import { Users, UtensilsCrossed, TrendingDown, Heart, AlertTriangle, Clock } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import StatCard from "@/components/StatCard";
import { residents, weeklyMealPlan, inventory } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";

const Index = () => {
  const expiringItems = inventory.filter((i) => i.status === "expiring");
  const lowItems = inventory.filter((i) => i.status === "low");
  const avgSatisfaction = Math.round(residents.reduce((a, r) => a + r.satisfactionScore, 0) / residents.length);
  const today = weeklyMealPlan[0];

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-['DM_Sans'] text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your care facility meal operations</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard icon={Users} label="Total Residents" value={residents.length} change="+2 this month" changeType="positive" />
          <StatCard icon={UtensilsCrossed} label="Meals Planned" value={21} change="Full week covered" changeType="positive" />
          <StatCard icon={TrendingDown} label="Waste Reduction" value="23%" change="↓ 5% vs last month" changeType="positive" />
          <StatCard icon={Heart} label="Avg Satisfaction" value={`${avgSatisfaction}%`} change="↑ 3% improvement" changeType="positive" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Menu */}
          <div className="lg:col-span-2 glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold font-['DM_Sans'] text-card-foreground">Today's Menu</h2>
              <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5">
                {today.day}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Breakfast", value: today.breakfast, time: "7:30 AM", icon: "🌅" },
                { label: "Lunch", value: today.lunch, time: "12:00 PM", icon: "☀️" },
                { label: "Dinner", value: today.dinner, time: "6:00 PM", icon: "🌙" },
                { label: "Snack", value: today.snack, time: "3:00 PM", icon: "🍎" },
              ].map((meal) => (
                <div key={meal.label} className="bg-muted/50 rounded-xl p-4 hover:bg-muted transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{meal.icon}</span>
                    <span className="text-xs text-muted-foreground font-medium">{meal.label}</span>
                  </div>
                  <p className="font-semibold text-sm text-card-foreground">{meal.value}</p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {meal.time}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-lg font-bold font-['DM_Sans'] text-card-foreground mb-5">Alerts</h2>
            <div className="space-y-3">
              {expiringItems.map((item) => (
                <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl bg-warning/5 border border-warning/15">
                  <AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">Expiring {item.expiryDate}</p>
                  </div>
                </div>
              ))}
              {lowItems.map((item) => (
                <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl bg-destructive/5 border border-destructive/15">
                  <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">Low stock: {item.quantity} {item.unit}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Resident Overview */}
        <div className="glass-card rounded-2xl p-6 mt-6">
          <h2 className="text-lg font-bold font-['DM_Sans'] text-card-foreground mb-5">Resident Dietary Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {residents.slice(0, 6).map((r) => (
              <div key={r.id} className="flex items-center gap-4 p-4 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                  {r.avatar}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-card-foreground truncate">{r.name}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {r.dietaryReqs.map((d) => (
                      <Badge key={d} variant="secondary" className="text-[10px] px-1.5 py-0">{d}</Badge>
                    ))}
                    {r.allergies.map((a) => (
                      <Badge key={a} variant="destructive" className="text-[10px] px-1.5 py-0">{a}</Badge>
                    ))}
                  </div>
                </div>
                <div className="ml-auto text-right shrink-0">
                  <p className={`text-sm font-bold ${r.satisfactionScore >= 85 ? "text-success" : r.satisfactionScore >= 70 ? "text-warning" : "text-destructive"}`}>
                    {r.satisfactionScore}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
