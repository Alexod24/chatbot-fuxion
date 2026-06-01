"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { PlanStatus } from "@/components/dashboard/PlanStatus";
import { History, ShieldCheck, Zap, Loader2 } from "lucide-react";

export default function PlanPage() {
    const [userId, setUserId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                setUserId(user.id);
            } catch (e) {}
        }
        setIsLoading(false);
    }, []);

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
                <header className="h-20 border-b border-white/5 px-8 flex items-center bg-black/50 backdrop-blur-xl z-20">
                    <h1 className="text-xl font-bold">Gestión de Plan</h1>
                </header>

                <div className="p-8 space-y-8 animate-fade-in max-w-5xl mx-auto w-full">
                    
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-indigo-600/20 rounded-2xl flex items-center justify-center border border-indigo-500/20">
                            <ShieldCheck className="text-indigo-400 w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">Mi Plan Actual</h2>
                            <p className="text-muted-foreground">Revisa el estado de tu membresía y mantén tu agente activo.</p>
                        </div>
                    </div>

                    <PlanStatus userId={userId} />

                    <div className="glass-dark rounded-3xl border border-white/5 p-8 mt-8">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <History className="w-5 h-5 text-indigo-400" />
                            Historial y Beneficios
                        </h3>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h4 className="font-semibold text-white/80">Beneficios del Plan Pro</h4>
                                <ul className="space-y-3">
                                    <li className="flex items-center gap-3 text-sm text-muted-foreground">
                                        <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                            <Zap className="w-3 h-3" />
                                        </div>
                                        Agente Fuxion IA 24/7 sin interrupciones
                                    </li>
                                    <li className="flex items-center gap-3 text-sm text-muted-foreground">
                                        <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                            <Zap className="w-3 h-3" />
                                        </div>
                                        Análisis avanzado y reportes de prospectos
                                    </li>
                                    <li className="flex items-center gap-3 text-sm text-muted-foreground">
                                        <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                            <Zap className="w-3 h-3" />
                                        </div>
                                        Respuestas en menos de 5 segundos
                                    </li>
                                </ul>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-semibold text-white/80">Actividad de la Cuenta</h4>
                                <div className="border border-white/5 rounded-2xl p-4 bg-white/[0.02]">
                                    <div className="relative pl-4 border-l border-white/10 space-y-6">
                                        <div className="relative">
                                            <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500" />
                                            <p className="text-sm font-bold text-white">Estado Actualizado</p>
                                            <p className="text-xs text-muted-foreground">Revisión de plan vigente.</p>
                                        </div>
                                        <div className="relative">
                                            <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-white/20" />
                                            <p className="text-sm font-bold text-white">Creación de Cuenta</p>
                                            <p className="text-xs text-muted-foreground">Activación inicial del agente en Fuxion AI.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
