# NERVE Health Systems

Plataforma SaaS multi-tenant de gestión médica, expedientes clínicos electrónicos, agenda en tiempo real, perfil médico público, teleconsultas, control de inventario y finanzas para médicos independientes, consultorios y clínicas.

## Tecnologías Utilizadas

- **Framework Web & API:** Next.js 16.2.3 (App Router) + React 19.2.4 + TypeScript 5
- **Estilos & UI:** Tailwind CSS v4, shadcn/ui, Base UI (`@base-ui/react`), Lucide Icons, Sonner
- **Base de Datos, Autenticación y Storage:** Supabase (`@supabase/supabase-js`, `@supabase/ssr`) con PostgreSQL y Row Level Security (RLS)
- **Pagos y Suscripciones:**
  - Stripe (`stripe`, `@stripe/stripe-js`, `@stripe/react-stripe-js`) — Suscripciones de plataforma y cobros médicos mediante Stripe Connect Custom
  - Mercado Pago (`@mercadopago/sdk-react`) — Suscripciones y vinculación OAuth para cobros
- **Notificaciones Multicanal:**
  - WhatsApp multi-instancia vía Evolution API
  - Correo electrónico transaccional vía Resend (`resend`)
  - Alertas operativas vía Telegram Bot API
- **Generación de Documentos:** Recetas médicas en PDF con `@react-pdf/renderer`
- **Agenda y Fechas:** `react-big-calendar`, `date-fns`
- **Empaquetado Móvil Híbrido:** Capacitor 8 (`@capacitor/core`, `@capacitor/android`, `@capacitor/ios`, `@capacitor/status-bar`, `@capacitor/keyboard`)

## Requisitos Previos

- **Node.js:** v20 o superior
- **npm:** incluido con Node.js
- Proyecto activo en **Supabase** (PostgreSQL + Auth + Storage)
- Credenciales de servicios externos según los módulos a utilizar (Stripe, Mercado Pago, Evolution API, Resend, Telegram)

## Instalación de Dependencias

```bash
git clone https://github.com/SKRMX/Nerve_Health_Systems.git
cd Nerve_Health_Systems
npm install
```

## Configuración de Variables de Entorno

1. Copia el archivo de ejemplo `.env.example` a `.env.local`:

```bash
cp .env.example .env.local
```

2. Configura las variables en `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
   - `MP_CLIENT_ID`, `NEXT_PUBLIC_MP_PUBLIC_KEY`, `MP_ACCESS_TOKEN`
   - `EVOLUTION_API_URL`, `EVOLUTION_GLOBAL_API_KEY`, `NERVE_WA_INSTANCE_TOKEN`
   - `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
   - `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
   - `CRON_SECRET`

## Base de Datos y Migraciones (Supabase)

Ejecuta en el editor SQL de Supabase los esquemas incluidos en el proyecto:

1. `supabase_schema.sql` — Esquema base multi-tenant (`clinics`, `users`, `patients`, `appointments`, `medical_records`, `prescriptions`) y políticas RLS
2. `supabase_schema_photos.sql` — Tabla `medical_record_photos` y políticas para el bucket privado `clinical-attachments`
3. `supabase_schema_doctor_profiles.sql` — Perfiles públicos de doctores (`doctor_profiles`), reservas públicas y publicación en Supabase Realtime
4. `supabase_schema_gallery.sql` — Galería de fotos del consultorio y campos de dirección detallada
5. `supabase_schema_teleconsulta_pagos.sql` — Teleconsultas, pagos integrados, almacén (`inventory_items`), ventas por cita (`appointment_sales`) y gastos (`clinic_expenses`)
6. `supabase_schema_stripe_custom.sql` — Soporte internacional multimoneda y cuentas conectadas de Stripe Connect Custom
7. `scripts/enforce_isolation.sql` — Refuerzo de aislamiento multi-tenant mediante RLS

## Ejecución Local y Scripts Disponibles

Comandos definidos en `package.json`:

```bash
# Iniciar servidor de desarrollo (http://localhost:3000)
npm run dev

# Compilar aplicación para producción
npm run build

