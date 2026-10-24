import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { ProductShowcase } from "@/components/home/ProductShowcase";
import { AnimatedBackground } from "@/components/home/AnimatedBackground";
import { NativeAppGuard } from "@/components/home/NativeAppGuard";

export const metadata: Metadata = {
  title: "NERVE Health Systems — Software de Gestión Clínica en la Nube",
  description:
    "Plataforma integral para la gestión de clínicas y consultorios médicos. Agenda inteligente, expedientes digitales, recetas electrónicas y administración de equipo. Prueba gratis 14 días.",
  keywords:
    "software médico, gestión clínica, expediente clínico electrónico, agenda médica, recetas digitales, SaaS salud, México",
  openGraph: {
    title: "NERVE Health Systems — Gestión Clínica de Alta Disponibilidad",
    description:
      "Digitaliza tu práctica médica con la plataforma más moderna de México. Agenda, expedientes, recetas y reportes desde cualquier dispositivo.",
    type: "website",
    locale: "es_MX",
  },
};

/* ======================================================================
   ICONS — inline SVGs for zero-dependency, crisp vector rendering
   ====================================================================== */

function IconCalendar({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
    </svg>
  );
}

function IconClipboard({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M9 14l2 2 4-4" />
    </svg>
  );
}

function IconPrescription({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
      <path d="M14 2v6h6M9 13h6M9 17h3" />
      <circle cx="15.5" cy="17.5" r="2.5" />
      <path d="M17.3 19.3L20 22" />
    </svg>
  );
}

