import React from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { StatCard } from "@/components/dashboard/StatCard";
import { BotStatus } from "@/components/dashboard/BotStatus";
import { 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Clock, 
  Search,
  Bell,
  Calendar,
  Settings,
  Zap
} from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen bg-black text-white">
      <Sidebar />
      
      <main className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between sticky top-0 bg-black/50 backdrop-blur-xl z-20">
          <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-xl border border-white/5 w-96 group focus-within:border-indigo-500/50 transition-all">
            <Search className="w-5 h-5 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Buscar conversaciones..." 
              className="bg-transparent border-none outline-none text-sm w-full placeholder:text-white/20"
            />
          </div>

          <div className="flex items-center gap-6">
            <button className="relative p-2 text-muted-foreground hover:text-white transition-colors">
              <Bell className="w-6 h-6" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full border-2 border-black" />
            </button>
            
            <div className="flex items-center gap-3 pl-6 border-l border-white/5">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold">Alexod Developer</p>
                <p className="text-xs text-muted-foreground">Admin Plan</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border border-white/20" />
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-8 space-y-8 animate-fade-in">
          {/* Welcome Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2">¡Hola, Alexod! 👋</h1>
              <p className="text-muted-foreground">Aquí tienes un resumen de lo que ha hecho tu agente hoy.</p>
            </div>
            <div className="flex items-center gap-3 bg-card border border-white/5 p-2 rounded-2xl">
              <button className="px-4 py-2 bg-white/5 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors">Día</button>
              <button className="px-4 py-2 bg-indigo-600 rounded-xl text-sm font-medium shadow-lg glow-indigo">Semana</button>
              <button className="px-4 py-2 bg-white/5 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Junio 2024
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              label="Conversaciones Totales" 
              value="1,284" 
              icon={MessageSquare} 
              trend={{ value: 12, isUp: true }} 
            />
            <StatCard 
              label="Prospectos Nuevos" 
              value="420" 
              icon={Users} 
              trend={{ value: 8, isUp: true }} 
            />
            <StatCard 
              label="Tasa de Cierre" 
              value="32%" 
              icon={TrendingUp} 
              trend={{ value: 4, isUp: true }} 
            />
            <StatCard 
              label="Tiempo de Respuesta" 
              value="1.2s" 
              icon={Clock} 
              trend={{ value: 2, isUp: false }} 
            />
          </div>

          {/* Bot Status Section */}
          <BotStatus />

          {/* Bottom Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 glass-dark rounded-3xl border border-white/5 p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold">Actividad Reciente</h3>
                <button className="text-sm text-indigo-400 hover:underline">Ver todo</button>
              </div>
              
              <div className="space-y-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-4 group cursor-pointer">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                      <Users className="w-6 h-6 text-muted-foreground group-hover:text-indigo-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold">Nuevo Prospecto: Juan Pérez</p>
                      <p className="text-sm text-muted-foreground">Preguntó por: Membresía Chatbot Pro</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">Hace {i * 5} min</p>
                      <span className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold">Cerrado</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-dark rounded-3xl border border-white/5 p-8 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold mb-4">Meta de Ventas</h3>
                <div className="relative h-4 w-full bg-white/5 rounded-full overflow-hidden mb-4">
                  <div className="absolute top-0 left-0 h-full w-[75%] bg-gradient-to-r from-indigo-500 to-purple-500" />
                </div>
                <div className="flex justify-between text-sm mb-8">
                  <span className="text-muted-foreground">Progreso: 75%</span>
                  <span className="font-bold">$7,500 / $10,000</span>
                </div>
              </div>

              <div className="p-6 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-xl glow-indigo">
                <p className="font-bold mb-2">¡Sube al siguiente nivel!</p>
                <p className="text-xs text-white/80 mb-4">Libera el poder de la IA con el plan Enterprise.</p>
                <button className="w-full py-3 bg-white text-black font-bold rounded-xl text-sm hover:bg-neutral-100 transition-colors">
                  Upgrade Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