# Iniciar servidor en modo producción (requiere ejecutar build antes)
npm run start

# Ejecutar linter (ESLint)
npm run lint

# Sincronizar assets web con proyectos nativos de Capacitor
npm run cap:sync

# Agregar u abrir plataformas nativas en Capacitor
npm run cap:add:android
npm run cap:add:ios
npm run cap:android
npm run cap:ios
```

## Estructura General del Proyecto

```text
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── attachments/          # Subida, listado y tokens de adjuntos clínicos
│   │   │   ├── auth/                 # Sesión actual y OAuth con Mercado Pago
│   │   │   ├── checkout/             # Suscripciones y cobros (Stripe / Mercado Pago)
│   │   │   ├── dashboard/doctor/     # Perfil del médico y subida de foto/galería
│   │   │   ├── doctor/               # Configuración bancaria, sesión y portal de Stripe Connect
│   │   │   ├── notifications/        # Bienvenida, confirmación, recordatorios y resumen diario
│   │   │   ├── notify/               # Endpoint de notificaciones internas
│   │   │   ├── public/               # API pública de perfil médico y agendamiento de citas
│   │   │   ├── seed/                 # Generación de datos de demostración
│   │   │   ├── superadmin/           # Gestión global de clínicas (Superadmin)
│   │   │   ├── webhooks/             # Webhooks de Stripe y Mercado Pago
│   │   │   └── whatsapp/             # Gestión de instancias y QR de WhatsApp (Evolution API)
│   │   ├── dashboard/
│   │   │   ├── agenda/               # Calendario interactivo de citas
│   │   │   ├── checkout/             # Flujo de pago de suscripción
│   │   │   ├── configuracion/        # Perfil médico, horarios, pagos, WhatsApp y recetas
│   │   │   ├── equipo/               # Gestión de médicos y recepcionistas de la clínica
│   │   │   ├── expedientes/          # Historia clínica, notas, adjuntos y recetas en PDF
│   │   │   ├── finanzas/             # Ingresos, gastos de clínica y balance financiero
│   │   │   ├── inventario/           # Control de almacén, stock y alertas de inventario
│   │   │   ├── pacientes/            # Directorio y fichas de pacientes
│   │   │   ├── reportes/             # Métricas y analítica clínica
│   │   │   ├── superadmin/           # Panel de administración global de tenants
│   │   │   └── suscripcion/          # Estado y administración del plan de suscripción
│   │   ├── dr/[slug]/                # Página pública del médico para agendar citas en línea
│   │   ├── legal/                    # Términos, aviso de privacidad y política de cookies
│   │   ├── login/                    # Inicio de sesión
│   │   ├── registro/                 # Registro de clínica/médico
│   │   └── upload-bridge/            # Puente móvil mediante QR para carga rápida de fotos clínicas
│   ├── components/
│   │   ├── features/                 # Gráficas de dashboard y generador de recetas PDF
│   │   ├── home/                     # Componentes de la landing page y guardia de app nativa
│   │   ├── layout/                   # Sidebar, header, navegación móvil y layout legal
│   │   ├── onboarding/               # Modal y checklist de configuración inicial
│   │   └── ui/                       # Componentes base de interfaz (shadcn/ui)
│   ├── hooks/                        # Hooks de autenticación (useAuth) y perfil médico (useDoctorProfile)
│   └── lib/                          # Clientes Supabase, pagos, criptografía, internacionalización y notificaciones
├── public/                           # Logos, manifest PWA y capturas de pantalla de la plataforma
├── scripts/                          # Scripts SQL de aislamiento RLS y datos demo
├── android/                          # Proyecto nativo Android (Capacitor)
├── ios/                              # Proyecto nativo iOS (Capacitor)
├── supabase_schema*.sql              # Esquemas y migraciones SQL de PostgreSQL / Supabase
├── middleware.ts                     # Middleware de sesión de Supabase en Next.js
├── capacitor.config.ts               # Configuración de Capacitor
└── next.config.ts                    # Configuración de Next.js
```

## Licencia

Privado — Todos los derechos reservados. NERVE Health Systems.
