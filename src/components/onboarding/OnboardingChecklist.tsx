"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  CheckCircle2, 
  Circle, 
  ChevronRight, 
  Compass, 
  Sparkles, 
  X, 
  UserCog, 
  MessageSquare, 
  CalendarPlus, 
  Globe, 
  Check, 
  Copy,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDoctorProfile } from "@/hooks/useDoctorProfile";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface OnboardingChecklistProps {
  totalPatients?: number;
}

export function OnboardingChecklist({ totalPatients = 0 }: OnboardingChecklistProps) {
  const { profile } = useDoctorProfile();
  const { userProfile, user } = useAuth();
  
  const [isDismissed, setIsDismissed] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    if (!user) return;
    const dismissed = localStorage.getItem(`nerve_checklist_dismissed_${user.id}`);
    if (dismissed === "true") {
      setIsDismissed(true);
    }
  }, [user]);

  if (!hasMounted || isDismissed || !user) return null;

  const doctorSlug = profile?.slug || "";
  const publicUrl = typeof window !== "undefined" && doctorSlug 
    ? `${window.location.origin}/dr/${doctorSlug}` 
    : doctorSlug ? `https://nervehealthsystems.com/dr/${doctorSlug}` : "";

  // Dynamic status evaluation
  const hasProfileCustomized = !!(profile?.specialty && profile?.license_number);
  const hasWhatsApp = !!(profile?.whatsapp_reminders_enabled);
  const hasPatientsOrAppointments = totalPatients > 0;
  const hasSlug = !!doctorSlug;

  const tasks = [
    {
      id: "account",
      title: "Cuenta de consultorio creada",
      desc: "Acceso inicial listo",
      completed: true,
      href: null,
      icon: CheckCircle2,
    },
    {
      id: "profile",
      title: "Personaliza tus datos médicos y plantilla",
      desc: "Cédula, universidad y formato de recetas oficiales",
      completed: hasProfileCustomized,
      href: "/dashboard/configuracion",
      icon: UserCog,
    },
    {
      id: "whatsapp",
      title: "Conecta tu WhatsApp para recordatorios",
      desc: "Escanea el código QR de tu consultorio en segundos",
      completed: hasWhatsApp,
      href: "/dashboard/configuracion",
      icon: MessageSquare,
    },
    {
      id: "appointment",
      title: "Registra tu primer paciente o cita",
      desc: "Comienza a construir tu directorio médico",
      completed: hasPatientsOrAppointments,
      href: "/dashboard/agenda",
      icon: CalendarPlus,
    },
    {
      id: "share",
      title: "Conoce y comparte tu enlace público",
      desc: "Tus pacientes podrán agendar en tus horarios libres",
      completed: hasSlug,
      href: hasSlug ? `/dr/${doctorSlug}` : "/dashboard/configuracion",
      isPublicLink: true,
      icon: Globe,
    },
  ];

  const completedCount = tasks.filter(t => t.completed).length;
  const progressPercent = Math.round((completedCount / tasks.length) * 100);

  const handleOpenTour = () => {
    window.dispatchEvent(new CustomEvent("open-nerve-onboarding"));
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    if (user) {
      localStorage.setItem(`nerve_checklist_dismissed_${user.id}`, "true");
    }
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    toast.success("Enlace público copiado");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950/80 via-slate-900/60 to-slate-950/90 border border-slate-800/80 shadow-xl backdrop-blur-xl p-5 sm:p-6 transition-all">
      {/* Decorative ambient background */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0 shadow-[0_0_15px_-3px_rgba(20,184,166,0.3)]">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">Ruta de Inicio Rápido</h3>
              <span className="px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-[10px] font-semibold text-teal-300">
                {progressPercent}% completado
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Completa estos 5 pasos para poner en marcha tu consultorio digital al 100%.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleOpenTour}
            className="rounded-xl bg-slate-900/60 border-slate-700 text-teal-300 hover:bg-teal-500/10 hover:text-teal-200 text-xs gap-1.5 h-8 font-medium"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Ver Tour Guiado
          </Button>

          <button
            onClick={handleDismiss}
            className="w-8 h-8 rounded-xl bg-slate-900/50 border border-slate-800 text-slate-500 hover:text-slate-300 hover:bg-slate-850 flex items-center justify-center transition-colors"
            title="Ocultar guía"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Line */}
      <div className="w-full bg-slate-900 h-1.5 rounded-full my-4 overflow-hidden">
        <div 
          className="bg-gradient-to-r from-teal-500 to-cyan-400 h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Checklist Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
        {tasks.map((task) => {
          const TaskIcon = task.icon;
          const content = (
            <div className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
              task.completed 
                ? "bg-slate-950/40 border-slate-850/60 opacity-80" 
                : "bg-slate-900/40 border-slate-800 hover:border-teal-500/40 hover:bg-slate-900/70 shadow-sm"
            }`}>
              <div className="mt-0.5 shrink-0">
                {task.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-500" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <p className={`text-xs font-semibold truncate ${
                    task.completed ? "text-slate-300 line-through decoration-slate-600" : "text-slate-200"
                  }`}>
                    {task.title}
                  </p>
                  {task.href && !task.completed && (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  {task.desc}
                </p>

                {task.isPublicLink && publicUrl && (
                  <div className="mt-2 flex items-center gap-1.5 pt-1 border-t border-white/5">
                    <button
                      onClick={handleCopyLink}
                      className="inline-flex items-center gap-1 text-[10px] text-teal-400 hover:text-teal-300 font-medium py-0.5 px-1.5 rounded bg-teal-500/10 border border-teal-500/20"
                    >
                      {copiedLink ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedLink ? "Copiado" : "Copiar enlace"}
                    </button>
                    <a
                      href={publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-200 font-medium py-0.5 px-1.5"
                    >
                      Ver <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          );

          if (task.href && !task.completed && !task.isPublicLink) {
            return (
              <Link key={task.id} href={task.href} className="block group">
                {content}
              </Link>
            );
          }

          return <div key={task.id}>{content}</div>;
        })}
      </div>
    </div>
  );
}
