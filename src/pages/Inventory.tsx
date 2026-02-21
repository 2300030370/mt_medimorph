import AppLayout from "@/components/AppLayout";
import { inventory } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";

const statusStyles = {
  good: "bg-success/10 text-success border-success/20",
  low: "bg-destructive/10 text-destructive border-destructive/20",
  expiring: "bg-warning/10 text-warning border-warning/20",
};

const Inventory = () => {
  const categories = [...new Set(inventory.map((i) => i.category))];

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold font-['DM_Sans'] text-foreground">Inventory</h1>
            <p className="text-muted-foreground mt-1">Track kitchen stock and expiry dates</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-success border-success/30 bg-success/5">{inventory.filter(i => i.status === "good").length} In Stock</Badge>
            <Badge variant="outline" className="text-warning border-warning/30 bg-warning/5">{inventory.filter(i => i.status === "expiring").length} Expiring</Badge>
            <Badge variant="outline" className="text-destructive border-destructive/30 bg-destructive/5">{inventory.filter(i => i.status === "low").length} Low</Badge>
          </div>
        </div>

        {categories.map((cat) => (
          <div key={cat} className="mb-6">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{cat}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inventory.filter((i) => i.category === cat).map((item) => (
                <div key={item.id} className="glass-card rounded-2xl p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                        <Package className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold text-card-foreground">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.quantity} {item.unit}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={statusStyles[item.status]}>
                      {item.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">Expires: {item.expiryDate}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
};

export default Inventory;
