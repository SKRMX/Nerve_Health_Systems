"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { DoctorProfileProvider } from "@/hooks/useDoctorProfile";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Image from "next/image";
import { Loader2, RefreshCw, LogOut, ShieldAlert, CreditCard } from "lucide-react";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";

/**
 * Auth Gate: shows loading screen while auth initializes.
 * NEVER redirects — the server middleware handles route protection.
 * If loading finishes without a profile, shows error with retry/logout options.
 */
function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, userProfile, clinic, isLoading, isSuperadmin, signOut } = useAuth();
  const pathname = usePathname();

  // Still loading — show branded loading screen
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#050B14]">
        <div className="flex flex-col items-center gap-6 animate-in fade-in duration-500">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shadow-[0_0_40px_-10px_rgba(45,212,191,0.3)]">
            <Image src="/logo_nerve.svg" alt="NERVE" width={40} height={40} className="animate-pulse" priority />
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="text-slate-400 text-sm font-medium">Verificando sesión...</p>
            <Loader2 className="h-5 w-5 text-teal-500 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  // Finished loading but no profile — show error with retry/logout
  // Do NOT redirect (middleware handles that)
  if (!user || !userProfile) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#050B14]">
        <div className="flex flex-col items-center gap-6 animate-in fade-in duration-500 max-w-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
            <Image src="/logo_nerve.svg" alt="NERVE" width={40} height={40} className="opacity-50" priority />
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="text-slate-300 text-sm font-medium">No se pudo cargar tu perfil</p>
            <p className="text-slate-500 text-xs">Puede ser un problema temporal de conexión.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm rounded-lg transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Reintentar
            </button>
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Subscription Enforcement ──
  // Allow superadmins, checkout page, and configuracion to always pass through
  const isAllowedPath = pathname === "/dashboard/checkout" || pathname === "/dashboard/configuracion" || pathname === "/dashboard/superadmin" || pathname === "/dashboard/suscripcion";
  
  if (!isSuperadmin && !isAllowedPath && clinic) {
    const status = clinic.subscription_status;
    const periodEnd = clinic.current_period_end ? new Date(clinic.current_period_end) : null;
    const now = new Date();
    const isExpired = 
      status === "expired" || 
      status === "canceled" || 
      status === "past_due" ||
      (status === "trialing" && periodEnd && periodEnd < now);

    if (isExpired) {
      return (
        <div className="flex items-center justify-center h-screen bg-[#050B14]">
          <div className="flex flex-col items-center gap-8 animate-in fade-in duration-500 max-w-lg text-center px-6">
            {/* Icon */}
            <div className="w-20 h-20 rounded-3xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-[0_0_40px_-10px_rgba(245,158,11,0.3)]">
              <ShieldAlert className="h-10 w-10 text-amber-500" />
            </div>

            {/* Title */}
            <div className="flex flex-col items-center gap-3">
              <h2 className="text-2xl font-bold text-white">Tu suscripción ha expirado</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Tu período de prueba o suscripción ha finalizado. Para seguir utilizando NERVE y proteger los datos de tus pacientes, activa tu plan ahora.
              </p>
            </div>

            {/* Features reminder */}
            <div className="w-full bg-slate-900/50 rounded-2xl p-5 border border-slate-800/60">
              <p className="text-slate-500 text-xs uppercase tracking-wider mb-3 font-medium">Lo que recuperas al activar</p>
              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="flex items-center gap-2 text-slate-300 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                  Agenda inteligente
                </div>
                <div className="flex items-center gap-2 text-slate-300 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                  Expedientes médicos
                </div>
                <div className="flex items-center gap-2 text-slate-300 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                  Recetas digitales
                </div>
                <div className="flex items-center gap-2 text-slate-300 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                  WhatsApp automático
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={() => window.location.href = "/dashboard/checkout"}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-teal-600/20 hover:shadow-teal-500/30"
              >
                <CreditCard className="h-5 w-5" />
                Activar mi Plan
              </button>
              <button
                onClick={signOut}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800/50 hover:bg-slate-800 text-slate-400 text-sm rounded-xl transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  // Session verified — render the full dashboard
  return <>{children}</>;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Auto-close mobile drawer when user navigates to another page
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <AuthProvider>
      <AuthGate>
        <DoctorProfileProvider>
          <div className="flex bg-[#050B14] h-screen overflow-hidden selection:bg-teal-500/30 selection:text-teal-200">
            <div className="absolute top-[-20%] left-[-10%] w-[30%] h-[50%] rounded-full bg-blue-900/10 blur-[150px] pointer-events-none" />
            
            {/* Desktop Sidebar */}
            <Sidebar />

            {/* Mobile Sidebar (Drawer) */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetContent side="left" className="p-0 w-64 bg-slate-950 border-r border-slate-800/60 text-slate-300" showCloseButton={false}>
                <Sidebar className="flex w-full h-full border-r-0 bg-transparent" />
              </SheetContent>
            </Sheet>

            <div className="flex-1 flex flex-col relative z-10 w-full min-w-0">
              <Header onMenuClick={() => setMobileOpen(true)} />
              <main className="flex-1 overflow-y-auto w-full pb-20 lg:pb-0">
                <div className="container mx-auto p-4 md:p-8 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
                  {children}
                </div>
              </main>
              {/* Native Mobile Bottom Bar */}
              <MobileBottomNav />

              {/* Onboarding Guide Modal */}
              <OnboardingModal />
            </div>
          </div>
        </DoctorProfileProvider>
      </AuthGate>
    </AuthProvider>
  );
}
