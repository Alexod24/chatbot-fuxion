"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { 
  Users, 
  Plus, 
  Search, 
  ShieldCheck, 
  ShieldAlert,
  Calendar,
  DollarSign,
  MoreVertical,
  CheckCircle,
  XCircle,
  BarChart3,
  Loader2
} from "lucide-react";

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newClient, setNewClient] = useState({ name: "", email: "", password: "", payment: 50 });
  const [stats, setStats] = useState({ totalRequests: 0, todayRequests: 0, activeSessions: 0 });


  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      // Temporary check until Supabase Auth is fully integrated in frontend
      if (user.role === "admin" || user.email === "admin@gmail.com") {
        setIsAdmin(true);
        fetchClients();
        fetchStats();
      } else {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      if (!data.error) setStats(data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/clients");
      const data = await res.json();
      if (Array.isArray(data)) {
        setClients(data);
      }
    } catch (err) {
      console.error("Error fetching clients:", err);
    } finally {
      setIsLoading(false);
    }
  };


  const toggleStatus = async (id: any, currentIsActive: any) => {
    const newStatus = !currentIsActive;
    await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, updates: { is_active: newStatus } })
    });
    fetchClients();
  };

  const handleRenew = async (id: any, action: 'renew' | 'trial') => {
    const confirmMessage = action === 'renew' 
      ? "¿Estás seguro de que deseas renovar 1 mes para este cliente?" 
      : "¿Estás seguro de que deseas dar 7 días de prueba a este cliente?";
      
    if (!confirm(confirmMessage)) return;
    try {
      await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, updates: { action } })
      });
      fetchClients();
    } catch (err) {
      console.error("Error updating client plan:", err);
    }
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClient)
      });
      const data = await res.json();
      if (data.error) alert("Error: " + data.error);
      else {
        setShowAddModal(false);
        setNewClient({ name: "", email: "", password: "", payment: 50 });
        fetchClients();
      }
    } catch (err) {
      console.error("Error adding client:", err);
    } finally {
      setIsSubmitting(false);
    }
  };


  if (isLoading) {
    return (
      <div className="flex h-screen bg-black text-white items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex h-screen bg-black text-white items-center justify-center">
        <div className="text-center space-y-4">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto" />
          <h1 className="text-2xl font-bold">Acceso Denegado</h1>
          <p className="text-muted-foreground">Solo el administrador puede ver esta sección.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-black text-white">
      <Sidebar />
      
      <main className="flex-1 p-8 space-y-8 animate-fade-in">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Clientes SaaS</h1>
            <p className="text-muted-foreground">Control de accesos y monitorización de peticiones.</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-indigo-600 rounded-2xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-500 transition-all shadow-lg glow-indigo"
          >
            <Plus className="w-5 h-5" />
            Nuevo Cliente
          </button>
        </header>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass-dark p-6 rounded-3xl border border-white/5 flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Activos</p>
              <p className="text-2xl font-bold">{clients.filter(c => c.is_active).length}</p>
            </div>
          </div>
          <div className="glass-dark p-6 rounded-3xl border border-white/5 flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-indigo-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ingresos (Est.)</p>
              <p className="text-2xl font-bold">S/ {clients.length * 50}</p>
            </div>
          </div>
          <div className="glass-dark p-6 rounded-3xl border border-white/5 flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Peticiones Hoy</p>
              <p className="text-2xl font-bold">{stats.todayRequests.toLocaleString()}</p>
            </div>
          </div>
          <div className="glass-dark p-6 rounded-3xl border border-white/5 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Peticiones Totales</p>
              <p className="text-2xl font-bold">{stats.totalRequests.toLocaleString()}</p>
            </div>
          </div>
        </div>


        {/* Clients Table */}
        <div className="glass-dark rounded-[2rem] border border-white/5 overflow-hidden">
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
            <h3 className="font-bold">Clientes en Plataforma</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Buscar email..." className="bg-black border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs uppercase tracking-widest text-muted-foreground border-b border-white/5">
                  <th className="px-8 py-4">Usuario</th>
                  <th className="px-8 py-4">WhatsApp ID</th>
                  <th className="px-8 py-4">Fecha Creación</th>
                  <th className="px-8 py-4">Rol</th>
                  <th className="px-8 py-4">Plan Restante</th>
                  <th className="px-8 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold uppercase">
                          {client.full_name?.charAt(0) || client.email.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold">{client.full_name || 'Sin nombre'}</p>
                          <p className="text-xs text-muted-foreground">{client.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <code className="text-xs bg-white/5 px-2 py-1 rounded border border-white/10 text-white/60">
                        {client.whatsapp_client_id || 'no_vinculado'}
                      </code>
                    </td>
                    <td className="px-8 py-6 text-sm text-muted-foreground">
                      {new Date(client.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-6">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        client.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {client.role}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      {(() => {
                        if (!client.plan_end_date) return <span className="text-muted-foreground text-xs">Sin Plan</span>;
                        const planEnd = new Date(client.plan_end_date);
                        const now = new Date();
                        const diffTime = planEnd.getTime() - now.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        let badgeClass = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
                        let label = `${diffDays} días`;
                        
                        if (diffDays <= 0) {
                          badgeClass = 'bg-red-500/10 text-red-500 border-red-500/20';
                          label = 'Expirado';
                        } else if (diffDays <= 3) {
                          badgeClass = 'bg-orange-500/10 text-orange-500 border-orange-500/20';
                        }

                        return (
                          <div className="flex flex-col items-start gap-1">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badgeClass}`}>
                              {label}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              Hasta {planEnd.toLocaleDateString()}
                            </span>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleRenew(client.id, 'trial')}
                          title="Dar 7 Días de Prueba"
                          className="px-3 py-1 text-xs font-bold rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500 hover:text-white transition-all"
                        >
                          +7 Días
                        </button>
                        <button 
                          onClick={() => handleRenew(client.id, 'renew')}
                          title="Renovar 1 Mes"
                          className="px-3 py-1 text-xs font-bold rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500 hover:text-white transition-all"
                        >
                          +1 Mes
                        </button>
                        <button 
                          onClick={() => toggleStatus(client.id, client.is_active)}
                          title={client.is_active ? 'Suspender' : 'Activar'}
                          className={`p-2 rounded-xl transition-all ${
                            client.is_active ? 'bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white'
                          }`}
                        >
                          {client.is_active ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Client Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="glass-dark w-full max-w-md rounded-[2.5rem] border border-white/10 p-8 shadow-2xl animate-fade-in">
              <h3 className="text-2xl font-bold mb-6">Nuevo Usuario SaaS</h3>
              <form onSubmit={handleAddClient} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground ml-1">Nombre Completo</label>
                  <input 
                    required 
                    value={newClient.name}
                    onChange={e => setNewClient({...newClient, name: e.target.value})}
                    type="text" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50" 
                    placeholder="Ej. Carlos Martínez"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground ml-1">Email</label>
                  <input 
                    required 
                    value={newClient.email}
                    onChange={e => setNewClient({...newClient, email: e.target.value})}
                    type="email" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50" 
                    placeholder="carlos@gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground ml-1">Contraseña Inicial</label>
                  <input 
                    required 
                    value={newClient.password}
                    onChange={e => setNewClient({...newClient, password: e.target.value})}
                    type="password" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50" 
                    placeholder="••••••••"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 bg-white/5 rounded-2xl font-bold hover:bg-white/10 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 bg-indigo-600 rounded-2xl font-bold hover:bg-indigo-500 transition-all shadow-lg glow-indigo disabled:opacity-50"
                  >
                    {isSubmitting ? 'Creando...' : 'Crear Acceso'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

