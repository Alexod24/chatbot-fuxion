import { Zap, ArrowRight, Bot, Shield, Globe } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-[radial-gradient(circle_at_50%_0%,#312e81,transparent_50%)] opacity-50" />
      <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px]" />

      <nav className="relative z-10 px-8 py-6 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Zap className="w-8 h-8 text-indigo-500 fill-indigo-500" />
          <span className="text-xl font-bold tracking-tighter">Fuxion AI</span>
        </div>
        <div className="flex items-center gap-8">
          <Link href="#" className="text-sm font-medium text-white/60 hover:text-white transition-colors">Características</Link>
          <Link href="#" className="text-sm font-medium text-white/60 hover:text-white transition-colors">Precios</Link>
          <Link href="/login" className="px-5 py-2.5 bg-white text-black text-sm font-bold rounded-full hover:bg-neutral-200 transition-all">
            Dashboard
          </Link>
        </div>
      </nav>

      <section className="relative z-10 pt-32 pb-20 px-8 flex flex-col items-center text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-indigo-400 text-sm font-medium mb-8 animate-fade-in">
          <Bot className="w-4 h-4" />
          <span>Vendedor Inteligente con IA para WhatsApp</span>
        </div>
        
        <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
          Escala tus ventas <br /> sin mover un dedo.
        </h1>
        
        <p className="text-lg md:text-xl text-white/60 max-w-2xl mb-12 leading-relaxed">
          Fuxion AI es el agente inteligente que atiende, califica y cierra ventas 24/7. 
          Vuelve a ser dueño de tu tiempo mientras tu bot genera ingresos.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/login" className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl flex items-center gap-2 hover:bg-indigo-700 transition-all glow-indigo group">
            Empezar Ahora
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <button className="px-8 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 transition-all">
            Ver Demo en Vivo
          </button>
        </div>
      </section>

      <section className="relative z-10 grid md:grid-cols-3 gap-8 px-8 max-w-7xl mx-auto pb-32">
        <div className="p-8 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-sm">
          <Shield className="w-10 h-10 text-indigo-400 mb-6" />
          <h3 className="text-xl font-bold mb-3">Seguridad Total</h3>
          <p className="text-white/60 leading-relaxed">Encriptación de punta a punta en todas tus conversaciones de WhatsApp.</p>
        </div>
        <div className="p-8 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-sm">
          <Globe className="w-10 h-10 text-purple-400 mb-6" />
          <h3 className="text-xl font-bold mb-3">Multilingüe</h3>
          <p className="text-white/60 leading-relaxed">Atiende a clientes en cualquier idioma con la potencia de Gemini 1.5 Pro.</p>
        </div>
        <div className="p-8 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-sm">
          <Bot className="w-10 h-10 text-emerald-400 mb-6" />
          <h3 className="text-xl font-bold mb-3">Entrenamiento RAG</h3>
          <p className="text-white/60 leading-relaxed">Sube tus PDFs o webs y el bot aprenderá todo sobre tus productos en segundos.</p>
        </div>
      </section>
    </main>
  );
}

