"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  CreditCard, 
  Calendar, 
  ShieldCheck, 
  AlertTriangle, 
  Loader2, 
  XCircle, 
  CheckCircle2, 
  ArrowRight,
  Activity,
  FileText,
  BadgeAlert
} from "lucide-react";
import { toast } from "sonner";
import { getCountryConfig, formatPrice } from "@/lib/international";

export default function SuscripcionPage() {
  const router = useRouter();
  const { userProfile, clinic, isLoading: authLoading } = useAuth();
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  if (authLoading) {
    return (
      <div className="flex-1 flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 text-teal-500 animate-spin" />
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
        <XCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">No se encontró información de la clínica</h2>
        <p className="text-slate-400 max-w-sm">
          Asegúrate de haber completado la configuración inicial de tu clínica.
        </p>
      </div>
    );
  }

  const status = clinic.subscription_status || "trialing";
  const tier = clinic.subscription_tier || "solo";
  const mpSubscriptionId = clinic.mp_subscription_id;

  const countryCode = clinic.country_code || "MX";
  const config = getCountryConfig(countryCode);

  // Plan Details Configuration
  const planInfo = {
    solo: {
      name: "Doctor Solo",
      price: formatPrice(config.monthlySolo, countryCode),
      description: "Ideal para médicos independientes con consultorio único."
    },
    pro: {
      name: "Clínica Pro",
      price: formatPrice(config.monthlyClinic, countryCode),
      description: "Potencia para clínicas medianas con múltiples doctores y asistentes."
    },
    enterprise: {
      name: "Enterprise",
      price: "Personalizado",
      description: "Plataforma adaptada a hospitales o redes de consultorios de gran escala."
    }
  }[tier] || {
    name: tier.toUpperCase(),
    price: "N/A",
    description: "Plan actual de la clínica."
  };

  const statusMap = {
    active: {
      label: "Activa",
      color: "text-green-400 bg-green-500/10 border-green-500/20",
      icon: CheckCircle2
    },
    trialing: {
      label: "Prueba Gratuita",
      color: "text-teal-400 bg-teal-500/10 border-teal-500/20",
      icon: Activity
    },
    canceled: {
      label: "Cancelada",
      color: "text-red-400 bg-red-500/10 border-red-500/20",
      icon: XCircle
    },
    expired: {
      label: "Expirada",
      color: "text-red-400 bg-red-500/10 border-red-500/20",
      icon: BadgeAlert
    },
    past_due: {
      label: "Pago Pendiente",
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      icon: AlertTriangle
    }
  };

  const statusConfig = statusMap[status as keyof typeof statusMap] || {
    label: status.toUpperCase(),
    color: "text-slate-400 bg-slate-500/10 border-slate-500/20",
    icon: Activity
  };

  const StatusIcon = statusConfig.icon;

  const handleCancelSubscription = async () => {
    setCancelling(true);
    toast.loading("Procesando cancelación de suscripción...", { id: "cancel-toast" });

    try {
      const response = await fetch("/api/checkout/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Suscripción cancelada exitosamente", { id: "cancel-toast" });
        setIsCancelConfirmOpen(false);
        // Force reload page to refresh auth state
        window.location.reload();
      } else {
        throw new Error(data.error || "Fallo al cancelar la suscripción");
      }
    } catch (err: any) {
      toast.error(err.message || "Error al procesar la cancelación", { id: "cancel-toast" });
    } finally {
      setCancelling(false);
    }
  };

  const formattedPeriodEnd = clinic.current_period_end 
    ? new Date(clinic.current_period_end).toLocaleDateString("es-MX", {
        day: "numeric",
        month: "long",
        year: "numeric"
      })
    : "No definida";

  return (
    <div className="space-y-8 max-w-4xl mx-auto w-full pt-4 pb-20 animate-in fade-in duration-500">
      
      {/* Encabezado */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Suscripción y Facturación
        </h1>
        <p className="text-slate-400 mt-1">Administra el plan de tu consultorio médico y los detalles de facturación.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Columna Principal - Detalles del Plan */}
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-slate-950/40 border-slate-800/60 backdrop-blur-xl shadow-lg ring-1 ring-white/5 overflow-hidden">
            <CardHeader className="border-b border-white/5 bg-slate-900/20 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-medium text-white flex items-center gap-2">
                    Detalles del Plan Actual
                  </CardTitle>
                  <CardDescription className="text-slate-400 mt-1">
                    Información sobre los cobros y nivel de servicio actual.
                  </CardDescription>
                </div>
                {/* Badge de Estado */}
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold w-fit self-start sm:self-center ${statusConfig.color}`}>
                  <StatusIcon className="h-3.5 w-3.5" />
                  {statusConfig.label}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Plan Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-slate-800/40">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Plan contratado</p>
                  <p className="text-lg font-semibold text-white mt-1">Plan NERVE {planInfo.name}</p>
                  <p className="text-xs text-slate-400 mt-1">{planInfo.description}</p>
                </div>
                <div className="sm:text-right">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Costo mensual</p>
                  <p className="text-xl font-bold text-white mt-1">{planInfo.price}</p>
                  <p className="text-xs text-slate-400 mt-1">Cobros recurrentes mensuales</p>
                </div>
              </div>

              {/* Expiration / Next Billing Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-slate-800/40">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-teal-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400 font-medium">
                      {status === "active" ? "Próxima fecha de cobro" : status === "trialing" ? "Fin del período de prueba" : "Fin del ciclo de facturación"}
                    </p>
                    <p className="text-sm font-semibold text-slate-200 mt-1">{formattedPeriodEnd}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CreditCard className="h-5 w-5 text-teal-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Método de pago registrado</p>
                    <p className="text-sm font-semibold text-slate-200 mt-1">
                      {status === "active" ? "Tarjeta bancaria" : "Ninguno"}
                    </p>
                    {status === "active" && (
                      <p className="text-[10px] text-slate-500 mt-0.5">Potenciado y encriptado por Mercado Pago</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Mercado Pago ID Reference */}
              {mpSubscriptionId && (
                <div className="bg-slate-900/40 rounded-xl p-4 border border-slate-800/50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-400">
                    <FileText className="h-4 w-4 text-slate-500" />
                    <span>ID de Suscripción:</span>
                    <code className="text-slate-300 font-mono select-all">{mpSubscriptionId}</code>
                  </div>
                  <span className="text-[9px] uppercase tracking-wider font-bold text-slate-600 bg-slate-900 px-2 py-0.5 rounded-md">
                    PCI-DSS
                  </span>
                </div>
              )}

              {/* Acciones principales */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 pt-2">
                {status === "active" ? (
                  <Button
                    variant="ghost"
                    onClick={() => setIsCancelConfirmOpen(true)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 font-medium h-10 px-4 rounded-xl border border-red-500/20"
                  >
                    Cancelar Suscripción
                  </Button>
                ) : (
                  <Button
                    onClick={() => router.push("/dashboard/checkout")}
                    className="bg-teal-600 hover:bg-teal-500 text-white font-semibold h-10 px-5 rounded-xl transition-all shadow-lg shadow-teal-600/20 hover:shadow-teal-500/30 flex items-center gap-2"
                  >
                    Activar o Cambiar de Plan
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna Lateral - Información Adicional / Transparencia */}
        <div className="space-y-6">
          <Card className="bg-slate-950/60 border-slate-800/80 backdrop-blur-xl shadow-2xl">
            <CardHeader>
              <CardTitle className="text-white text-md flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-400" />
                Garantías NERVE
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-400 space-y-4">
              <p>
                <strong>¿Cuándo se me cobra?</strong><br />
                Los cobros se efectúan de manera mensual exactamente el mismo día en que realizaste la contratación.
              </p>
              <p>
                <strong>¿Cómo cancelar?</strong><br />
                Puedes cancelar tu plan en cualquier momento sin costo adicional ni plazos forzosos de permanencia.
              </p>
              <p>
                <strong>Aislamiento de Información (RLS)</strong><br />
                Aunque tu suscripción expire, tu base de datos y expedientes se mantendrán aislados de manera segura de acuerdo a nuestras políticas de privacidad.
              </p>
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Modal Confirmación de Cancelación */}
      <Dialog open={isCancelConfirmOpen} onOpenChange={setIsCancelConfirmOpen}>
        <DialogContent className="sm:max-w-[480px] bg-slate-950 border-slate-800 text-slate-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-medium text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              ¿Confirmas la cancelación?
            </DialogTitle>
            <DialogDescription className="text-slate-400 mt-2 leading-relaxed">
              Estás a punto de cancelar tu suscripción recurrente al plan <span className="text-white font-semibold">{planInfo.name}</span>.
              <br /><br />
              <strong>¿Qué pasará después?</strong>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-400 text-xs">
                <li>Se cancelarán los cobros automáticos en Mercado Pago.</li>
                <li>Podrás seguir usando las funciones completas de NERVE hasta el fin del ciclo actual: <span className="text-slate-300 font-semibold">{formattedPeriodEnd}</span>.</li>
                <li>Posterior a esta fecha, el acceso a la agenda y los expedientes clínicos se bloqueará temporalmente hasta reactivar tu plan.</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex items-center gap-3">
            <Button
              variant="ghost"
              disabled={cancelling}
              onClick={() => setIsCancelConfirmOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              Mantener Suscripción
            </Button>
            <Button
              disabled={cancelling}
              onClick={handleCancelSubscription}
              className="bg-red-600 hover:bg-red-500 text-white"
            >
              {cancelling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelando...
                </>
              ) : (
                "Sí, Cancelar Plan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
