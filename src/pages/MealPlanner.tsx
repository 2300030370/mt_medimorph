import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Info, RefreshCw, Sparkles, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const fullDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const localFallbackWeek = [
  { day: "Monday", breakfast: "Oatmeal with Berries", lunch: "Lentil Vegetable Soup", dinner: "Grilled Fish with Brown Rice", snack: "Greek Yogurt with Fruit" },
  { day: "Tuesday", breakfast: "Vegetable Upma", lunch: "Chickpea Salad Bowl", dinner: "Chicken Stew with Quinoa", snack: "Apple with Almonds" },
  { day: "Wednesday", breakfast: "Moong Dal Chilla", lunch: "Paneer Veggie Wrap", dinner: "Baked Salmon with Greens", snack: "Roasted Chickpeas" },
  { day: "Thursday", breakfast: "Idli with Sambar", lunch: "Brown Rice Veg Pulao", dinner: "Turkey Veggie Stir Fry", snack: "Banana Peanut-Free Smoothie" },
  { day: "Friday", breakfast: "Poha with Vegetables", lunch: "Mixed Bean Curry Bowl", dinner: "Grilled Tofu with Millet", snack: "Carrot Cucumber Sticks" },
  { day: "Saturday", breakfast: "Whole Wheat Toast and Eggs", lunch: "Vegetable Khichdi", dinner: "Baked Chicken with Veggies", snack: "Buttermilk and Seeds" },
  { day: "Sunday", breakfast: "Ragi Porridge", lunch: "Quinoa Chickpea Tabbouleh", dinner: "Light Fish Curry with Rice", snack: "Seasonal Fruit Bowl" },
];

