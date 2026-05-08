"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Bot, 
  LayoutDashboard, 
  Settings, 
  BarChart, 
  MessageSquare, 
  LogOut,
  Zap
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Bot, label: "Bot Config", href: "/dashboard/bot" },
  { icon: MessageSquare, label: "Mensajes", href: "/dashboard/messages" },
  { icon: BarChart, label: "Estadísticas", href: "/dashboard/stats" },
  { icon: Settings, label: "Configuración", href: "/dashboard/settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    // Aquí se limpiaría la sesión en un caso real
    router.push("/login");
  };

  return (
    <aside className="w-64 sidebar-gradient border-r border-white/5 flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center glow-indigo">
          <Zap className="text-white w-6 h-6 fill-white" />
        </div>
        <span className="text-xl font-bold tracking-tight">Fuxion AI</span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                isActive 
                  ? "text-white bg-indigo-600/10" 
                  : "text-muted-foreground hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-colors",
                isActive ? "text-indigo-400" : "group-hover:text-white"
              )} />
              <span className="font-medium">{item.label}</span>
              
              {isActive && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute left-0 w-1 h-6 bg-indigo-500 rounded-r-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/20 mb-4">
          <p className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-1">Plan Pro</p>
          <p className="text-sm text-white/80 mb-3">Tu membresía vence en 24 días.</p>
          <button className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors">
            Renovar Ahora
          </button>
        </div>
        
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-muted-foreground hover:text-red-400 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
