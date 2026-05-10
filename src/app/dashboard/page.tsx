"use client";

import React, { useEffect, useState } from "react";
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
  Zap,
  Save,
  CheckCircle,
  Loader2
} from "lucide-react";

export default function DashboardPage() {
  const [userName, setUserName] = useState("Usuario");
  const [userId, setUserId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [prospects, setProspects] = useState<any[]>([]);
  const [totalCostPEN, setTotalCostPEN] = useState("0.0000");
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserName(user.full_name || user.name || "Usuario");
      setUserId(user.id || 'default');
      
      // Initialize WhatsApp for this user if not already done
      if (user.id) {
          fetch("/api/whatsapp/init", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: user.id })
          });
      }
    }

    const fetchData = async () => {
        const userStr = typeof window !== 'undefined' ? localStorage.getItem("user") : null;
        let uId = 'default';
        
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                uId = user.id || 'default';
            } catch (e) {
                console.error("Error parsing user", e);
            }
        }
        
        // Cargar config del bot
        fetch(`/api/config?userId=${uId}`)
          .then(res => res.json())
          .then(data => {
            if (data.expert_prompt) setPrompt(data.expert_prompt);
          });

        // Cargar prospectos iniciales
        fetch(`/api/prospects?userId=${uId}`)
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data)) setProspects(data);
          });

        // Cargar Estadísticas de Gasto (ADMIN/STATS)
        fetch('/api/admin/stats')
            .then(res => res.json())
            .then(data => {
                if (data.totalCostPEN) setTotalCostPEN(data.totalCostPEN);
                setIsLoading(false);
            });
    };

    fetchData();

    // Polling para actualizar cada 30s
    const interval = setInterval(() => {
        const userStr = typeof window !== 'undefined' ? localStorage.getItem("user") : null;
        let uId = 'default';
        if (userStr) {
            try { uId = JSON.parse(userStr).id || 'default'; } catch(e) {}
        }
        
        fetch(`/api/prospects?userId=${uId}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setProspects(data);
            });

        fetch('/api/admin/stats')
            .then(res => res.json())
            .then(data => {
                if (data.totalCostPEN) setTotalCostPEN(data.totalCostPEN);
            });
    }, 30000);


    return () => clearInterval(interval);
  }, []);

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, expert_prompt: prompt })
      });
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 3000);
    } catch (err) {
      console.error("Error saving config:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (isoString: any) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Ahora";
    if (diffMins < 60) return `Hace ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours} h`;
    return date.toLocaleDateString();
  };


  if (isLoading) {
      return (
          <div className="flex h-screen bg-black text-white items-center justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
          </div>
      );
  }

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
                <p className="text-sm font-bold">{userName}</p>
                <p className="text-xs text-muted-foreground">Plan Pro</p>
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
              <h1 className="text-4xl font-bold tracking-tight mb-2">¡Hola, {userName.split(' ')[0]}! 👋</h1>
              <p className="text-muted-foreground">Aquí tienes el control de tu agente Fuxion AI.</p>
            </div>
            <div className="flex items-center gap-3 bg-card border border-white/5 p-2 rounded-2xl">
              <button className="px-4 py-2 bg-white/5 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors">Hoy</button>
              <button className="px-4 py-2 bg-indigo-600 rounded-xl text-sm font-medium shadow-lg glow-indigo">En tiempo real</button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard label="Conversaciones" value={prospects.length} icon={MessageSquare} trend={{ value: 12, isUp: true }} />
            <StatCard label="Prospectos" value={prospects.length} icon={Users} trend={{ value: 8, isUp: true }} />
            <StatCard label="Tasa Cierre" value="24%" icon={TrendingUp} trend={{ value: 4, isUp: true }} />
            <StatCard label="Gasto Gemini" value={`S/ ${totalCostPEN}`} icon={Zap} trend={{ value: 0, isUp: false }} />
          </div>

          {/* Bot Status Section */}
          <BotStatus userId={userId} />

          {/* Activity and Config Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Real Prospects List */}
            <div className="lg:col-span-2 glass-dark rounded-3xl border border-white/5 p-8 flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold">Actividad Reciente</h3>
                <button className="text-sm text-indigo-400 hover:underline">Ver todo</button>
              </div>
              
              <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {prospects.length > 0 ? prospects.map((prospect) => (
                  <div key={prospect.id} className="flex items-center gap-4 group cursor-pointer border-b border-white/5 pb-4 last:border-0">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                      <Users className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold">{prospect.name}</p>
                        <span className="text-[10px] px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-white/40 uppercase tracking-tighter">
                          {prospect.whatsapp_number?.split('@')[0] || 'whatsapp'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1 italic">"{prospect.last_message}"</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-white/40 mb-1">{formatTime(prospect.created_at)}</p>
                      <span className="text-[10px] px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg border border-emerald-500/20 font-bold uppercase tracking-wider">
                        {prospect.status}
                      </span>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-20">
                    <MessageSquare className="w-12 h-12 text-white/10 mx-auto mb-4" />
                    <p className="text-muted-foreground">Esperando nuevos prospectos...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Config Section (Quick Edit) */}
            <div className="glass-dark rounded-3xl border border-white/5 p-8 flex flex-col">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-400" />
                Prompt del Asesor
              </h3>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="flex-1 bg-black/40 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 mb-6 resize-none placeholder:text-white/10"
                placeholder="Escribe aquí las instrucciones de tu bot..."
              />
              <button 
                onClick={handleSaveConfig}
                disabled={isSaving}
                className="w-full py-4 bg-indigo-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-500 transition-all shadow-lg glow-indigo disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : showSaved ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    ¡Guardado!
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

