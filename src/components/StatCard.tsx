import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  iconColor?: string;
}

const StatCard = ({ icon: Icon, label, value, change, changeType = "neutral", iconColor }: StatCardProps) => {
  return (
    <div className="glass-card rounded-2xl p-6 hover:shadow-md transition-shadow duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{label}</p>
          <p className="text-3xl font-bold mt-2 font-['DM_Sans'] text-card-foreground">{value}</p>
          {change && (
            <p className={`text-xs mt-2 font-medium ${
              changeType === "positive" ? "text-success" : changeType === "negative" ? "text-destructive" : "text-muted-foreground"
            }`}>
              {change}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconColor || "bg-primary/10"}`}>
          <Icon className={`w-6 h-6 ${iconColor ? "text-primary-foreground" : "text-primary"}`} />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
