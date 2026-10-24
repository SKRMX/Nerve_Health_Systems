"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { 
  LayoutDashboard, 
  CalendarDays, 
  Users, 
  FolderOpen, 
  MoreHorizontal,
  Package,
  CircleDollarSign,
  UsersRound,
  BarChart3,
  Settings,
  LogOut,
  CreditCard,
  X,
  Shield
} from "lucide-react";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { signOut, isAdmin, isReceptionist, isSuperadmin, userProfile, clinic } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  const primaryTabs = [
    { name: "Inicio", href: "/dashboard", icon: LayoutDashboard },
    { name: "Agenda", href: "/dashboard/agenda", icon: CalendarDays },
    { name: "Pacientes", href: "/dashboard/pacientes", icon: Users },
    ...(!isReceptionist ? [{ name: "Expedientes", href: "/dashboard/expedientes", icon: FolderOpen }] : []),
  ];

  const secondaryTabs = [
    ...(!isReceptionist ? [
      { name: "Inventario", href: "/dashboard/inventario", icon: Package },
      { name: "Finanzas", href: "/dashboard/finanzas", icon: CircleDollarSign }
    ] : []),
    ...(isAdmin ? [
      { name: "Equipo", href: "/dashboard/equipo", icon: UsersRound },
      { name: "Reportes", href: "/dashboard/reportes", icon: BarChart3 }
    ] : []),
    { name: "Suscripción", href: "/dashboard/checkout", icon: CreditCard },
    { name: "Configuración", href: "/dashboard/configuracion", icon: Settings },
  ];

  return (
    <>
      {/* Fixed Native Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-slate-950/85 backdrop-blur-2xl border-t border-white/10 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-2xl">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {primaryTabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 ${
                  isActive
                    ? "text-teal-400 font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${
                  isActive ? "bg-teal-500/20 shadow-[0_0_12px_rgba(45,212,191,0.3)]" : ""
                }`}>
                  <tab.icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] tracking-tight mt-0.5">{tab.name}</span>
              </Link>
            );
          })}

          {/* "Más" Button */}
          <button
            onClick={() => setMoreOpen(true)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 ${
              moreOpen || secondaryTabs.some(t => pathname === t.href)
                ? "text-violet-400 font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${
              moreOpen || secondaryTabs.some(t => pathname === t.href)
                ? "bg-violet-500/20 shadow-[0_0_12px_rgba(139,92,246,0.3)]"
                : ""
            }`}>
              <MoreHorizontal className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">Más</span>
          </button>
        </div>
      </div>

      {/* Native Bottom Sheet Drawer for "Más" */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setMoreOpen(false)}
          />

          {/* Drawer Sheet */}
          <div className="relative bg-slate-950 border-t border-slate-800 rounded-t-3xl p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl animate-in slide-in-from-bottom duration-300">
            {/* Sheet Pull Indicator */}
            <div className="w-12 h-1.5 bg-slate-800 rounded-full mx-auto mb-5" />

            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-teal-400" />
                <span className="text-sm font-semibold text-white">Menú Principal</span>
                {userProfile?.role && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 capitalize font-mono">
                    {userProfile.role}
                  </span>
                )}
              </div>
              <button 
                onClick={() => setMoreOpen(false)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {secondaryTabs.map((tab) => {
                const isActive = pathname === tab.href;
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    onClick={() => setMoreOpen(false)}
                    className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                      isActive
                        ? "bg-teal-500/10 border-teal-500/30 text-teal-300 font-medium"
                        : "bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-900"
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${
                      isActive ? "bg-teal-500/20 text-teal-400" : "bg-slate-800 text-slate-400"
                    }`}>
                      <tab.icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-medium">{tab.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Sign Out Button */}
            <button
              onClick={() => {
                setMoreOpen(false);
                signOut();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </>
  );
}
