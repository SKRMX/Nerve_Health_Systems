"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Save, 
  User, 
  Building2, 
  GraduationCap, 
  FileText, 
  CheckCircle2,
  Loader2,
  Stethoscope,
  Phone,
  Mail,
  MapPin,
  BadgeCheck,
  Pen,
  MessageSquare,
  Wifi,
  WifiOff,
  RefreshCw,
  Trash2,
  Smartphone,
  Globe,
  Copy,
  Check,
  Upload,
  Calendar,
  Clock,
  Coffee,
  Image,
  Plus,
  CreditCard,
  ExternalLink,
  AlertTriangle,
  Video,
  TrendingUp
} from "lucide-react";
import { toast } from "sonner";
import { useDoctorProfile, DoctorProfile } from "@/hooks/useDoctorProfile";
import { useAuth } from "@/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COUNTRIES, formatPrice, getCountryConfig } from "@/lib/international";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

const DAYS_NAMES = [
  { id: "1", name: "Lunes" },
  { id: "2", name: "Martes" },
  { id: "3", name: "Miércoles" },
  { id: "4", name: "Jueves" },
  { id: "5", name: "Viernes" },
  { id: "6", name: "Sábado" },
  { id: "0", name: "Domingo" }
];

export default function ConfiguracionPage() {
  const { profile, isLoading, updateProfile } = useDoctorProfile();
  const { isAdmin, isSuperadmin } = useAuth();
  const [formData, setFormData] = useState<Partial<DoctorProfile>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // WhatsApp state
  const [waStatus, setWaStatus] = useState<"loading" | "not_configured" | "waiting_qr" | "connected">("loading");
  const [waQr, setWaQr] = useState<string | null>(null);
  const [waPhone, setWaPhone] = useState<string | null>(null);
  const [waConnecting, setWaConnecting] = useState(false);
  const [waDisconnecting, setWaDisconnecting] = useState(false);

  // Profile URL state
  const [host, setHost] = useState("");
  const [copied, setCopied] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);

  // Get host client-side and handle Stripe return params
  useEffect(() => {
    if (typeof window !== "undefined") {
      setHost(window.location.host);

      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("stripe_success") === "true") {
        toast.success("¡Cuenta verificada en Stripe Connect con éxito!", {
          description: "Tus depósitos ya están configurados correctamente.",
          icon: <CheckCircle2 className="h-4 w-4 text-teal-500" />,
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (urlParams.get("stripe_refresh") === "true") {
        toast.warning("El onboarding de Stripe no se completó.", {
          description: "Puedes intentarlo nuevamente desde la sección de pagos.",
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  // Sync form with loaded profile
  useEffect(() => {
    if (profile && profile.id) {
      setFormData({ ...profile });
    }
  }, [profile]);

  // Fetch WhatsApp status
  const fetchWaStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/whatsapp", { credentials: "include" });
      const data = await res.json();
      setWaStatus(data.status || "not_configured");
      setWaQr(data.qr || null);
      setWaPhone(data.phone || null);
    } catch {
      setWaStatus("not_configured");
    }
  }, []);

  useEffect(() => {
    if (isAdmin || isSuperadmin) fetchWaStatus();
  }, [isAdmin, isSuperadmin, fetchWaStatus]);

  // Poll for QR/connection while waiting
  useEffect(() => {
    if (waStatus !== "waiting_qr") return;
    const interval = setInterval(fetchWaStatus, 5000);
    return () => clearInterval(interval);
  }, [waStatus, fetchWaStatus]);

  const handleConnectWhatsApp = async () => {
    setWaConnecting(true);
    try {
      const res = await fetch("/api/whatsapp", { method: "POST", credentials: "include" });
      const data = await res.json();
      if (data.success) {
        toast.success("Instancia creada", { description: "Escanea el código QR con tu WhatsApp" });
        await fetchWaStatus();
      } else {
        toast.error("Error", { description: data.error });
      }
    } catch (err: any) {
      toast.error("Error de conexión", { description: err.message });
    }
    setWaConnecting(false);
  };

  const handleDisconnectWhatsApp = async () => {
    const confirmMsg = waStatus === "waiting_qr" 
      ? "¿Deseas cancelar la vinculación actual y empezar de nuevo?"
      : "¿Seguro que deseas desconectar WhatsApp? Los recordatorios dejarán de enviarse.";
    if (!confirm(confirmMsg)) return;
    setWaDisconnecting(true);
    try {
      await fetch("/api/whatsapp", { method: "DELETE", credentials: "include" });
      toast.success(waStatus === "waiting_qr" ? "Vinculación cancelada" : "WhatsApp desconectado");
      setWaStatus("not_configured");
      setWaQr(null);
      setWaPhone(null);
    } catch {}
    setWaDisconnecting(false);
  };

  const handleChange = (field: keyof DoctorProfile, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSocialChange = (network: string, value: string) => {
    setFormData((prev) => {
      const links = prev.social_links || {};
      return {
        ...prev,
        social_links: {
          ...links,
          [network]: value
        }
      };
    });
    setHasChanges(true);
  };

  const handleScheduleDayToggle = (dayId: string, active: boolean) => {
    setFormData((prev) => {
      const schedule = prev.schedule_settings || {};
      const days = schedule.days || {};
      const dayConfig = days[dayId] || { start: "09:00", end: "18:00" };
      return {
        ...prev,
        schedule_settings: {
          ...schedule,
          days: {
            ...days,
            [dayId]: {
              ...dayConfig,
              active
            }
          }
        }
      };
    });
    setHasChanges(true);
  };

  const handleScheduleTimeChange = (dayId: string, type: "start" | "end", value: string) => {
    setFormData((prev) => {
      const schedule = prev.schedule_settings || {};
      const days = schedule.days || {};
      const dayConfig = days[dayId] || { active: true, start: "09:00", end: "18:00" };
      return {
        ...prev,
        schedule_settings: {
          ...schedule,
          days: {
            ...days,
            [dayId]: {
              ...dayConfig,
              [type]: value
            }
          }
        }
      };
    });
    setHasChanges(true);
  };

  const handleDurationChange = (minutes: number) => {
    setFormData((prev) => {
      const schedule = prev.schedule_settings || {};
      return {
        ...prev,
        schedule_settings: {
          ...schedule,
          duration: minutes
        }
      };
    });
    setHasChanges(true);
  };

  const handleBreakToggle = (active: boolean) => {
    setFormData((prev) => {
      const schedule = prev.schedule_settings || {};
      return {
        ...prev,
        schedule_settings: {
          ...schedule,
          break_enabled: active
        }
      };
    });
    setHasChanges(true);
  };

  const handleBreakTimeChange = (type: "break_start" | "break_end", value: string) => {
    setFormData((prev) => {
      const schedule = prev.schedule_settings || {};
      return {
        ...prev,
        schedule_settings: {
          ...schedule,
          [type]: value
        }
      };
    });
    setHasChanges(true);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    const uploadFormData = new FormData();
    uploadFormData.append("file", file);

    try {
      const res = await fetch("/api/dashboard/doctor/profile/upload", {
        method: "POST",
        body: uploadFormData
      });
      const data = await res.json();
      if (res.ok && data.success) {
        handleChange("profile_photo_url", data.publicUrl);
        toast.success("Foto de perfil subida exitosamente");
      } else {
        toast.error("Error al subir la imagen", { description: data.error });
      }
    } catch (err: any) {
      toast.error("Error de red", { description: err.message });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const currentImages = formData.gallery_images || [];
    if (currentImages.length >= 9) {
      toast.error("Límite alcanzado", { description: "Solo puedes subir un máximo de 9 imágenes en tu galería." });
      return;
    }

    const remainingSlots = 9 - currentImages.length;
    const filesArray = Array.from(files).slice(0, remainingSlots);

    setIsUploadingGallery(true);
    let successCount = 0;
    const newImages = [...currentImages];

    for (const file of filesArray) {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      try {
        const res = await fetch("/api/dashboard/doctor/profile/upload", {
          method: "POST",
          body: uploadFormData
        });
        const data = await res.json();
        if (res.ok && data.success) {
          newImages.push(data.publicUrl);
          successCount++;
        } else {
          toast.error(`Error al subir ${file.name}`, { description: data.error });
        }
      } catch (err: any) {
        toast.error(`Error de red al subir ${file.name}`, { description: err.message });
      }
    }

    if (successCount > 0) {
      handleChange("gallery_images", newImages);
      toast.success(`${successCount} imagen(es) subida(s) exitosamente`);
    }
    setIsUploadingGallery(false);
  };

  const handleRemoveGalleryImage = (index: number) => {
    const currentImages = formData.gallery_images || [];
    const newImages = currentImages.filter((_, i) => i !== index);
    handleChange("gallery_images", newImages);
    toast.success("Imagen eliminada de la galería");
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Clean slug formatting before save
      let cleanSlug = formData.slug ? formData.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-') : '';
      if (cleanSlug.startsWith('-')) cleanSlug = cleanSlug.slice(1);
      if (cleanSlug.endsWith('-')) cleanSlug = cleanSlug.slice(0, -1);

      // Validate slug format
      if (formData.slug && cleanSlug.length < 3) {
        throw new Error("El enlace de perfil (slug) debe tener al menos 3 caracteres.");
      }

      const updatedData = {
        ...formData,
        slug: cleanSlug || null
      };

      await updateProfile(updatedData);
      toast.success("Perfil actualizado", {
        description: "Los cambios se guardaron con éxito en el sistema.",
        icon: <CheckCircle2 className="h-4 w-4 text-teal-500" />,
      });
      setHasChanges(false);
    } catch (error: any) {
      toast.error("Error al guardar", { description: error.message });
    }
    setIsSaving(false);
  };

  const handleCopyLink = () => {
    if (!formData.slug) return;
    const link = `${window.location.protocol}//${host}/dr/${formData.slug}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Enlace copiado al portapapeles");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDisconnectMP = async () => {
    if (!confirm("¿Seguro que deseas desconectar tu cuenta de Mercado Pago? Las reservas prepagadas en línea quedarán inhabilitadas.")) return;
    try {
      const res = await fetch("/api/auth/mercadopago/disconnect", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        handleChange("mp_client_id", null);
        handleChange("mp_access_token", null);
        handleChange("mp_refresh_token", null);
        handleChange("payment_required", false);
        toast.success("Mercado Pago desconectado exitosamente");
      } else {
        toast.error("Error al desconectar", { description: data.error });
      }
    } catch (err: any) {
      toast.error("Error de red", { description: err.message });
    }
  };

  const [isSavingBank, setIsSavingBank] = useState(false);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);

  const handleOpenStripePortal = async () => {
    setIsOpeningPortal(true);
    try {
      const res = await fetch("/api/doctor/stripe-portal", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success && data.url) {
        window.open(data.url, "_blank");
      } else {
        toast.error("Error al abrir portal", { description: data.error || "No se pudo acceder al portal de Stripe." });
      }
    } catch (err: any) {
      toast.error("Error de red", { description: err.message || "Error de conexión al abrir el portal de Stripe." });
    } finally {
      setIsOpeningPortal(false);
    }
  };

  const handleSaveBankSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBank(true);

    try {
      // Validaciones básicas de banco si el modo no es 'ninguno'
      // Validaciones básicas de banco si el modo no es 'ninguno'
      if (formData.payment_mode !== 'ninguno') {
        if (!formData.bank_beneficiary_name?.trim()) throw new Error("Debes indicar el nombre del titular");
        if (!formData.bank_account_clabe?.trim()) throw new Error("Debes indicar la tarjeta de débito o cuenta CLABE");

        // Si es México, validar que sea tarjeta de 16 dígitos o CLABE de 18 dígitos
        const cleanClabe = formData.bank_account_clabe.replace(/\D/g, '');
        if (formData.country_code === 'MX' && cleanClabe.length !== 16 && cleanClabe.length !== 18) {
          throw new Error("Ingresa los 16 dígitos de tu tarjeta de débito (para depósitos al instante) o los 18 dígitos de tu CLABE");
        }
      }

      const res = await fetch("/api/doctor/bank-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bank_name: formData.bank_name,
          bank_account_clabe: formData.bank_account_clabe,
          bank_beneficiary_name: formData.bank_beneficiary_name,
          bank_rfc: formData.bank_rfc,
          country_code: formData.country_code || "MX",
          currency: formData.currency || "MXN",
          payment_mode: formData.payment_mode || "ninguno",
          anticipo_amount: formData.anticipo_amount || 0
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al configurar datos bancarios");

      // Actualizar estado local
      handleChange("stripe_account_id", data.stripe_account_id);
      handleChange("stripe_onboarding_completed", data.stripe_onboarding_completed);
      
      if (data.stripe_onboarding_url) {
        toast.success("Redirigiendo a Stripe...", {
          description: "Completa la verificación oficial de tu cuenta Connect para poder activar tus cobros.",
        });
        setTimeout(() => {
          window.location.href = data.stripe_onboarding_url;
        }, 1500);
      } else {
        toast.success("Configuración de pagos guardada", {
          description: data.stripe_onboarding_completed
            ? "Depósitos en línea activados correctamente con Stripe Connect."
            : "Datos de cobro presencial actualizados correctamente.",
          icon: <CheckCircle2 className="h-4 w-4 text-teal-500" />,
        });
      }
      setHasChanges(false);
    } catch (error: any) {
      toast.error("Error en configuración de pagos", { description: error.message });
    } finally {
      setIsSavingBank(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-teal-500 mx-auto" />
          <p className="text-slate-500 text-sm">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  const publicLink = (typeof window !== "undefined" && formData.slug) 
    ? `${window.location.protocol}//${host}/dr/${formData.slug}` 
    : "";

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Configuración del Perfil</h1>
          <p className="text-slate-400 mt-1">
            Administra los datos de tus recetas y la configuración de tu agenda pública en línea.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className={`rounded-xl px-6 transition-all duration-300 ${
            hasChanges
              ? "bg-teal-600 hover:bg-teal-500 text-white shadow-[0_0_20px_-5px_rgba(13,148,136,0.4)]"
              : "bg-slate-800 text-slate-500 cursor-not-allowed"
          }`}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isSaving ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </div>

      <Tabs defaultValue="recetas" className="w-full space-y-6">
        <TabsList className="bg-slate-900/40 border border-slate-800/80 p-1 rounded-xl w-fit">
          <TabsTrigger value="recetas" className="rounded-lg px-4 py-2 text-slate-400 data-[state=active]:bg-teal-600 data-[state=active]:text-white">
            Recetas y Consultorio
          </TabsTrigger>
          <TabsTrigger value="agenda" className="rounded-lg px-4 py-2 text-slate-400 data-[state=active]:bg-teal-600 data-[state=active]:text-white">
            Agenda Online y Perfil
          </TabsTrigger>
          <TabsTrigger value="teleconsulta" className="rounded-lg px-4 py-2 text-slate-400 data-[state=active]:bg-teal-600 data-[state=active]:text-white">
            Teleconsulta y Pagos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recetas" className="space-y-8 focus:outline-none">
          {/* Section: Información Personal */}
          <Card className="bg-slate-950/40 border-slate-800/60 backdrop-blur-xl shadow-lg ring-1 ring-white/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-teal-500/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-teal-500" />
                </div>
                <div>
                  <CardTitle className="text-lg text-slate-200">Información del Médico</CardTitle>
                  <CardDescription className="text-slate-500">
                    Nombre, especialidad y credenciales profesionales.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-slate-300 flex items-center gap-2">
                    <Stethoscope className="h-3.5 w-3.5 text-slate-500" />
                    Nombre Completo (como aparecerá en recetas)
                  </Label>
                  <Input
                    placeholder="Ej. Dr. Juan Pérez López"
                    className="bg-slate-900/50 border-slate-800 focus-visible:ring-teal-500/50"
                    value={formData.full_name || ""}
                    onChange={(e) => handleChange("full_name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300 flex items-center gap-2">
                    <GraduationCap className="h-3.5 w-3.5 text-slate-500" />
                    Especialidad Médica
                  </Label>
                  <Input
                    placeholder="Ej. Cardiología Intervencionista"
                    className="bg-slate-900/50 border-slate-800 focus-visible:ring-teal-500/50"
                    value={formData.specialty || ""}
                    onChange={(e) => handleChange("specialty", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300 flex items-center gap-2">
                    <BadgeCheck className="h-3.5 w-3.5 text-slate-500" />
                    Cédula Profesional
                  </Label>
                  <Input
                    placeholder="Ej. 12345678"
                    className="bg-slate-900/50 border-slate-800 focus-visible:ring-teal-500/50"
                    value={formData.license_number || ""}
                    onChange={(e) => handleChange("license_number", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300 flex items-center gap-2">
                    <GraduationCap className="h-3.5 w-3.5 text-slate-500" />
                    Universidad
                  </Label>
                  <Input
                    placeholder="Ej. UANL Facultad de Medicina"
                    className="bg-slate-900/50 border-slate-800 focus-visible:ring-teal-500/50"
                    value={formData.university || ""}
                    onChange={(e) => handleChange("university", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section: WhatsApp Notifications */}
          {(isAdmin || isSuperadmin) && (
            <Card className="bg-slate-950/40 border-slate-800/60 backdrop-blur-xl shadow-lg ring-1 ring-white/5 overflow-hidden">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                    waStatus === "connected" ? "bg-emerald-500/10" : "bg-green-500/10"
                  }`}>
                    <MessageSquare className={`h-5 w-5 ${
                      waStatus === "connected" ? "text-emerald-500" : "text-green-500"
                    }`} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg text-slate-200">Notificaciones por WhatsApp</CardTitle>
                    <CardDescription className="text-slate-500">
                      Vincula tu número de WhatsApp para enviar recordatorios automáticos a tus pacientes.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    {waStatus === "connected" && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <Wifi className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-xs font-medium text-emerald-400">Conectado</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-300">Activar envíos</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={formData.whatsapp_reminders_enabled !== false}
                          onChange={(e) => handleChange("whatsapp_reminders_enabled", e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {waStatus === "not_configured" && (
                  <div className="text-center py-8 space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto border border-slate-700/50">
                      <Smartphone className="h-8 w-8 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-slate-300 font-medium">WhatsApp no vinculado</p>
                      <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
                        Conecta tu número de WhatsApp para que tus pacientes reciban recordatorios automáticos 
                        de sus citas 24 y 48 horas antes.
                      </p>
                    </div>
                    <Button 
                      onClick={handleConnectWhatsApp} 
                      disabled={waConnecting}
                      className="bg-green-600 hover:bg-green-500 text-white rounded-xl px-6 shadow-[0_0_20px_-5px_rgba(34,197,94,0.4)]"
                    >
                      {waConnecting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <MessageSquare className="h-4 w-4 mr-2" />
                      )}
                      {waConnecting ? "Preparando..." : "Vincular WhatsApp"}
                    </Button>
                  </div>
                )}

                {waStatus === "loading" && (
                  <div className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-green-400 mx-auto" />
                    <p className="text-slate-500 text-sm mt-2">Verificando estado...</p>
                  </div>
                )}

                {waStatus === "waiting_qr" && (
                  <div className="text-center py-4 space-y-4">
                    <p className="text-slate-300 font-medium">Escanea el código QR</p>
                    <p className="text-slate-500 text-sm max-w-md mx-auto">
                      Abre WhatsApp en tu celular → Configuración → Dispositivos vinculados → Vincular un dispositivo
                    </p>
                    {waQr ? (
                      <div className="inline-block p-4 bg-white rounded-2xl shadow-lg">
                        <img src={waQr} alt="QR WhatsApp" className="w-56 h-56" />
                      </div>
                    ) : (
                      <div className="inline-flex flex-col items-center gap-3 p-8 rounded-2xl bg-slate-800/50 border border-slate-700/50">
                        <Loader2 className="h-8 w-8 animate-spin text-green-400" />
                        <p className="text-slate-400 text-sm">Generando código QR...</p>
                      </div>
                    )}
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        Actualizando cada 5 segundos...
                      </div>
                      <Button
                        onClick={handleDisconnectWhatsApp}
                        disabled={waDisconnecting}
                        variant="outline"
                        className="text-red-400 border-red-500/20 hover:bg-red-500/10 hover:text-red-300 rounded-xl text-xs flex items-center gap-1.5"
                      >
                        {waDisconnecting ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                        Desvincular / Resetear
                      </Button>
                    </div>
                  </div>
                )}

                {waStatus === "connected" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-xl">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-emerald-300">WhatsApp activo</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {waPhone ? `Número: +${waPhone}` : "Número vinculado exitosamente"}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Los recordatorios de citas se enviarán automáticamente desde este número.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <button
                        onClick={fetchWaStatus}
                        className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1.5 transition-colors"
                      >
                        <RefreshCw className="h-3 w-3" /> Verificar conexión
                      </button>
                      <Button
                        onClick={handleDisconnectWhatsApp}
                        disabled={waDisconnecting}
                        variant="outline"
                        className="text-red-400 border-red-500/20 hover:bg-red-500/10 hover:text-red-300 rounded-xl text-xs"
                      >
                        {waDisconnecting ? (
                          <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3 mr-1.5" />
                        )}
                        Desvincular
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Section: Consultorio / Clínica */}
          <Card className="bg-slate-950/40 border-slate-800/60 backdrop-blur-xl shadow-lg ring-1 ring-white/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="text-lg text-slate-200">Consultorio / Clínica</CardTitle>
                  <CardDescription className="text-slate-500">
                    Datos de ubicación y contacto que se imprimen en documentos.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-slate-300 flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-slate-500" />
                    Nombre de la Clínica
                  </Label>
                  <Input
                    placeholder="Ej. Centro Médico Especializado"
                    className="bg-slate-900/50 border-slate-800 focus-visible:ring-teal-500/50"
                    value={formData.clinic_name || ""}
                    onChange={(e) => handleChange("clinic_name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300 flex items-center gap-2">
                    <Pen className="h-3.5 w-3.5 text-slate-500" />
                    Subtítulo / Eslogan
                  </Label>
                  <Input
                    placeholder="Ej. Medicina de Vanguardia"
                    className="bg-slate-900/50 border-slate-800 focus-visible:ring-teal-500/50"
                    value={formData.clinic_subtitle || ""}
                    onChange={(e) => handleChange("clinic_subtitle", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-slate-300 flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-500" />
                    Calle y Número (Consultorio)
                  </Label>
                  <Input
                    placeholder="Ej. Av. Constitución #1234, Col. Centro"
                    className="bg-slate-900/50 border-slate-800 focus-visible:ring-teal-500/50"
                    value={formData.clinic_address || ""}
                    onChange={(e) => handleChange("clinic_address", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Ciudad</Label>
                  <Input
                    placeholder="Ej. Monterrey"
                    className="bg-slate-900/50 border-slate-800 focus-visible:ring-teal-500/50"
                    value={formData.clinic_city || ""}
                    onChange={(e) => handleChange("clinic_city", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Estado</Label>
                    <Input
                      placeholder="Ej. Nuevo León"
                      className="bg-slate-900/50 border-slate-800 focus-visible:ring-teal-500/50"
                      value={formData.clinic_state || ""}
                      onChange={(e) => handleChange("clinic_state", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Código Postal</Label>
                    <Input
                      placeholder="Ej. 64000"
                      className="bg-slate-900/50 border-slate-800 focus-visible:ring-teal-500/50"
                      value={formData.clinic_postal_code || ""}
                      onChange={(e) => handleChange("clinic_postal_code", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-slate-300 flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-500" />
                    Teléfono
                  </Label>
                  <Input
                    placeholder="Ej. (81) 8000-0000"
                    className="bg-slate-900/50 border-slate-800 focus-visible:ring-teal-500/50"
                    value={formData.clinic_phone || ""}
                    onChange={(e) => handleChange("clinic_phone", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300 flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-500" />
                    Email de Contacto
                  </Label>
                  <Input
                    placeholder="Ej. contacto@clinica.com"
                    className="bg-slate-900/50 border-slate-800 focus-visible:ring-teal-500/50"
                    value={formData.clinic_email || ""}
                    onChange={(e) => handleChange("clinic_email", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section: Personalización de Documentos */}
          <Card className="bg-slate-950/40 border-slate-800/60 backdrop-blur-xl shadow-lg ring-1 ring-white/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <CardTitle className="text-lg text-slate-200">Personalización de Documentos</CardTitle>
                  <CardDescription className="text-slate-500">
                    Configura el texto que aparece en la firma y pie de página de tus recetas.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-slate-300">Texto bajo la Firma</Label>
                <Input
                  placeholder="Ej. Médico Cirujano - Cédula 12345678"
                  className="bg-slate-900/50 border-slate-800 focus-visible:ring-teal-500/50"
                  value={formData.signature_label || ""}
                  onChange={(e) => handleChange("signature_label", e.target.value)}
                />
                <p className="text-[11px] text-slate-600">
                  Se muestra debajo de la línea de firma en recetas y expedientes.
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Pie de Página de Recetas</Label>
                <Textarea
                  placeholder="Ej. Esta receta es un documento médico oficial generado por..."
                  className="bg-slate-900/50 border-slate-800 focus-visible:ring-teal-500/50 resize-none min-h-[80px]"
                  value={formData.footer_text || ""}
                  onChange={(e) => handleChange("footer_text", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section: Plantilla y Tamaño */}
          <Card className="bg-slate-950/40 border-slate-800/60 backdrop-blur-xl shadow-lg ring-1 ring-white/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-violet-500" />
                </div>
                <div>
                  <CardTitle className="text-lg text-slate-200">Plantilla de Receta</CardTitle>
                  <CardDescription className="text-slate-500">
                    Elige el estilo visual y tamaño de tus recetas médicas.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              <div>
                <Label className="text-slate-300 mb-4 block">Estilo de Receta</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={() => { handleChange("template_style", "classic"); }}
                    className={`relative p-5 rounded-xl border-2 transition-all duration-300 text-left group ${
                      (formData.template_style || "classic") === "classic"
                        ? "border-teal-500 bg-teal-500/5 shadow-[0_0_20px_-5px_rgba(13,148,136,0.3)]"
                        : "border-slate-800 bg-slate-900/30 hover:border-slate-700"
                    }`}
                  >
                    {(formData.template_style || "classic") === "classic" && (
                      <div className="absolute top-2.5 right-2.5 w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                      </div>
                    )}
                    <div className="bg-white rounded-lg p-3 mb-3 h-24 flex flex-col justify-between">
                      <div className="flex justify-between">
                        <div>
                          <div className="w-20 h-1.5 bg-slate-800 rounded mb-1" />
                          <div className="w-14 h-1 bg-slate-300 rounded" />
                        </div>
                        <div className="text-right">
                          <div className="w-16 h-1.5 bg-slate-600 rounded mb-1 ml-auto" />
                          <div className="w-10 h-1 bg-teal-500 rounded ml-auto" />
                        </div>
                      </div>
                      <div className="border-t-2 border-teal-500" />
                      <div className="space-y-1">
                        <div className="flex gap-1"><div className="w-1 h-3 bg-teal-500 rounded" /><div className="w-24 h-1 bg-slate-300 rounded mt-1" /></div>
                        <div className="flex gap-1"><div className="w-1 h-3 bg-teal-500 rounded" /><div className="w-20 h-1 bg-slate-300 rounded mt-1" /></div>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-slate-200">Clásica</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Profesional con acento teal</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => { handleChange("template_style", "modern"); }}
                    className={`relative p-5 rounded-xl border-2 transition-all duration-300 text-left group ${
                      formData.template_style === "modern"
                        ? "border-blue-500 bg-blue-500/5 shadow-[0_0_20px_-5px_rgba(37,99,235,0.3)]"
                        : "border-slate-800 bg-slate-900/30 hover:border-slate-700"
                    }`}
                  >
                    {formData.template_style === "modern" && (
                      <div className="absolute top-2.5 right-2.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                      </div>
                    )}
                    <div className="bg-white rounded-lg p-3 mb-3 h-24 flex flex-col justify-between">
                      <div className="flex justify-between">
                        <div>
                          <div className="w-20 h-1.5 bg-slate-800 rounded mb-1" />
                          <div className="w-14 h-1 bg-blue-500 rounded" />
                        </div>
                        <div className="text-right">
                          <div className="w-16 h-1.5 bg-slate-600 rounded mb-1 ml-auto" />
                          <div className="w-12 h-1 bg-blue-400 rounded ml-auto" />
                        </div>
                      </div>
                      <div className="border-t-[3px] border-blue-500" />
                      <div className="space-y-1">
                        <div className="flex gap-1"><div className="w-1 h-3 bg-blue-500 rounded" /><div className="w-24 h-1 bg-slate-300 rounded mt-1" /></div>
                        <div className="flex gap-1"><div className="w-1 h-3 bg-blue-500 rounded" /><div className="w-20 h-1 bg-slate-300 rounded mt-1" /></div>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-slate-200">Moderna</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Diseño limpio con acento azul</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => { handleChange("template_style", "minimal"); }}
                    className={`relative p-5 rounded-xl border-2 transition-all duration-300 text-left group ${
                      formData.template_style === "minimal"
                        ? "border-slate-400 bg-slate-400/5 shadow-[0_0_20px_-5px_rgba(148,163,184,0.3)]"
                        : "border-slate-800 bg-slate-900/30 hover:border-slate-700"
                    }`}
                  >
                    {formData.template_style === "minimal" && (
                      <div className="absolute top-2.5 right-2.5 w-5 h-5 bg-slate-400 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                      </div>
                    )}
                    <div className="bg-white rounded-lg p-3 mb-3 h-24 flex flex-col justify-between">
                      <div className="flex justify-between">
                        <div>
                          <div className="w-20 h-1 bg-slate-400 rounded mb-1" />
                          <div className="w-14 h-0.5 bg-slate-200 rounded" />
                        </div>
                        <div className="text-right">
                          <div className="w-16 h-1 bg-slate-400 rounded mb-1 ml-auto" />
                          <div className="w-10 h-0.5 bg-slate-300 rounded ml-auto" />
                        </div>
                      </div>
                      <div className="border-t border-slate-200" />
                      <div className="space-y-1">
                        <div className="flex gap-1"><div className="w-0.5 h-3 bg-slate-300 rounded" /><div className="w-24 h-0.5 bg-slate-200 rounded mt-1.5" /></div>
                        <div className="flex gap-1"><div className="w-0.5 h-3 bg-slate-300 rounded" /><div className="w-20 h-0.5 bg-slate-200 rounded mt-1.5" /></div>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-slate-200">Minimalista</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Ultra limpia y elegante</p>
                  </button>
                </div>
              </div>

              <div>
                <Label className="text-slate-300 mb-4 block">Tamaño de Impresión</Label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => { handleChange("page_size", "full"); }}
                    className={`p-5 rounded-xl border-2 flex items-center gap-4 transition-all duration-300 ${
                      (formData.page_size || "full") === "full"
                        ? "border-teal-500 bg-teal-500/5"
                        : "border-slate-800 bg-slate-900/30 hover:border-slate-700"
                    }`}
                  >
                    <div className={`w-8 h-11 rounded border-2 ${(formData.page_size || "full") === "full" ? "border-teal-500 bg-teal-500/10" : "border-slate-700 bg-slate-800"}`} />
                    <div className="text-left">
                      <p className="text-sm font-medium text-slate-200">Hoja Completa</p>
                      <p className="text-[11px] text-slate-500">Tamaño carta estándar</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => { handleChange("page_size", "half"); }}
                    className={`p-5 rounded-xl border-2 flex items-center gap-4 transition-all duration-300 ${
                      formData.page_size === "half"
                        ? "border-teal-500 bg-teal-500/5"
                        : "border-slate-800 bg-slate-900/30 hover:border-slate-700"
                    }`}
                  >
                    <div className={`w-8 h-6 rounded border-2 ${formData.page_size === "half" ? "border-teal-500 bg-teal-500/10" : "border-slate-700 bg-slate-800"}`} />
                    <div className="text-left">
                      <p className="text-sm font-medium text-slate-200">Media Hoja</p>
                      <p className="text-[11px] text-slate-500">Receta compacta para recetarios</p>
                    </div>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live Preview */}
          <Card className="bg-slate-950/40 border-slate-800/60 backdrop-blur-xl shadow-lg ring-1 ring-white/5 overflow-hidden">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <CardTitle className="text-lg text-slate-200">Vista Previa de Receta</CardTitle>
                  <CardDescription className="text-slate-500">
                    Así se verá el encabezado y pie de tus recetas médicas.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {(() => {
                const tpl = formData.template_style || "classic";
                const accentColor = tpl === "modern" ? "#2563eb" : tpl === "minimal" ? "#94a3b8" : "#0d9488";
                const accentLight = tpl === "modern" ? "#3b82f6" : tpl === "minimal" ? "#64748b" : "#0d9488";
                const borderW = tpl === "modern" ? "3px" : tpl === "minimal" ? "0.5px" : "2px";
                const medBorderW = tpl === "modern" ? "3px" : tpl === "minimal" ? "0.5px" : "2px";
                const isHalf = formData.page_size === "half";
                return (
                  <div className={`bg-white rounded-xl shadow-inner max-w-2xl mx-auto transition-all duration-500 ${isHalf ? "p-6" : "p-8"}`}
                       style={{ aspectRatio: isHalf ? "8.5 / 5.5" : "8.5 / 11" }}>
                    <div className="flex justify-between items-start pb-3 mb-4" style={{ borderBottom: `${borderW} solid ${accentColor}` }}>
                      <div>
                        {formData.clinic_name ? (
                          <p className={`text-[#0f172a] font-bold ${isHalf ? "text-base" : "text-xl"}`}>{formData.clinic_name}</p>
                        ) : (
                          <p className={`text-[#0f172a] font-bold ${isHalf ? "text-base" : "text-xl"}`}>{formData.full_name || "Nombre del Médico"}</p>
                        )}
                        {formData.clinic_subtitle && (
                          <p className={`mt-1 ${tpl === "modern" ? "uppercase tracking-widest" : ""}`}
                             style={{ fontSize: isHalf ? 7 : 9, color: tpl === "modern" ? accentLight : "#64748b" }}>
                            {formData.clinic_subtitle}
                          </p>
                        )}
                        {(formData.clinic_phone || formData.clinic_email) && (
                          <p style={{ fontSize: isHalf ? 6 : 7, color: "#94a3b8", marginTop: 4 }}>
                            {formData.clinic_phone && `Tel: ${formData.clinic_phone}`}
                            {formData.clinic_phone && formData.clinic_email && "  |  "}
                            {formData.clinic_email}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        {formData.clinic_name && (
                          <p className={`text-[#0f172a] font-bold ${isHalf ? "text-xs" : "text-sm"}`}>{formData.full_name || "Nombre del Médico"}</p>
                        )}
                        {formData.specialty && (
                          <p className={`mt-0.5 ${tpl === "modern" ? "uppercase tracking-wider" : ""}`}
                             style={{ fontSize: isHalf ? 7 : 9, color: accentLight }}>
                            {formData.specialty}
                          </p>
                        )}
                        {formData.license_number && (
                          <p style={{ fontSize: isHalf ? 6 : 7, color: "#64748b", marginTop: 2 }}>Cédula: {formData.license_number}</p>
                        )}
                        {formData.university && (
                          <p style={{ fontSize: isHalf ? 6 : 7, color: "#64748b", marginTop: 1 }}>{formData.university}</p>
                        )}
                      </div>
                    </div>

                    <div className={`rounded flex gap-8 mb-4 ${tpl === "minimal" ? "border-b pb-2" : "border p-2"}`}
                         style={{ backgroundColor: tpl === "modern" ? "#eff6ff" : tpl === "minimal" ? "transparent" : "#f8fafc",
                                  borderColor: tpl === "modern" ? "#bfdbfe" : "#e2e8f0" }}>
                      <div>
                        <p style={{ fontSize: 6, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>Paciente</p>
                        <p style={{ fontSize: isHalf ? 8 : 9, color: "#1e293b", fontWeight: "bold" }}>Nombre del Paciente</p>
                      </div>
                      <div>
                        <p style={{ fontSize: 6, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>Fecha</p>
                        <p style={{ fontSize: isHalf ? 8 : 9, color: "#1e293b", fontWeight: "bold" }}>
                          {new Date().toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                      </div>
                    </div>

                    <p style={{ fontSize: isHalf ? 16 : 22, color: accentColor, fontWeight: "bold", marginBottom: 4 }}>Rx</p>
                    <div style={{ borderBottom: `${tpl === "minimal" ? "0.5px" : "1px"} solid #e2e8f0`, marginBottom: 8 }} />
                    <div style={{ paddingLeft: 6, borderLeft: `${medBorderW} solid ${accentColor}`, marginBottom: isHalf ? 12 : 24 }}>
                      <p style={{ fontSize: isHalf ? 8 : 10, color: "#0f172a", fontWeight: "bold" }}>1. Medicamento Ejemplo</p>
                      <p style={{ fontSize: isHalf ? 7 : 8, color: "#334155", marginTop: 2 }}>Dosis: 1 cada 8 horas</p>
                      <p style={{ fontSize: isHalf ? 6 : 7, color: "#64748b", marginTop: 2, fontStyle: "italic" }}>Instrucciones: Por 5 días después de alimento</p>
                    </div>

                    <div className="flex justify-end" style={{ marginTop: isHalf ? 8 : 24 }}>
                      <div className="text-center pt-2 w-40" style={{ borderTop: `${tpl === "minimal" ? "0.5px" : "1px"} solid ${tpl === "modern" ? accentColor : "#334155"}` }}>
                        <p style={{ fontSize: isHalf ? 8 : 9, color: "#0f172a", fontWeight: "bold" }}>{formData.full_name || "Nombre del Médico"}</p>
                        <p style={{ fontSize: isHalf ? 6 : 7, color: "#64748b", marginTop: 2 }}>
                          {formData.signature_label || [formData.specialty, formData.license_number && `Céd. ${formData.license_number}`].filter(Boolean).join(" - ") || "Médico"}
                        </p>
                      </div>
                    </div>

                    <div className="text-center" style={{ borderTop: `${tpl === "minimal" ? "0.5px" : "1px"} solid #e2e8f0`, marginTop: isHalf ? 8 : 24, paddingTop: 6 }}>
                      <p style={{ fontSize: isHalf ? 5 : 6, color: tpl === "minimal" ? "#cbd5e1" : "#94a3b8" }}>{formData.footer_text || "Esta receta es un documento médico oficial."}</p>
                      {(formData.clinic_address || formData.clinic_city || formData.clinic_state || formData.clinic_postal_code) && (
                        <p style={{ fontSize: isHalf ? 5 : 6, color: "#b0b8c4", marginTop: 2 }}>
                          {[
                            formData.clinic_address,
                            formData.clinic_city,
                            formData.clinic_state,
                            formData.clinic_postal_code ? `C.P. ${formData.clinic_postal_code}` : ""
                          ].filter(Boolean).join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agenda" className="space-y-8 focus:outline-none">
          {/* Card: Enlace de Reserva */}
          <Card className="bg-slate-950/40 border-slate-800/60 backdrop-blur-xl shadow-lg ring-1 ring-white/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-teal-500/10 flex items-center justify-center">
                  <Globe className="h-5 w-5 text-teal-500" />
                </div>
                <div>
                  <CardTitle className="text-lg text-slate-200">Enlace de Reserva Online</CardTitle>
                  <CardDescription className="text-slate-500">
                    Establece el enlace público que compartirás con tus pacientes para que se agenden en línea.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="text-slate-300">Enlace personalizado (Slug URL)</Label>
                <div className="flex items-center gap-2 max-w-lg">
                  <span className="text-slate-500 text-sm bg-slate-900/60 px-3 py-2.5 rounded-xl border border-slate-800/50 shrink-0">
                    {host}/dr/
                  </span>
                  <Input
                    placeholder="ej. dr-perez"
                    className="bg-slate-900/50 border-slate-800 focus-visible:ring-teal-500/50"
                    value={formData.slug || ""}
                    onChange={(e) => handleChange("slug", e.target.value)}
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Usa solo minúsculas, números y guiones. Mínimo 3 caracteres.
                </p>
              </div>

              {formData.slug && (
                <div className="p-4 bg-teal-950/20 border border-teal-500/15 rounded-xl flex items-center justify-between gap-4 max-w-xl">
                  <div className="overflow-hidden">
                    <p className="text-xs text-teal-400 font-medium">Tu agenda pública está activa en:</p>
                    <a
                      href={`/dr/${formData.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-slate-200 hover:text-teal-300 underline font-medium truncate block mt-0.5"
                    >
                      {publicLink}
                    </a>
                  </div>
                  <Button
                    type="button"
                    onClick={handleCopyLink}
                    variant="outline"
                    className="border-slate-800 text-slate-300 hover:bg-slate-900 rounded-xl"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-emerald-400 mr-2" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    {copied ? "Copiado!" : "Copiar"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card: Perfil Público */}
          <Card className="bg-slate-950/40 border-slate-800/60 backdrop-blur-xl shadow-lg ring-1 ring-white/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="text-lg text-slate-200">Perfil Público de Presentación</CardTitle>
                  <CardDescription className="text-slate-500">
                    Sube tu foto y escribe una breve biografía que verán tus pacientes al agendar.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Photo Upload */}
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="relative w-24 h-24 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                  {formData.profile_photo_url ? (
                    <img 
                      src={formData.profile_photo_url} 
                      alt="Doctor Perfil" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="h-8 w-8 text-slate-600" />
                  )}
                  {isUploadingPhoto && (
                    <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center">
                      <Loader2 className="h-5 w-5 text-teal-500 animate-spin" />
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label className="text-slate-300">Foto de Perfil</Label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl px-4 py-2 text-sm font-medium transition-colors">
                      <Upload className="h-4 w-4" />
                      Subir foto
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handlePhotoUpload}
                        disabled={isUploadingPhoto}
                      />
                    </label>
                    {formData.profile_photo_url && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleChange("profile_photo_url", "")}
                        className="border-red-500/20 text-red-400 hover:bg-red-500/10 rounded-xl text-xs py-2 h-auto"
                      >
                        Eliminar
                      </Button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Formatos admitidos: PNG, JPG, WEBP. Máximo 5MB.
                  </p>
                </div>
              </div>

              {/* Bio Description */}
              <div className="space-y-2">
                <Label className="text-slate-300">Biografía Profesional (Presentación)</Label>
                <Textarea
                  placeholder="Escribe una breve descripción sobre tu trayectoria, enfoque médico o mensaje de bienvenida..."
                  className="bg-slate-900/50 border-slate-800 focus-visible:ring-teal-500/50 min-h-[120px] resize-none"
                  value={formData.bio || ""}
                  onChange={(e) => handleChange("bio", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Card: Horarios de Atención */}
          <Card className="bg-slate-950/40 border-slate-800/60 backdrop-blur-xl shadow-lg ring-1 ring-white/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-violet-500" />
                </div>
                <div>
                  <CardTitle className="text-lg text-slate-200">Horarios de Atención Pública</CardTitle>
                  <CardDescription className="text-slate-500">
                    Define la duración de tus consultas y los días y horas que estarás disponible para citas online.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Duration select */}
              <div className="space-y-2 max-w-xs">
                <Label className="text-slate-300 flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-slate-500" />
                  Duración promedio de Consulta
                </Label>
                <select
                  value={formData.schedule_settings?.duration || 30}
                  onChange={(e) => handleDurationChange(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
                >
                  <option value="15">15 minutos</option>
                  <option value="20">20 minutos</option>
                  <option value="30">30 minutos</option>
                  <option value="45">45 minutos</option>
                  <option value="60">60 minutos</option>
                  <option value="90">90 minutos</option>
                </select>
              </div>

              <Separator className="border-slate-850" />

              {/* Days setup */}
              <div className="space-y-4">
                <Label className="text-slate-300 block mb-2">Días y Horarios Laborables</Label>
                <div className="space-y-3.5">
                  {DAYS_NAMES.map((day) => {
                    const daySettings = formData.schedule_settings?.days?.[day.id] || { active: false, start: "09:00", end: "18:00" };
                    return (
                      <div 
                        key={day.id} 
                        className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border transition-all duration-300 ${
                          daySettings.active 
                            ? "bg-slate-900/30 border-slate-800" 
                            : "bg-slate-950/20 border-slate-900 opacity-60"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id={`day-${day.id}`}
                            checked={daySettings.active}
                            onChange={(e) => handleScheduleDayToggle(day.id, e.target.checked)}
                            className="rounded border-slate-800 text-teal-600 focus:ring-teal-500/30 w-4 h-4"
                          />
                          <Label 
                            htmlFor={`day-${day.id}`} 
                            className="text-sm font-medium text-slate-200 cursor-pointer"
                          >
                            {day.name}
                          </Label>
                        </div>

                        {daySettings.active && (
                          <div className="flex items-center gap-3 self-end md:self-auto">
                            <span className="text-xs text-slate-500">Horario:</span>
                            <input
                              type="time"
                              value={daySettings.start}
                              onChange={(e) => handleScheduleTimeChange(day.id, "start", e.target.value)}
                              className="bg-slate-900 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
                            />
                            <span className="text-xs text-slate-600">a</span>
                            <input
                              type="time"
                              value={daySettings.end}
                              onChange={(e) => handleScheduleTimeChange(day.id, "end", e.target.value)}
                              className="bg-slate-900 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <Separator className="border-slate-850" />

              {/* Hora de Comida / Receso */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-slate-300 flex items-center gap-2 text-sm font-medium">
                      <Coffee className="h-4 w-4 text-teal-400" />
                      Hora de Receso / Comida
                    </Label>
                    <span className="text-xs text-slate-500 block">
                      Define un horario de descanso (ej. almuerzo) en el cual no se generarán citas disponibles.
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="break-enabled"
                      checked={formData.schedule_settings?.break_enabled || false}
                      onChange={(e) => handleBreakToggle(e.target.checked)}
                      className="rounded border-slate-800 text-teal-600 focus:ring-teal-500/30 w-4 h-4 bg-slate-900"
                    />
                    <Label
                      htmlFor="break-enabled"
                      className="text-xs font-medium text-slate-400 cursor-pointer"
                    >
                      Activar receso
                    </Label>
                  </div>
                </div>

                {formData.schedule_settings?.break_enabled && (
                  <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-800 bg-slate-900/30 w-full max-w-md animate-in fade-in slide-in-from-top-2 duration-200">
                    <span className="text-xs text-slate-500">Horario de receso:</span>
                    <input
                      type="time"
                      value={formData.schedule_settings?.break_start || "14:00"}
                      onChange={(e) => handleBreakTimeChange("break_start", e.target.value)}
                      className="bg-slate-900 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
                    />
                    <span className="text-xs text-slate-600">a</span>
                    <input
                      type="time"
                      value={formData.schedule_settings?.break_end || "15:00"}
                      onChange={(e) => handleBreakTimeChange("break_end", e.target.value)}
                      className="bg-slate-900 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card: Redes Sociales */}
          <Card className="bg-slate-950/40 border-slate-800/60 backdrop-blur-xl shadow-lg ring-1 ring-white/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Globe className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <CardTitle className="text-lg text-slate-200">Redes Sociales y Enlaces Externos</CardTitle>
                  <CardDescription className="text-slate-500">
                    Añade tus redes profesionales para que tus pacientes puedan contactarte por otros medios.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300 flex items-center gap-2">
                  <InstagramIcon className="h-4 w-4 text-pink-500" />
                  Instagram
                </Label>
                <Input
                  placeholder="https://instagram.com/tuperfil"
                  className="bg-slate-900/50 border-slate-800 focus-visible:ring-teal-500/50"
                  value={formData.social_links?.instagram || ""}
                  onChange={(e) => handleSocialChange("instagram", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300 flex items-center gap-2">
                  <FacebookIcon className="h-4 w-4 text-blue-600" />
                  Facebook
                </Label>
                <Input
                  placeholder="https://facebook.com/tuperfil"
                  className="bg-slate-900/50 border-slate-800 focus-visible:ring-teal-500/50"
                  value={formData.social_links?.facebook || ""}
                  onChange={(e) => handleSocialChange("facebook", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300 flex items-center gap-2">
                  <LinkedinIcon className="h-4 w-4 text-blue-500" />
                  LinkedIn
                </Label>
                <Input
                  placeholder="https://linkedin.com/in/tuperfil"
                  className="bg-slate-900/50 border-slate-800 focus-visible:ring-teal-500/50"
                  value={formData.social_links?.linkedin || ""}
                  onChange={(e) => handleSocialChange("linkedin", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-emerald-500" />
                  WhatsApp Directo (Para mensajes directos de pacientes)
                </Label>
                <Input
                  placeholder="Ej. +52 1 921 175 6673"
                  className="bg-slate-900/50 border-slate-800 focus-visible:ring-teal-500/50"
                  value={formData.social_links?.whatsapp || ""}
                  onChange={(e) => handleSocialChange("whatsapp", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-slate-400" />
                  Sitio Web Personal / Otro Enlace
                </Label>
                <Input
                  placeholder="https://tupaginaweb.com"
                  className="bg-slate-900/50 border-slate-800 focus-visible:ring-teal-500/50"
                  value={formData.social_links?.website || ""}
                  onChange={(e) => handleSocialChange("website", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Card: Galería de Imágenes y Flyers */}
          <Card className="bg-slate-950/40 border-slate-800/60 backdrop-blur-xl shadow-lg ring-1 ring-white/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-teal-500/10 flex items-center justify-center">
                    <Image className="h-5 w-5 text-teal-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-slate-200">Galería de Imágenes y Flyers</CardTitle>
                    <CardDescription className="text-slate-500">
                      Sube flyers informativos, fotos de tu consultorio o certificaciones (máximo 9 imágenes).
                    </CardDescription>
                  </div>
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  {(formData.gallery_images || []).length} / 9 fotos
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Grid of images */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {(formData.gallery_images || []).map((url, index) => (
                  <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-slate-900 border border-slate-800 group">
                    <img
                      src={url}
                      alt={`Galería ${index + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveGalleryImage(index)}
                        className="p-2 rounded-lg bg-red-600/80 hover:bg-red-700 text-white transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                
                {/* Upload button card */}
                {(formData.gallery_images || []).length < 9 && (
                  <label className="relative aspect-square rounded-xl border border-dashed border-slate-800 hover:border-teal-500/50 bg-slate-900/20 hover:bg-slate-900/40 flex flex-col items-center justify-center cursor-pointer gap-2 transition-all duration-300 group">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-850 group-hover:border-teal-500/20 group-hover:bg-slate-800/50 transition-all">
                      {isUploadingGallery ? (
                        <Loader2 className="h-5 w-5 text-teal-500 animate-spin" />
                      ) : (
                        <Plus className="h-5 w-5 text-slate-400 group-hover:text-teal-400 transition-colors" />
                      )}
                    </div>
                    <span className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors font-medium">
                      {isUploadingGallery ? "Subiendo..." : "Agregar Foto"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleGalleryUpload}
                      disabled={isUploadingGallery}
                    />
                  </label>
                )}
              </div>
              
              <p className="text-[11px] text-slate-600">
                Formatos admitidos: PNG, JPG, WEBP. Cada archivo debe ser menor a 5MB. Puedes seleccionar varias imágenes a la vez.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teleconsulta" className="space-y-8 focus:outline-none">
          {/* Card: Teleconsulta */}
          <Card className="bg-slate-950/40 border-slate-800/60 backdrop-blur-xl shadow-lg ring-1 ring-white/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-teal-500/10 flex items-center justify-center">
                    <Video className="h-5 w-5 text-teal-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-slate-200">Teleconsulta Médica (Videollamadas)</CardTitle>
                    <CardDescription className="text-slate-500">
                      Habilita la atención a distancia mediante salas seguras de Jitsi Meet (100% gratuito y sin costo extra).
                    </CardDescription>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={formData.teleconsulta_enabled || false}
                    onChange={(e) => handleChange("teleconsulta_enabled", e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                </label>
              </div>
            </CardHeader>
            {formData.teleconsulta_enabled && (
              <CardContent className="space-y-6 pt-0">
                <Separator className="bg-slate-800/60 mb-6" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Costo por Teleconsulta (MXN)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-500 text-sm">$</span>
                      <Input
                        type="number"
                        placeholder="Ej. 600"
                        className="bg-slate-900/50 border-slate-800 focus-visible:ring-teal-500/50 pl-7"
                        value={formData.teleconsulta_price || ""}
                        onChange={(e) => handleChange("teleconsulta_price", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Esta tarifa se le mostrará y cobrará (si los cobros están activos) al paciente que elija la modalidad online.
                    </p>
                  </div>
                  
                  <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-center">
                    <h4 className="text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-teal-500"></span>
                      Salas Privadas y Encriptadas
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Al programarse una teleconsulta, NERVE genera de forma automatizada un enlace seguro de Jitsi Meet. El paciente lo recibirá por WhatsApp y tú podrás unirte directamente desde tu agenda.
                    </p>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Card: Stripe Connect & Datos Bancarios */}
          <Card className="bg-slate-950/40 border-slate-800/60 backdrop-blur-xl shadow-lg ring-1 ring-white/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-teal-500/10 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-teal-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-slate-200">Depósito Directo e Internacionalización (Stripe)</CardTitle>
                    <CardDescription className="text-slate-500">
                      Configura tu país de operación, divisa, y la cuenta de banco para recibir pagos automáticos de tus pacientes.
                    </CardDescription>
                  </div>
                </div>
                {formData.stripe_onboarding_completed ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span className="text-xs font-medium text-emerald-400">Depósitos Activos</span>
                    </div>
                    <Button
                      type="button"
                      disabled={isOpeningPortal}
                      onClick={handleOpenStripePortal}
                      className="h-8 px-3 rounded-lg bg-teal-600/10 border border-teal-500/20 text-teal-400 hover:bg-teal-600/20 hover:text-teal-300 text-xs font-medium flex items-center gap-1.5 transition-all"
                    >
                      {isOpeningPortal ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ExternalLink className="h-3.5 w-3.5" />
                      )}
                      Ver Balance y Banco (Stripe)
                    </Button>
                  </div>
                ) : formData.stripe_account_id ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 animate-pulse">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
                    <span className="text-xs font-medium text-amber-400">Falta Verificación Stripe</span>
                  </div>
                ) : (
                  <div className="px-3 py-1.5 rounded-full bg-slate-500/10 border border-slate-500/20">
                    <span className="text-xs font-medium text-slate-400">Pago Local / Presencial</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveBankSetup} className="space-y-6">
                
                {/* 1. Internacionalización y Localización */}
                <div className="bg-slate-900/20 border border-slate-850 rounded-xl p-4 space-y-4">
                  <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-teal-500" />
                    País de Operación y Divisa
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-400 text-xs font-medium">País de la Clínica</Label>
                      <Select 
                        value={formData.country_code || "MX"} 
                        onValueChange={(val) => {
                          const conf = getCountryConfig(val);
                          setFormData(prev => ({
                            ...prev,
                            country_code: val,
                            currency: conf.currency
                          }));
                          setHasChanges(true);
                        }}
                      >
                        <SelectTrigger className="bg-slate-900/50 border-slate-800 focus-visible:ring-teal-500/50">
                          <SelectValue placeholder="Selecciona un país" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-950 border-slate-850 max-h-[220px] overflow-y-auto w-[250px] max-w-[90vw]">
                          {Object.values(COUNTRIES).map((c) => (
                            <SelectItem key={c.code} value={c.code} className="hover:bg-slate-900 focus:bg-slate-900 text-slate-200">
                              {c.name} (Lada +{c.phonePrefix})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[11px] text-slate-500">
                        Define el prefijo internacional de tus notificaciones y tu divisa.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-400 text-xs font-medium">Divisa Principal</Label>
                      <Input
                        className="bg-slate-900/20 border-slate-800 text-slate-400 select-none"
                        value={`${formData.currency || "MXN"} (${getCountryConfig(formData.country_code).symbol})`}
                        disabled
                      />
                      <p className="text-[11px] text-slate-500">
                        La divisa se ajusta automáticamente según el país del consultorio.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Modalidad de Cobro al Reservar */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Modalidad de Pago para Pacientes</Label>
                    <Select 
                      value={formData.payment_mode || "ninguno"} 
                      onValueChange={(val: any) => {
                        setFormData(prev => ({
                          ...prev,
                          payment_mode: val,
                          // Si es ninguno, reseteamos el anticipo
                          anticipo_amount: val === 'ninguno' ? 0 : prev.anticipo_amount
                        }));
                        setHasChanges(true);
                      }}
                    >
                      <SelectTrigger className="bg-slate-900/50 border-slate-800 focus-visible:ring-teal-500/50">
                        <SelectValue placeholder="Selecciona el tipo de cobro" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-950 border-slate-850 w-[350px] max-w-[90vw]">
                        <SelectItem value="ninguno" className="hover:bg-slate-900 focus:bg-slate-900 text-slate-200">Pago presencial / gratis al agendar</SelectItem>
                        <SelectItem value="anticipo" className="hover:bg-slate-900 focus:bg-slate-900 text-slate-200">Cobrar un anticipo o garantía de reserva</SelectItem>
                        <SelectItem value="completo" className="hover:bg-slate-900 focus:bg-slate-900 text-slate-200">Cobrar la consulta completa al agendar</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-slate-500">
                      Decide si tus pacientes pagan anticipo, el total o pagan en efectivo el día de la cita.
                    </p>
                  </div>

                  {formData.payment_mode === "anticipo" && (
                    <div className="space-y-2">
                      <Label className="text-slate-300">Monto del Anticipo ({formData.currency || "MXN"})</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-slate-500 text-sm">
                          {getCountryConfig(formData.country_code).symbol}
                        </span>
                        <Input
                          type="number"
                          placeholder="Ej. 150"
                          className="bg-slate-900/50 border-slate-800 focus-visible:ring-teal-500/50 pl-7"
                          value={formData.anticipo_amount || ""}
                          onChange={(e) => {
                            handleChange("anticipo_amount", parseFloat(e.target.value) || 0);
                          }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Monto parcial que el paciente debe liquidar con tarjeta para agendar.
                      </p>
                    </div>
                  )}
                </div>

                {/* 3. Datos de Cuenta de Depósitos Bancarios (Conectada a Stripe Connect) */}
                {formData.payment_mode !== "ninguno" && (
                  <div className="bg-slate-900/10 border border-slate-850 rounded-xl p-5 space-y-4 pt-4">
                    <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-teal-500" />
                      Cuenta para Depósitos Automáticos
                    </h4>

                    {/* Tarjeta de ayuda premium sobre Instant Payouts y Comisiones */}
                    <div className="p-4 bg-teal-950/20 border border-teal-500/15 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-teal-400">
                        <TrendingUp className="h-4 w-4 text-teal-400" />
                        ¿Quieres recibir tus ganancias al instante?
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Para recibir los depósitos de tus consultas de forma **inmediata (en menos de 5 minutos)** tras el pago del paciente, ingresa los **16 dígitos de tu tarjeta de débito** en el campo de cuenta bancaria. Si prefieres usar una cuenta CLABE tradicional de 18 dígitos, las transferencias se procesarán automáticamente de forma diaria (tardando de 24 a 48 horas hábiles).
                      </p>
                      <p className="text-[11px] text-teal-500/80 font-medium">
                        * NERVE descuenta automáticamente una comisión fija de $20 MXN por cada consulta cobrada mediante la plataforma.
                      </p>
                      <p className="text-[10px] text-amber-400/90 font-light mt-1 pt-1 border-t border-teal-500/10">
                        ⚠️ **Nota de Stripe:** Por regulaciones bancarias de seguridad, el **primer depósito** de tu cuenta puede tardar de 7 a 14 días en validarse. Los depósitos posteriores se liquidarán de forma inmediata en minutos (tarjeta) o diaria (CLABE).
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-400 text-xs">Nombre Completo del Titular</Label>
                        <Input
                          placeholder="Como aparece en el banco"
                          className="bg-slate-900/50 border-slate-800 focus-visible:ring-teal-500/50"
                          value={formData.bank_beneficiary_name || ""}
                          onChange={(e) => handleChange("bank_beneficiary_name", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-400 text-xs">Identificación Fiscal / RFC</Label>
                        <Input
                          placeholder="Ej. VECJ880326XXX o Tax ID"
                          className="bg-slate-900/50 border-slate-800 focus-visible:ring-teal-500/50"
                          value={formData.bank_rfc || ""}
                          onChange={(e) => handleChange("bank_rfc", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-400 text-xs">Nombre de tu Banco</Label>
                        <Input
                          placeholder="Ej. BBVA, Bancolombia, Chase"
                          className="bg-slate-900/50 border-slate-800 focus-visible:ring-teal-500/50"
                          value={formData.bank_name || ""}
                          onChange={(e) => handleChange("bank_name", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-400 text-xs">
                          {formData.country_code === 'MX' ? 'Tarjeta de Débito (16 dígitos) o CLABE (18 dígitos)' : 'Número de Cuenta / IBAN'}
                        </Label>
                        <Input
                          placeholder={formData.country_code === 'MX' ? 'Ingresa tus 16 dígitos de tarjeta de débito o 18 dígitos de CLABE' : 'Ingresa tu número de cuenta internacional'}
                          className="bg-slate-900/50 border-slate-800 focus-visible:ring-teal-500/50 font-mono"
                          value={formData.bank_account_clabe || ""}
                          onChange={(e) => handleChange("bank_account_clabe", e.target.value.replace(/\s/g, ''))}
                        />
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed border-t border-slate-850 pt-3">
                      🔒 <strong>Seguridad Stripe:</strong> Los depósitos se dispersan directamente y de forma segura a través de Stripe Connect a tu tarjeta o cuenta registrada en un periodo de 5 minutos (tarjeta) o 24-48 horas hábiles (CLABE).
                    </p>
                  </div>
                )}

                {/* 4. Desglose de Tarifas Dinámico */}
                {formData.payment_mode !== "ninguno" && (
                  <div className="bg-slate-900/30 border border-slate-800/60 rounded-xl p-5 space-y-3">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Desglose de Tarifas por Consulta</h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>Monto cobrado al Paciente:</span>
                        <span className="font-semibold text-slate-200">
                          {formatPrice(formData.payment_mode === 'anticipo' ? (formData.anticipo_amount || 0) : (formData.presencial_price || 0), formData.country_code)}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Comisión fija NERVE:</span>
                        <span className="text-red-400">
                          -{formatPrice(getCountryConfig(formData.country_code).fee, formData.country_code)}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Tarifa de procesamiento de Tarjeta (Stripe):</span>
                        <span className="text-red-400">
                          -{formatPrice(
                            ((formData.payment_mode === 'anticipo' ? (formData.anticipo_amount || 0) : (formData.presencial_price || 0)) * 0.036 + (formData.country_code === 'MX' ? 3 : 0.3)),
                            formData.country_code
                          )}
                        </span>
                      </div>
                      <Separator className="bg-slate-800/60 my-2" />
                      <div className="flex justify-between text-slate-200 font-semibold">
                        <span>Depósito neto estimado en tu banco:</span>
                        <span className="text-emerald-400">
                          {formatPrice(
                            Math.max(0, 
                              (formData.payment_mode === 'anticipo' ? (formData.anticipo_amount || 0) : (formData.presencial_price || 0))
                              - getCountryConfig(formData.country_code).fee 
                              - ((formData.payment_mode === 'anticipo' ? (formData.anticipo_amount || 0) : (formData.presencial_price || 0)) * 0.036 + (formData.country_code === 'MX' ? 3 : 0.3))
                            ),
                            formData.country_code
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {formData.stripe_account_id && !formData.stripe_onboarding_completed && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-amber-400">Verificación de Cuenta Requerida</h4>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          Stripe Connect requiere que completes la verificación de identidad (KYC) y dirección oficial para habilitar cargos a tus pacientes y transferir el dinero de forma segura a tu cuenta bancaria.
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end pt-1">
                      <Button
                        type="button"
                        onClick={handleSaveBankSetup}
                        className="px-4 py-2 text-xs bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 rounded-lg flex items-center gap-1.5 transition-colors"
                      >
                        <Globe className="h-3.5 w-3.5" />
                        Completar Verificación Oficial en Stripe
                      </Button>
                    </div>
                  </div>
                )}

                {/* Botón de Guardado */}
                <div className="flex justify-end pt-4">
                  <Button
                    type="submit"
                    disabled={isSavingBank}
                    className="px-6 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium flex items-center justify-center gap-2 h-11 transition-all shadow-[0_0_20px_-5px_rgba(13,148,136,0.3)]"
                  >
                    {isSavingBank ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Guardando y Activando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Guardar Configuración de Pagos
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
