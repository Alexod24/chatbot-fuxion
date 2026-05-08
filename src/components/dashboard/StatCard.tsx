import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isUp: boolean;
  };
  className?: string;
}

export function StatCard({ label, value, icon: Icon, trend, className }: StatCardProps) {
  return (
    <div className={cn("p-6 rounded-2xl bg-card border border-white/5 hover:border-white/10 transition-colors", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="p-2.5 rounded-xl bg-white/5 text-muted-foreground">
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className={cn(
            "text-xs font-medium px-2 py-1 rounded-full",
            trend.isUp ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
          )}>
            {trend.isUp ? "+" : "-"}{trend.value}%
          </span>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
        <h3 className="text-2xl font-bold text-white">{value}</h3>
      </div>
    </div>
  );
}
