"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { 
  LayoutDashboard, 
  Users, 
  CalendarDays, 
  Settings, 
  LogOut,
  FolderOpen,
  UsersRound,
  BarChart3,
  Shield,
  CreditCard,
  AlertCircle,
  Globe,
  HeadphonesIcon,
  Package,
  CircleDollarSign
} from "lucide-react";
import { toast } from "sonner";

export function Sidebar({ className = "hidden lg:flex" }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut, isAdmin, isReceptionist, isSuperadmin, userProfile, clinic } = useAuth();

  // Role badge config
  const roleConfig = {
    superadmin: { label: "Superadmin", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
    admin: { label: "Admin", color: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
    doctor: { label: "Doctor", color: "text-teal-400 bg-teal-500/10 border-teal-500/20" },
    receptionist: { label: "Recepcionista", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  };
  const currentRole = userProfile?.role as keyof typeof roleConfig | undefined;
  const roleBadge = currentRole ? roleConfig[currentRole] : null;

  // Subscription Banner Logic
  const handleCheckout = () => {
    router.push("/dashboard/checkout");
  };

  const getDaysLeft = () => {
    if (!clinic?.current_period_end) return 0;
    const end = new Date(clinic.current_period_end);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
  };

  const daysLeft = getDaysLeft();
  const isTrial = clinic?.subscription_status === 'trialing';
  const isPastDue = clinic?.subscription_status === 'past_due' || clinic?.subscription_status === 'canceled';

  // Base nav items — visible to all roles
  const baseItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Agenda", href: "/dashboard/agenda", icon: CalendarDays },
    { name: "Pacientes", href: "/dashboard/pacientes", icon: Users },
  ];

  // Doctor & Admin only
  const doctorItems = isAdmin || (!isReceptionist)
    ? [
        { name: "Expedientes", href: "/dashboard/expedientes", icon: FolderOpen },
        { name: "Inventario", href: "/dashboard/inventario", icon: Package },
        { name: "Finanzas", href: "/dashboard/finanzas", icon: CircleDollarSign }
      ]
    : [];

  // Admin only - Conditional based on subscription tier
  const adminItems = isAdmin
    ? clinic?.subscription_tier === "pro" || clinic?.subscription_tier === "enterprise"
      ? [
          { name: "Equipo", href: "/dashboard/equipo", icon: UsersRound },
          { name: "Reportes", href: "/dashboard/reportes", icon: BarChart3 },
        ]
      : [
          { name: "Asistente", href: "/dashboard/equipo", icon: HeadphonesIcon },
          { name: "Reportes", href: "/dashboard/reportes", icon: BarChart3 },
        ]
    : [];

  // Superadmin only
  const superadminItems = isSuperadmin 
    ? [{ name: "Panel Global", href: "/dashboard/superadmin", icon: Globe }]
    : [];

  const allNavItems = isSuperadmin 
    ? [...superadminItems, ...baseItems, ...doctorItems, ...adminItems] 
    : [...baseItems, ...doctorItems, ...adminItems];

  return (
    <div className={`${className} w-64 shrink-0 h-screen flex-col border-r border-slate-800/60 bg-slate-950/50 backdrop-blur-xl sticky top-0`}>
      {/* Logo & Brand */}
      <div className="h-16 flex items-center px-6 border-b border-white/5">
        <Link href="/dashboard" className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/10 shadow-[0_0_15px_-5px_rgba(45,212,191,0.2)]">
            <Image src="/logo_nerve.svg" alt="Logo" width={20} height={20} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-white font-semibold tracking-wide">NERVE</span>
            {clinic && (
              <span className="text-[10px] text-slate-500 truncate max-w-[120px]">{clinic.name}</span>
            )}
          </div>
        </Link>
      </div>

      {/* Role Badge */}
      {roleBadge && (
        <div className="px-4 pt-4">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium w-fit ${roleBadge.color}`}>
            <Shield className="h-3 w-3" />
            {roleBadge.label}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-500 mb-3 px-2 uppercase tracking-wider">
          Módulos
        </div>
        {allNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isActive 
                  ? "bg-teal-500/10 text-teal-400 font-medium" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <item.icon className={`h-5 w-5 ${isActive ? "text-teal-400" : "text-slate-500"}`} />
              {item.name}
              {isActive && (
                <div className="ml-auto w-1 h-5 bg-teal-500 rounded-full" />
              )}
            </Link>
          );
        })}

        {/* Admin section separator */}
        {isAdmin && !isSuperadmin && (
          <>
            <div className="pt-4 pb-2">
              <div className="text-xs font-semibold text-slate-500 px-2 uppercase tracking-wider">
                Administración
              </div>
            </div>
            {adminItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? "bg-violet-500/10 text-violet-400 font-medium" 
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                  }`}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? "text-violet-400" : "text-slate-500"}`} />
                  {item.name}
                  {isActive && (
                    <div className="ml-auto w-1 h-5 bg-violet-500 rounded-full" />
                  )}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Subscription Banner */}
      {isAdmin && !isSuperadmin && (isTrial || isPastDue) && (
        <div className="px-4 pb-4">
          <div className={`p-4 rounded-xl border relative overflow-hidden ${
            isPastDue 
              ? "bg-red-500/10 border-red-500/20" 
              : "bg-teal-500/10 border-teal-500/20"
          }`}>
            <div className="relative z-10 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                {isPastDue ? <AlertCircle className="w-4 h-4 text-red-400" /> : <CreditCard className="w-4 h-4 text-teal-400" />}
                <span className={`text-sm font-semibold ${isPastDue ? "text-red-400" : "text-teal-400"}`}>
                  {isPastDue ? "Acceso Bloqueado" : "Prueba Gratuita"}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isPastDue 
                  ? "Tu suscripción ha expirado. Reactiva tu cuenta para continuar." 
                  : `Te quedan ${daysLeft} días de prueba gratuita de la plataforma NERVE.`}
              </p>
              <button 
                onClick={handleCheckout}
                className={`mt-2 w-full py-2 text-xs font-medium rounded-lg transition-colors ${
                  isPastDue 
                    ? "bg-red-500 hover:bg-red-600 text-white" 
                    : "bg-teal-600 hover:bg-teal-500 text-white"
                }`}
              >
                Suscribirse ahora
              </button>
            </div>
            {/* Minimal Background Glow */}
            <div className={`absolute -right-4 -bottom-4 w-16 h-16 rounded-full blur-[20px] ${
              isPastDue ? "bg-red-500/20" : "bg-teal-500/20"
            }`} />
          </div>
        </div>
      )}

      {/* Footer Nav */}
      <div className="p-4 border-t border-white/5 space-y-1">
        <Link 
          href="/dashboard/configuracion"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
            pathname === "/dashboard/configuracion"
              ? "bg-teal-500/10 text-teal-400 font-medium"
              : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          <Settings className={`h-5 w-5 ${pathname === "/dashboard/configuracion" ? "text-teal-400" : "text-slate-500"}`} />
          Configuración
          {pathname === "/dashboard/configuracion" && (
            <div className="ml-auto w-1 h-5 bg-teal-500 rounded-full" />
          )}
        </Link>
        <button 
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
