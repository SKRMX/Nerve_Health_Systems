"use client";

import React, { useState, useEffect, use } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  User, 
  Stethoscope, 
  Calendar, 
  Clock, 
  Globe, 
  MessageCircle,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  X,
  Phone,
  Mail,
  FileText,
  Building2,
  MapPin,
  Image,
  Video
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { loadStripe } from "@stripe/stripe-js";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { formatPrice } from "@/lib/international";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

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
import { format, parseISO, isSameDay } from "date-fns";
import { es } from "date-fns/locale";

interface DoctorData {
  id: string;
  full_name: string;
  specialty: string;
  bio: string;
  profile_photo_url: string | null;
  social_links: {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    whatsapp?: string;
    website?: string;
  };
  clinic_name: string;
  clinic_id: string;
  clinic_address: string;
  clinic_city?: string | null;
  clinic_state?: string | null;
  clinic_postal_code?: string | null;
  gallery_images?: string[] | null;
  teleconsulta_enabled?: boolean;
  teleconsulta_price?: number;
  presencial_price?: number;
  payment_required?: boolean;
}

function getFullAddress(doctor: DoctorData) {
  const parts = [
    doctor.clinic_address,
    doctor.clinic_city,
    doctor.clinic_state,
    doctor.clinic_postal_code ? `C.P. ${doctor.clinic_postal_code}` : ""
  ].filter(Boolean);
  return parts.join(", ");
}

