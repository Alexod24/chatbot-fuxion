"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Mic, Trash2, Info, Loader2, PlayCircle } from "lucide-react";

export default function MediaPage() {
    const [audios, setAudios] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                setUserId(user.id);
            } catch (e) {}
        }
    }, []);

    useEffect(() => {
        if (!userId) return;
        fetchAudios();
    }, [userId]);

    const fetchAudios = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/media/audios?userId=${userId}`);
            const data = await res.json();
            setAudios(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (name: string) => {
        if (!confirm(`¿Estás seguro de que deseas eliminar el audio "${name}"?`)) return;
        try {
            await fetch(`/api/media/audios?userId=${userId}&name=${name}`, { method: 'DELETE' });
            fetchAudios();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="flex min-h-screen bg-black text-white">
            <Sidebar />
            
            <main className="flex-1 flex flex-col">
                <header className="h-20 border-b border-white/5 px-8 flex items-center bg-black/50 backdrop-blur-xl z-20">
                    <h1 className="text-xl font-bold">Gestión de Audios</h1>
                </header>

                <div className="p-8 space-y-8 animate-fade-in max-w-6xl mx-auto w-full">
                    
                    <div className="flex flex-col md:flex-row gap-8">
                        
                        {/* Audio List Section */}
                        <div className="flex-1 space-y-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-indigo-600/20 rounded-2xl flex items-center justify-center border border-indigo-500/20">
                                    <Mic className="text-indigo-400 w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold tracking-tight">Mis Audios</h2>
                                    <p className="text-muted-foreground">Administra los audios que el bot enviará a tus clientes.</p>
                                </div>
                            </div>

                            {isLoading ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                                </div>
                            ) : audios.length === 0 ? (
                                <div className="glass-dark border border-white/5 p-12 rounded-3xl text-center">
                                    <Mic className="w-12 h-12 text-white/10 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold mb-2">No tienes audios guardados</h3>
                                    <p className="text-muted-foreground max-w-sm mx-auto">Sigue las instrucciones de la derecha para grabar tu primer audio desde WhatsApp.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {audios.map((audio) => (
                                        <div key={audio.id} className="glass-dark border border-white/5 p-6 rounded-3xl group hover:border-indigo-500/30 transition-all flex items-center justify-between">
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className="hidden sm:flex w-10 h-10 rounded-full bg-indigo-500/10 items-center justify-center text-indigo-400">
                                                    <Mic className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <p className="font-bold text-white uppercase text-sm tracking-wider">{audio.name}</p>
                                                        <p className="text-[10px] text-muted-foreground bg-white/5 px-2 py-0.5 rounded">
                                                            {new Date(audio.created_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    
                                                    {/* Native HTML5 Audio Player connecting to our WhatsApp stream API */}
                                                    <audio 
                                                        controls 
                                                        className="h-8 w-full max-w-[200px] outline-none" 
                                                        preload="none"
                                                        src={`/api/media/play?userId=${userId}&messageId=${encodeURIComponent(audio.message_id)}`}
                                                    />
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleDelete(audio.name)}
                                                className="w-8 h-8 flex items-center justify-center rounded-full bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                                                title="Eliminar Audio"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Instructions Card */}
                        <div className="w-full md:w-96 shrink-0">
                            <div className="glass-dark rounded-3xl border border-indigo-500/20 p-6 relative overflow-hidden">
                                <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/10 blur-[50px] rounded-full" />
                                
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-indigo-300">
                                    <Info className="w-5 h-5" />
                                    ¿Cómo guardar un audio?
                                </h3>

                                <div className="space-y-6 relative z-10">
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-sm shrink-0">1</div>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            Abre WhatsApp y escríbete <b>a ti mismo</b> o a tu propio número.
                                        </p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-sm shrink-0">2</div>
                                        <div>
                                            <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                                                Graba y envía una nota de voz normal.
                                            </p>
                                            <div className="bg-emerald-500/10 text-emerald-500 text-xs px-3 py-2 rounded-xl flex items-center gap-2 border border-emerald-500/20 w-max">
                                                <Mic className="w-4 h-4" /> 0:15
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-sm shrink-0">3</div>
                                        <div>
                                            <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                                                Desliza ese audio para <b>responderlo</b> y escribe el siguiente comando:
                                            </p>
                                            <div className="bg-black/50 border border-white/10 rounded-xl p-3">
                                                <code className="text-indigo-400 font-mono text-sm">#GUARDAR:LLAMADA</code>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl">
                                        <p className="text-xs text-orange-400">
                                            <b>Nota:</b> El audio se queda en WhatsApp. Aquí solo verás el nombre que usaste (ej: LLAMADA) para confirmar que se guardó.
                                        </p>
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
