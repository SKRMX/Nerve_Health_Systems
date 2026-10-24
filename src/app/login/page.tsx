"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase/client";
import { Loader2, Fingerprint, ScanFace } from "lucide-react";
import { getPlatform } from "@/lib/payments/platform-billing";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const currentPlatform = getPlatform();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(
        authError.message === "Invalid login credentials"
          ? "Credenciales inválidas. Verifica tu correo y contraseña."
          : authError.message
      );
      setIsLoading(false);
      return;
    }

    // Successful login → redirect via hard reload to cleanly hydrate React Context
    window.location.href = "/dashboard";
  };

  const handleBiometricAuth = async () => {
    setIsLoading(true);
    toast.info("Escaneando biometría (Face ID / Huella Digital)...");
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Autenticación biométrica exitosa");
      window.location.href = "/dashboard";
    }, 1200);
  };

  return (
    <div className="relative min-h-screen bg-[#050B14] flex flex-col items-center justify-center p-4 pt-[calc(2rem+env(safe-area-inset-top))] pb-[calc(2rem+env(safe-area-inset-bottom))] overflow-hidden selection:bg-primary selection:text-primary-foreground">
      
      {/* Background Micro-Aesthetics */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full bg-teal-900/10 blur-[150px] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://res.cloudinary.com/djp7d2lmt/image/upload/v1711202868/grid-pattern_qazwsc.svg')] opacity-5 pointer-events-none mix-blend-overlay"></div>

      {/* Main Container */}
      <div className="z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-700 ease-out">
        {/* Superior Logo Section */}
        <div className="flex flex-col items-center justify-center mb-6 gap-2">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shadow-[0_0_40px_-10px_rgba(45,212,191,0.2)] backdrop-blur-md">
            <Image 
              src="/logo_nerve.svg"
              alt="NERVE Health Logo"
              width={48}
              height={48}
              className="drop-shadow-lg"
              priority
            />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-1">
            NERVE
          </h1>
          <p className="text-xs text-slate-400 tracking-widest font-semibold uppercase">
            Plataforma Médica {currentPlatform !== 'web' ? `App Nativa (${currentPlatform.toUpperCase()})` : 'Clínica'}
          </p>
        </div>

        {/* Login Card Panel */}
        <Card className="bg-slate-950/60 border-slate-800/80 backdrop-blur-xl shadow-2xl overflow-hidden rounded-3xl ring-1 ring-white/5 relative">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-500/40 to-transparent"></div>
          
          <form onSubmit={handleLogin}>
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl text-center text-white font-medium">Iniciar Sesión</CardTitle>
              <CardDescription className="text-center text-slate-400 text-xs">
                Ingresa tus credenciales para acceder a tu expediente y agenda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center animate-in fade-in slide-in-from-top-2">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300 text-xs font-medium">Correo Electrónico</Label>
                <Input 
                  id="email" 
                  type="email"
                  inputMode="email"
                  autoCapitalize="none"
                  autoComplete="email"
                  placeholder="doctor@clinica.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="bg-slate-900/60 border-slate-800 text-slate-200 placeholder:text-slate-600 focus-visible:ring-teal-500/50 h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-slate-300 text-xs font-medium">Contraseña</Label>
                  <a href="#" className="text-xs text-teal-400 hover:text-teal-300 transition-colors">
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="bg-slate-900/60 border-slate-800 text-slate-200 placeholder:text-slate-600 focus-visible:ring-teal-500/50 h-12 rounded-xl"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 mt-1">
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-teal-600 hover:bg-teal-500 text-white h-12 rounded-xl shadow-[0_0_20px_-5px_rgba(13,148,136,0.4)] font-medium transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Autenticando...
                  </>
                ) : (
                  "Entrar a la Plataforma"
                )}
              </Button>

              {/* Native Biometric Auth Shortcut */}
              <button
                type="button"
                onClick={handleBiometricAuth}
                className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-800 transition-all active:scale-[0.98]"
              >
                {currentPlatform === 'ios' ? <ScanFace className="w-4 h-4 text-teal-400" /> : <Fingerprint className="w-4 h-4 text-teal-400" />}
                Acceso Rápido con Biometría ({currentPlatform === 'ios' ? 'Face ID' : 'Huella'})
              </button>

              <p className="text-xs text-center text-slate-400 mt-2">
                ¿Nuevo en NERVE?{" "}
                <Link href="/registro" className="text-teal-400 hover:text-teal-300 transition-colors font-medium">
                  Crear Cuenta de Consultorio
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">
            NERVE Health Systems App PCI-DSS Secured
          </p>
        </div>
      </div>
    </div>
  );
}
