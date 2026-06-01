"use client";

import React, { useState, useEffect } from "react";
import { Calendar, AlertTriangle, CheckCircle, Clock } from "lucide-react";

export function PlanStatus({ userId }: { userId: string | null }) {
    const [planEndDate, setPlanEndDate] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;

        const fetchPlan = async () => {
            try {
                const res = await fetch(`/api/profile?userId=${userId}`);
                const data = await res.json();
                if (data.plan_end_date !== undefined) {
                    setPlanEndDate(data.plan_end_date);
                }
            } catch (err) {
                console.error("Error fetching plan status:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPlan();
        const interval = setInterval(fetchPlan, 30000);
        return () => clearInterval(interval);
    }, [userId]);

    if (isLoading) return null;

    let diffDays = 0;
    let isActive = false;
    let badgeClass = "bg-red-500/10 text-red-500 border-red-500/20";
    let title = "Plan Expirado o Inactivo";
    let desc = "Tu agente inteligente está pausado. Contacta a tu administrador para renovar o activar tu plan.";
    let Icon = AlertTriangle;

    if (planEndDate) {
        const planEnd = new Date(planEndDate);
        const now = new Date();
        const diffTime = planEnd.getTime() - now.getTime();
        diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 0) {
            isActive = true;
            if (diffDays <= 3) {
                badgeClass = "bg-orange-500/10 text-orange-500 border-orange-500/20";
                title = "Plan a Punto de Expirar";
                desc = "Te quedan pocos días de uso. Renueva pronto para evitar interrupciones.";
                Icon = Clock;
            } else {
                badgeClass = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
                title = "Plan Activo";
                desc = "Tu agente tiene acceso total y está listo para vender.";
                Icon = CheckCircle;
            }
        }
    }

    return (
        <div className="p-8 rounded-3xl bg-card border border-white/5 relative overflow-hidden group">
            <div className={`absolute -top-24 -right-24 w-64 h-64 blur-[100px] rounded-full transition-all duration-700 ${isActive ? 'bg-emerald-500/10 group-hover:bg-emerald-500/20' : 'bg-red-500/10 group-hover:bg-red-500/20'}`} />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                        <Icon className={`w-6 h-6 ${isActive ? (diffDays <= 3 ? 'text-orange-500' : 'text-emerald-500') : 'text-red-500'}`} />
                        <span className={`text-sm font-semibold tracking-wider uppercase px-3 py-1 rounded-full border ${badgeClass}`}>
                            {title}
                        </span>
                    </div>
                    
                    <h2 className="text-3xl font-bold text-white">
                        {isActive ? `Quedan ${diffDays} Días` : "0 Días Disponibles"}
                    </h2>
                    
                    <p className="text-muted-foreground max-w-md leading-relaxed">
                        {desc}
                    </p>

                    {planEndDate && (
                        <div className="flex items-center gap-2 text-sm text-white/40 font-medium">
                            <Calendar className="w-4 h-4" />
                            Vence el: {new Date(planEndDate).toLocaleDateString()}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
