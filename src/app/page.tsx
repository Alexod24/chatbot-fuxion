"use client";

import React, { useState, useEffect } from "react";
import { 
  Zap, 
  ArrowRight, 
  Bot, 
  Shield, 
  Globe, 
  MessageSquare, 
  Check, 
  HelpCircle, 
  ChevronDown, 
  Sparkles, 
  Smartphone, 
  Cpu, 
  BarChart3, 
  Database, 
  Users, 
  MessageCircle, 
  DollarSign, 
  CheckCircle,
  TrendingUp,
  Clock,
  Play
} from "lucide-react";
import Link from "next/link";

interface Message {
  sender: "user" | "bot";
  text: string;
  time: string;
}

export default function Home() {
  // Simulator State
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { sender: "bot", text: "¡Hola! 👋 Soy Fuxion AI, tu asesor comercial virtual. ¿En qué te puedo ayudar hoy?", time: "10:00 AM" }
  ]);

  // Pricing State
  const [isAnnual, setIsAnnual] = useState(false);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Simulated Chat Scenarios
  const scenarios: Record<string, { question: string; answer: string }> = {
    planes: {
      question: "¿Cuáles son los planes y cuánto cuesta Fuxion AI?",
      answer: "¡Hola! 🚀 En **Fuxion AI** tenemos planes ideales para cada etapa de tu negocio:\n\n1️⃣ **Plan Inicial (Prueba)**: S/ 0 por 7 días para que compruebes el potencial.\n2️⃣ **Plan Pro (Recomendado)**: S/ 109 al mes. Incluye conexión QR, 2,000 mensajes mensuales, Gemini 1.5 Pro y base de conocimientos ilimitada.\n3️⃣ **Plan Enterprise**: Solución a medida para alto volumen.\n\n¿Te gustaría iniciar tu prueba gratuita de 7 días ahora mismo?"
    },
    funcionamiento: {
      question: "¿Cómo se conecta a mi WhatsApp? ¿Necesito programar?",
      answer: "¡Para nada! 🛠️ Cero código. El proceso toma menos de 1 minuto:\n\n1️⃣ Entras a tu panel de **Fuxion AI**.\n2️⃣ Escaneas el **código QR** desde tu celular (igual que WhatsApp Web).\n3️⃣ ¡Listo! Tu bot ya está conectado y listo para atender a tus clientes.\n\n¿Quieres que te guíe para hacer la conexión?"
    },
    entrenamiento: {
      question: "¿Cómo aprende el bot sobre mis productos o servicios?",
      answer: "¡Es súper fácil! 🧠 Puedes entrenar a tu bot de dos formas:\n\n📝 **Instrucciones directas**: Le escribes en lenguaje natural cómo quieres que atienda (ej: 'Sé muy amable, ofrece un 10% de descuento si dudan, y pide el correo').\n📁 **Base de Conocimientos (RAG)**: Subes tus PDFs de catálogo, archivos de texto o pegas el link de tu web.\n\nEl bot asimilará todo en segundos y responderá con precisión absoluta."
    }
  };

  const handleSelectScenario = (key: string) => {
    if (isTyping || activeScenario === key) return;
    setActiveScenario(key);

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Add user message
    const userMsg: Message = {
      sender: "user",
      text: scenarios[key].question,
      time: currentTime
    };
    
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // Simulated delay for bot typing
    setTimeout(() => {
      setIsTyping(false);
      const botMsg: Message = {
        sender: "bot",
        text: scenarios[key].answer,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 1200);
  };

  const resetChat = () => {
    setMessages([
      { sender: "bot", text: "¡Hola! 👋 Soy Fuxion AI, tu asesor comercial virtual. ¿En qué te puedo ayudar hoy?", time: "10:00 AM" }
    ]);
    setActiveScenario(null);
    setIsTyping(false);
  };

  // FAQ Items
  const faqItems = [
    {
      q: "¿Necesito un número de WhatsApp exclusivo?",
      a: "No obligatoriamente, puedes usar tu número actual (personal o comercial). Sin embargo, para negocios con alto tráfico recomendamos usar una línea dedicada para evitar que los mensajes automáticos se mezclen con tus chats privados cotidianos."
    },
    {
      q: "¿Qué modelos de Inteligencia Artificial utiliza?",
      a: "Fuxion AI está potenciado por la tecnología de Google Gemini. Usamos Gemini 1.5 Pro para análisis de intenciones complejos y Gemini 1.5 Flash para respuestas ultrarrápidas, asegurando un balance óptimo entre costo, precisión y velocidad."
    },
    {
      q: "¿Puedo chatear yo mismo si el bot está activo?",
      a: "¡Sí, por supuesto! El sistema funciona de forma híbrida. Puedes intervenir en cualquier chat directamente desde tu aplicación de WhatsApp o pausar el bot de forma temporal desde tu panel de control si deseas tomar el control manual."
    },
    {
      q: "¿Cómo se calculan los costos de la IA?",
      a: "Fuxion AI se conecta de forma directa a la API oficial. Esto optimiza el consumo de tokens para que pagues únicamente céntimos por cada mil interacciones. Toda la contabilidad de costos se muestra de forma transparente en soles (PEN) en tu Dashboard."
    },
    {
      q: "¿Es seguro para mis datos de cliente?",
      a: "Totalmente. No almacenamos tus conversaciones de forma permanente en servidores externos sin tu consentimiento. Las conexiones se realizan mediante sesiones encriptadas de WhatsApp Web y los datos del entrenamiento RAG se guardan de forma aislada en Supabase."
    }
  ];

  return (
    <main className="min-h-screen bg-[#070709] text-white relative overflow-hidden font-sans selection:bg-indigo-500/30 selection:text-white">
      {/* Background gradients and stars */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[700px] bg-[radial-gradient(circle_at_50%_-10%,#312e81,transparent_55%)] opacity-60 pointer-events-none" />
      <div className="absolute top-[800px] right-0 w-[400px] h-[400px] bg-[radial-gradient(circle_at_80%_50%,#4f46e5,transparent_50%)] opacity-10 pointer-events-none" />
      <div className="absolute bottom-[300px] left-0 w-[500px] h-[500px] bg-[radial-gradient(circle_at_20%_50%,#7c3aed,transparent_50%)] opacity-10 pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

      {/* Navigation */}
      <nav className="sticky top-0 z-50 px-6 py-4 bg-[#070709]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="#" className="flex items-center gap-2.5 group">
            <div className="p-2 rounded-xl bg-indigo-600/10 border border-indigo-500/20 group-hover:border-indigo-500/40 transition-all">
              <Zap className="w-6 h-6 text-indigo-400 fill-indigo-400/20 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              Fuxion AI
            </span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#caracteristicas" className="text-sm font-medium text-white/60 hover:text-white transition-colors">Características</a>
            <a href="#como-funciona" className="text-sm font-medium text-white/60 hover:text-white transition-colors">Cómo Funciona</a>
            <a href="#simulador" className="text-sm font-medium text-white/60 hover:text-white transition-colors">Simulador</a>
            <a href="#precios" className="text-sm font-medium text-white/60 hover:text-white transition-colors">Precios</a>
            <a href="#faq" className="text-sm font-medium text-white/60 hover:text-white transition-colors">Preguntas Frecuentes</a>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 text-sm font-bold rounded-2xl transition-all">
              Iniciar Sesión
            </Link>
            <Link href="/login" className="hidden sm:inline-flex px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-2xl transition-all shadow-lg shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98]">
              Comenzar Gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 md:pt-28 pb-16 px-6 max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 space-y-8 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Vendedor WhatsApp IA 24/7</span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.05] text-white">
            Escala tus ventas en <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 bg-clip-text text-transparent">automático</span>.
          </h1>

          <p className="text-lg text-white/60 max-w-2xl leading-relaxed">
            Fuxion AI es el agente inteligente que atiende, califica y cierra prospectos 24/7 en tu propio WhatsApp. Conéctalo escaneando un código QR y deja que la IA trabaje por ti.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Link href="/login" className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-indigo-600/30 hover:scale-[1.03] active:scale-[0.97] group">
              Empezar Prueba Gratis
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="#simulador" className="px-8 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all">
              Probar Simulador
            </a>
          </div>

          {/* Social Proof Stats */}
          <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/5 max-w-lg">
            <div>
              <p className="text-3xl font-extrabold text-white">98%</p>
              <p className="text-xs text-white/40 uppercase tracking-widest mt-1">Precisión IA</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-white">2.1s</p>
              <p className="text-xs text-white/40 uppercase tracking-widest mt-1">Resp. Promedio</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-white">+40%</p>
              <p className="text-xs text-white/40 uppercase tracking-widest mt-1">Aumento Ventas</p>
            </div>
          </div>
        </div>

        {/* Interactive Phone Simulator inside Hero */}
        <div className="lg:col-span-5 flex justify-center w-full">
          <div className="relative w-full max-w-[360px] aspect-[9/18.5] bg-[#0c0c0e] rounded-[50px] p-3 border-[6px] border-white/15 shadow-[0_0_80px_rgba(99,102,241,0.15)] flex flex-col overflow-hidden">
            {/* Speaker & camera notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-36 bg-black rounded-b-2xl z-20 flex justify-center items-center">
              <span className="w-12 h-1 bg-white/10 rounded-full mb-1.5" />
            </div>

            {/* Simulated WhatsApp Header */}
            <div className="bg-[#121214] pt-7 pb-3 px-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center border border-white/10">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#121214]" />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-bold">Fuxion AI Bot</p>
                    <span className="w-3.5 h-3.5 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                      <Check className="w-2.5 h-2.5 text-indigo-400" />
                    </span>
                  </div>
                  <p className="text-[10px] text-emerald-400 font-semibold tracking-wide">en línea</p>
                </div>
              </div>
              <button 
                onClick={resetChat}
                className="text-[10px] px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white border border-white/5 transition-colors"
              >
                Reiniciar
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#09090b] flex flex-col justify-end text-xs custom-scrollbar">
              <div className="space-y-4">
                {messages.map((msg, index) => (
                  <div 
                    key={index}
                    className={`flex flex-col max-w-[85%] ${msg.sender === "user" ? "ml-auto items-end animate-slide-up" : "mr-auto items-start animate-fade-in"}`}
                  >
                    <div className={`p-3 rounded-2xl leading-relaxed whitespace-pre-line ${
                      msg.sender === "user" 
                        ? "bg-indigo-600 text-white rounded-tr-none" 
                        : "bg-[#18181b] text-white/90 border border-white/5 rounded-tl-none"
                    }`}>
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-white/30 mt-1 px-1">{msg.time}</span>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex flex-col items-start max-w-[80%] mr-auto animate-pulse">
                    <div className="p-3 bg-[#18181b] text-white/90 border border-white/5 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Simulator Quick Action Buttons */}
            <div className="bg-[#121214] p-3 border-t border-white/5 space-y-2">
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider px-1">Pregúntale a la IA:</p>
              <div className="flex flex-col gap-1.5">
                {Object.keys(scenarios).map((key) => (
                  <button
                    key={key}
                    onClick={() => handleSelectScenario(key)}
                    disabled={isTyping}
                    className={`w-full text-left p-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center justify-between ${
                      activeScenario === key
                        ? "bg-indigo-500/10 border-indigo-500/40 text-indigo-300"
                        : "bg-white/5 border-white/10 hover:bg-white/10 text-white/80 hover:text-white"
                    }`}
                  >
                    <span className="line-clamp-1">{scenarios[key].question}</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-50 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works / Workflow Section */}
      <section id="como-funciona" className="relative z-10 py-24 px-6 border-t border-white/5 bg-[#09090b]/40">
        <div className="max-w-7xl mx-auto text-center space-y-4 mb-16">
          <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Flujo de Configuración</h2>
          <h3 className="text-3xl md:text-5xl font-bold tracking-tight">Cómo funciona en 4 pasos</h3>
          <p className="text-white/60 max-w-xl mx-auto">
            Configura y lanza tu bot sin complicaciones. Todo el proceso es visual y autogestionable.
          </p>
        </div>

        <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              step: "01",
              title: "Escanea el QR",
              desc: "Abre WhatsApp en tu celular y escanea el código QR generado en tu panel en segundos.",
              icon: Smartphone,
              color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
            },
            {
              step: "02",
              title: "Escribe el Cerebro",
              desc: "Define sus instrucciones, metas de venta, precios y la personalidad en lenguaje natural.",
              icon: Cpu,
              color: "text-purple-400 bg-purple-500/10 border-purple-500/20"
            },
            {
              step: "03",
              title: "Entrena al Bot (RAG)",
              desc: "Carga archivos PDF, documentos o la URL de tu web para proveer el catálogo de productos.",
              icon: Database,
              color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
            },
            {
              step: "04",
              title: "Monitorea y Gana",
              desc: "Mira las conversaciones en vivo, monitorea los prospectos calificados y gestiona tus ingresos.",
              icon: BarChart3,
              color: "text-blue-400 bg-blue-500/10 border-blue-500/20"
            }
          ].map((item, idx) => (
            <div key={idx} className="relative p-8 rounded-3xl bg-white/5 border border-white/5 hover:border-white/10 transition-all flex flex-col group">
              <div className="absolute top-6 right-8 text-3xl font-extrabold text-white/5 group-hover:text-white/10 transition-colors">
                {item.step}
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 border ${item.color}`}>
                <item.icon className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold mb-3">{item.title}</h4>
              <p className="text-white/60 text-sm leading-relaxed flex-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Simulator Dedicated Section */}
      <section id="simulador" className="relative z-10 py-24 px-6 max-w-7xl mx-auto border-t border-white/5">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Simulador Interactivo</h2>
            <h3 className="text-4xl md:text-5xl font-bold tracking-tight">Experimenta el poder del chatbot de ventas</h3>
            <p className="text-lg text-white/60 leading-relaxed">
              Prueba el comportamiento del vendedor virtual interactuando con él desde el teléfono inteligente de demostración. Observa cómo Fuxion AI implementa técnicas de negociación, responde instantáneamente y propone conversiones comerciales.
            </p>
            <div className="space-y-4 pt-4">
              <div className="flex gap-4 items-start">
                <div className="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 mt-1 shrink-0">
                  <Check className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h4 className="font-bold text-white">Persuasión integrada</h4>
                  <p className="text-white/60 text-sm">Organiza las ventajas principales de tu producto con viñetas claras y negritas estructuradas.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 mt-1 shrink-0">
                  <Check className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h4 className="font-bold text-white">Objetivo comercial definido</h4>
                  <p className="text-white/60 text-sm">El bot no solo responde dudas; busca siempre cerrar la venta o calificar al prospecto.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            {/* Glassmorphism Laptop / Tablet Frame containing Dashboard simulator preview */}
            <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />
              <div className="flex items-center gap-2 mb-6">
                <span className="w-3 h-3 bg-red-500 rounded-full" />
                <span className="w-3 h-3 bg-yellow-500 rounded-full" />
                <span className="w-3 h-3 bg-emerald-500 rounded-full" />
                <span className="text-[10px] text-white/30 ml-2 font-mono uppercase tracking-widest">Simulación de Calificación</span>
              </div>
              
              <div className="space-y-4 font-mono text-xs">
                <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                  <span className="text-indigo-400"># Analizando intención del cliente...</span>
                  <div className="flex justify-between items-center mt-2 pb-2 border-b border-white/5">
                    <span className="text-white/60">Interés en:</span>
                    <span className="text-white font-bold">Plan Pro (Mensual)</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-white/60">Nivel de Temperatura:</span>
                    <span className="text-emerald-400 font-bold">CALIENTE 🔥</span>
                  </div>
                </div>

                <div className="bg-black/40 p-4 rounded-xl border border-white/5 space-y-2">
                  <span className="text-purple-400"># Prospecto Identificado</span>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 bg-white/5 rounded">
                      <p className="text-white/30">Nombre</p>
                      <p className="font-bold text-white">Alejandro L.</p>
                    </div>
                    <div className="p-2 bg-white/5 rounded">
                      <p className="text-white/30">WhatsApp</p>
                      <p className="font-bold text-white">+51 987 ••• •••</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="caracteristicas" className="relative z-10 py-24 px-6 border-t border-white/5 bg-[#09090b]/40">
        <div className="max-w-7xl mx-auto text-center space-y-4 mb-20">
          <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Características Clave</h2>
          <h3 className="text-3xl md:text-5xl font-bold tracking-tight">Diseñado para vender sin parar</h3>
          <p className="text-white/60 max-w-xl mx-auto">
            Todas las herramientas necesarias para automatizar la atención comercial de tu negocio en un solo panel.
          </p>
        </div>

        <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              title: "Gemini 1.5 Pro & Flash",
              desc: "Combina la velocidad de Flash para chats comunes y el análisis avanzado de Pro para negociaciones complejas.",
              icon: Cpu,
              color: "text-indigo-400"
            },
            {
              title: "Entrenamiento RAG Ultra-rápido",
              desc: "Solo arrastra tu catálogo o ingresa tu URL. El bot responderá usando estrictamente tu base de datos configurada.",
              icon: Database,
              color: "text-purple-400"
            },
            {
              title: "Seguridad y Privacidad",
              desc: "Tus credenciales de WhatsApp Web se manejan localmente de forma encriptada sin almacenamiento inseguro.",
              icon: Shield,
              color: "text-emerald-400"
            },
            {
              title: "Intervención Instantánea",
              desc: "Monitorea los chats en tiempo real y chatea directamente en cualquier momento para concretar cierres manuales.",
              icon: MessageSquare,
              color: "text-amber-400"
            },
            {
              title: "Estadísticas de Conversión",
              desc: "Mira gráficos del total de conversaciones, tasa de conversión y el costo real acumulado en tiempo real.",
              icon: BarChart3,
              color: "text-rose-400"
            },
            {
              title: "Configuración Multilingüe",
              desc: "Atiende de manera fluida y nativa a clientes que escriban en inglés, portugués, quechua o cualquier otro idioma.",
              icon: Globe,
              color: "text-blue-400"
            }
          ].map((feat, idx) => (
            <div key={idx} className="p-8 rounded-3xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all flex flex-col">
              <feat.icon className={`w-10 h-10 ${feat.color} mb-6`} />
              <h4 className="text-xl font-bold mb-3">{feat.title}</h4>
              <p className="text-white/60 text-sm leading-relaxed flex-1">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Dashboard Mockup Showcase */}
      <section className="relative z-10 py-24 px-6 max-w-7xl mx-auto border-t border-white/5 overflow-hidden">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Vista Previa de la Plataforma</h2>
          <h3 className="text-3xl md:text-5xl font-bold tracking-tight">Toma el control total en un solo panel</h3>
          <p className="text-white/60 max-w-xl mx-auto">
            Configura el prompt comercial del asesor, observa los prospectos calificados y revisa el costo de procesamiento acumulado.
          </p>
        </div>

        {/* Dashboard Mockup */}
        <div className="relative rounded-3xl border border-white/10 bg-[#0c0c0e]/80 p-4 md:p-6 shadow-[0_0_80px_rgba(99,102,241,0.05)] overflow-hidden">
          {/* Decorative gradients */}
          <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-indigo-500/10 blur-[100px] rounded-full" />
          <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-purple-500/10 blur-[100px] rounded-full" />
          
          <div className="relative z-10 flex flex-col md:flex-row gap-6">
            {/* Sidebar Mock */}
            <div className="w-full md:w-56 bg-black/40 rounded-2xl border border-white/5 p-4 space-y-6 hidden md:block">
              <div className="flex items-center gap-2 px-2">
                <Zap className="w-5 h-5 text-indigo-400 fill-indigo-400/20" />
                <span className="font-bold text-sm">Fuxion AI</span>
              </div>
              <div className="space-y-1.5">
                {["Dashboard", "Cerebro del Bot", "Prospectos", "Archivos RAG", "Configuración"].map((menu, idx) => (
                  <div key={idx} className={`px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${idx === 0 ? "bg-indigo-600 text-white" : "text-white/40 hover:text-white/80 hover:bg-white/5"}`}>
                    {menu}
                  </div>
                ))}
              </div>
            </div>

            {/* Main Area Mock */}
            <div className="flex-1 space-y-6">
              {/* Header */}
              <div className="flex justify-between items-center pb-4 border-b border-white/5">
                <div>
                  <h4 className="text-lg font-bold">¡Hola, Alejandro! 👋</h4>
                  <p className="text-[11px] text-white/40">Tu vendedor automático ha atendido a 124 clientes hoy.</p>
                </div>
                <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-emerald-400 text-xs font-bold flex items-center gap-1.5 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Bot Activo
                </div>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Chats Totales", val: "1,248", icon: MessageCircle, col: "text-indigo-400" },
                  { label: "Prospectos Calificados", val: "482", icon: Users, col: "text-purple-400" },
                  { label: "Tasa de Cierre", val: "24.6%", icon: TrendingUp, col: "text-emerald-400" },
                  { label: "Gasto Gemini", val: "S/ 18.42", icon: DollarSign, col: "text-blue-400" }
                ].map((stat, idx) => (
                  <div key={idx} className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">{stat.label}</span>
                      <stat.icon className={`w-4 h-4 ${stat.col}`} />
                    </div>
                    <p className="text-xl font-bold">{stat.val}</p>
                  </div>
                ))}
              </div>

              {/* Content Grid */}
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Recent Activities */}
                <div className="lg:col-span-2 bg-black/30 rounded-2xl border border-white/5 p-5 space-y-4">
                  <p className="text-xs font-bold text-white/80 uppercase tracking-widest mb-2">Historial de Conversaciones</p>
                  <div className="space-y-3">
                    {[
                      { name: "Juan Perez", text: "¿Tienen stock del cargador inalámbrico?", status: "Interesado", time: "Hace 2 min" },
                      { name: "Maria Gomez", text: "Excelente, envíame el link de pago por favor", status: "Ganado", time: "Hace 5 min" },
                      { name: "Carlos Sanchez", text: "Listo, gracias por la información", status: "Atendido", time: "Hace 12 min" }
                    ].map((c, i) => (
                      <div key={i} className="flex items-center justify-between text-xs pb-3 border-b border-white/5 last:border-0 last:pb-0">
                        <div className="space-y-1">
                          <p className="font-bold">{c.name}</p>
                          <p className="text-white/60 truncate max-w-[240px] italic">"{c.text}"</p>
                        </div>
                        <div className="text-right space-y-1">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${c.status === "Ganado" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25" : c.status === "Interesado" ? "bg-purple-500/10 text-purple-400 border border-purple-500/25" : "bg-white/5 text-white/50"}`}>
                            {c.status}
                          </span>
                          <p className="text-[9px] text-white/30">{c.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* System Prompt View */}
                <div className="bg-black/30 rounded-2xl border border-white/5 p-5 flex flex-col">
                  <p className="text-xs font-bold text-white/80 uppercase tracking-widest mb-3">Prompt del Asesor</p>
                  <div className="bg-black/50 border border-white/5 p-3 rounded-xl text-[10px] font-mono text-white/60 leading-relaxed flex-1 mb-3">
                    Eres un vendedor amable de Fuxion. Tu meta es vender cargadores y accesorios. Si te preguntan precios, indica S/ 49 y ofrece envío gratuito en Lima...
                  </div>
                  <button className="w-full py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all">
                    Editar Cerebro
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="precios" className="relative z-10 py-24 px-6 border-t border-white/5 bg-[#09090b]/40">
        <div className="max-w-7xl mx-auto text-center space-y-4 mb-16">
          <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Planes Disponibles</h2>
          <h3 className="text-3xl md:text-5xl font-bold tracking-tight">Elige el plan ideal para tu negocio</h3>
          <p className="text-white/60 max-w-xl mx-auto">
            Todos los planes incluyen el módulo de entrenamiento. Ahorra 20% en facturación anual.
          </p>

          {/* Toggle Mensual/Anual */}
          <div className="flex items-center justify-center gap-4 pt-4">
            <span className={`text-sm font-semibold transition-colors ${!isAnnual ? "text-white" : "text-white/40"}`}>Mensual</span>
            <button 
              onClick={() => setIsAnnual(!isAnnual)}
              className="w-12 h-6 bg-white/10 hover:bg-white/15 rounded-full relative p-1 transition-all border border-white/5"
            >
              <div className={`w-4 h-4 bg-indigo-500 rounded-full transition-transform ${isAnnual ? "translate-x-6" : ""}`} />
            </button>
            <span className={`text-sm font-semibold flex items-center gap-1.5 transition-colors ${isAnnual ? "text-white" : "text-white/40"}`}>
              Anual 
              <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 font-bold rounded-full border border-emerald-500/20">
                -20%
              </span>
            </span>
          </div>
        </div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 items-stretch">
          {[
            {
              name: "Inicial / Trial",
              price: "0",
              desc: "Perfecto para evaluar y probar la integración.",
              features: [
                "Límite de 50 mensajes",
                "Conexión con 1 número",
                "Prompt simple",
                "Soporte estándar por email"
              ],
              cta: "Probar Gratis",
              popular: false
            },
            {
              name: "Plan Pro",
              price: isAnnual ? "89" : "109",
              desc: "Ideal para negocios y tiendas en crecimiento.",
              features: [
                "2,000 mensajes mensuales",
                "Base de conocimientos ilimitada (RAG)",
                "Modelos Gemini 1.5 Pro & Flash",
                "Historial de prospectos detallado",
                "Dashboard en soles (PEN) con control de costos",
                "Soporte prioritario"
              ],
              cta: "Comenzar Pro",
              popular: true
            },
            {
              name: "Enterprise",
              price: "Personalizado",
              desc: "Para grandes volúmenes y requerimientos especiales.",
              features: [
                "Mensajería y capacidad ilimitadas",
                "Modelos dedicados con fine-tuning",
                "Integración de CRM API directa",
                "SLA de disponibilidad garantizado",
                "Asesor de IA dedicado"
              ],
              cta: "Contactar Ventas",
              popular: false
            }
          ].map((plan, idx) => (
            <div 
              key={idx} 
              className={`p-8 rounded-[2rem] bg-white/5 border transition-all flex flex-col relative ${
                plan.popular 
                  ? "border-indigo-500/50 shadow-[0_0_40px_rgba(99,102,241,0.1)] md:-translate-y-2 scale-[1.02]" 
                  : "border-white/5 hover:border-white/10"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-indigo-600 rounded-full text-[10px] font-extrabold uppercase tracking-widest shadow-lg">
                  Más Popular
                </span>
              )}
              
              <div className="space-y-4 mb-8">
                <h4 className="text-xl font-bold">{plan.name}</h4>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold">{plan.price === "Personalizado" ? "" : "S/"}</span>
                  <span className="text-5xl font-black tracking-tight">{plan.price}</span>
                  <span className="text-sm text-white/40 font-medium">{plan.price === "Personalizado" ? "" : "/mes"}</span>
                </div>
                <p className="text-white/60 text-xs leading-relaxed">{plan.desc}</p>
              </div>

              <ul className="space-y-4 text-xs font-semibold text-white/80 flex-1 mb-8">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex gap-3 items-center">
                    <CheckCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Link 
                href="/login" 
                className={`w-full py-4 rounded-2xl font-bold text-center text-sm transition-all ${
                  plan.popular 
                    ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20" 
                    : "bg-white/5 border border-white/10 hover:bg-white/10 text-white"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="relative z-10 py-24 px-6 max-w-4xl mx-auto border-t border-white/5">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Preguntas Frecuentes</h2>
          <h3 className="text-3xl md:text-5xl font-bold tracking-tight">Resolvemos tus dudas</h3>
        </div>

        <div className="space-y-4">
          {faqItems.map((item, idx) => (
            <div 
              key={idx}
              className="rounded-2xl border border-white/5 bg-white/5 overflow-hidden transition-all duration-300"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-6 text-left flex justify-between items-center gap-4 hover:bg-white/5 transition-colors focus:outline-none"
              >
                <span className="font-bold text-sm sm:text-base text-white/90">{item.q}</span>
                <ChevronDown className={`w-5 h-5 text-white/40 shrink-0 transition-transform duration-300 ${openFaq === idx ? "rotate-185 text-indigo-400" : ""}`} />
              </button>
              
              <div 
                className={`transition-all duration-300 ease-in-out ${
                  openFaq === idx 
                    ? "max-h-[300px] border-t border-white/5 p-6 opacity-100 bg-black/20" 
                    : "max-h-0 opacity-0 overflow-hidden"
                }`}
              >
                <p className="text-xs sm:text-sm text-white/60 leading-relaxed">{item.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="relative z-10 py-24 px-6 max-w-7xl mx-auto border-t border-white/5 text-center relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-3xl mx-auto space-y-8 relative z-10">
          <Zap className="w-12 h-12 text-indigo-500 fill-indigo-500/20 mx-auto" />
          <h3 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            ¿Listo para multiplicar tus ventas en WhatsApp?
          </h3>
          <p className="text-base md:text-lg text-white/60 max-w-xl mx-auto leading-relaxed">
            Conecta tu bot hoy mismo. Comienza tu prueba gratuita de 7 días sin tarjetas ni compromisos.
          </p>
          <div className="pt-4">
            <Link 
              href="/login" 
              className="inline-flex px-8 py-4 bg-white text-black font-extrabold rounded-2xl hover:bg-neutral-200 transition-all shadow-2xl hover:scale-[1.03] active:scale-[0.97]"
            >
              Comenzar Ahora Gratis
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-[#070709] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-500 fill-indigo-500/20" />
            <span className="text-sm font-bold text-white/90">Fuxion AI © {new Date().getFullYear()}</span>
          </div>
          <p className="text-xs text-white/40">
            Desarrollado con inteligencia artificial premium para automatizar tus ventas en WhatsApp.
          </p>
          <div className="flex gap-6 text-xs text-white/40">
            <a href="#" className="hover:text-white transition-colors">Términos</a>
            <a href="#" className="hover:text-white transition-colors">Privacidad</a>
            <a href="#" className="hover:text-white transition-colors">Soporte</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
