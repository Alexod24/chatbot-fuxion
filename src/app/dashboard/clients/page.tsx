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
  XCircle
} from "lucide-react";

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClient, setNewClient] = useState({ name: "", email: "", payment: 50 });

  useEffect(() => {
    // Verificar si es admin
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.email === "admin@gmail.com") {
        setIsAdmin(true);
        fetchClients();
      }
    }
  }, []);

  const fetchClients = async () => {
    const res = await fetch("/api/clients");
    const data = await res.json();
    setClients(data);
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, updates: { status: newStatus } })
    });
    fetchClients();
  };

  const handleAddClient = async (e) => {
    e.preventDefault();
    await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newClient)
    });
    setShowAddModal(false);
    setNewClient({ name: "", email: "", payment: 50 });
    fetchClients();
  };

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
      
      <main className="flex-1 p-8 space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Clientes</h1>
            <p className="text-muted-foreground">Administra las suscripciones y accesos de tus usuarios.</p>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-dark p-6 rounded-3xl border border-white/5 flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Clientes Activos</p>
              <p className="text-2xl font-bold">{clients.filter(c => c.status === 'active').length}</p>
            </div>
          </div>
          <div className="glass-dark p-6 rounded-3xl border border-white/5 flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-indigo-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ingresos Mensuales</p>
              <p className="text-2xl font-bold">S/ {clients.reduce((acc, c) => acc + Number(c.payment), 0)}</p>
            </div>
          </div>
          <div className="glass-dark p-6 rounded-3xl border border-white/5 flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Próximos Vencimientos</p>
              <p className="text-2xl font-bold">3</p>
            </div>
          </div>
        </div>

        {/* Clients Table */}
        <div className="glass-dark rounded-[2rem] border border-white/5 overflow-hidden">
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
            <h3 className="font-bold">Lista de Suscriptores</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Buscar cliente..." className="bg-black border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs uppercase tracking-widest text-muted-foreground border-b border-white/5">
                  <th className="px-8 py-4">Cliente</th>
                  <th className="px-8 py-4">Aporte</th>
                  <th className="px-8 py-4">Inicio</th>
                  <th className="px-8 py-4">Vencimiento</th>
                  <th className="px-8 py-4">Estado</th>
                  <th className="px-8 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {clients.map((client) => {
                  const daysLeft = Math.ceil((new Date(client.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                  return (
                    <tr key={client.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                            {client.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold">{client.name}</p>
                            <p className="text-xs text-muted-foreground">{client.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 font-mono text-emerald-400">S/ {client.payment}</td>
                      <td className="px-8 py-6 text-sm text-muted-foreground">{new Date(client.startDate).toLocaleDateString()}</td>
                      <td className="px-8 py-6">
                        <div className="space-y-1">
                          <p className="text-sm">{new Date(client.expiryDate).toLocaleDateString()}</p>
                          <p className={`text-[10px] font-bold uppercase ${daysLeft < 5 ? 'text-red-400' : 'text-indigo-400'}`}>
                            {daysLeft > 0 ? `${daysLeft} días restantes` : 'Vencido'}
                          </p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          client.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                        }`}>
                          {client.status === 'active' ? 'Habilitado' : 'Suspendido'}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button 
                          onClick={() => toggleStatus(client.id, client.status)}
                          className={`p-2 rounded-xl transition-all ${
                            client.status === 'active' ? 'bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white'
                          }`}
                        >
                          {client.status === 'active' ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Client Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="glass-dark w-full max-w-md rounded-[2.5rem] border border-white/10 p-8 shadow-2xl animate-fade-in">
              <h3 className="text-2xl font-bold mb-6">Añadir Nuevo Suscriptor</h3>
              <form onSubmit={handleAddClient} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground ml-1">Nombre del Cliente</label>
                  <input 
                    required 
                    value={newClient.name}
                    onChange={e => setNewClient({...newClient, name: e.target.value})}
                    type="text" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50" 
                    placeholder="Ej. Juan Pérez"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground ml-1">Email (para login)</label>
                  <input 
                    required 
                    value={newClient.email}
                    onChange={e => setNewClient({...newClient, email: e.target.value})}
                    type="email" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50" 
                    placeholder="juan@gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground ml-1">Aporte Mensual (S/)</label>
                  <input 
                    required 
                    value={newClient.payment}
                    onChange={e => setNewClient({...newClient, payment: e.target.value})}
                    type="number" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50" 
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 bg-white/5 rounded-2xl font-bold hover:bg-white/10 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-indigo-600 rounded-2xl font-bold hover:bg-indigo-500 transition-all shadow-lg glow-indigo"
                  >
                    Habilitar Acceso
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