interface NutritionInfo {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MealPlanItem {
  day: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  snack: string;
  id?: string;
}

interface ResidentOption {
  userId: string;
  fullName: string;
}

// Estimated nutrition per meal type (simplified estimation)
const estimateNutrition = (mealType: string): NutritionInfo => {
  switch (mealType) {
    case "breakfast": return { kcal: 320, protein: 14, carbs: 42, fat: 10 };
    case "lunch": return { kcal: 450, protein: 28, carbs: 40, fat: 16 };
    case "dinner": return { kcal: 480, protein: 32, carbs: 35, fat: 18 };
    case "snack": return { kcal: 160, protein: 5, carbs: 25, fat: 5 };
    default: return { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  }
};

const nutrientTargets = { kcal: 1800, protein: 90, carbs: 200, fat: 60 };
const getMealDetails = (mealName: string) => ({
  type: "Balanced, easy-to-digest meal suitable for residents",
  preparation: [
    "Wash and prepare all ingredients",
    "Cook on low flame with minimal oil",
    "Use mild seasoning and low salt",
    "Serve warm and fresh",
  ],
});

const swapPool: Record<string, string[]> = {
  breakfast: [
    "Oatmeal with Berries",
    "Vegetable Upma",
    "Moong Dal Chilla",
    "Idli with Sambar",
    "Poha with Vegetables",
  ],
  lunch: [
    "Lentil Vegetable Soup",
    "Chickpea Salad Bowl",
    "Paneer Veggie Wrap",
    "Brown Rice Veg Pulao",
    "Mixed Bean Curry Bowl",
  ],
  dinner: [
    "Grilled Fish with Brown Rice",
    "Chicken Stew with Quinoa",
    "Baked Salmon with Greens",
    "Turkey Veggie Stir Fry",
    "Grilled Tofu with Millet",
  ],
  snack: [
    "Greek Yogurt with Fruit",
    "Apple with Almonds",
    "Roasted Chickpeas",
    "Carrot Cucumber Sticks",
    "Seasonal Fruit Bowl",
  ],
};
const MealPlanner = () => {
  
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedResidentId, setSelectedResidentId] = useState<string>("");
  const [perResidentPlans, setPerResidentPlans] = useState<Record<string, MealPlanItem[]>>({});
  const [mealOverrides, setMealOverrides] = useState<Record<string, string>>({});
  const { role } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: mealPlans, isLoading } = useQuery({
    queryKey: ["meal_plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meal_plans")
        .select("*")
        .order("day");
      if (error) throw error;
      return data;
    },
  });

  const { data: residents = [] } = useQuery({
    queryKey: ["resident_options"],
    queryFn: async () => {
      const { data: residentRows, error: residentError } = await supabase
        .from("residents")
        .select("user_id");
      if (residentError) throw residentError;
      const userIds = (residentRows ?? []).map((row) => row.user_id);
      if (userIds.length === 0) return [] as ResidentOption[];

      let profiles: Array<{ id: string; full_name: string }> = [];
      const byId = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);
      if (!byId.error) {
        profiles = (byId.data ?? []) as Array<{ id: string; full_name: string }>;
      } else {
        const byUserId = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);
        if (byUserId.error) throw byUserId.error;
        profiles = (byUserId.data ?? []).map((profile) => ({
          id: (profile as { user_id: string }).user_id,
          full_name: (profile as { full_name: string }).full_name,
        }));
      }

      const nameMap = new Map(profiles.map((profile) => [profile.id, profile.full_name]));
      return userIds.map((userId) => ({
        userId,
        fullName: nameMap.get(userId) ?? "Resident",
      }));
    },
  });

  useEffect(() => {
    if (!selectedResidentId && residents.length > 0) {
      setSelectedResidentId(residents[0].userId);
    }
  }, [residents, selectedResidentId]);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("Not authenticated");

      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-meal-plan`;

      const invokeResult = await supabase.functions.invoke("generate-meal-plan", {
        body: {},
      });
      if (!invokeResult.error) return invokeResult.data;

      // Fallback path: direct fetch can succeed in environments where invoke transport fails.
      const directResponse = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({}),
      }).catch(() => null);

      if (directResponse?.ok) return directResponse.json();

      const invokeError = invokeResult.error.message || "Edge Function transport failed";
      const directErrorPayload = directResponse
        ? await directResponse
            .json()
            .then((payload) => payload?.error as string | undefined)
            .catch(() => undefined)
        : undefined;

      throw new Error(
        directErrorPayload ||
          `${invokeError}. Verify function deployment and network access to ${functionUrl}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meal_plans"] });
      toast({ title: "Meal plan generated!", description: "AI has created a new 7-day meal plan based on resident profiles." });
    },
    onError: (error: Error) => {
      if (selectedResidentId) {
        setPerResidentPlans((prev) => ({ ...prev, [selectedResidentId]: localFallbackWeek }));
      }
      toast({
        title: "Edge AI unavailable",
        description: `Loaded local backup plan. ${error.message}`,
      });
    },
  });

  // Find meal plan for selected day
  const selectedDayName = fullDays[selectedDay];
  const displayedPlans = (selectedResidentId && perResidentPlans[selectedResidentId]) || mealPlans;
  const todayPlan = displayedPlans?.find((p) => p.day === selectedDayName);

  const overrideKey = (residentId: string, day: string, meal: string) =>
    `${residentId}:${day}:${meal}`;

  const getDisplayedMeal = (
    residentId: string,
    day: string,
    mealType: "breakfast" | "lunch" | "dinner" | "snack",
    original: string
  ) => mealOverrides[overrideKey(residentId, day, mealType)] ?? original;

  const handleWhy = (mealLabel: string, mealName: string, nutrition: NutritionInfo) => {
    const details = getMealDetails(mealName);
    toast({
      title: `Why this ${mealLabel.toLowerCase()}?`,
      description: `${details.type}. Nutrition: ${nutrition.kcal} kcal, P ${nutrition.protein}g, C ${nutrition.carbs}g, F ${nutrition.fat}g.`,
    });
  };

  const handleSwap = async (
    day: string,
    mealType: "breakfast" | "lunch" | "dinner" | "snack",
    currentMeal: string
  ) => {
    const options = swapPool[mealType];
    const currentIndex = options.indexOf(currentMeal);
    const nextMeal = options[(currentIndex + 1 + options.length) % options.length];

    setMealOverrides((prev) => ({
      ...prev,
      [overrideKey(selectedResidentId || "all", day, mealType)]: nextMeal,
    }));

    if (todayPlan?.id && !(selectedResidentId && perResidentPlans[selectedResidentId])) {
      const { error } = await supabase
        .from("meal_plans")
        .update({ [mealType]: nextMeal })
        .eq("id", todayPlan.id);
      if (!error) {
        queryClient.invalidateQueries({ queryKey: ["meal_plans"] });
      }
    }

    toast({
      title: `${mealType[0].toUpperCase()}${mealType.slice(1)} swapped`,
      description: `${currentMeal} -> ${nextMeal}`,
    });
  };

  const meals = todayPlan  
    ? [
        {
          label: "BREAKFAST",
          mealType: "breakfast" as const,
          value: getDisplayedMeal(selectedResidentId || "all", selectedDayName, "breakfast", todayPlan.breakfast),
          nutrition: estimateNutrition("breakfast"),
        },
        {
          label: "LUNCH",
          mealType: "lunch" as const,
          value: getDisplayedMeal(selectedResidentId || "all", selectedDayName, "lunch", todayPlan.lunch),
          nutrition: estimateNutrition("lunch"),
        },
        {
          label: "DINNER",
          mealType: "dinner" as const,
          value: getDisplayedMeal(selectedResidentId || "all", selectedDayName, "dinner", todayPlan.dinner),
          nutrition: estimateNutrition("dinner"),
        },
        {
          label: "SNACK",
          mealType: "snack" as const,
          value: getDisplayedMeal(selectedResidentId || "all", selectedDayName, "snack", todayPlan.snack),
          nutrition: estimateNutrition("snack"),
        },
      ]
    : [];

  const totals = meals.reduce(
    (acc, m) => ({
      kcal: acc.kcal + m.nutrition.kcal,
      protein: acc.protein + m.nutrition.protein,
      carbs: acc.carbs + m.nutrition.carbs,
      fat: acc.fat + m.nutrition.fat,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const canManage = role === "kitchen_staff" || role === "admin";

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold font-['DM_Sans'] text-foreground">
              Your Weekly Meal Plan
            </h1>
            <p className="text-muted-foreground mt-1">
              {displayedPlans?.length ? `AI-optimized for residents · ${totals.kcal} kcal today` : "No meal plan generated yet"}
            </p>
          </div>
          {canManage && (
            <div className="flex items-center gap-3">
              <Select value={selectedResidentId} onValueChange={setSelectedResidentId}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Select resident" />
                </SelectTrigger>
                <SelectContent>
                  {residents.map((resident) => (
                    <SelectItem key={resident.userId} value={resident.userId}>
                      {resident.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="gap-2"
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending || !selectedResidentId}
              >
                {generateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {generateMutation.isPending ? "Generating..." : "AI Generate"}
              </Button>
            </div>
          )}
        </div>

        {/* Day Tabs */}
        <div className="flex gap-2 mb-8">
          {days.map((d, i) => (
            <button
              key={d}
              onClick={() => setSelectedDay(i)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedDay === i
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !todayPlan && (
          <div className="glass-card rounded-2xl p-12 text-center">
            <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-bold font-['DM_Sans'] text-card-foreground mb-2">
              No Meal Plan Yet
            </h3>
            <p className="text-muted-foreground mb-6">
              {canManage
                ? "Click 'AI Generate' to create a personalized 7-day meal plan based on resident dietary profiles."
                : "A meal plan hasn't been created yet. Please check back later."}
            </p>
          </div>
        )}

        {/* Meal Cards */}
        {todayPlan && (
          <>
            <div className="space-y-4 mb-8">
              {meals.map((meal) => (
                <div
                  key={meal.label}
                  className="glass-card rounded-2xl p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold tracking-wider text-primary mb-1">
                        {meal.label}
                      </p>
                      <h3 className="text-lg font-semibold text-card-foreground font-['DM_Sans'] mb-2">
                        {meal.value}
                      </h3>
                      {(() => {
  const details = getMealDetails(meal.value);
  return (
    <>
      <p className="text-sm text-muted-foreground mb-3">
        <span className="font-medium text-foreground">Meal type:</span>{" "}
        {details.type}
      </p>

      <div className="text-sm text-muted-foreground mb-3">
        <p className="font-medium text-foreground mb-1">How to prepare:</p>
        <ol className="list-decimal ml-5 space-y-1">
          {details.preparation.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </div>
    </>
  );
})()}
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span className="text-primary font-medium">{meal.nutrition.kcal} kcal</span>
                        <span>P: {meal.nutrition.protein}g</span>
                        <span>C: {meal.nutrition.carbs}g</span>
                        <span>F: {meal.nutrition.fat}g</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-muted-foreground"
                        onClick={() => handleWhy(meal.label, meal.value, meal.nutrition)}
                      >
                        <Info className="h-4 w-4" />
                        Why?
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => handleSwap(selectedDayName, meal.mealType, meal.value)}
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Swap
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Daily Nutrient Summary */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-bold font-['DM_Sans'] text-card-foreground mb-6">
                Daily Nutrient Summary
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: "Calories", value: totals.kcal, unit: "kcal", target: nutrientTargets.kcal },
                  { label: "Protein", value: totals.protein, unit: "g", target: nutrientTargets.protein },
                  { label: "Carbs", value: totals.carbs, unit: "g", target: nutrientTargets.carbs },
                  { label: "Fat", value: totals.fat, unit: "g", target: nutrientTargets.fat },
                ].map((n) => (
                  <div key={n.label} className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">{n.label}</p>
                    <p className="text-2xl font-bold text-card-foreground font-['DM_Sans']">
                      {n.value}
                      <span className="text-sm font-normal text-muted-foreground ml-0.5">{n.unit}</span>
                    </p>
                    <Progress
                      value={Math.min((n.value / n.target) * 100, 100)}
                      className="h-2 mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Target: {n.target.toLocaleString()}{n.unit === "kcal" ? "" : n.unit}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default MealPlanner;
