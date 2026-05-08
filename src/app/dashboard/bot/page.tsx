"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { BotStatus } from "@/components/dashboard/BotStatus";
import { 
  Bot,
  Save,
  CheckCircle,
  Zap,
  Info
} from "lucide-react";

export default function BotConfigPage() {
  const [userName, setUserName] = useState("Usuario");
  const [prompt, setPrompt] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    // Cargar usuario
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserName(user.name || "Usuario");
    }

    // Cargar config del bot
    fetch("/api/config")
      .then(res => res.json())
      .then(data => {
        if (data.expert_prompt) setPrompt(data.expert_prompt);
      });
  }, []);

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          expert_prompt: prompt,
          ownerEmail: localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")).email : 'general'
        })
      });
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 3000);
    } catch (err) {
      console.error("Error saving config:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-black text-white">
      <Sidebar />
      
      <main className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between sticky top-0 bg-black/50 backdrop-blur-xl z-20">
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-indigo-400" />
            <h1 className="text-xl font-bold">Configuración del Agente</h1>
          </div>

          <div className="flex items-center gap-3">
             <div className="text-right hidden sm:block">
                <p className="text-sm font-bold">{userName}</p>
                <p className="text-xs text-muted-foreground text-indigo-400">Modo Editor</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-indigo-400" />
              </div>
          </div>
        </header>

        <div className="p-8 space-y-8 animate-fade-in">
          {/* Header Info */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold mb-2">Cerebro de la IA 🧠</h2>
              <p className="text-muted-foreground">
                Aquí defines la personalidad, los precios y las estrategias de cierre de tu bot. 
                Cualquier cambio aquí se reflejará en el próximo mensaje que envíe el bot.
              </p>
            </div>
            
            <div className="flex items-center gap-4">
                {showSaved && (
                  <span className="flex items-center gap-2 text-emerald-400 text-sm font-medium animate-in fade-in slide-in-from-right-4">
                    <CheckCircle className="w-4 h-4" />
                    ¡Sincronizado!
                  </span>
                )}
                <button 
                  onClick={handleSaveConfig}
                  disabled={isSaving}
                  className="px-8 py-3 bg-white text-black font-bold rounded-2xl hover:bg-neutral-200 transition-all flex items-center gap-2 shadow-2xl glow-white disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  {isSaving ? "Guardando..." : "Guardar Cambios"}
                </button>
            </div>
          </div>

          <BotStatus />

          {/* Editor Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            <div className="xl:col-span-3 space-y-6">
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[2rem] blur opacity-20 group-focus-within:opacity-40 transition duration-1000"></div>
                    <textarea 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="relative w-full h-[600px] bg-black border border-white/10 rounded-[2rem] p-8 text-base font-mono leading-relaxed focus:outline-none focus:border-indigo-500/50 transition-all resize-none shadow-2xl custom-scrollbar"
                        placeholder="Escribe aquí las instrucciones maestras..."
                    />
                    <div className="absolute top-6 right-6 flex gap-2">
                        <span className="px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-[10px] text-indigo-300 uppercase tracking-widest font-bold backdrop-blur-md">
                            IA Activa
                        </span>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="glass-dark rounded-3xl border border-white/5 p-6 space-y-4">
                    <div className="flex items-center gap-2 text-indigo-400">
                        <Info className="w-5 h-5" />
                        <h3 className="font-bold">Tips de Vendedor</h3>
                    </div>
                    <ul className="text-sm space-y-3 text-muted-foreground">
                        <li className="flex gap-2">
                            <span className="text-indigo-500">•</span>
                            Usa **negritas** para resaltar precios.
                        </li>
                        <li className="flex gap-2">
                            <span className="text-indigo-500">•</span>
                            Asegúrate de incluir siempre una pregunta al final.
                        </li>
                        <li className="flex gap-2">
                            <span className="text-indigo-500">•</span>
                            Menciona la escasez de regalos para cerrar rápido.
                        </li>
                    </ul>
                </div>

                <div className="p-6 bg-gradient-to-br from-indigo-600/10 to-purple-600/10 rounded-3xl border border-indigo-500/20">
                    <Zap className="w-8 h-8 text-indigo-500 mb-3" />
                    <h3 className="font-bold mb-1">Entrenamiento Live</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Tu bot está usando actualmente el modelo 2.5 Flash Lite para respuestas ultra rápidas.
                    </p>
                </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
