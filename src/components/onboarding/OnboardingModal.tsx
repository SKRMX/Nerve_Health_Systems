"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Sparkles, 
  CalendarDays, 
  FileText, 
  MessageSquare, 
  Globe, 
  ArrowRight, 
  ArrowLeft, 
  X, 
  CheckCircle2, 
  Copy, 
  Check, 
  QrCode, 
  Stethoscope, 
  CreditCard,
  ShieldCheck,
  Building2,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDoctorProfile } from "@/hooks/useDoctorProfile";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface OnboardingModalProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export function OnboardingModal({ forceOpen, onClose }: OnboardingModalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile } = useDoctorProfile();
  const { userProfile, user } = useAuth();
  
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [copiedLink, setCopiedLink] = useState(false);

  const totalSteps = 5;

  const doctorName = userProfile?.first_name 
    ? `Dr. ${userProfile.first_name} ${userProfile.last_name || ""}`.trim()
    : profile.full_name 
      ? profile.full_name.startsWith("Dr") ? profile.full_name : `Dr. ${profile.full_name}`
      : "Doctor";

  const clinicName = userProfile ? profile.clinic_name || "Tu Consultorio" : "Tu Consultorio";
  const doctorSlug = profile.slug || "";
  const publicUrl = typeof window !== "undefined" && doctorSlug 
    ? `${window.location.origin}/dr/${doctorSlug}` 
    : doctorSlug ? `https://nervehealthsystems.com/dr/${doctorSlug}` : "";

  // Handle opening via welcome query param, localStorage check, or custom event
  useEffect(() => {
    if (!user) return;

    const storageKey = `nerve_onboarding_completed_${user.id}`;
    const hasCompleted = localStorage.getItem(storageKey);
    const hasWelcomeParam = searchParams.get("welcome") === "true";

    if (forceOpen || hasWelcomeParam || !hasCompleted) {
      setIsOpen(true);
      setStep(1);
    }

    // Listen for custom trigger to open anytime from Header or Dashboard
    const handleOpenEvent = () => {
      setIsOpen(true);
      setStep(1);
    };

    window.addEventListener("open-nerve-onboarding", handleOpenEvent);
    return () => window.removeEventListener("open-nerve-onboarding", handleOpenEvent);
  }, [user, searchParams, forceOpen]);

  const handleClose = () => {
    if (user) {
      localStorage.setItem(`nerve_onboarding_completed_${user.id}`, "true");
    }
    setIsOpen(false);
    if (onClose) onClose();

    // Clean welcome query param from URL if present without page reload
    if (searchParams.get("welcome")) {
      const url = new URL(window.location.href);
      url.searchParams.delete("welcome");
      window.history.replaceState({}, "", url.toString());
    }
  };

  const handleCopyLink = () => {
    if (!publicUrl) {
      toast.info("Aún no tienes un enlace público configurado.");
      return;
    }
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    toast.success("Enlace de agendamiento copiado al portapapeles");
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleFinish = () => {
    handleClose();
    toast.success("¡Tour completado! Bienvenido a NERVE.", {
      description: "Puedes volver a abrir esta guía en cualquier momento desde el menú de usuario."
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      {/* Container with ambient glow */}
      <div className="relative w-full max-w-2xl bg-slate-950/90 border border-slate-800/80 rounded-3xl shadow-[0_0_50px_-10px_rgba(20,184,166,0.3)] backdrop-blur-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Glow ambient spheres */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-teal-500/15 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-blue-500/15 rounded-full blur-[80px] pointer-events-none" />

        {/* Modal Header */}
        <div className="relative z-10 flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shadow-[0_0_15px_-3px_rgba(20,184,166,0.3)]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-teal-400">Guía de Inicio Rápido</span>
              <h3 className="text-sm font-semibold text-white">Conoce NERVE Health</h3>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400 font-medium">
              Paso <span className="text-teal-400 font-bold">{step}</span> de {totalSteps}
            </span>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              title="Cerrar tour"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative w-full h-1 bg-slate-900">
          <div 
            className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(20,184,166,0.5)]"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        {/* Modal Body with Step Content */}
        <div className="relative z-10 p-6 sm:p-8 overflow-y-auto flex-1">
          {/* STEP 1: Bienvenida */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-medium">
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Todo listo para tu práctica clínica</span>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  ¡Bienvenido, <span className="text-teal-400">{doctorName}</span>!
                </h2>
                <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                  Has activado tu consultorio en <strong className="text-slate-200">NERVE</strong>. Esta plataforma está diseñada para que administres tu consulta médica de forma ágil, moderna y sin papeleos.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400">
                    <CalendarDays className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-semibold text-white">Agenda en Vivo</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">Controla citas del día, sala de espera y teleconsultas.</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-semibold text-white">Expedientes & PDF</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">Genera recetas oficiales al instante y fotos con código QR.</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-semibold text-white">WhatsApp Bot</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">Recordatorios automáticos para eliminar inasistencias.</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-teal-950/20 border border-teal-500/20 flex items-center gap-3">
                <Building2 className="w-5 h-5 text-teal-400 shrink-0" />
                <p className="text-xs text-slate-300">
                  Clínica activa: <strong className="text-teal-300">{clinicName}</strong>. Te guiaremos en 4 pasos rápidos para aprovechar la plataforma al máximo.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: Agenda Inteligente */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>Módulo de Citas</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Agenda Inteligente y Citas Online
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Nunca más dobles agendamientos ni confusión de horarios. Tu agenda se actualiza en tiempo real.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    1
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Citas Presenciales o Teleconsultas</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Al programar una teleconsulta, NERVE genera automáticamente una sala de videollamada segura sin apps extras.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    2
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Control de Sala de Espera</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Tanto tú como tu asistente pueden cambiar los estados: <span className="text-slate-300 font-medium">Programada → En Sala → Atendida</span> para llevar el flujo del consultorio en orden.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    3
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Agendamiento Autónomo de Pacientes</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Tus pacientes pueden ingresar a tu página web pública y reservar únicamente en los horarios y días que tengas disponibles.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Expedientes Clínicos & Recetas PDF & Fotos QR */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-medium">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Atención Médica & Expedientes</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Expediente Clínico, Recetas PDF y Captura QR
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Toda la información de tus pacientes organizada en un solo lugar con herramientas exclusivas.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                  <div className="flex items-center gap-2 text-teal-400 font-semibold text-xs">
                    <FileText className="w-4 h-4" />
                    <span>Recetas Médicas Oficiales</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Escribe los medicamentos y genera recetas en PDF elegantes con tu cédula profesional, universidad y firma en un clic para imprimir o enviar.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs">
                    <QrCode className="w-4 h-4" />
                    <span>Puente Móvil de Fotos QR</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Abre el código QR en la pantalla del expediente, escanéalo con tu celular y toma la foto clínica. Aparecerá en tu computadora al instante.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-850 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-400 leading-relaxed">
                  <strong className="text-slate-200">Seguridad Médica:</strong> Los expedientes y notas clínicas están protegidos por permisos de red (RLS). Tu recepcionista puede gestionar pacientes, pero solo los doctores pueden ver diagnósticos.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: WhatsApp Automático */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Cero Inasistencias</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Recordatorios y Recetas por WhatsApp
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Automatiza el seguimiento de tus citas con el canal preferido por los pacientes.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Conexión con tu Propio Número</h4>
                    <p className="text-xs text-slate-400">Escaneas un código QR como en WhatsApp Web y listo.</p>
                  </div>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Confirmación inmediata con fecha, hora y ubicación en mapa.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Recordatorio automático 24 horas y 2 horas antes de la consulta.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Envío del resumen médico y receta directamente al paciente al terminar la cita.</span>
                  </li>
                </ul>
              </div>

              <p className="text-xs text-slate-500">
                👉 Puedes conectar tu WhatsApp en cualquier momento yendo a <span className="text-slate-300 font-medium">Configuración → WhatsApp Conexión</span>.
              </p>
            </div>
          )}

          {/* STEP 5: Perfil Web & Cobros */}
          {step === 5 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Presencia Digital & Pagos</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Tu Perfil Web de Agendamiento y Cobros
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Comparte tu enlace en tu perfil de Instagram, Facebook o WhatsApp para que tus pacientes agenden sin intermediarios.
                </p>
              </div>

              {/* URL Box */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Tu Enlace Exclusivo:</span>
                  {publicUrl && (
                    <a
                      href={publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-teal-400 hover:text-teal-300 flex items-center gap-1 font-medium"
                    >
                      Previsualizar <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-950 border border-slate-800 px-3 py-2.5 rounded-xl text-xs text-slate-300 font-mono truncate">
                    {publicUrl || `https://nervehealthsystems.com/dr/${doctorSlug || "tu-nombre"}`}
                  </div>
                  <Button
                    type="button"
                    onClick={handleCopyLink}
                    disabled={!publicUrl}
                    className="shrink-0 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-medium px-4 h-10 gap-1.5"
                  >
                    {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedLink ? "Copiado" : "Copiar"}
                  </Button>
                </div>
              </div>

              {/* Payments highlight */}
              <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex items-start gap-3">
                <CreditCard className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-white">Cobro de Anticipos y Consultas con Tarjeta</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Puedes vincular tu cuenta bancaria (Stripe / Mercado Pago) en <span className="text-slate-300 font-medium">Configuración → Teleconsulta y Pagos</span> para recibir pagos directos al momento de agendar.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="relative z-10 flex items-center justify-between px-6 py-4 border-t border-white/5 bg-slate-950/60">
          <div>
            {step > 1 ? (
              <Button
                variant="ghost"
                onClick={() => setStep(prev => Math.max(1, prev - 1))}
                className="text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl text-xs font-medium gap-1 px-3"
              >
                <ArrowLeft className="w-4 h-4" />
                Anterior
              </Button>
            ) : (
              <Button
                variant="ghost"
                onClick={handleClose}
                className="text-slate-500 hover:text-slate-300 hover:bg-slate-900/50 rounded-xl text-xs font-medium"
              >
                Saltar tour
              </Button>
            )}
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setStep(idx + 1)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  step === idx + 1 
                    ? "w-6 bg-teal-400 shadow-[0_0_8px_rgba(20,184,166,0.6)]" 
                    : "bg-slate-800 hover:bg-slate-700"
                }`}
                title={`Ir al paso ${idx + 1}`}
              />
            ))}
          </div>

          <div>
            {step < totalSteps ? (
              <Button
                onClick={() => setStep(prev => Math.min(totalSteps, prev + 1))}
                className="bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold gap-1.5 px-5 shadow-[0_0_20px_-5px_rgba(20,184,166,0.4)]"
              >
                Siguiente
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleFinish}
                className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold rounded-xl text-xs gap-1.5 px-6 shadow-[0_0_25px_-5px_rgba(20,184,166,0.6)]"
              >
                ¡Comenzar ahora!
                <CheckCircle2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
