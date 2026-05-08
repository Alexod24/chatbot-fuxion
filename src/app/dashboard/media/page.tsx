"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { 
  Music, 
  Upload, 
  Play, 
  Trash2, 
  CheckCircle,
  Mic,
  Info
} from "lucide-react";

export default function MediaPage() {
  const [audios, setAudios] = useState<any[]>([]);
  const [userEmail, setUserEmail] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserEmail(user.email);
      fetchAudios(user.email);
    }
  }, []);

  const fetchAudios = async (email: any) => {
    const res = await fetch(`/api/media/upload?email=${email}`);
    const data = await res.json();
    setAudios(data);
  };

  const handleFileUpload = async (e: any, tag: any) => {
    const file = e.target.files[0];

    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', tag);
    formData.append('email', userEmail);

    try {
      await fetch('/api/media/upload', {
        method: 'POST',
        body: formData
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      fetchAudios(userEmail);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const predefinedTags = [
    { id: 'bienvenida', label: 'Bienvenida', desc: 'Se envía al iniciar la charla.' },
    { id: 'oferta', label: 'Oferta Especial', desc: 'Se envía al dar precios.' },
    { id: 'llamada', label: 'Cierre (Llamada)', desc: 'Para coordinar la llamada final.' },
    { id: 'testimonio', label: 'Testimonio', desc: 'Genera confianza con el cliente.' }
  ];

  return (
    <div className="flex min-h-screen bg-black text-white">
      <Sidebar />
      
      <main className="flex-1 p-8 space-y-8">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Multimedia</h1>
          <p className="text-muted-foreground">Sube tus propios audios para que el bot hable con tu voz.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {predefinedTags.map((tag) => (
                <div key={tag.id} className="glass-dark p-6 rounded-3xl border border-white/5 space-y-4 group hover:border-indigo-500/30 transition-all">
                  <div className="flex justify-between items-start">
                    <div className="p-3 bg-indigo-600/10 rounded-2xl">
                      <Mic className="w-6 h-6 text-indigo-400" />
                    </div>
                    {audios.includes(tag.id) ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-lg">
                        <CheckCircle className="w-3 h-3" />
                        Subido
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Pendiente</span>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-lg">{tag.label}</h3>
                    <p className="text-xs text-muted-foreground">{tag.desc}</p>
                  </div>

                  <div className="flex gap-2">
                    <label className="flex-1 cursor-pointer">
                      <input 
                        type="file" 
                        accept=".ogg,.mp3" 
                        className="hidden" 
                        onChange={(e) => handleFileUpload(e, tag.id)}
                        disabled={uploading}
                      />
                      <div className="w-full py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-all">
                        <Upload className="w-3 h-3" />
                        {uploading ? 'Subiendo...' : 'Subir Audio'}
                      </div>
                    </label>
                    {audios.includes(tag.id) && (
                      <button className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all">
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-dark p-8 rounded-3xl border border-white/5 space-y-4">
              <div className="flex items-center gap-2 text-indigo-400 mb-2">
                <Info className="w-5 h-5" />
                <h3 className="font-bold uppercase tracking-widest text-xs">Instrucciones</h3>
              </div>
              <ul className="text-sm space-y-4 text-muted-foreground">
                <li className="leading-relaxed">
                  <strong className="text-white block mb-1">Formato Recomendado</strong>
                  Usa archivos <span className="text-indigo-400">.ogg</span>. WhatsApp los reconoce como notas de voz reales.
                </li>
                <li className="leading-relaxed">
                  <strong className="text-white block mb-1">Duración Máxima</strong>
                  Te recomendamos audios de máximo 30 segundos para no aburrir al cliente.
                </li>
                <li className="leading-relaxed">
                  <strong className="text-white block mb-1">Personalización</strong>
                  Graba los audios en un lugar sin ruido para que suenen profesionales.
                </li>
              </ul>
            </div>

            {showSuccess && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-400 animate-in fade-in slide-in-from-bottom-4">
                <CheckCircle className="w-5 h-5" />
                <p className="text-sm font-bold">¡Audio actualizado con éxito!</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