function IconTeam({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function IconChart({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  );
}

function IconShield({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function IconCloud({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" />
    </svg>
  );
}

function IconMobile({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <path d="M12 18h.01" />
    </svg>
  );
}

function IconCheck({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconArrowRight({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function IconStar({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function IconQuote({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" opacity="0.15">
      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
    </svg>
  );
}

function IconMapGallery({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="18" rx="2" />
      <path d="M12 3v18" />
      <circle cx="7" cy="8" r="1.5" />
      <path d="M2 16l3-3 3 3 2-2 2 2" />
      <path d="M17 7c-1.66 0-3 1.34-3 3 0 2 3 5 3 5s3-3 3-5c0-1.66-1.34-3-3-3z" />
      <circle cx="17" cy="10" r="1" />
    </svg>
  );
}

/* ======================================================================
   MAIN LANDING PAGE
   ====================================================================== */

export default function LandingPage() {
  const features = [
    {
      icon: <IconCalendar className="w-7 h-7" />,
      title: "Agenda Inteligente",
      description: "Calendario interactivo con vista diaria, semanal y mensual. Arrastra, edita y programa citas con control total de horarios y disponibilidad.",
    },
    {
      icon: <IconClipboard className="w-7 h-7" />,
      title: "Expediente Clínico Digital",
      description: "Historial médico completo por paciente. Notas clínicas, diagnósticos y seguimiento cronológico — todo en un solo lugar seguro.",
    },
    {
      icon: <IconPrescription className="w-7 h-7" />,
      title: "Recetas Electrónicas",
      description: "Genera recetas profesionales en PDF con tu marca y cédula. Múltiples medicamentos, dosis personalizadas e impresión directa.",
    },
    {
      icon: <IconMapGallery className="w-7 h-7" />,
      title: "Perfil Público con Galería y Mapa",
      description: "Página de reserva personalizada con galería de imágenes/flyers informativos y mapa interactivo en modo oscuro para tu consultorio.",
    },
    {
      icon: <IconTeam className="w-7 h-7" />,
      title: "Gestión de Equipo",
      description: "Roles diferenciados para doctores, recepcionistas y administradores. Permisos granulares y control de acceso por función.",
    },
    {
      icon: <IconChart className="w-7 h-7" />,
      title: "Reportes y Métricas",
      description: "Panel de productividad por doctor: citas completadas, tasa de cumplimiento, pacientes atendidos y tendencias mensuales.",
    },
    {
      icon: <IconShield className="w-7 h-7" />,
      title: "Seguridad de Grado Médico",
      description: "Aislamiento de datos por clínica (multi-tenant). Políticas RLS en cada tabla. Cifrado en tránsito y en reposo con infraestructura Supabase.",
    },
    {
      icon: <IconCloud className="w-7 h-7" />,
      title: "100% en la Nube",
      description: "Sin instalaciones, sin servidores locales. Accede desde cualquier computadora o tablet con tu navegador. Backups automáticos diarios.",
    },
    {
      icon: <IconMobile className="w-7 h-7" />,
      title: "Diseño Responsivo",
      description: "Interfaz adaptada para escritorio y tablets. Opera tu agenda desde la sala de consulta o la recepción sin cambiar de herramienta.",
    },
  ];

  const plans = [
    {
      name: "Doctor Solo",
      subtitle: "Consultorio independiente",
      price: "149",
      period: "/mes",
      description: "Para el médico que gestiona su propia consulta de forma autónoma.",
      features: [
        "1 doctor + 1 recepcionista",
        "Agenda inteligente completa",
        "Expedientes clínicos ilimitados",
        "Recetas electrónicas con PDF",
        "Directorio de pacientes",
        "Soporte por correo",
      ],
      cta: "Comenzar prueba gratis",
      href: "/registro?plan=solo",
      highlighted: false,
    },
    {
      name: "Clínica",
      subtitle: "Hasta 10 doctores",
      price: "1,299",
      period: "/mes",
      description: "Para clínicas con múltiples especialistas y personal administrativo.",
      features: [
        "Hasta 10 doctores incluidos",
        "Recepcionistas ilimitadas",
        "Agenda general con filtro por doctor",
        "Panel de administración completo",
        "Reportes de productividad",
        "Gestión de equipo y roles",
        "Expedientes y recetas ilimitados",
        "Soporte prioritario",
      ],
      cta: "Comenzar prueba gratis",
      href: "/registro?plan=clinica",
      highlighted: true,
      badge: "Más popular",
    },
    {
      name: "Enterprise",
      subtitle: "Hecho a tu medida",
      price: "Personalizado",
      period: "",
      description: "Para redes de clínicas o instituciones con más de 10 especialistas.",
      features: [
        "Doctores ilimitados (~$550/doctor)",
        "Configuración de tamaño flexible",
        "Onboarding dedicado",
        "SLA garantizado",
        "Integraciones personalizadas",
        "Gestor de cuenta asignado",
      ],
      cta: "Contactar ventas",
      href: "mailto:soporte@nervesystems.mx?subject=Plan%20Enterprise%20NERVE",
      highlighted: false,
    },
  ];

  const testimonials = [
    {
      name: "Dra. Laura M.",
      role: "Especialista en Dermatología",
      quote: "NERVE transformó mi consulta. Antes usaba hojas de Excel para todo. Ahora mis recetas salen profesionales y mis pacientes notan la diferencia.",
      rating: 5,
    },
    {
      name: "Dr. Roberto S.",
      role: "Director de Clínica Privada",
      quote: "Con el panel de reportes puedo ver la productividad de cada doctor en tiempo real. Ya no necesito pedir informes manuales a fin de mes.",
      rating: 5,
    },
    {
      name: "Lic. María G.",
      role: "Administradora de Servicios de Salud",
      quote: "La agenda general me permite coordinar las citas de diversos especialistas desde un solo panel. La recepción es mucho más eficiente.",
      rating: 5,
    },
  ];

  const faqs = [
    {
      q: "¿Necesito instalar algo en mi computadora?",
      a: "No. NERVE funciona 100% en tu navegador web. Solo necesitas conexión a internet. Compatible con Chrome, Safari, Firefox y Edge.",
    },
    {
      q: "¿Mis datos están seguros?",
      a: "Sí. Cada clínica tiene sus datos completamente aislados con Row-Level Security (RLS). La infraestructura corre sobre Supabase con cifrado AES-256 en reposo y TLS 1.3 en tránsito.",
    },
    {
      q: "¿Qué pasa después de los 14 días de prueba?",
      a: "Si decides continuar, se activará el cobro mensual con el plan que elegiste. Si no, tu cuenta se pausará sin perder datos — podrás reactivarla cuando quieras.",
    },
    {
      q: "¿Puedo cambiar de plan después?",
      a: "Sí. Puedes escalar de Doctor Solo a Clínica o a Enterprise en cualquier momento desde tu panel de configuración. El cambio se prorratea.",
    },
    {
      q: "¿Qué métodos de pago aceptan?",
      a: "Aceptamos tarjeta de crédito, débito y otros métodos a través de Mercado Pago. El cobro es recurrente y puedes cancelar cuando quieras.",
    },
    {
      q: "¿Cuántos pacientes puedo registrar?",
      a: "Ilimitados. Todos los planes incluyen pacientes, expedientes y recetas sin tope. Solo se limita la cantidad de doctores según tu plan.",
    },
  ];

  return (
    <div className="relative isolate min-h-screen bg-[#030712] text-slate-100 antialiased selection:bg-teal-500/30 selection:text-teal-200">
      {/* SaaS Schema JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "NERVE Health Systems",
            "operatingSystem": "All (Web-Based)",
            "applicationCategory": "MedicalSoftware",
            "description": "Software de gestión clínica, agenda inteligente y expediente clínico electrónico para médicos en México.",
            "offers": {
              "@type": "Offer",
              "price": "149",
              "priceCurrency": "MXN",
              "priceSpecification": {
                "@type": "UnitPriceSpecification",
                "price": "149",
                "priceCurrency": "MXN",
                "referenceQuantity": {
                  "@type": "QuantitativeValue",
                  "value": "1",
                  "unitCode": "MON"
                }
              }
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.9",
              "ratingCount": "150"
            }
          })
        }}
      />
      <AnimatedBackground />
      <NativeAppGuard />

      {/* ================================================================
          NAVIGATION (Sticky & Glass)
          ================================================================ */}
      <nav className="sticky top-0 inset-x-0 z-50 pt-[env(safe-area-inset-top)] border-b border-white/[0.04] bg-[#030712]/80 backdrop-blur-3xl transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/10 border border-white/10 flex items-center justify-center shadow-[0_0_20px_-6px_rgba(20,184,166,0.3)] group-hover:shadow-[0_0_25px_-4px_rgba(20,184,166,0.4)] transition-shadow">
              <Image src="/logo_nerve.svg" alt="NERVE" width={20} height={20} />
            </div>
            <span className="text-lg font-semibold text-white tracking-wide">NERVE</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            <a href="#funciones" className="hover:text-white transition-colors">Funciones</a>
            <a href="#precios" className="hover:text-white transition-colors">Precios</a>
            <a href="#testimonios" className="hover:text-white transition-colors">Testimonios</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-flex text-sm text-slate-300 hover:text-white px-4 py-2 rounded-lg transition-colors"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/registro"
              className="text-sm font-medium bg-teal-600 hover:bg-teal-500 text-white px-5 py-2.5 rounded-xl transition-all shadow-[0_0_20px_-5px_rgba(13,148,136,0.5)] hover:shadow-[0_0_25px_-3px_rgba(13,148,136,0.6)]"
            >
              Prueba gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* ================================================================
          HERO
          ================================================================ */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden">
        {/* Background effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-teal-500/[0.07] via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-20 right-0 w-[500px] h-[500px] rounded-full bg-cyan-900/[0.04] blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-blue-900/[0.06] blur-[80px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          {/* Trust badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/[0.08] border border-teal-500/20 text-teal-400 text-xs font-medium mb-8 tracking-wide">
            <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse" />
            PRUEBA GRATUITA DE 14 DÍAS — SIN TARJETA DE CRÉDITO
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] text-white">
            Software Médico y{" "}
            <span className="text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.4)]">
              Expediente Clínico
            </span>{" "}
            Electrónico
          </h1>

          <p className="mt-6 text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Tu clínica merece tecnología de primer nivel. Optimiza la atención de tus pacientes y elimina el papeleo con la plataforma más rápida para médicos en México.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/registro"
              className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white font-medium px-8 py-3.5 rounded-xl text-base transition-all shadow-[0_0_30px_-8px_rgba(13,148,136,0.5)] hover:shadow-[0_0_40px_-5px_rgba(13,148,136,0.6)] hover:-translate-y-0.5"
            >
              Comenzar prueba gratuita
              <IconArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#funciones"
              className="inline-flex items-center gap-2 text-slate-300 hover:text-white font-medium px-6 py-3.5 rounded-xl border border-slate-800 hover:border-slate-700 transition-all text-base hover:bg-white/[0.02]"
            >
              Explorar funciones
            </a>
          </div>

          {/* Social Proof (Updated) */}
          <div className="mt-8 text-sm font-medium text-slate-400">
            Únete a <span className="text-white">+150 doctores</span> que ya digitalizaron su consulta.
          </div>

          {/* Trust badges */}
          <div className="mt-12 flex items-center justify-center gap-8 flex-wrap">
            <div className="flex items-center gap-1.5 text-sm text-slate-500">
              <IconShield className="w-4 h-4 text-teal-500/60" />
              <span>Datos cifrados</span>
            </div>
            <div className="h-4 w-px bg-slate-800 hidden sm:block" />
            <div className="flex items-center gap-1.5 text-sm text-slate-500">
              <IconCloud className="w-4 h-4 text-teal-500/60" />
              <span>99.9% uptime</span>
            </div>
            <div className="h-4 w-px bg-slate-800 hidden sm:block" />
            <div className="flex items-center gap-1.5 text-sm text-slate-500">
              <IconCalendar className="w-4 h-4 text-teal-500/60" />
              <span>14 días gratis</span>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          SOFTWARE VS PAPEL
          ================================================================ */}
      <section className="py-24 border-t border-white/[0.03] bg-gradient-to-b from-transparent via-blue-950/[0.04] to-transparent">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              La alternativa moderna a agendas físicas y expedientes en papel
            </h2>
            <p className="mt-4 text-slate-400 text-lg">
              La diferencia entre perder el tiempo administrando y enfocarlo en atender a tus pacientes.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* The Old Way */}
            <div className="bg-red-950/10 border border-red-900/20 rounded-2xl p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600/50 to-orange-600/50" />
              <h3 className="text-xl font-bold text-slate-300 flex items-center gap-2 mb-6">
                <span className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 text-lg">✕</span>
                Cuadernos y Excel
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-slate-400">
                  <span className="text-red-400 mt-1">•</span> Búsqueda lenta de expedientes entre decenas de cajones y carpetas.
                </li>
                <li className="flex items-start gap-3 text-slate-400">
                  <span className="text-red-400 mt-1">•</span> Agenda desorganizada, empalmes de citas y pacientes olvidados.
                </li>
                <li className="flex items-start gap-3 text-slate-400">
                  <span className="text-red-400 mt-1">•</span> Riesgo de pérdida por daño físico, robo del disco duro o virus.
                </li>
                <li className="flex items-start gap-3 text-slate-400">
                  <span className="text-red-400 mt-1">•</span> Recetas manuales sin identidad gráfica ni profesionalismo.
                </li>
              </ul>
            </div>

            {/* The NERVE Way */}
            <div className="bg-teal-950/20 border border-teal-500/30 rounded-2xl p-8 relative overflow-hidden shadow-[0_0_50px_-15px_rgba(20,184,166,0.15)] scale-100 lg:scale-[1.02]">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 to-cyan-400" />
              <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                <span className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 text-lg">✓</span>
                NERVE Health Systems
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-slate-300">
                  <IconCheck className="w-5 h-5 text-teal-400 shrink-0" /> Acceso instantáneo a cualquier nombre, diagnóstico o historial en un segundo.
                </li>
                <li className="flex items-start gap-3 text-slate-300">
                  <IconCheck className="w-5 h-5 text-teal-400 shrink-0" /> Agenda inteligente compartida en tiempo real con tu recepción.
                </li>
                <li className="flex items-start gap-3 text-slate-300">
                  <IconCheck className="w-5 h-5 text-teal-400 shrink-0" /> Cifrado de grado médico con respaldos diarios y automáticos.
                </li>
                <li className="flex items-start gap-3 text-slate-300">
                  <IconCheck className="w-5 h-5 text-teal-400 shrink-0" /> Recetas hermosas en PDF enviadas directamente al WhatsApp del paciente.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          FEATURES
          ================================================================ */}
      <section id="funciones" className="py-24 md:py-32 border-t border-white/[0.03]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-teal-400 text-sm font-semibold tracking-widest uppercase mb-3">Plataforma integral</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              El software médico con todo lo que tu consultorio necesita
            </h2>
            <p className="mt-4 text-slate-400 text-lg">
              Herramientas diseñadas específicamente para profesionales de la salud en México.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="group relative bg-slate-950/50 border border-slate-800/50 rounded-2xl p-6 hover:border-teal-500/20 transition-all duration-300 hover:bg-slate-900/30"
              >
                <div className="w-12 h-12 rounded-xl bg-teal-500/[0.08] border border-teal-500/10 flex items-center justify-center text-teal-400 mb-5 group-hover:bg-teal-500/[0.12] group-hover:border-teal-500/20 transition-colors">
                  {f.icon}
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          HOW IT WORKS
          ================================================================ */}
      <section className="py-24 md:py-32 border-t border-white/[0.03] bg-gradient-to-b from-transparent via-teal-950/[0.03] to-transparent">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-teal-400 text-sm font-semibold tracking-widest uppercase mb-3">Cómo funciona</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              Activo en menos de 5 minutos
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Crea tu cuenta", desc: "Elige tu plan, completa tus datos y los de tu clínica. Sin instalaciones ni configuraciones complicadas." },
              { step: "02", title: "Configura tu equipo", desc: "Invita a tus doctores y recepcionistas. Asigna roles y permisos en segundos desde tu panel de administración." },
              { step: "03", title: "Comienza a operar", desc: "Agenda citas, escribe notas clínicas y genera recetas desde el primer día. Tu clínica electrónica está lista." },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-teal-500/[0.08] border border-teal-500/10 flex items-center justify-center mx-auto mb-5">
                  <span className="text-xl font-bold bg-gradient-to-b from-teal-400 to-cyan-400 bg-clip-text text-transparent">{s.step}</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          INTERFAZ REAL (MOCKUPS)
          ================================================================ */}
      <section className="py-24 border-t border-white/[0.03] overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-teal-400 text-sm font-semibold tracking-widest uppercase mb-3">Conoce el producto</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              Una plataforma médica diseñada para la velocidad de tu consulta
            </h2>
          </div>

          <ProductShowcase />
        </div>
      </section>

      {/* ================================================================
          PRICING
          ================================================================ */}
      <section id="precios" className="py-24 md:py-32 border-t border-white/[0.03] bg-transparent">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-teal-400 text-sm font-semibold tracking-widest uppercase mb-3">Precios transparentes</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              Planes flexibles para software de gestión médica
            </h2>
            <p className="mt-4 text-slate-400 text-lg">
              Comienza con 14 días gratuitos. Sin compromisos, sin tarjeta de crédito.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-6 max-w-5xl mx-auto px-2 sm:px-4">
            {plans.map((plan, i) => (
              <div
                key={i}
                className={`relative rounded-2xl p-8 flex flex-col transition-all duration-300 ${
                  plan.highlighted
                    ? "bg-gradient-to-b from-teal-950/40 to-slate-950/60 border-2 border-teal-400/50 shadow-[0_0_40px_-5px_rgba(20,184,166,0.3)] md:scale-105 z-10"
                    : "bg-slate-950/50 border border-slate-800/50 mt-4 md:mt-0"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-teal-500 text-white text-xs font-semibold shadow-lg">
                    {plan.badge}
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                  <p className="text-sm text-slate-500 mt-1">{plan.subtitle}</p>
                </div>
                <div className="mb-6">
                  {plan.price === "Personalizado" ? (
                    <span className="text-3xl font-bold text-white">{plan.price}</span>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm text-slate-500">$</span>
                      <span className="text-4xl font-bold text-white">{plan.price}</span>
                      <span className="text-sm text-slate-500 ml-1">MXN{plan.period}</span>
                    </div>
                  )}
                  <p className="text-sm text-slate-500 mt-2">{plan.description}</p>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm text-slate-300">
                      <IconCheck className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`block text-center font-medium py-3 rounded-xl transition-all text-sm ${
                    plan.highlighted
                      ? "bg-teal-600 hover:bg-teal-500 text-white shadow-[0_0_20px_-5px_rgba(13,148,136,0.4)]"
                      : "bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-slate-600 mt-8">
            Todos los precios son en pesos mexicanos (MXN) e incluyen IVA. Facturación mensual.
          </p>
        </div>
      </section>

      {/* ================================================================
          TESTIMONIALS
          ================================================================ */}
      <section id="testimonios" className="py-24 md:py-32 border-t border-white/[0.03] bg-gradient-to-b from-transparent via-blue-950/[0.04] to-transparent">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-teal-400 text-sm font-semibold tracking-widest uppercase mb-3">Testimonios</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              Profesionales que confían en NERVE
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-slate-950/50 border border-slate-800/50 rounded-2xl p-8 relative">
                <IconQuote className="absolute top-6 right-6 w-10 h-10 text-teal-400" />
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <IconStar key={j} className="w-4 h-4 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed mb-6 italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div>
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          FAQ
          ================================================================ */}
      <section id="faq" className="py-24 md:py-32 border-t border-white/[0.03]">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-teal-400 text-sm font-semibold tracking-widest uppercase mb-3">Preguntas frecuentes</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              ¿Tienes dudas?
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <details
                key={i}
                className="group bg-slate-950/50 border border-slate-800/50 rounded-xl overflow-hidden"
              >
                <summary className="flex items-center justify-between px-6 py-4 cursor-pointer text-sm font-medium text-slate-200 hover:text-white transition-colors list-none [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <span className="ml-4 text-slate-500 group-open:rotate-45 transition-transform text-lg leading-none">+</span>
                </summary>
                <div className="px-6 pb-5 text-sm text-slate-400 leading-relaxed border-t border-slate-800/30 pt-3">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          FINAL CTA
          ================================================================ */}
      <section className="py-24 md:py-32 border-t border-white/[0.03]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            Digitaliza tu consultorio o clínica con NERVE{" "}
            <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">hoy</span>
          </h2>
          <p className="mt-4 text-slate-400 text-lg max-w-xl mx-auto">
            Únete a los profesionales de la salud que ya gestionan su práctica con NERVE.
            14 días gratis, sin compromiso.
          </p>
          <div className="mt-8">
            <Link
              href="/registro"
              className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white font-medium px-8 py-3.5 rounded-xl text-base transition-all shadow-[0_0_30px_-8px_rgba(13,148,136,0.5)] hover:shadow-[0_0_40px_-5px_rgba(13,148,136,0.6)] hover:-translate-y-0.5"
            >
              Comenzar prueba gratuita
              <IconArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ================================================================
          FOOTER & WHATSAPP WIDGET
          ================================================================ */}
      {/* WhatsApp Floating Button */}
      <a 
        href="https://wa.me/524464796116?text=Hola,%20me%20interesa%20probar%20el%20software%20clínico%20de%20NERVE." 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-400 text-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(34,197,94,0.4)] hover:shadow-[0_8px_40px_rgba(34,197,94,0.5)] transition-all hover:-translate-y-1 group"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm.029 18.88c-1.161 0-2.305-.292-3.318-.844l-3.677.964.984-3.595c-.607-1.052-.927-2.246-.926-3.468.001-3.825 3.113-6.937 6.937-6.937 3.825.001 6.938 3.113 6.938 6.938-.001 3.825-3.113 6.937-6.939 6.937z"/>
        </svg>
      </a>

      <footer className="border-t border-white/[0.04] bg-[#030710]">
        {/* Superior Guarantee Band */}
        <div className="border-b border-white/[0.02] bg-slate-900/10">
          <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-teal-400 font-medium tracking-wide">
              Misión Crítica. Cero Fallos.
            </p>
            <p className="text-sm text-slate-400 flex items-center gap-2">
              <IconShield className="w-4 h-4" /> Plataforma de gestión clínica de alta disponibilidad (SLA 99.9%).
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-4 gap-12 md:gap-8">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                  <Image src="/logo_nerve.svg" alt="NERVE" width={18} height={18} />
                </div>
                <span className="font-semibold text-white tracking-wide">NERVE</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Diseñada y desarrollada con orgullo para potenciar la salud digital de Latinoamérica y el mundo.
              </p>
              <div className="text-[10px] text-slate-600 space-y-1">
                <p><strong>NERVE Health Systems S.A. de C.V.</strong></p>
                <p>Jose Maria Morelos y Pavon #1306, Colonia Independencia, Coatzacoalcos, Veracruz, C.P. 96556, México.</p>
                <p>Contacto: soporte@nervehealthsystems.com</p>
                <p>Teléfono: +52 446 479 6116</p>
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Producto</h4>
              <ul className="space-y-2.5">
                <li><a href="#funciones" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Funciones</a></li>
                <li><a href="#precios" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Precios</a></li>
                <li><a href="#faq" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Empresa</h4>
              <ul className="space-y-2.5">
                <li><a href="#" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Acerca de</a></li>
                <li><a href="mailto:soporte@nervehealthsystems.com" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Contacto</a></li>
                <li><a href="https://www.linkedin.com/company/nerve-health-systems/" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-2">LinkedIn</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Legal</h4>
              <ul className="space-y-2.5">
                <li><Link href="/legal/privacidad" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Privacidad</Link></li>
                <li><Link href="/legal/terminos" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Términos de servicio</Link></li>
                <li><Link href="/legal/cookies" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Aviso de cookies</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-600">
              © {new Date().getFullYear()} NERVE Health Systems. Todos los derechos reservados.
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              Creada y potenciada por <a href="https://jecamavi.com" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:text-teal-300 transition-colors">JECAMAVI</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
