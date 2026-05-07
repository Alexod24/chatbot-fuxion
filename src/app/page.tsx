import { Bot, QrCode, UploadCloud, Webhook } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-50 selection:bg-indigo-500/30">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

      <div className="relative pt-24 pb-12 w-full max-w-7xl mx-auto px-6">
        <header className="flex flex-col items-center text-center space-y-6 mb-20 animate-fade-in">
          <div className="inline-flex items-center rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-sm font-medium text-indigo-300">
            <Bot className="w-4 h-4 mr-2" />
            <span>Fuxion AI Agent Dashboard</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-500">
            Tu Vendedor Inteligente 24/7
          </h1>
          <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto">
            Visualiza el estado de tu agente, sube el conocimiento de tus
            productos y automatiza las ventas a través de WhatsApp.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Dashboard Panel 1 */}
          <div className="relative group rounded-2xl border border-neutral-800 bg-neutral-900/50 p-8 backdrop-blur-xl transition-all hover:bg-neutral-900/80 hover:border-indigo-500/50">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400">
                <QrCode className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-semibold">1. Conecta tu WhatsApp</h2>
            </div>
            <p className="text-neutral-400 mb-6 font-light">
              Para vincular este agente a tu número de WhatsApp para atender a
              tus prospectos, corre el proyecto en tu consola.
            </p>
            <div className="flex items-center justify-center p-8 bg-black/50 rounded-xl border border-neutral-800/50">
              <span className="text-sm text-neutral-500 text-center">
                Ejecuta <code>npm run dev</code> en tu terminal y escanea el
                código QR generado para loguearte.
              </span>
            </div>
          </div>

          {/* Dashboard Panel 2 */}
          <div className="relative group rounded-2xl border border-neutral-800 bg-neutral-900/50 p-8 backdrop-blur-xl transition-all hover:bg-neutral-900/80 hover:border-emerald-500/50">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400">
                <UploadCloud className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-semibold">
                2. Entrena al Agente (RAG)
              </h2>
            </div>
            <p className="text-neutral-400 mb-6 font-light">
              Sube los beneficios, ingredientes y guiones de venta de tus
              productos. La IA contestará basándose en esto y hará cierres de
              venta.
            </p>
            <button className="w-full py-3 px-4 bg-white text-black font-medium rounded-xl hover:bg-neutral-200 transition-colors flex items-center justify-center">
              <UploadCloud className="w-4 h-4 mr-2" />
              Ir a Base de Conocimientos
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
