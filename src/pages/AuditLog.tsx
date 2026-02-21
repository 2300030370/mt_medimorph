import AppLayout from "@/components/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const AuditLog = () => {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["audit_log"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_log")
        .select("*")
        .order("changed_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-['DM_Sans'] text-foreground">Audit Log</h1>
          <p className="text-muted-foreground mt-1">Track all modifications and updates</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : logs.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <p className="text-muted-foreground">No modifications recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="glass-card rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant={log.action === "DELETE" ? "destructive" : "secondary"}>
                    {log.action}
                  </Badge>
                  <span className="text-sm font-medium text-card-foreground">{log.table_name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {format(new Date(log.changed_at), "MMM d, yyyy h:mm a")}
                  </span>
                </div>
                {log.record_id && (
                  <p className="text-xs text-muted-foreground">Record: {log.record_id}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default AuditLog;
