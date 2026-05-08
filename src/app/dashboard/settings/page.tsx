"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  CreditCard,
  Mail,
  Smartphone,
  Check
} from "lucide-react";

export default function SettingsPage() {
  const [userName, setUserName] = useState("Usuario");

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserName(user.name || "Usuario");
    }
  }, []);

  return (
    <div className="flex min-h-screen bg-black text-white">
      <Sidebar />
      
      <main className="flex-1 p-8 space-y-8">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
          <p className="text-muted-foreground">Administra tu cuenta y las preferencias del sistema.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <aside className="space-y-2">
                {[
                    { icon: User, label: "Perfil", active: true },
                    { icon: Bell, label: "Notificaciones", active: false },
                    { icon: Shield, label: "Seguridad", active: false },
                    { icon: CreditCard, label: "Facturación", active: false }
                ].map((item) => (
                    <button 
                        key={item.label}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                            item.active ? "bg-white/10 text-white border border-white/10" : "text-muted-foreground hover:bg-white/5"
                        }`}
                    >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                    </button>
                ))}
            </aside>

            <div className="lg:col-span-3 space-y-8">
                <section className="glass-dark rounded-[2rem] border border-white/5 p-8 space-y-6">
                    <h3 className="text-xl font-bold border-b border-white/5 pb-4">Información del Perfil</h3>
                    
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-3xl font-bold relative group">
                            {userName.charAt(0)}
                            <button className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                                Cambiar
                            </button>
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-lg font-bold">{userName}</h4>
                            <p className="text-sm text-muted-foreground">Administrador del Sistema</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Nombre Completo</label>
                            <input type="text" defaultValue={userName} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Correo Electrónico</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input type="email" defaultValue="admin@fuxion.ai" className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Teléfono Vinculado</label>
                            <div className="relative">
                                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input type="text" defaultValue="+51 987 654 321" className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button className="px-6 py-2 bg-indigo-600 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-500 transition-all shadow-lg glow-indigo">
                            <Check className="w-4 h-4" />
                            Guardar Cambios
                        </button>
                    </div>
                </section>

                <section className="glass-dark rounded-[2rem] border border-white/5 p-8">
                    <h3 className="text-xl font-bold border-b border-white/5 pb-4 mb-6">Preferencias del Chatbot</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                            <div>
                                <p className="font-bold">Modo Híbrido</p>
                                <p className="text-xs text-muted-foreground">Permitir intervención humana en chats activos.</p>
                            </div>
                            <div className="w-12 h-6 bg-indigo-600 rounded-full relative cursor-pointer">
                                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                            <div>
                                <p className="font-bold">Notificaciones Push</p>
                                <p className="text-xs text-muted-foreground">Avisar cuando un cliente solicita un asesor humano.</p>
                            </div>
                            <div className="w-12 h-6 bg-indigo-600 rounded-full relative cursor-pointer">
                                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
      </main>
    </div>
  );
}
