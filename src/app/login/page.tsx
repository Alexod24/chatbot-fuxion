"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Zap, Mail, Lock, ArrowRight, Globe } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validación de credenciales solicitadas
    const validUsers = [
      { email: "admin@gmail.com", password: "123455", role: "admin", name: "Alex OD" },
      { email: "kenedy@gmail.com", password: "123456", role: "cliente", name: "Kenedy" }
    ];

    const mockUser = validUsers.find(u => u.email === email && u.password === password);

    if (!mockUser) {
      setError("Credenciales incorrectas. Por favor intenta de nuevo.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/clients");
      const clients = await res.json();
      
      const realProfile = clients.find((c: any) => c.email === email);
      
      if (!realProfile) {
        setError(`El correo ${email} no existe en la Base de Datos. Pídele al Admin que lo cree.`);
        setIsLoading(false);
        return;
      }

      const finalUser = { ...mockUser, id: realProfile.id };
      localStorage.setItem("user", JSON.stringify(finalUser));
      router.push("/dashboard");
    } catch (err) {
      setError("Error conectando con la base de datos.");
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,#312e81,transparent_50%)]" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-600/10 blur-[120px] rounded-full" />
      <div className="absolute top-1/2 left-0 w-64 h-64 bg-purple-600/10 blur-[100px] rounded-full -translate-y-1/2" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-2xl glow-indigo">
            <Zap className="text-white w-10 h-10 fill-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Fuxion AI</h1>
          <p className="text-muted-foreground mt-2">Ingresa a tu centro de comando</p>
        </div>

        <div className="glass-dark p-8 rounded-[2rem] border border-white/10 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm py-3 px-4 rounded-xl text-center"
              >
                {error}
              </motion.div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70 ml-1">Email o Credencial</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-indigo-400 transition-colors" />
                <input 
                  type="text" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@fuxion.ai"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder:text-white/20"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-sm font-medium text-white/70">Contraseña</label>
                <button type="button" className="text-xs text-indigo-400 hover:text-indigo-300">¿Olvidaste tu contraseña?</button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-indigo-400 transition-colors" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder:text-white/20"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-neutral-200 transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  Ingresar al Dashboard
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 flex flex-col gap-4">
            <button className="w-full bg-white/5 border border-white/10 text-white font-medium py-3 rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-3">
              <Globe className="w-5 h-5" />
              Continuar con Github
            </button>
          </div>
        </div>

        <p className="text-center mt-8 text-sm text-muted-foreground">
          ¿No tienes una cuenta? <Link href="#" className="text-indigo-400 font-semibold hover:underline">Contacta a ventas</Link>
        </p>
      </motion.div>
    </main>
  );
}
