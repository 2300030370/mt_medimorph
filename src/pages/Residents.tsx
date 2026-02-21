import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Pencil, Trash2, Plus, X, UserPlus } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";

interface ResidentWithProfile {
  id: string;
  user_id: string;
  allergies: string[];
  dietary_reqs: string[];
  preferences: string[];
  satisfaction_score: number;
  profile: {
    full_name: string;
    room: string | null;
    age: number | null;
  } | null;
}

const Residents = () => {
  const [search, setSearch] = useState("");
  const { role, user } = useAuth();
  const queryClient = useQueryClient();
  const canManage = role === "kitchen_staff" || role === "admin";
  const canAddResident = role === "admin";
  const canDeleteResident = role === "admin";

  const missingColumnFromError = (error: unknown): string | null => {
    const message = (error as { message?: string })?.message ?? "";
    const quoted = message.match(/'([^']+)' column/i);
    if (quoted?.[1]) return quoted[1];
    const plain = message.match(/column\s+([a-zA-Z0-9_.]+)\s+does not exist/i);
    if (plain?.[1]) return plain[1].split(".").pop() ?? plain[1];
    return null;
  };

  const profilePayloadVariants = (payload: Record<string, unknown>) => {
    const variants: Record<string, unknown>[] = [payload];
    const withoutAge = Object.fromEntries(Object.entries(payload).filter(([k]) => k !== "age"));
    const withoutRoom = Object.fromEntries(Object.entries(payload).filter(([k]) => k !== "room"));
    const minimal = Object.fromEntries(
      Object.entries(payload).filter(([k]) => k !== "age" && k !== "room")
    );
    variants.push(withoutAge, withoutRoom, minimal);
    return variants;
  };

  const selectProfilesByKey = async (
    key: "user_id" | "id",
    userIds: string[]
  ) => {
    const selectVariants = [
      `${key}, full_name, room, age`,
      `${key}, full_name, room`,
      `${key}, full_name, age`,
      `${key}, full_name`,
    ];

    let lastError: unknown = null;
    for (const selectClause of selectVariants) {
      const { data, error } = await supabase
        .from("profiles")
        .select(selectClause)
        .in(key, userIds);

      if (!error) {
        return (data ?? []).map((p) => ({
          user_id: key === "id" ? (p as { id: string }).id : (p as { user_id: string }).user_id,
          full_name: (p as { full_name: string }).full_name,
          room: (p as { room?: string | null }).room ?? null,
          age: (p as { age?: number | null }).age ?? null,
        }));
      }

      lastError = error;
      if (!missingColumnFromError(error)) break;
    }

    throw lastError;
  };

  const updateProfileResilient = async (userId: string, payload: Record<string, unknown>) => {
    let lastError: unknown = null;
    for (const keyColumn of ["user_id", "id"] as const) {
      for (const variant of profilePayloadVariants(payload)) {
        const { data, error } = await supabase
          .from("profiles")
          .update(variant)
          .eq(keyColumn, userId)
          .select("id");
        if (!error && data && data.length > 0) return;
        if (!error) continue;
        lastError = error;
        if (!missingColumnFromError(error)) break;
      }
    }

    if (lastError) throw lastError;

    // If profile row doesn't exist for this resident id, create one so edited details persist.
    await insertProfileResilient(userId, payload);
  };

  const insertProfileResilient = async (userId: string, payload: Record<string, unknown>) => {
    const payloadByUserId = { user_id: userId, ...payload };
    const payloadById = { id: userId, ...payload };
    let lastError: unknown = null;
    for (const keyVariant of [payloadByUserId, payloadById]) {
      for (const variant of profilePayloadVariants(keyVariant)) {
        const { error } = await supabase.from("profiles").insert(variant);
        if (!error) return;
        lastError = error;
        if (!missingColumnFromError(error)) break;
      }
    }
    throw lastError;
  };

  // Edit state
  const [editingResident, setEditingResident] = useState<ResidentWithProfile | null>(null);
  const [editName, setEditName] = useState("");
  const [editRoom, setEditRoom] = useState("");
  const [editAge, setEditAge] = useState("");
  const [editAllergies, setEditAllergies] = useState<string[]>([]);
  const [newAllergy, setNewAllergy] = useState("");
  const [editDietaryReqs, setEditDietaryReqs] = useState<string[]>([]);
  const [newDietaryReq, setNewDietaryReq] = useState("");
  const [editPreferences, setEditPreferences] = useState<string[]>([]);
  const [newPreference, setNewPreference] = useState("");

  // Delete state
  const [deleteResident, setDeleteResident] = useState<ResidentWithProfile | null>(null);

  // Add resident state
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState("");
  const [addRoom, setAddRoom] = useState("");
  const [addAge, setAddAge] = useState("");
  const [addAllergies, setAddAllergies] = useState<string[]>([]);
  const [addAllergyInput, setAddAllergyInput] = useState("");
  const [addDietaryReqs, setAddDietaryReqs] = useState<string[]>([]);
  const [addDietaryInput, setAddDietaryInput] = useState("");
  const [addPreferences, setAddPreferences] = useState<string[]>([]);
  const [addPreferenceInput, setAddPreferenceInput] = useState("");

  // Fetch residents with profiles
  const { data: residents = [], isLoading, isError, error } = useQuery({
    queryKey: ["residents"],
    queryFn: async () => {
      // For residents, they can only see their own record
      const query = supabase.from("residents").select("*");
      const { data: residentData, error } = await query;
      if (error) throw error;

      // Fetch profiles for each resident
      const userIds = residentData.map((r) => r.user_id);
      let normalizedProfileData: Array<{
        user_id: string;
        full_name: string;
        room: string | null;
        age: number | null;
      }> = [];

      try {
        normalizedProfileData = await selectProfilesByKey("user_id", userIds);
      } catch (err) {
        if (!missingColumnFromError(err)) throw err;
        normalizedProfileData = await selectProfilesByKey("id", userIds);
      }

      const profileMap = new Map(normalizedProfileData?.map((p) => [p.user_id, p]) ?? []);

      return residentData.map((r) => ({
        ...r,
        profile: profileMap.get(r.user_id) ?? null,
      })) as ResidentWithProfile[];
    },
  });

  // Update resident mutation
  const updateResident = useMutation({
    mutationFn: async ({ resident, allergies, dietaryReqs, preferences, name, room, age }: {
      resident: ResidentWithProfile;
      allergies: string[];
      dietaryReqs: string[];
      preferences: string[];
      name: string;
      room: string;
      age: string;
    }) => {
      if (!user?.id) {
        throw new Error("Not authenticated.");
      }
      const { data: canManageByPolicy, error: roleCheckError } = await supabase.rpc("can_manage", {
        _user_id: user.id,
      });
      if (roleCheckError || !canManageByPolicy) {
        throw new Error("Permission denied by role policy for updating residents.");
      }

      const { data: updatedRows, error: resError } = await supabase
        .from("residents")
        .update({ allergies, dietary_reqs: dietaryReqs, preferences })
        .eq("id", resident.id)
        .select("id");
      if (resError) throw resError;
      if (!updatedRows || updatedRows.length === 0) {
        throw new Error("Resident update was not applied. Operation may be blocked by RLS policy.");
      }

      await updateProfileResilient(resident.user_id, {
        full_name: name,
        room: room || null,
        age: age ? parseInt(age) : null,
      });

      return {
        residentId: resident.id,
        userId: resident.user_id,
        allergies,
        dietaryReqs,
        preferences,
        name,
        room: room || null,
        age: age ? parseInt(age) : null,
      };
    },
    onSuccess: async (updated) => {
      queryClient.setQueryData<ResidentWithProfile[]>(["residents"], (prev) =>
        (prev ?? []).map((resident) =>
          resident.id === updated.residentId
            ? {
                ...resident,
                allergies: updated.allergies,
                dietary_reqs: updated.dietaryReqs,
                preferences: updated.preferences,
                profile: {
                  full_name: updated.name,
                  room: updated.room,
                  age: updated.age,
                },
              }
            : resident
        )
      );
      await queryClient.invalidateQueries({ queryKey: ["residents"] });
      await queryClient.refetchQueries({ queryKey: ["residents"] });
      toast({ title: "Resident updated" });
      setEditingResident(null);
    },
    onError: (e) => {
      const lower = e.message?.toLowerCase() ?? "";
      const message = lower.includes("row-level security")
        ? "Permission denied by RLS while updating resident."
        : lower.includes("permission denied by role policy")
          ? "Only staff/admin can update residents with the current policy."
          : e.message;
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });

  // Delete resident mutation (admin only - deletes the auth user which cascades)
  const deleteResidentMutation = useMutation({
    mutationFn: async (residentId: string) => {
      if (!user?.id) {
        throw new Error("Not authenticated.");
      }
      const { data: isAdminByPolicy, error: roleCheckError } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      if (roleCheckError || !isAdminByPolicy) {
        throw new Error("Only admins can remove residents with the current policy.");
      }

      const { data, error } = await supabase
        .from("residents")
        .delete()
        .eq("id", residentId)
        .select("id");
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("Resident was not deleted. Operation may be blocked by RLS policy.");
      }
    },
    onSuccess: async (_data, residentId) => {
      queryClient.setQueryData<ResidentWithProfile[]>(["residents"], (prev) =>
        (prev ?? []).filter((resident) => resident.id !== residentId)
      );
      await queryClient.invalidateQueries({ queryKey: ["residents"] });
      await queryClient.refetchQueries({ queryKey: ["residents"] });
      toast({ title: "Resident removed" });
      setDeleteResident(null);
    },
    onError: (e) => {
      const lower = e.message?.toLowerCase() ?? "";
      const message = lower.includes("row-level security")
        ? "Permission denied by RLS while removing resident."
        : lower.includes("only admins can remove residents")
          ? "Only admins can remove residents."
          : e.message;
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });

  // Add resident mutation
  const addResident = useMutation({
    mutationFn: async () => {
      if (!canAddResident) {
        throw new Error("Only admins can add residents.");
      }
      if (!user?.id) {
        throw new Error("Not authenticated.");
      }

      const { data: isAdminByPolicy, error: roleCheckError } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      if (roleCheckError || !isAdminByPolicy) {
        throw new Error(
          "Your account is not admin in database role policies (user_roles). Ask an admin to assign role in user_roles."
        );
      }

      const residentUserId = crypto.randomUUID();

      await insertProfileResilient(residentUserId, {
        full_name: addName,
        room: addRoom || null,
        age: addAge ? parseInt(addAge) : null,
      });

      const { error: residentError } = await supabase.from("residents").insert({
        user_id: residentUserId,
        allergies: addAllergies,
        dietary_reqs: addDietaryReqs,
        preferences: addPreferences,
      });
      if (residentError) throw residentError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["residents"] });
      toast({ title: "Resident added" });
      setShowAdd(false);
      setAddName("");
      setAddRoom("");
      setAddAge("");
      setAddAllergies([]);
      setAddDietaryReqs([]);
      setAddPreferences([]);
    },
    onError: (e) => {
      const lower = e.message?.toLowerCase() ?? "";
      const message = lower.includes("row-level security")
        ? "Permission denied by RLS. Verify your admin role exists in user_roles."
        : lower.includes("foreign key")
          ? "Resident creation requires a valid linked auth user in this database schema."
          : e.message;
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });

  const filtered = residents.filter((r) =>
    (r.profile?.full_name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const handleEditOpen = (resident: ResidentWithProfile) => {
    setEditingResident(resident);
    setEditName(resident.profile?.full_name ?? "");
    setEditRoom(resident.profile?.room ?? "");
    setEditAge(resident.profile?.age?.toString() ?? "");
    setEditAllergies([...resident.allergies]);
    setNewAllergy("");
    setEditDietaryReqs([...resident.dietary_reqs]);
    setNewDietaryReq("");
    setEditPreferences([...resident.preferences]);
    setNewPreference("");
  };

  const handleAddAllergy = () => {
    const trimmed = newAllergy.trim();
    if (trimmed && !editAllergies.includes(trimmed)) {
      setEditAllergies([...editAllergies, trimmed]);
      setNewAllergy("");
    }
  };

  const getInitials = (name: string) =>
    name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold font-['DM_Sans'] text-foreground">Residents</h1>
            <p className="text-muted-foreground mt-1">Manage dietary profiles and preferences</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search residents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring w-64"
              />
            </div>
            {canAddResident && (
              <Button onClick={() => setShowAdd(true)}>
                <UserPlus className="h-4 w-4 mr-2" /> Add Resident
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : isError ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <p className="text-destructive font-medium">Failed to load residents</p>
            <p className="text-muted-foreground mt-2">
              {(error as { message?: string } | null)?.message ?? "Unknown error"}
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <p className="text-muted-foreground">
              {residents.length === 0 ? "No residents found. Have residents sign up with the 'Resident' role." : "No matching residents."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filtered.map((r) => {
              const name = r.profile?.full_name || "Unknown";
              const canEdit = canManage;
              const canDelete = canDeleteResident;

              return (
                <div key={r.id} className="glass-card rounded-2xl p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-lg font-bold shrink-0">
                      {getInitials(name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-card-foreground font-['DM_Sans']">{name}</h3>
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-bold ${r.satisfaction_score >= 85 ? "text-success" : r.satisfaction_score >= 70 ? "text-warning" : "text-destructive"}`}>
                            {r.satisfaction_score}%
                          </span>
                          {canEdit && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditOpen(r)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteResident(r)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {r.profile?.room ? `Room ${r.profile.room}` : "No room"} • {r.profile?.age ? `Age ${r.profile.age}` : "Age unknown"}
                      </p>

                      <div className="mt-3 space-y-2">
                        {r.allergies.length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Allergies</p>
                            <div className="flex flex-wrap gap-1">
                              {r.allergies.map((a) => (
                                <Badge key={a} variant="destructive" className="text-xs">{a}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {r.dietary_reqs.length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Dietary Requirements</p>
                            <div className="flex flex-wrap gap-1">
                              {r.dietary_reqs.map((d) => (
                                <Badge key={d} variant="secondary" className="text-xs">{d}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {r.preferences.length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Preferences</p>
                            <div className="flex flex-wrap gap-1">
                              {r.preferences.map((p) => (
                                <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Resident Dialog */}
      <Dialog open={!!editingResident} onOpenChange={(open) => !open && setEditingResident(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Resident — {editingResident?.profile?.full_name}</DialogTitle>
            <DialogDescription>Update resident profile and dietary information.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Room</Label>
                <Input value={editRoom} onChange={(e) => setEditRoom(e.target.value)} />
              </div>
              <div>
                <Label>Age</Label>
                <Input type="number" value={editAge} onChange={(e) => setEditAge(e.target.value)} />
              </div>
            </div>

            {/* Allergies */}
            <div>
              <Label>Allergies</Label>
              <div className="flex flex-wrap gap-1 mb-2">
                {editAllergies.map((a) => (
                  <Badge key={a} variant="destructive" className="text-xs gap-1 pr-1">
                    {a}
                    <button onClick={() => setEditAllergies(editAllergies.filter((x) => x !== a))} className="ml-1 hover:bg-destructive/80 rounded-full p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input placeholder="Add allergy..." value={newAllergy} onChange={(e) => setNewAllergy(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddAllergy())} />
                <Button size="sm" onClick={handleAddAllergy} disabled={!newAllergy.trim()}><Plus className="h-4 w-4" /></Button>
              </div>
            </div>

            {/* Dietary Requirements */}
            <div>
              <Label>Dietary Requirements</Label>
              <div className="flex flex-wrap gap-1 mb-2">
                {editDietaryReqs.map((d) => (
                  <Badge key={d} variant="secondary" className="text-xs gap-1 pr-1">
                    {d}
                    <button onClick={() => setEditDietaryReqs(editDietaryReqs.filter((x) => x !== d))} className="ml-1 hover:bg-secondary/80 rounded-full p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input placeholder="Add requirement..." value={newDietaryReq} onChange={(e) => setNewDietaryReq(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); const v = newDietaryReq.trim(); if (v && !editDietaryReqs.includes(v)) setEditDietaryReqs([...editDietaryReqs, v]); setNewDietaryReq(""); }
                  }} />
                <Button size="sm" onClick={() => { const v = newDietaryReq.trim(); if (v && !editDietaryReqs.includes(v)) setEditDietaryReqs([...editDietaryReqs, v]); setNewDietaryReq(""); }} disabled={!newDietaryReq.trim()}><Plus className="h-4 w-4" /></Button>
              </div>
            </div>

            {/* Preferences */}
            <div>
              <Label>Preferences</Label>
              <div className="flex flex-wrap gap-1 mb-2">
                {editPreferences.map((p) => (
                  <Badge key={p} variant="outline" className="text-xs gap-1 pr-1">
                    {p}
                    <button onClick={() => setEditPreferences(editPreferences.filter((x) => x !== p))} className="ml-1 hover:bg-muted rounded-full p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input placeholder="Add preference..." value={newPreference} onChange={(e) => setNewPreference(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); const v = newPreference.trim(); if (v && !editPreferences.includes(v)) setEditPreferences([...editPreferences, v]); setNewPreference(""); }
                  }} />
                <Button size="sm" onClick={() => { const v = newPreference.trim(); if (v && !editPreferences.includes(v)) setEditPreferences([...editPreferences, v]); setNewPreference(""); }} disabled={!newPreference.trim()}><Plus className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingResident(null)}>Cancel</Button>
            <Button onClick={() => editingResident && updateResident.mutate({
              resident: editingResident,
              allergies: editAllergies,
              dietaryReqs: editDietaryReqs,
              preferences: editPreferences,
              name: editName,
              room: editRoom,
              age: editAge,
            })} disabled={!editName.trim() || updateResident.isPending}>
              {updateResident.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteResident} onOpenChange={(open) => !open && setDeleteResident(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deleteResident?.profile?.full_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the resident from the system. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteResident && deleteResidentMutation.mutate(deleteResident.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Add Resident Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Resident</DialogTitle>
            <DialogDescription>Create a new resident profile.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Full Name *</Label>
              <Input value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="Jane Doe" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Room</Label>
                <Input value={addRoom} onChange={(e) => setAddRoom(e.target.value)} placeholder="101" />
              </div>
              <div>
                <Label>Age</Label>
                <Input type="number" value={addAge} onChange={(e) => setAddAge(e.target.value)} placeholder="75" />
              </div>
            </div>
            <div>
              <Label>Allergies</Label>
              <div className="flex flex-wrap gap-1 mb-2">
                {addAllergies.map((a) => (
                  <Badge key={a} variant="destructive" className="text-xs gap-1 pr-1">
                    {a}
                    <button onClick={() => setAddAllergies(addAllergies.filter((x) => x !== a))} className="ml-1 hover:bg-destructive/80 rounded-full p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add allergy..."
                  value={addAllergyInput}
                  onChange={(e) => setAddAllergyInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const v = addAllergyInput.trim();
                      if (v && !addAllergies.includes(v)) setAddAllergies([...addAllergies, v]);
                      setAddAllergyInput("");
                    }
                  }}
                />
                <Button size="sm" onClick={() => {
                  const v = addAllergyInput.trim();
                  if (v && !addAllergies.includes(v)) setAddAllergies([...addAllergies, v]);
                  setAddAllergyInput("");
                }} disabled={!addAllergyInput.trim()}><Plus className="h-4 w-4" /></Button>
              </div>
            </div>
            <div>
              <Label>Dietary Requirements</Label>
              <div className="flex flex-wrap gap-1 mb-2">
                {addDietaryReqs.map((d) => (
                  <Badge key={d} variant="secondary" className="text-xs gap-1 pr-1">
                    {d}
                    <button onClick={() => setAddDietaryReqs(addDietaryReqs.filter((x) => x !== d))} className="ml-1 hover:bg-secondary/80 rounded-full p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add requirement..."
                  value={addDietaryInput}
                  onChange={(e) => setAddDietaryInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const v = addDietaryInput.trim();
                      if (v && !addDietaryReqs.includes(v)) setAddDietaryReqs([...addDietaryReqs, v]);
                      setAddDietaryInput("");
                    }
                  }}
                />
                <Button size="sm" onClick={() => {
                  const v = addDietaryInput.trim();
                  if (v && !addDietaryReqs.includes(v)) setAddDietaryReqs([...addDietaryReqs, v]);
                  setAddDietaryInput("");
                }} disabled={!addDietaryInput.trim()}><Plus className="h-4 w-4" /></Button>
            </div>
            {/* Preferences */}
            <div>
              <Label>Preferences</Label>
              <div className="flex flex-wrap gap-1 mb-2">
                {addPreferences.map((p) => (
                  <Badge key={p} variant="outline" className="text-xs gap-1 pr-1">
                    {p}
                    <button onClick={() => setAddPreferences(addPreferences.filter((x) => x !== p))} className="ml-1 hover:bg-muted rounded-full p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input placeholder="Add preference..." value={addPreferenceInput} onChange={(e) => setAddPreferenceInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); const v = addPreferenceInput.trim(); if (v && !addPreferences.includes(v)) setAddPreferences([...addPreferences, v]); setAddPreferenceInput(""); }
                  }} />
                <Button size="sm" onClick={() => { const v = addPreferenceInput.trim(); if (v && !addPreferences.includes(v)) setAddPreferences([...addPreferences, v]); setAddPreferenceInput(""); }} disabled={!addPreferenceInput.trim()}><Plus className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => addResident.mutate()} disabled={!addName.trim() || addResident.isPending}>
              {addResident.isPending ? "Adding..." : "Add Resident"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Residents;
