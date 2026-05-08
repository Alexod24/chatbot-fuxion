"use client";

import React, { useState, useEffect } from "react";
import { QrCode, CheckCircle2, AlertCircle, RefreshCw, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface BotStatusProps {
    userId?: string | null;
}

export function BotStatus({ userId = 'default' }: BotStatusProps) {
  const [status, setStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const [qr, setQr] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/whatsapp/status?userId=${userId || 'default'}`);
        const data = await response.json();
        
        if (data.state === "CONNECTED" || data.state === "AUTHENTICATED") {
          setStatus("connected");
          setShowQR(false);
          setQr(null);
        } else if (data.state === "QR_READY") {
          setStatus("connecting");
          setQr(data.qr);
          setShowQR(true);
        } else {
          setStatus("disconnected");
          setQr(null);
          // Don't hide QR if we are waiting for it, but if it's disconnected, hide it
          if (!data.qr) setShowQR(false);
        }
      } catch (error) {
        console.error("Error fetching WhatsApp status:", error);
      }
    };

    const interval = setInterval(fetchStatus, 3000);
    fetchStatus(); // Initial fetch

    return () => clearInterval(interval);
  }, [userId]);

  const toggleConnect = () => {
    // Backend should handle initialization
    if (status === "disconnected" && userId) {
        setStatus("connecting");
        fetch("/api/whatsapp/init", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId })
        });
    }
  };

  return (
    <div className="p-8 rounded-3xl bg-card border border-white/5 relative overflow-hidden group">
      {/* Glow effect */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-600/10 blur-[100px] rounded-full group-hover:bg-indigo-600/20 transition-all duration-700" />
      
      <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-3 h-3 rounded-full animate-pulse",
              status === "connected" ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]" : 
              status === "connecting" ? "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]" : 
              "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]"
            )} />
            <span className="text-sm font-semibold tracking-wider uppercase text-muted-foreground">
              Estado del Agente: {status === "connected" ? "Activo" : status === "connecting" ? "Vinculando..." : "Inactivo"}
            </span>
          </div>
          
          <h2 className="text-3xl font-bold text-white">
            {status === "connected" ? "¡Tu agente está vendiendo!" : "Vincula tu WhatsApp"}
          </h2>
          
          <p className="text-muted-foreground max-w-md leading-relaxed">
            {status === "connected" 
              ? "El agente Fuxion AI está procesando mensajes y cerrando ventas automáticamente en tu número vinculado."
              : "Escanea el código QR con tu aplicación de WhatsApp para activar tu agente inteligente y empezar a automatizar tus ventas."}
          </p>

          <div className="flex gap-4 pt-2">
            <button 
              onClick={toggleConnect}
              disabled={status === "connecting"}
              className={cn(
                "px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2",
                status === "connected" 
                  ? "bg-white/5 text-white hover:bg-white/10" 
                  : "bg-indigo-600 text-white hover:bg-indigo-700 glow-indigo disabled:opacity-50"
              )}
            >
              {status === "connected" ? "Agente Conectado" : status === "connecting" ? "Generando QR..." : "Vincular WhatsApp"}
              {status === "connecting" && <RefreshCw className="w-4 h-4 animate-spin" />}
            </button>
            
            {status === "connected" && (
              <button className="px-6 py-3 rounded-xl font-bold bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-all flex items-center gap-2 border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4" />
                Ver Logs en Vivo
              </button>
            )}
          </div>
        </div>

        <div className="relative">
          <AnimatePresence mode="wait">
            {showQR && qr ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.9, rotate: 5 }}
                className="p-4 bg-white rounded-2xl shadow-2xl relative group"
              >
                <div className="w-48 h-48 bg-white flex items-center justify-center rounded-lg overflow-hidden">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qr)}`}
                    alt="WhatsApp QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                  <p className="text-white text-xs font-bold text-center px-4">
                    Abre WhatsApp &gt; Dispositivos Vinculados &gt; Vincular un dispositivo
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-56 h-56 bg-white/5 rounded-3xl border border-white/10 flex flex-col items-center justify-center text-muted-foreground gap-4"
              >
                <Smartphone className="w-16 h-16 opacity-20" />
                <span className="text-xs font-medium uppercase tracking-widest opacity-40">
                  {status === "connected" ? "Conectado" : "Esperando Conexión"}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Decorative floating elements */}
          <div className="absolute -top-4 -right-4 w-12 h-12 bg-indigo-500/20 rounded-full blur-xl animate-pulse" />
          <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-purple-500/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
      </div>
    </div>
  );
}

