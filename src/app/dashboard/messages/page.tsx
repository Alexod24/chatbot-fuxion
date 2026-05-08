"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { 
  MessageSquare, 
  Search, 
  Send, 
  User, 
  MoreVertical,
  Phone,
  Video
} from "lucide-react";

export default function MessagesPage() {
  const [prospects, setProspects] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = user.id || 'default';
    
    fetch(`/api/prospects?userId=${userId}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProspects(data);
          if (data.length > 0) setSelectedChat(data[0]);
        }
      });
  }, []);


  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 flex overflow-hidden">
        {/* Chat List Sidebar */}
        <div className="w-96 border-r border-white/5 flex flex-col bg-black">
          <div className="p-6 border-b border-white/5">
            <h1 className="text-2xl font-bold mb-4">Mensajes</h1>
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Buscar chat..." 
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {prospects.map((prospect) => (
              <div 
                key={prospect.id}
                onClick={() => setSelectedChat(prospect)}
                className={`p-4 flex items-center gap-4 cursor-pointer transition-colors ${
                  selectedChat?.id === prospect.id ? "bg-indigo-600/10 border-r-2 border-indigo-500" : "hover:bg-white/5"
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-lg">
                  {prospect.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-bold truncate">{prospect.name}</h3>
                    <span className="text-[10px] text-muted-foreground uppercase">12:30 PM</span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate italic">
                    {prospect.lastMessage}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col bg-[#0a0a0a]">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between bg-black/40 backdrop-blur-md">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="font-bold">{selectedChat.name}</h2>
                    <p className="text-xs text-emerald-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      En línea (WhatsApp)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button className="p-2 text-muted-foreground hover:text-white transition-colors">
                    <Phone className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-muted-foreground hover:text-white transition-colors">
                    <Video className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-muted-foreground hover:text-white transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </header>

              {/* Messages Area */}
              <div className="flex-1 p-8 overflow-y-auto space-y-6 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                <div className="flex justify-center">
                  <span className="text-[10px] bg-white/5 border border-white/10 px-3 py-1 rounded-full text-muted-foreground uppercase tracking-widest">
                    Hoy
                  </span>
                </div>

                <div className="flex flex-col gap-4">
                  {/* Prospect Message */}
                  <div className="flex flex-col items-start max-w-[70%]">
                    <div className="bg-white/10 border border-white/5 p-4 rounded-2xl rounded-tl-none">
                      <p className="text-sm">{selectedChat.lastMessage}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-1 ml-1">12:30 PM</span>
                  </div>

                  {/* AI Response */}
                  <div className="flex flex-col items-end self-end max-w-[70%]">
                    <div className="bg-indigo-600 p-4 rounded-2xl rounded-tr-none shadow-xl glow-indigo">
                      <p className="text-sm">¡Hola! Soy tu asesor Fuxion. ¿Cómo puedo ayudarte hoy con tu bienestar?</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-1 mr-1">12:31 PM • Enviado por IA</span>
                  </div>
                </div>
              </div>

              {/* Message Input */}
              <footer className="p-6 bg-black border-t border-white/5">
                <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-2 focus-within:border-indigo-500/50 transition-all">
                  <input 
                    type="text" 
                    placeholder="Escribe un mensaje manual..." 
                    className="flex-1 bg-transparent border-none outline-none px-4 py-2 text-sm"
                  />
                  <button className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center hover:bg-indigo-500 transition-colors shadow-lg glow-indigo">
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-[10px] text-center text-muted-foreground mt-3 uppercase tracking-widest opacity-50">
                  Modo Híbrido: La IA responderá si no intervienes en 5 minutos.
                </p>
              </footer>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <MessageSquare className="w-16 h-16 mb-4 opacity-10" />
              <p>Selecciona una conversación para ver los detalles</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