export default function DoctorPublicBookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  
  // Doctor availability state
  const [doctor, setDoctor] = useState<DoctorData | null>(null);
  const [availableSlots, setAvailableSlots] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Scheduling selections
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Booking Form modal state
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<any | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // New features state
  const [appointmentType, setAppointmentType] = useState<"presencial" | "teleconsulta">("presencial");
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // Reset checkout state when modal closes
  useEffect(() => {
    if (!showModal) {
      setClientSecret(null);
      setBookingError(null);
    }
  }, [showModal]);

  // Check URL parameters for successful booking redirects from Mercado Pago
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const bookingSuccessParam = params.get("booking_success");
      const bookingPendingParam = params.get("booking_pending");
      const appointmentId = params.get("appointment_id");

      if ((bookingSuccessParam === "true" || bookingPendingParam === "true") && appointmentId) {
        // Fetch fresh details from API to get the Jitsi video URL if paid
        fetch(`/api/public/appointments?id=${appointmentId}`)
          .then(res => res.json())
          .then(data => {
            if (data.success && data.appointment) {
              setBookingSuccess(data.appointment);
              localStorage.removeItem("pending_appointment");
            } else {
              // Fallback to local storage
              const savedApp = localStorage.getItem("pending_appointment");
              if (savedApp) {
                setBookingSuccess(JSON.parse(savedApp));
                localStorage.removeItem("pending_appointment");
              }
            }
          })
          .catch(() => {
            // Fallback to local storage
            const savedApp = localStorage.getItem("pending_appointment");
            if (savedApp) {
              setBookingSuccess(JSON.parse(savedApp));
              localStorage.removeItem("pending_appointment");
            }
          });
      }
    }
  }, []);

  // Fetch doctor profile and available slots
  useEffect(() => {
    async function loadDoctor() {
      try {
        setLoading(true);
        const res = await fetch(`/api/public/doctor?slug=${slug}`);
        const data = await res.json();
        
        if (res.ok) {
          setDoctor(data.doctor);
          setAvailableSlots(data.availableSlots || {});
          
          // Select first available date automatically
          const dates = Object.keys(data.availableSlots || {});
          if (dates.length > 0) {
            setSelectedDateStr(dates[0]);
          }
        } else {
          setError(data.error || "No se pudo cargar la información del médico.");
        }
      } catch (err) {
        setError("Error de red al intentar conectar con el servidor.");
      } finally {
        setLoading(false);
      }
    }
    loadDoctor();
  }, [slug]);

  // Handle slot reservation POST
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctor || !selectedSlot || !name || !phone) return;

    // Clear previous errors
    setBookingError(null);

    if (!acceptTerms) {
      setBookingError("Debes aceptar los Términos de Servicio y el Aviso de Privacidad.");
      return;
    }

    // Validate phone number format (at least 10 digits)
    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      setBookingError("Por favor ingresa un número de teléfono válido de al menos 10 dígitos.");
      return;
    }

    setBookingLoading(true);
    try {
      const res = await fetch("/api/public/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctor_id: doctor.id,
          start_time: selectedSlot,
          name,
          phone,
          email,
          notes,
          appointment_type: appointmentType
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        if (data.payment_required && data.client_secret) {
          // Guardar información temporalmente
          localStorage.setItem("pending_appointment", JSON.stringify(data.appointment));
          setClientSecret(data.client_secret);
          return;
        }

        setBookingSuccess(data.appointment);
        setShowModal(false);
        setBookingError(null);
        
        // Remove booked slot locally from list
        if (selectedDateStr) {
          setAvailableSlots(prev => {
            const list = prev[selectedDateStr] || [];
            return {
              ...prev,
              [selectedDateStr]: list.filter(slot => slot !== selectedSlot)
            };
          });
        }
      } else {
        setBookingError(data.error || "Ocurrió un error al reservar la cita. Por favor intenta de nuevo.");
      }
    } catch (err) {
      setBookingError("Error de conexión al guardar tu reserva. Verifica tu conexión a internet.");
    } finally {
      setBookingLoading(false);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#070e1b] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-teal-500 mx-auto" />
          <p className="text-slate-400 text-sm">Cargando disponibilidad de la agenda...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error || !doctor) {
    return (
      <div className="min-h-screen bg-[#070e1b] flex items-center justify-center p-4">
        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl max-w-md w-full text-center">
          <CardHeader className="space-y-2">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <CardTitle className="text-white text-xl">Perfil No Encontrado</CardTitle>
            <CardDescription className="text-slate-400">
              {error || "El enlace médico que buscas no existe o está deshabilitado."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-slate-500 text-xs">NERVE Health Systems</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Generate date keys list
  const availableDates = Object.keys(availableSlots).sort();

  const paymentMode = doctor.payment_mode || "ninguno";
  const isPaymentRequired = (appointmentType === "teleconsulta" && doctor.teleconsulta_enabled)
    ? (!!doctor.teleconsulta_price && doctor.teleconsulta_price > 0 && !!doctor.stripe_account_id && !!doctor.stripe_onboarding_completed)
    : (appointmentType === "presencial" && paymentMode !== "ninguno" && !!doctor.stripe_account_id && !!doctor.stripe_onboarding_completed);

  return (
    <div className="min-h-screen bg-[#070e1b] relative overflow-hidden text-slate-100 font-sans pb-16">
      {/* Background radial glow accents */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-teal-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px]" />

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 pt-12 md:pt-20 relative z-10 space-y-8">
        
        {/* Navigation / Header Brand */}
        <div className="flex items-center gap-2 text-slate-500 text-xs tracking-wider uppercase font-semibold">
          <Stethoscope className="h-4 w-4 text-teal-500" />
          <span>NERVE Health Systems</span>
        </div>

        {bookingSuccess ? (
          /* SUCCESS VIEW */
          <div className="max-w-md mx-auto">
            <Card className="bg-slate-900/50 border-teal-500/20 backdrop-blur-xl shadow-2xl p-8 text-center space-y-6">
              <div className="h-16 w-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl text-white font-bold">¡Cita Agendada!</CardTitle>
                <p className="text-slate-400 text-sm">
                  Hola <strong className="text-slate-200">{name}</strong>, tu cita ha sido reservada con éxito.
                </p>
              </div>

              <Separator className="border-slate-800" />

              <div className="text-left space-y-3.5 bg-slate-950/40 p-4 rounded-xl border border-slate-850/50">
                <div className="flex items-center gap-2.5 text-xs text-slate-400">
                  <User className="h-4 w-4 text-teal-500 shrink-0" />
                  <span>Médico: <strong className="text-slate-200">{doctor.full_name}</strong></span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-400">
                  <Calendar className="h-4 w-4 text-teal-500 shrink-0" />
                  <span>Fecha: <strong className="text-slate-200">{format(parseISO(bookingSuccess.start_time), "d 'de' MMMM, yyyy", { locale: es })}</strong></span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-400">
                  <Clock className="h-4 w-4 text-teal-500 shrink-0" />
                  <span>Hora: <strong className="text-slate-200">{format(parseISO(bookingSuccess.start_time), "hh:mm a")}</strong></span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-400">
                  <Building2 className="h-4 w-4 text-teal-500 shrink-0" />
                  <span>Consultorio: <strong className="text-slate-200">{doctor.clinic_name}</strong></span>
                </div>
                {bookingSuccess.appointment_type === 'teleconsulta' && bookingSuccess.teleconsulta_url && (
                  <div className="flex flex-col gap-1.5 p-3 bg-teal-950/20 border border-teal-500/10 rounded-xl text-left">
                    <div className="flex items-center gap-2 text-xs text-teal-400">
                      <Video className="h-4 w-4 shrink-0" />
                      <strong className="font-semibold">Videollamada de Telemedicina:</strong>
                    </div>
                    <a 
                      href={bookingSuccess.teleconsulta_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[11px] text-teal-300 hover:underline break-all"
                    >
                      {bookingSuccess.teleconsulta_url}
                    </a>
                  </div>
                )}
              </div>

              <div className="p-3 bg-emerald-950/20 border border-emerald-500/10 rounded-xl">
                <p className="text-[11px] text-emerald-400">
                  Te hemos enviado un mensaje de confirmación por WhatsApp.
                </p>
              </div>

              <Button 
                onClick={() => setBookingSuccess(null)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
              >
                Volver a la agenda
              </Button>
            </Card>
          </div>
        ) : (
          /* BOOKING INTERFACE */
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Left Column: Doctor Profile Card */}
            <div className="md:col-span-1 space-y-6">
              <Card className="bg-slate-900/40 border-slate-800/80 backdrop-blur-md shadow-2xl p-6 rounded-2xl ring-1 ring-white/5 space-y-6">
                <div className="text-center space-y-4">
                  {/* Photo */}
                  <div className="w-28 h-28 rounded-full border-2 border-teal-500/30 p-1.5 mx-auto bg-slate-950/60 shadow-[0_0_30px_-5px_rgba(13,148,136,0.3)]">
                    {doctor.profile_photo_url ? (
                      <img 
                        src={doctor.profile_photo_url} 
                        alt={doctor.full_name} 
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-slate-850 flex items-center justify-center">
                        <User className="h-10 w-10 text-slate-500" />
                      </div>
                    )}
                  </div>
                  
                  {/* Name and specialty */}
                  <div className="space-y-1">
                    <h1 className="text-lg font-bold text-white tracking-tight">{doctor.full_name}</h1>
                    <div className="inline-block px-2.5 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/15 text-teal-400 text-[10px] font-semibold uppercase tracking-wider">
                      {doctor.specialty || "Médico General"}
                    </div>
                  </div>
                </div>

                <Separator className="border-slate-850" />

                {/* Biography */}
                {doctor.bio ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Biografía</p>
                    <p className="text-xs text-slate-400 leading-relaxed font-light whitespace-pre-line">{doctor.bio}</p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic text-center">Sin biografía disponible</p>
                )}

                <Separator className="border-slate-850" />

                {/* Social networks & links */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Contacto & Redes</p>
                  <div className="flex flex-wrap gap-2">
                    {doctor.social_links?.whatsapp && (
                      <a 
                        href={`https://wa.me/${doctor.social_links.whatsapp.replace(/\D/g, "")}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/20 hover:scale-105 transition-all"
                        title="WhatsApp Directo"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </a>
                    )}
                    {doctor.social_links?.instagram && (
                      <a 
                        href={doctor.social_links.instagram}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="h-9 w-9 rounded-xl bg-pink-500/10 border border-pink-500/15 flex items-center justify-center text-pink-400 hover:bg-pink-500/20 hover:scale-105 transition-all"
                        title="Instagram"
                      >
                        <InstagramIcon className="h-4 w-4" />
                      </a>
                    )}
                    {doctor.social_links?.facebook && (
                      <a 
                        href={doctor.social_links.facebook}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="h-9 w-9 rounded-xl bg-blue-600/10 border border-blue-600/15 flex items-center justify-center text-blue-400 hover:bg-blue-600/20 hover:scale-105 transition-all"
                        title="Facebook"
                      >
                        <FacebookIcon className="h-4 w-4" />
                      </a>
                    )}
                    {doctor.social_links?.linkedin && (
                      <a 
                        href={doctor.social_links.linkedin}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center text-blue-400 hover:bg-blue-500/20 hover:scale-105 transition-all"
                        title="LinkedIn"
                      >
                        <LinkedinIcon className="h-4 w-4" />
                      </a>
                    )}
                    {doctor.social_links?.website && (
                      <a 
                        href={doctor.social_links.website}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="h-9 w-9 rounded-xl bg-slate-500/10 border border-slate-500/15 flex items-center justify-center text-slate-300 hover:bg-slate-500/20 hover:scale-105 transition-all"
                        title="Sitio Web"
                      >
                        <Globe className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              </Card>

              {/* Clinic & Location Banner */}
              <div className="p-5 bg-slate-900/30 border border-slate-800/80 rounded-2xl space-y-4 shadow-lg ring-1 ring-white/5">
                <div className="flex items-start gap-3.5">
                  <Building2 className="h-5 w-5 text-teal-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Consultorio</p>
                    <p className="text-sm text-slate-200 font-semibold">{doctor.clinic_name}</p>
                  </div>
                </div>

                {/* Detailed address with MapPin */}
                {getFullAddress(doctor) && (
                  <div className="space-y-3.5 pt-2 border-t border-slate-800/50">
                    <div className="flex items-start gap-3.5">
                      <MapPin className="h-5 w-5 text-teal-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Dirección</p>
                        <p className="text-xs text-slate-400 leading-relaxed font-light">{getFullAddress(doctor)}</p>
                      </div>
                    </div>

                    {/* Navigation maps buttons */}
                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(getFullAddress(doctor))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-teal-950/20 border border-teal-500/20 text-teal-400 hover:bg-teal-600 hover:text-white text-[11px] font-semibold transition-all duration-300 shadow-[0_0_15px_-5px_rgba(13,148,136,0.2)] text-center"
                      >
                        <MapPin className="h-3.5 w-3.5" />
                        Google Maps
                      </a>
                      <a
                        href={`https://maps.apple.com/maps?daddr=${encodeURIComponent(getFullAddress(doctor))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-950/20 border border-blue-500/20 text-blue-400 hover:bg-blue-600 hover:text-white text-[11px] font-semibold transition-all duration-300 shadow-[0_0_15px_-5px_rgba(59,130,246,0.2)] text-center"
                      >
                        <Globe className="h-3.5 w-3.5" />
                        Apple Maps
                      </a>
                    </div>

                    {/* Embedded Map iframe */}
                    <div className="w-full h-40 rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950/40 relative group mt-3">
                      <iframe
                        width="100%"
                        height="100%"
                        style={{ border: 0, filter: "grayscale(1) invert(0.9) contrast(1.2)" }}
                        loading="lazy"
                        allowFullScreen
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(getFullAddress(doctor))}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                      />
                      <div className="absolute inset-0 bg-slate-950/10 pointer-events-none group-hover:bg-transparent transition-colors" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Calendar and Slot Picker */}
            <div className="md:col-span-2 space-y-6">
              <Card className="bg-slate-900/40 border-slate-800/80 backdrop-blur-md shadow-2xl p-6 rounded-2xl ring-1 ring-white/5 space-y-6">
                <div>
                  <CardTitle className="text-lg text-white font-semibold">Agenda tu Cita en Línea</CardTitle>
                  <CardDescription className="text-slate-400 text-xs mt-1">
                    Selecciona una fecha y un horario disponible para reservar tu consulta de forma gratuita.
                  </CardDescription>
                </div>

                {availableDates.length === 0 ? (
                  /* No availability whatsoever */
                  <div className="text-center py-16 space-y-4">
                    <Calendar className="h-12 w-12 text-slate-600 mx-auto" />
                    <div>
                      <p className="text-slate-300 font-medium">No hay fechas disponibles</p>
                      <p className="text-slate-500 text-xs mt-1 max-w-xs mx-auto">
                        Este médico no tiene horarios libres configurados para los próximos 14 días.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Horizontal scroll dates selector */}
                    <div className="space-y-2">
                      <Label className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Fecha de consulta</Label>
                      <div className="flex gap-2.5 overflow-x-auto pb-3.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                        {availableDates.map(dateStr => {
                          const dateObj = parseISO(`${dateStr}T00:00:00`);
                          const isSelected = selectedDateStr === dateStr;
                          return (
                            <button
                              key={dateStr}
                              onClick={() => {
                                setSelectedDateStr(dateStr);
                                setSelectedSlot(null);
                              }}
                              className={`flex flex-col items-center justify-center p-3 w-16 h-18 rounded-xl border transition-all duration-300 shrink-0 ${
                                isSelected
                                  ? "bg-teal-600 border-teal-500 text-white shadow-[0_0_20px_-5px_rgba(13,148,136,0.5)] scale-105"
                                  : "bg-slate-950/40 border-slate-850/80 text-slate-400 hover:border-slate-700"
                              }`}
                            >
                              <span className="text-[10px] font-bold uppercase tracking-wider">
                                {format(dateObj, "eee", { locale: es }).replace(".", "")}
                              </span>
                              <span className="text-lg font-bold mt-1">
                                {format(dateObj, "d")}
                              </span>
                              <span className="text-[8px] opacity-70 mt-0.5 uppercase">
                                {format(dateObj, "MMM", { locale: es }).replace(".", "")}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Hours list selector */}
                    <div className="space-y-3">
                      <Label className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Horario de consulta</Label>
                      {selectedDateStr && availableSlots[selectedDateStr]?.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                          {availableSlots[selectedDateStr].map(slotISO => {
                            const timeStr = format(parseISO(slotISO), "hh:mm a");
                            const isSelected = selectedSlot === slotISO;
                            return (
                              <button
                                key={slotISO}
                                onClick={() => setSelectedSlot(slotISO)}
                                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all duration-300 ${
                                  isSelected
                                    ? "bg-teal-600 border-teal-500 text-white shadow-[0_0_20px_-5px_rgba(13,148,136,0.4)]"
                                    : "bg-slate-950/40 border-slate-850/80 text-slate-400 hover:bg-slate-900 hover:border-slate-750"
                                }`}
                              >
                                {timeStr}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl bg-slate-950/20">
                          No hay horarios disponibles para esta fecha.
                        </div>
                      )}
                    </div>

                    {/* Booking button trigger */}
                    {selectedSlot && (
                      <div className="pt-4 flex justify-end">
                        <Button
                          onClick={() => setShowModal(true)}
                          className="bg-teal-600 hover:bg-teal-500 text-white rounded-xl px-8 shadow-[0_0_25px_-5px_rgba(13,148,136,0.4)] transition-all"
                        >
                          Continuar Reserva
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </Card>

              {/* Galería de imágenes y Flyers */}
              {doctor.gallery_images && doctor.gallery_images.length > 0 && (
                <Card className="bg-slate-900/40 border-slate-800/80 backdrop-blur-md shadow-2xl p-6 rounded-2xl ring-1 ring-white/5">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-xl bg-teal-500/10 flex items-center justify-center">
                      <Image className="h-5 w-5 text-teal-500" />
                    </div>
                    <div>
                      <h3 className="text-lg text-white font-semibold">Galería e Información</h3>
                      <p className="text-slate-400 text-xs mt-0.5">
                        Imágenes del consultorio, flyers de servicios y promociones médicas.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-4">
                    {doctor.gallery_images.map((url, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-850 group cursor-pointer"
                        onClick={() => {
                          setSelectedImage(url);
                        }}
                      >
                        <img
                          src={url}
                          alt={`Imagen ${idx + 1}`}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-slate-950/20 opacity-100 group-hover:opacity-0 transition-opacity" />
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>

          </div>
        </>
      )}
      </div>

      {/* Booking Form Modal Overlay */}
      {showModal && selectedSlot && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-slate-900/90 border-slate-800 backdrop-blur-xl shadow-2xl max-w-md w-full relative overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Background blur inside modal */}
            <div className="absolute top-[-10%] right-[-10%] w-24 h-24 bg-teal-500/10 rounded-full blur-2xl" />
            
            <CardHeader className="pb-4 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white text-base">Completa tu Reserva</CardTitle>
                  <CardDescription className="text-xs text-slate-400 mt-0.5">
                    Proporciona tus datos para confirmar tu cita.
                  </CardDescription>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="h-8 w-8 rounded-lg bg-slate-850 hover:bg-slate-800 flex items-center justify-center text-slate-400 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>
            
            <CardContent className="relative z-10">
              {/* Appointment summary header */}
              <div className="mb-6 p-3.5 bg-slate-950/50 border border-slate-850/80 rounded-xl space-y-1 text-xs">
                <p className="text-slate-400 flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                  <span>Fecha: <strong className="text-slate-200">{format(parseISO(selectedSlot), "EEEE, d 'de' MMMM", { locale: es })}</strong></span>
                </p>
                <p className="text-slate-400 flex items-center gap-2 mt-1">
                  <Clock className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                  <span>Hora: <strong className="text-slate-200">{format(parseISO(selectedSlot), "hh:mm a")}</strong></span>
                </p>
              </div>

              {/* Inline error message */}
              {bookingError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-red-400 font-medium">Error al reservar</p>
                    <p className="text-[11px] text-red-400/80 mt-0.5">{bookingError}</p>
                  </div>
                  <button
                    onClick={() => setBookingError(null)}
                    className="ml-auto text-red-400/60 hover:text-red-400 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {clientSecret ? (
                <div className="space-y-4 pt-2">
                  <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-300">Pago de Garantía Seguro</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">Procesado de forma segura mediante Stripe Connect</p>
                    </div>
                    <button
                      onClick={() => setClientSecret(null)}
                      className="text-xs text-teal-400 hover:text-teal-300 underline font-medium transition-colors cursor-pointer"
                    >
                      Modificar Datos
                    </button>
                  </div>
                  <div className="bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden p-1 min-h-[350px]">
                    <EmbeddedCheckoutProvider
                      stripe={stripePromise}
                      options={{ clientSecret }}
                    >
                      <EmbeddedCheckout />
                    </EmbeddedCheckoutProvider>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  {doctor.teleconsulta_enabled && (
                    <div className="space-y-1.5 pb-2">
                      <Label className="text-slate-300 text-xs">Modalidad de Consulta</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setAppointmentType("presencial")}
                          className={`p-3 rounded-xl border text-center transition-all ${
                            appointmentType === "presencial"
                              ? "border-teal-500 bg-teal-500/10 text-white"
                              : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"
                          }`}
                        >
                          Presencial
                          <span className="block text-[10px] text-slate-500 mt-0.5">Consultorio</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAppointmentType("teleconsulta")}
                          className={`p-3 rounded-xl border text-center transition-all ${
                            appointmentType === "teleconsulta"
                              ? "border-teal-500 bg-teal-500/10 text-white"
                              : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"
                          }`}
                        >
                          Videollamada
                          <span className="block text-[10px] text-teal-400 mt-0.5">
                            {formatPrice(doctor.teleconsulta_price || 0, doctor.country_code)}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Pricing warning if payment is required */}
                  {isPaymentRequired && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2 text-xs">
                      <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-amber-400 font-semibold">Garantía de Consulta Requerida</p>
                        <p className="text-slate-400 mt-0.5 leading-relaxed">
                          Para confirmar la cita se requiere el pago de un anticipo de{" "}
                          <strong className="text-white">
                            {formatPrice(
                              paymentMode === "anticipo" ? (doctor.anticipo_amount || 0) : (doctor.presencial_price || 0),
                              doctor.country_code
                            )}
                          </strong>{" "}
                          mediante tarjeta.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-slate-300 text-xs">Nombre y Apellido</Label>
                    <Input
                      id="name"
                      required
                      placeholder="Ej. Sofía Martínez García"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-slate-950 border-slate-800 text-slate-200 focus-visible:ring-teal-500/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-slate-300 text-xs flex items-center gap-1.5">
                      <Phone className="h-3 w-3 text-slate-500" />
                      Celular (WhatsApp de contacto)
                    </Label>
                    <Input
                      id="phone"
                      required
                      type="tel"
                      placeholder="Ej. 921 175 6673"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="bg-slate-950 border-slate-800 text-slate-200 focus-visible:ring-teal-500/50"
                    />
                    <p className="text-[10px] text-slate-500 leading-normal">
                      Se enviarán los recordatorios de tu cita a este número. Mínimo 10 dígitos.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-slate-300 text-xs flex items-center gap-1.5">
                      <Mail className="h-3 w-3 text-slate-500" />
                      Correo Electrónico (Opcional)
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="ejemplo@correo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-slate-950 border-slate-800 text-slate-200 focus-visible:ring-teal-500/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="notes" className="text-slate-300 text-xs flex items-center gap-1.5">
                      <FileText className="h-3 w-3 text-slate-500" />
                      Motivo de consulta (Opcional)
                    </Label>
                    <Textarea
                      id="notes"
                      placeholder="Describe brevemente tus síntomas o motivo de la visita..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="bg-slate-950 border-slate-800 text-slate-200 focus-visible:ring-teal-500/50 min-h-[70px] resize-none"
                    />
                  </div>

                  <div className="flex items-start gap-2 pt-1 mt-4">
                    <input
                      type="checkbox"
                      id="accept-patient-terms"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      required
                      className="mt-1 h-4 w-4 rounded border-slate-800 bg-slate-950 text-teal-600 focus:ring-teal-500 focus:ring-offset-slate-950 accent-teal-500 cursor-pointer"
                    />
                    <label htmlFor="accept-patient-terms" className="text-xs text-slate-400 leading-normal cursor-pointer select-none">
                      Acepto expresamente los <a href="/legal/terminos" target="_blank" className="text-teal-400 hover:text-teal-300 transition-colors underline font-medium font-semibold">Términos de Servicio</a> y el <a href="/legal/privacidad" target="_blank" className="text-teal-400 hover:text-teal-300 transition-colors underline font-medium font-semibold">Aviso de Privacidad</a> de NERVE. Entiendo que mis datos se procesarán de forma segura.
                    </label>
                  </div>

                  <div className="pt-4">
                    <Button
                      type="submit"
                      disabled={bookingLoading}
                      className="w-full bg-teal-600 hover:bg-teal-500 text-white rounded-xl shadow-[0_0_20px_-5px_rgba(13,148,136,0.4)]"
                    >
                      {bookingLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        "Confirmar Reserva"
                      )}
                      {bookingLoading ? "Reservando..." : "Confirmar Cita"}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      {/* Image lightbox modal overlay */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-slate-900/60 border border-slate-805 text-slate-300 hover:text-white flex items-center justify-center backdrop-blur-md transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl border border-slate-850 bg-slate-950 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <img
              src={selectedImage}
              alt="Visualización ampliada"
              className="w-auto h-auto max-w-full max-h-[85vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}

    </div>
  );
}
