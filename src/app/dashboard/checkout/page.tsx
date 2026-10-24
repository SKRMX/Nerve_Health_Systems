"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Shield, Lock, CreditCard, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCountryConfig, formatPrice } from "@/lib/international";
import { initiateSubscription, getPlatform } from "@/lib/payments/platform-billing";

export default function CheckoutPage() {
  const router = useRouter();
  const { clinic, isLoading } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const currentPlatform = getPlatform();

  if (isLoading || !clinic) {
    return (
      <div className="flex-grow flex flex-col justify-center items-center h-[60vh] text-slate-400 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
        <p className="text-sm">Iniciando pasarela de pago segura...</p>
      </div>
    );
  }

  const countryCode = clinic.country_code || "MX";
  const config = getCountryConfig(countryCode);

  const isClinicPlan = clinic.subscription_tier === 'pro';
  const priceAmount = isClinicPlan ? config.monthlyClinic : config.monthlySolo;
  const planName = isClinicPlan ? 'Clínica Pro' : 'Doctor Solo';

  const handleCheckout = async () => {
    if (!acceptTerms) {
      toast.error("Debes aceptar los términos y el aviso de privacidad");
      return;
    }

    setProcessing(true);
    const toastId = toast.loading(`Iniciando activación (${currentPlatform === 'web' ? 'Stripe' : currentPlatform.toUpperCase()})...`);

    try {
      const result = await initiateSubscription(isClinicPlan ? 'pro' : 'solo');

      if (result.success) {
        toast.success(result.message || "Redirigiendo a pasarela nativa...", { id: toastId });
      } else {
        throw new Error(result.message || "No se pudo iniciar el checkout seguro");
      }
    } catch (error: any) {
      toast.error("Error al procesar", { 
        id: toastId, 
        description: error.message || "Inténtalo de nuevo."
      });
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row gap-8 max-w-5xl mx-auto w-full pt-8 animate-in fade-in duration-500 pb-20 px-4">
      
      {/* Resumen del Pedido */}
      <div className="w-full md:w-1/3 order-2 md:order-1">
        <Card className="bg-slate-950/60 border-slate-800/80 backdrop-blur-xl shadow-2xl sticky top-8">
          <CardHeader>
            <CardTitle className="text-white text-lg flex items-center gap-2">
              Resumen de suscripción
            </CardTitle>
            <CardDescription className="text-slate-400">
              Pago recurrente mensual
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <p className="font-medium text-slate-200">Plan NERVE {planName}</p>
                <p className="text-xs text-slate-500 mt-1">{clinic.name}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-white">{formatPrice(priceAmount, countryCode)}</p>
                <p className="text-xs text-slate-500 mt-1">/mes</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400">
              <Shield className="w-5 h-5 text-teal-500 shrink-0" />
              <p>Tu clínica estará protegida por políticas de aislamiento de información (RLS), copias de seguridad continuas y cifrado de seguridad.</p>
            </div>
            
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <Lock className="w-5 h-5 text-teal-500 shrink-0" />
              <p>Cancela tu suscripción en cualquier momento de forma directa desde tu panel. Sin plazos forzosos.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Formulario de Checkout Seguro de Stripe */}
      <div className="w-full md:w-2/3 order-1 md:order-2">
        <div className="bg-[#020617] border border-slate-800/80 rounded-xl p-0 shadow-lg min-h-[380px] flex flex-col justify-between">
          <div>
            <div className="p-6 border-b border-slate-800 flex items-center gap-3 bg-slate-950/50 rounded-t-xl">
              <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-400">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-medium text-white">Activación Segura</h2>
                <p className="text-xs text-slate-400">Tus datos están encriptados y procesados por Stripe de manera oficial</p>
              </div>
            </div>
            
            <div className="p-8 space-y-6 text-center">
              <div className="max-w-md mx-auto space-y-4">
                <p className="text-slate-400 text-sm leading-relaxed">
                  Estás a un paso de activar tu plan <strong>NERVE {planName}</strong>. El procesamiento de cobro recurrente mensual se realiza de forma 100% segura por Stripe.
                </p>
                
                <div className="bg-slate-900/30 border border-slate-850 rounded-xl p-4 text-left">
                  <h4 className="text-xs font-semibold text-slate-300 mb-2">Detalles del cobro:</h4>
                  <ul className="text-xs text-slate-500 space-y-1.5 list-disc pl-4">
                    <li>Monto mensual: <strong className="text-slate-300">{formatPrice(priceAmount, countryCode)}</strong></li>
                    <li>Soporta pagos con Tarjeta de Crédito, Débito y monederos autorizados.</li>
                    <li>Renovación automática mensual con cargo a la tarjeta registrada.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-slate-800/50">
            <div className="flex items-start gap-2 pt-1 mb-4 max-w-md mx-auto text-left">
              <input
                type="checkbox"
                id="accept-checkout-terms"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-800 bg-slate-900/50 text-teal-600 focus:ring-teal-500 focus:ring-offset-slate-950 accent-teal-500 cursor-pointer"
              />
              <label htmlFor="accept-checkout-terms" className="text-xs text-slate-400 leading-normal cursor-pointer select-none">
                Acepto expresamente los <a href="/legal/terminos" target="_blank" className="text-teal-400 hover:text-teal-300 transition-colors underline font-medium">Términos de Servicio</a> y el <a href="/legal/privacidad" target="_blank" className="text-teal-400 hover:text-teal-300 transition-colors underline font-medium">Aviso de Privacidad</a> de NERVE, incluyendo la facturación y cobro automático mensual recurrente.
              </label>
            </div>
            
            <Button
              onClick={handleCheckout}
              disabled={processing}
              className="w-full md:max-w-md mx-auto px-6 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium flex items-center justify-center gap-2 h-12 transition-all shadow-[0_0_20px_-5px_rgba(13,148,136,0.3)]"
            >
              {processing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Redirigiendo a pasarela...
                </>
              ) : (
                <>
                  Proceder al Pago Seguro con Stripe
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </Button>
            
            <p className="text-[10px] text-slate-500 leading-relaxed uppercase tracking-widest mt-6 text-center">
              Protegido y potenciado por Stripe Connect
            </p>
            <p className="text-[10px] text-slate-600 leading-relaxed mt-2 max-w-sm mx-auto text-center">
              Al procesar este pago, aceptas nuestros Términos y Condiciones y Políticas de Privacidad. Tu método de pago será guardado de manera encriptada por Stripe para cobros recurrentes mensuales.
            </p>
          </div>
        </div>
        
        <p className="text-center text-[10px] text-slate-600 mt-6 font-medium tracking-widest uppercase">
          NERVE Health Systems PCI-DSS Compliant Gateway
        </p>
      </div>
    </div>
  );
}
