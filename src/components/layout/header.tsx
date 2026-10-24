"use client";

import React from "react";
import { Bell, Menu, Search, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDoctorProfile } from "@/hooks/useDoctorProfile";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  doctor: "Doctor",
  receptionist: "Recepcionista",
};

const roleColors: Record<string, string> = {
  admin: "text-violet-400",
  doctor: "text-teal-400",
  receptionist: "text-blue-400",
};

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { profile } = useDoctorProfile();
  const { userProfile, signOut, isLoading } = useAuth();
  const router = useRouter();
  
  // Display name: prefer userProfile from auth, fall back to doctorProfile
  const rawFullName = userProfile
    ? `${userProfile.first_name} ${userProfile.last_name}`.trim()
    : (profile.full_name || "");

  const displayFullName = isLoading ? "Verificando sesión..." : (rawFullName || "Doctor");

  const role = userProfile?.role;
  const roleLabel = isLoading ? "NERVE Core v1.0" : (role ? roleLabels[role] : (profile.specialty || "Médico"));
  const roleColor = isLoading ? "text-teal-500/50" : (role ? roleColors[role] : "text-teal-400");


  // Extract initials
  const initials = displayFullName
    .split(" ")
    .filter(w => w.length > 0 && w !== "Dr." && w !== "Dra.")
    .slice(0, 2)
    .map(w => w[0])
    .join("")
    .toUpperCase() || "DR";

  const displayName = displayFullName.length > 22 
    ? displayFullName.substring(0, 22) + "..." 
    : displayFullName;

  // Avatar color by role
  const avatarBg = role === "admin" ? "bg-violet-600" : role === "receptionist" ? "bg-blue-600" : "bg-teal-600";

  return (
    <header className="shrink-0 flex items-center justify-between px-4 md:px-6 pt-[env(safe-area-inset-top)] h-[calc(4rem+env(safe-area-inset-top))] border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40">
      <div className="flex items-center gap-4 flex-1">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onMenuClick}
          className="lg:hidden text-slate-400 hover:text-white hover:bg-white/10"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        {/* Global Search */}
        <div className="hidden md:flex relative w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input 
            placeholder="Buscar pacientes, citas (CMD + K)..." 
            className="pl-9 bg-slate-900/50 border-slate-800/60 text-slate-300 focus-visible:ring-teal-500/50 placeholder:text-slate-600 rounded-full h-9"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Tour / Guide Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => window.dispatchEvent(new CustomEvent("open-nerve-onboarding"))}
          className="relative text-slate-400 hover:text-teal-300 hover:bg-teal-500/10 rounded-full h-9 w-9 transition-colors"
          title="Guía de Inicio / Tour"
        >
          <Compass className="h-4 w-4" />
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-white hover:bg-white/10 rounded-full h-9 w-9">
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-teal-500 rounded-full shadow-[0_0_8px_rgba(20,184,166,0.8)]" />
        </Button>

        <div className="h-6 w-px bg-slate-800 mx-1" />

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center outline-none h-9 rounded-full pl-2 pr-4 bg-white/5 hover:bg-white/10 gap-3 border border-white/5 transition-colors">
              <Avatar className="h-6 w-6">
                <AvatarImage src="" alt={displayName} />
                <AvatarFallback className={`${avatarBg} text-[10px] text-white`}>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start leading-none pointer-events-none">
                <span className="text-sm font-medium text-slate-200">{displayName}</span>
                <span className={`text-[10px] ${roleColor}`}>{roleLabel}</span>
              </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-slate-950 border-slate-800 text-slate-300">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none text-slate-200">{displayFullName}</p>
                  <p className="text-xs leading-none text-slate-500">{userProfile?.email || profile.clinic_email || "Sin configurar"}</p>
                  {role && (
                    <span className={`text-[10px] font-medium ${roleColor} mt-1`}>
                      {roleLabel}
                    </span>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-800" />
              <DropdownMenuItem 
                className="focus:bg-teal-500/10 focus:text-teal-400 cursor-pointer flex items-center justify-between"
                onClick={() => window.dispatchEvent(new CustomEvent("open-nerve-onboarding"))}
              >
                <span>Guía de Inicio / Tour</span>
                <Compass className="w-4 h-4 text-teal-400" />
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="focus:bg-teal-500/10 focus:text-teal-400 cursor-pointer"
                onClick={() => router.push("/dashboard/configuracion")}
              >
                Perfil Profesional
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="focus:bg-teal-500/10 focus:text-teal-400 cursor-pointer"
                onClick={() => router.push("/dashboard/suscripcion")}
              >
                Suscripción
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-800" />
              <DropdownMenuItem 
                className="focus:bg-red-500/10 focus:text-red-400 cursor-pointer"
                onClick={signOut}
              >
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
