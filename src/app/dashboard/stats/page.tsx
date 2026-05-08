"use client";

import React from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { StatCard } from "@/components/dashboard/StatCard";
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Calendar,
  ArrowUpRight,
  Target
} from "lucide-react";

export default function StatsPage() {
  return (
    <div className="flex min-h-screen bg-black text-white">
      <Sidebar />
      
      <main className="flex-1 flex flex-col p-8 space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Estadísticas de Rendimiento</h1>
            <p className="text-muted-foreground">Métricas detalladas sobre la efectividad de tu bot.</p>
          </div>
          <div className="flex items-center gap-3">
             <button className="px-4 py-2 bg-white/5 rounded-xl text-sm border border-white/5 flex items-center gap-2 hover:bg-white/10 transition-colors">
                <Calendar className="w-4 h-4" />
                Últimos 30 días
             </button>
             <button className="px-4 py-2 bg-indigo-600 rounded-xl text-sm font-bold shadow-lg glow-indigo">Exportar Reporte</button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard label="Retorno de Inversión" value="4.2x" icon={TrendingUp} trend={{ value: 15, isUp: true }} />
            <StatCard label="Tasa de Conversión" value="28%" icon={PieChart} trend={{ value: 5, isUp: true }} />
            <StatCard label="Ventas Cerradas" value="S/ 12,450" icon={Target} trend={{ value: 20, isUp: true }} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="glass-dark rounded-[2rem] border border-white/5 p-8">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-indigo-400" />
                        Conversaciones por Día
                    </h3>
                </div>
                <div className="h-64 flex items-end justify-between gap-2">
                    {[40, 70, 45, 90, 65, 80, 100].map((h, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                            <div className="w-full bg-indigo-600/20 rounded-t-lg relative overflow-hidden group-hover:bg-indigo-500/40 transition-all" style={{ height: `${h}%` }}>
                                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-indigo-500 to-transparent opacity-50" />
                            </div>
                            <span className="text-[10px] text-muted-foreground uppercase font-bold">Día {i+1}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="glass-dark rounded-[2rem] border border-white/5 p-8">
                <h3 className="text-xl font-bold mb-8">Top Productos Vendidos</h3>
                <div className="space-y-6">
                    {[
                        { name: "Prunex 1 (Caja)", share: 45, color: "bg-indigo-500" },
                        { name: "Thermo T3", share: 30, color: "bg-purple-500" },
                        { name: "Flora Liv", share: 15, color: "bg-blue-500" },
                        { name: "Otros", share: 10, color: "bg-white/20" }
                    ].map((item) => (
                        <div key={item.name} className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium">{item.name}</span>
                                <span className="text-muted-foreground">{item.share}%</span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <div className={`h-full ${item.color} shadow-[0_0_10px_rgba(99,102,241,0.5)]`} style={{ width: `${item.share}%` }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        <div className="glass-dark rounded-[2rem] border border-white/5 p-8">
            <h3 className="text-xl font-bold mb-6">Eficiencia de Respuesta</h3>
            <div className="flex flex-wrap gap-8">
                <div className="flex-1 min-w-[200px] p-6 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-sm text-muted-foreground mb-1">Tiempo de Respuesta IA</p>
                    <p className="text-2xl font-bold text-emerald-400">0.8 Segundos</p>
                </div>
                <div className="flex-1 min-w-[200px] p-6 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-sm text-muted-foreground mb-1">Precisión de Respuesta</p>
                    <p className="text-2xl font-bold text-indigo-400">98.5%</p>
                </div>
                <div className="flex-1 min-w-[200px] p-6 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-sm text-muted-foreground mb-1">Escalamiento Humano</p>
                    <p className="text-2xl font-bold text-purple-400">4%</p>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}
