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
import { Loader2, Building2, UserRound, Check, ArrowLeft, ArrowRight, GraduationCap, Phone, MapPin, BadgeCheck, Eye, EyeOff } from "lucide-react";
import { useSearchParams } from "next/navigation";

type PlanType = "solo" | "clinic";

import React from "react";

function RegistroContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPlan = searchParams.get("plan");
  const [step, setStep] = useState<1 | 2 | 3>(preselectedPlan ? 2 : 1);
  const [plan, setPlan] = useState<PlanType>(preselectedPlan === "clinica" ? "clinic" : "solo");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    clinic_name: "",
    specialty: "",
    phone: "",
    license_number: "",
    university: "",
    clinic_address: "",
  });

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!acceptTerms) {
      setError("Debes aceptar los Términos de Servicio y el Aviso de Privacidad");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setIsLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            role: "admin",
          }
        }
      });

      if (authError) { setError(authError.message); setIsLoading(false); return; }
      if (!authData.user) { setError("Error inesperado al crear la cuenta"); setIsLoading(false); return; }

      const clinicName = plan === "clinic"
        ? formData.clinic_name
        : formData.clinic_name || `Consultorio ${formData.full_name.split(' ').slice(0, 2).join(' ')}`;

      const nameParts = formData.full_name
        .replace(/^(Dr\.|Dra\.|Dr|Dra)\s+/i, '')
        .trim().split(' ').filter(Boolean);
      const firstName = nameParts[0] || formData.full_name;
      const lastName = nameParts.slice(1).join(' ') || "";

      const { data: rpcData, error: rpcError } = await supabase.rpc('register_tenant', {
        p_user_id: authData.user.id,
        p_email: formData.email,
        p_first_name: firstName,
        p_last_name: lastName,
        p_role: "admin",
        p_clinic_name: clinicName,
        p_tier: plan === "clinic" ? "pro" : "solo",
        p_specialty: formData.specialty || ""
      });

      if (rpcError || (rpcData && rpcData.error)) {
        setError("Error en el servidor al configurar tu clínica. Intenta de nuevo.");
        setIsLoading(false);
        return;
      }

      // Save extra professional data to doctor_profiles
      const { data: dpData } = await supabase
        .from("doctor_profiles")
        .select("id")
        .eq("user_id", authData.user.id)
        .maybeSingle();

      if (dpData?.id) {
        await supabase.from("doctor_profiles").update({
          full_name: formData.full_name,
          specialty: formData.specialty,
          license_number: formData.license_number,
          university: formData.university,
          clinic_name: clinicName,
          clinic_address: formData.clinic_address,
          clinic_phone: formData.phone,
          clinic_email: formData.email,
        }).eq("id", dpData.id);
      }

      // Save phone to users table
      if (formData.phone) {
        await supabase.from("users").update({ phone: formData.phone }).eq("id", authData.user.id);
      }

      // Notify: Welcome email + Telegram
      fetch("/api/notifications/welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          fullName: formData.full_name,
          specialty: formData.specialty,
          phone: formData.phone,
          licenseNumber: formData.license_number,
          university: formData.university,
          clinicName: clinicName,
          address: formData.clinic_address,
          plan,
        })
      }).catch(e => console.error("Welcome notification error:", e));

      window.location.href = "/dashboard?welcome=true";
    } catch (err: any) {
      setError(err.message || "Error inesperado");
      setIsLoading(false);
    }
  };

  const stepIndicator = (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[1, 2, 3].map(s => (
        <div key={s} className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
            step >= s ? 'bg-teal-500 text-white' : 'bg-slate-800 text-slate-500'
          }`}>{s}</div>
          {s < 3 && <div className={`w-8 h-px ${step > s ? 'bg-teal-500' : 'bg-slate-800'}`} />}
        </div>
      ))}
    </div>
  );

  return (
    <div className="relative min-h-screen bg-[#050B14] flex flex-col items-center justify-center p-4 overflow-hidden selection:bg-primary selection:text-primary-foreground">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full bg-teal-900/10 blur-[150px] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://res.cloudinary.com/djp7d2lmt/image/upload/v1711202868/grid-pattern_qazwsc.svg')] opacity-5 pointer-events-none mix-blend-overlay"></div>

      <div className="z-10 w-full max-w-lg animate-in fade-in zoom-in-95 duration-700 ease-out">
        {/* Logo */}
        <div className="flex flex-col items-center justify-center mb-6 gap-3">
          <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shadow-[0_0_40px_-10px_rgba(45,212,191,0.2)] backdrop-blur-md">
            <Image src="/logo_nerve.svg" alt="NERVE" width={36} height={36} className="drop-shadow-lg" priority />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-white">Crear cuenta en NERVE</h1>
        </div>

        {stepIndicator}

        {step === 1 ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <p className="text-center text-slate-400 text-sm mb-6">Selecciona el tipo de suscripción que mejor se adapte a ti</p>

            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setPlan("solo")} className={`relative p-6 rounded-2xl border text-left transition-all duration-300 ${plan === "solo" ? "bg-teal-500/10 border-teal-500/40 ring-2 ring-teal-500/20" : "bg-slate-950/40 border-slate-800/60 hover:border-slate-700"}`}>
                {plan === "solo" && <div className="absolute top-3 right-3 w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center"><Check className="h-3 w-3 text-white" /></div>}
                <UserRound className={`h-8 w-8 mb-3 ${plan === "solo" ? "text-teal-400" : "text-slate-500"}`} />
                <h3 className="text-white font-medium mb-1">Doctor Solo</h3>
                <p className="text-slate-500 text-xs mb-3">Consultorio independiente</p>
                <div className="flex items-baseline gap-1"><span className="text-2xl font-bold text-white">$149</span><span className="text-xs text-slate-500">MXN/mes</span></div>
                <ul className="mt-3 space-y-1">
                  <li className="text-[10px] text-slate-400 flex items-center gap-1.5"><Check className="h-2.5 w-2.5 text-teal-500" /> 1 Doctor</li>
                  <li className="text-[10px] text-slate-400 flex items-center gap-1.5"><Check className="h-2.5 w-2.5 text-teal-500" /> Recetas ilimitadas</li>
                  <li className="text-[10px] text-slate-400 flex items-center gap-1.5"><Check className="h-2.5 w-2.5 text-teal-500" /> Agenda + Expedientes</li>
                </ul>
              </button>
              <button onClick={() => setPlan("clinic")} className={`relative p-6 rounded-2xl border text-left transition-all duration-300 ${plan === "clinic" ? "bg-violet-500/10 border-violet-500/40 ring-2 ring-violet-500/20" : "bg-slate-950/40 border-slate-800/60 hover:border-slate-700"}`}>
                {plan === "clinic" && <div className="absolute top-3 right-3 w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center"><Check className="h-3 w-3 text-white" /></div>}
                <Building2 className={`h-8 w-8 mb-3 ${plan === "clinic" ? "text-violet-400" : "text-slate-500"}`} />
                <h3 className="text-white font-medium mb-1">Clínica</h3>
                <p className="text-slate-500 text-xs mb-3">Multi-doctor con equipo</p>
                <div className="flex items-baseline gap-1"><span className="text-2xl font-bold text-white">$1,299</span><span className="text-xs text-slate-500">MXN/mes</span></div>
                <ul className="mt-3 space-y-1">
                  <li className="text-[10px] text-slate-400 flex items-center gap-1.5"><Check className="h-2.5 w-2.5 text-violet-500" /> Hasta 10 doctores</li>
                  <li className="text-[10px] text-slate-400 flex items-center gap-1.5"><Check className="h-2.5 w-2.5 text-violet-500" /> Panel de administrador</li>
                  <li className="text-[10px] text-slate-400 flex items-center gap-1.5"><Check className="h-2.5 w-2.5 text-violet-500" /> Reportes y métricas</li>
                  <li className="text-[10px] text-slate-400 flex items-center gap-1.5"><Check className="h-2.5 w-2.5 text-violet-500" /> Recepcionistas</li>
                </ul>
              </button>
            </div>

            <Button onClick={() => setStep(2)} className="w-full mt-4 bg-teal-600 hover:bg-teal-500 text-white h-11 rounded-xl shadow-[0_0_20px_-5px_rgba(13,148,136,0.4)]">
              Continuar <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <p className="text-xs text-center text-slate-500 mt-2">
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" className="text-teal-400 hover:text-teal-300 transition-colors">Inicia sesión</Link>
            </p>
          </div>
        ) : step === 2 ? (
          /* Step 2: Professional Data */
          <Card className="bg-slate-950/40 border-slate-800/60 backdrop-blur-xl shadow-2xl rounded-2xl ring-1 ring-white/5 relative animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-500/30 to-transparent"></div>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-white font-medium">Datos Profesionales</CardTitle>
                  <CardDescription className="text-slate-400">Información que aparecerá en tus recetas y documentos.</CardDescription>
                </div>
                <button type="button" onClick={() => setStep(1)} className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1">
                  <ArrowLeft className="h-3 w-3" /> Plan
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300 flex items-center gap-2"><UserRound className="h-3.5 w-3.5 text-slate-500" /> Nombre completo</Label>
                <Input placeholder="Dr. Juan López García" value={formData.full_name} onChange={(e) => updateField("full_name", e.target.value)} required className="bg-slate-900/50 border-slate-800 text-slate-200 placeholder:text-slate-600 focus-visible:ring-teal-500/50 h-10" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-slate-300 flex items-center gap-2"><GraduationCap className="h-3.5 w-3.5 text-slate-500" /> Especialidad</Label>
                  <Input placeholder="Medicina General" value={formData.specialty} onChange={(e) => updateField("specialty", e.target.value)} className="bg-slate-900/50 border-slate-800 text-slate-200 placeholder:text-slate-600 focus-visible:ring-teal-500/50 h-10" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300 flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-slate-500" /> Teléfono</Label>
                  <Input placeholder="+52 81 1234 5678" value={formData.phone} onChange={(e) => updateField("phone", e.target.value)} className="bg-slate-900/50 border-slate-800 text-slate-200 placeholder:text-slate-600 focus-visible:ring-teal-500/50 h-10" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-slate-300 flex items-center gap-2"><BadgeCheck className="h-3.5 w-3.5 text-slate-500" /> Cédula Profesional</Label>
                  <Input placeholder="12345678" value={formData.license_number} onChange={(e) => updateField("license_number", e.target.value)} className="bg-slate-900/50 border-slate-800 text-slate-200 placeholder:text-slate-600 focus-visible:ring-teal-500/50 h-10" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300 flex items-center gap-2"><GraduationCap className="h-3.5 w-3.5 text-slate-500" /> Universidad</Label>
                  <Input placeholder="UNAM, UANL, etc." value={formData.university} onChange={(e) => updateField("university", e.target.value)} className="bg-slate-900/50 border-slate-800 text-slate-200 placeholder:text-slate-600 focus-visible:ring-teal-500/50 h-10" />
                </div>
              </div>

              <div className="border-t border-white/5 pt-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300 flex items-center gap-2"><Building2 className="h-3.5 w-3.5 text-slate-500" /> Nombre del Consultorio / Clínica</Label>
                  <Input placeholder={plan === "clinic" ? "Centro Médico Especializado" : "Consultorio Dr. López"} value={formData.clinic_name} onChange={(e) => updateField("clinic_name", e.target.value)} required={plan === "clinic"} className="bg-slate-900/50 border-slate-800 text-slate-200 placeholder:text-slate-600 focus-visible:ring-teal-500/50 h-10" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300 flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-slate-500" /> Dirección del Consultorio</Label>
                  <Input placeholder="Av. Constitución #1234, Col. Centro, Monterrey" value={formData.clinic_address} onChange={(e) => updateField("clinic_address", e.target.value)} className="bg-slate-900/50 border-slate-800 text-slate-200 placeholder:text-slate-600 focus-visible:ring-teal-500/50 h-10" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex gap-3">
              <Button type="button" variant="ghost" onClick={() => setStep(1)} className="text-slate-400 hover:text-white">
                <ArrowLeft className="h-4 w-4 mr-2" /> Atrás
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (!formData.full_name) { setError("El nombre es obligatorio"); return; }
                  setError("");
                  setStep(3);
                }}
                className="flex-1 bg-teal-600 hover:bg-teal-500 text-white h-11 rounded-xl shadow-[0_0_20px_-5px_rgba(13,148,136,0.4)]"
              >
                Continuar <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardFooter>
            {error && <div className="px-6 pb-4"><div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">{error}</div></div>}
          </Card>
        ) : (
          /* Step 3: Account Credentials */
          <Card className="bg-slate-950/40 border-slate-800/60 backdrop-blur-xl shadow-2xl rounded-2xl ring-1 ring-white/5 relative animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-500/30 to-transparent"></div>
            <form onSubmit={handleRegister}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg text-white font-medium">Crear tu cuenta</CardTitle>
                    <CardDescription className="text-slate-400">
                      {plan === "solo" ? "Plan Doctor Solo — $149/mes" : "Plan Clínica — $1,299/mes"}
                    </CardDescription>
                  </div>
                  <button type="button" onClick={() => setStep(2)} className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1">
                    <ArrowLeft className="h-3 w-3" /> Datos
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center animate-in fade-in slide-in-from-top-2">
                    {error}
                  </div>
                )}

                {/* Summary of what was filled */}
                <div className="bg-slate-900/30 border border-slate-800/40 rounded-xl p-4 space-y-1">
                  <p className="text-xs font-bold text-teal-400 uppercase tracking-wider mb-2">Resumen</p>
                  <p className="text-sm text-slate-300"><span className="text-slate-500">Doctor:</span> {formData.full_name}</p>
                  {formData.specialty && <p className="text-sm text-slate-300"><span className="text-slate-500">Especialidad:</span> {formData.specialty}</p>}
                  {formData.license_number && <p className="text-sm text-slate-300"><span className="text-slate-500">Cédula:</span> {formData.license_number}</p>}
                  {formData.clinic_name && <p className="text-sm text-slate-300"><span className="text-slate-500">Consultorio:</span> {formData.clinic_name}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Correo Electrónico</Label>
                  <Input type="email" placeholder="doctor@clinica.com" value={formData.email} onChange={(e) => updateField("email", e.target.value)} required disabled={isLoading} className="bg-slate-900/50 border-slate-800 text-slate-200 placeholder:text-slate-600 focus-visible:ring-teal-500/50 h-10" />
                </div>
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Contraseña</Label>
                    <div className="relative">
                      <Input type={showPassword ? "text" : "password"} placeholder="Mínimo 6 caracteres" value={formData.password} onChange={(e) => updateField("password", e.target.value)} required disabled={isLoading} className="bg-slate-900/50 border-slate-800 text-slate-200 placeholder:text-slate-600 focus-visible:ring-teal-500/50 h-10 pr-10" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Confirmar</Label>
                    <div className="relative">
                      <Input type={showConfirmPassword ? "text" : "password"} placeholder="Repetir contraseña" value={formData.confirmPassword} onChange={(e) => updateField("confirmPassword", e.target.value)} required disabled={isLoading} className="bg-slate-900/50 border-slate-800 text-slate-200 placeholder:text-slate-600 focus-visible:ring-teal-500/50 h-10 pr-10" />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 pt-1 mt-4">
                  <input
                    type="checkbox"
                    id="accept-terms"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    required
                    className="mt-1 h-4 w-4 rounded border-slate-800 bg-slate-900/50 text-teal-600 focus:ring-teal-500 focus:ring-offset-slate-950 accent-teal-500 cursor-pointer"
                  />
                  <label htmlFor="accept-terms" className="text-xs text-slate-400 leading-normal cursor-pointer select-none">
                    He leído y acepto expresamente los{" "}
                    <Link href="/legal/terminos" target="_blank" className="text-teal-400 hover:text-teal-300 transition-colors underline font-medium">Términos de Servicio</Link>{" "}
                    y el{" "}
                    <Link href="/legal/privacidad" target="_blank" className="text-teal-400 hover:text-teal-300 transition-colors underline font-medium">Aviso de Privacidad</Link>{" "}
                    de NERVE Health Systems.
                  </label>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <div className="flex gap-3 w-full">
                  <Button type="button" variant="ghost" onClick={() => setStep(2)} className="text-slate-400 hover:text-white" disabled={isLoading}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Atrás
                  </Button>
                  <Button type="submit" disabled={isLoading} className="flex-1 bg-teal-600 hover:bg-teal-500 text-white h-11 rounded-xl shadow-[0_0_20px_-5px_rgba(13,148,136,0.4)] disabled:opacity-50">
                    {isLoading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creando cuenta...</>) : ("Comenzar prueba gratuita de 14 días")}
                  </Button>
                </div>
                <p className="text-[10px] text-center text-slate-600">
                  14 días gratis, sin tarjeta de crédito. Al registrarte aceptas nuestros términos de servicio.
                </p>
              </CardFooter>
            </form>
          </Card>
        )}

        <p className="text-xs text-center text-slate-500 mt-4">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-teal-400 hover:text-teal-300 transition-colors">Inicia sesión</Link>
        </p>

        <div className="mt-6 text-center">
          <p className="text-[11px] text-slate-600 font-medium tracking-widest">
            Misión Crítica. Cero Fallos.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegistroPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#020617]"><Loader2 className="w-8 h-8 animate-spin text-teal-500" /></div>}>
      <RegistroContent />
    </React.Suspense>
  );
}
