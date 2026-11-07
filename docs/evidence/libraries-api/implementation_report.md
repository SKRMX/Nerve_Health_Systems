# Librerías y API implementadas en NERVE Health Systems

Este documento presenta la auditoría técnica y funcional de las cuatro librerías y APIs idóneas ya integradas y operativas en el núcleo de **NERVE Health Systems**.

---

## 1. Supabase JS / SSR

- **Versión real instalada:**  
  - `@supabase/supabase-js`: `^2.103.0`  
  - `@supabase/ssr`: `^0.10.2`
- **Archivos donde se usa:**  
  - `src/lib/supabase/client.ts` (Cliente de navegador para componentes cliente)
  - `src/lib/supabase/server.ts` (Cliente de servidor para Server Components y Route Handlers)
  - `src/lib/supabase/middleware.ts` / `src/proxy.ts` (Gestión y refresco de tokens de sesión mediante cookies)
  - `src/app/dashboard/agenda/page.tsx` (Consultas de agenda y pacientes)
  - `src/app/dashboard/pacientes/page.tsx` (Gestión del directorio de pacientes)
  - `src/app/dashboard/expedientes/page.tsx` (Notas clínicas, diagnósticos y recetas)
  - `src/hooks/useAuth.tsx` (Proveedor de contexto de autenticación y perfil del usuario)
- **Función técnica:**  
  Proporciona la infraestructura de Backend-as-a-Service (BaaS) interactuando directamente con PostgreSQL. Ofrece cliente tipado para consultas relationales (`select`, `insert`, `update`, `delete`), autenticación segura basada en tokens JWT persistidos en cookies HTTP-only (`@supabase/ssr`) y políticas de seguridad a nivel de fila (Row Level Security - RLS).
- **Uso en NERVE:**  
  Es la capa central de persistencia de datos. Garantiza el aislamiento multi-tenant estricto mediante el filtrado obligatorio por `clinic_id` (tanto en código TypeScript como en RLS en PostgreSQL). Evita construir manualmente APIs REST CRUD redundantes, gestionando de forma declarativa las relaciones entre clínicas, usuarios (médicos/recepcionistas), pacientes, citas (`appointments`) y expedientes (`medical_records`).
- **Fragmentos/símbolos relevantes:**  
  `createBrowserClient`, `createServerClient`, `supabase.from('patients').select(...)`, `supabase.from('appointments').select(...)`.
- **Capturas asociadas:**  
  - `01_supabase_dependency_code.png` (Declaración del cliente y consulta relacional en código)  
  - `02_supabase_functional_usage.png` (Modal interactivo de cita en NERVE con datos de prueba cargados desde PostgreSQL)

---

## 2. react-big-calendar

- **Versión real instalada:**  
  - `react-big-calendar`: `^1.19.4`
- **Archivos donde se usa:**  
  - `src/app/dashboard/agenda/page.tsx`
- **Función técnica:**  
  Componente de calendario interactivo para aplicaciones React diseñado específicamente para la gestión de eventos temporales con soporte de arrastre, selección de rangos, vistas temporales configurables y personalización de celdas horarias.
- **Uso en NERVE:**  
  Constituye la interfaz visual y operativa del módulo de **Agenda Médica**. Mapea los registros de la tabla `appointments` de Supabase a objetos `ClinicEvent`, renderizando la cuadrícula semanal entre las 07:00 y las 21:00 horas. Permite visualizar el estado de cada paciente ("Programado", "En sala", "Completado"), su modalidad (presencial o teleconsulta) mediante codificación por color, selección de celdas para agendar nuevas citas y selección de eventos existentes para reagendar o iniciar consulta.
- **Fragmentos/símbolos relevantes:**  
  `import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar"`, `localizer={localizer}`, `events={events}`, `view={currentView}`, `<Calendar ... />`.
- **Capturas asociadas:**  
  - `03_react_big_calendar_code.png` (Configuración de localizer y renderizado del componente `<Calendar />`)  
  - `04_react_big_calendar_ui.png` (Interfaz real de la Agenda clínica de NERVE funcionando)

---

## 3. date-fns

- **Versión real instalada:**  
  - `date-fns`: `^4.1.0`
- **Archivos donde se usa:**  
  - `src/app/dashboard/agenda/page.tsx`
  - `src/app/dashboard/expedientes/page.tsx`
  - `src/app/dashboard/finanzas/page.tsx`
- **Función técnica:**  
  Biblioteca modular, funcional e inmutable para manipulación, formateo, aritmética y localización de fechas en JavaScript/TypeScript, evitando la sobrecarga y mutabilidad de objetos nativos o librerías monolíticas como Moment.js.
- **Uso en NERVE:**  
  1. Actúa como el motor de cálculo temporal para `dateFnsLocalizer` en `react-big-calendar`.
  2. Configura el inicio de la semana médica en lunes (`weekStartsOn: 1`).
  3. Proporciona localización completa al español latinoamericano mediante `date-fns/locale/es`.
  4. Genera dinámicamente las etiquetas de los rangos semanales en el toolbar superior (`getToolbarDateLabel`), por ejemplo: `2 - 8 DE NOVIEMBRE`.
  5. Formatea fechas oficiales en las recetas médicas expedidas en el módulo de expedientes (`format(date, "PPP", { locale: es })`).
- **Fragmentos/símbolos relevantes:**  
  `format`, `parse`, `startOfWeek`, `getDay`, `import { es } from "date-fns/locale/es"`, `dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales: { "es": es } })`.
- **Capturas asociadas:**  
  - `05_date_fns_code.png` (Imports, configuración de localizador en español y función `getToolbarDateLabel`)  
  - `06_date_fns_functional_usage.png` (Cabecera y columnas de la agenda traducidas al español: `2 - 8 DE NOVIEMBRE`, `lun`, `mar`, `mié`, `jue`, `vie`, `sáb`, `dom`)

---

## 4. @react-pdf/renderer

- **Versión real instalada:**  
  - `@react-pdf/renderer`: `^4.4.1`
- **Archivos donde se usa:**  
  - `src/components/features/PrescriptionPDF.tsx` (Definición del documento, estilos y layout de la receta médica)
  - `src/app/dashboard/expedientes/page.tsx` (Integración con `PDFViewer` e invocación dentro del flujo de consulta)
- **Función técnica:**  
  Framework declarativo para generar documentos PDF utilizando componentes React tanto en el lado del cliente como en Node.js, implementando un motor de diseño basado en flexbox mediante estilos nativos (`StyleSheet`).
- **Uso en NERVE:**  
  Permite la emisión de **recetas médicas digitales oficiales**. El componente `PrescriptionPDF` recibe el expediente del paciente, la lista de medicamentos prescritos (nombre, dosis, instrucciones), la fecha formateada y el perfil del médico tratante (cédula profesional, especialidad, clínica, membrete y firma). Se previsualiza directamente en el navegador del médico mediante el visor integrado `<PDFViewer showToolbar={true}>`, permitiendo su descarga inmediata en PDF o impresión física sin requerir servicios externos de renderizado.
- **Fragmentos/símbolos relevantes:**  
  `Document`, `Page`, `View`, `Text`, `StyleSheet.create`, `const PDFViewer = dynamic(() => import("@react-pdf/renderer").then(mod => mod.PDFViewer), { ssr: false })`, `<PrescriptionPDF patient={selectedPatient} medications={...} ... />`.
- **Capturas asociadas:**  
  - `07_react_pdf_code.png` (Estructura declarativa del documento PDF y estilos en `PrescriptionPDF.tsx`)  
  - `08_react_pdf_generated.png` (Documento oficial de receta médica emitido por NERVE con datos de prueba, previsualizado en el visor integrado)

---

## Matriz de correspondencia

| Tecnología | Dependencia | Archivo principal | Uso funcional | Evidencia técnica |
|---|---|---|---|---|
| **Supabase JS / SSR** | `@supabase/supabase-js` (`^2.103.0`)<br>`@supabase/ssr` (`^0.10.2`) | `src/lib/supabase/client.ts`<br>`src/app/dashboard/agenda/page.tsx` | Acceso a PostgreSQL, autenticación por cookies y consultas multi-tenant con aislamiento por clínica (`clinic_id`). | `01_supabase_dependency_code.png`<br>`02_supabase_functional_usage.png` |
| **react-big-calendar** | `react-big-calendar` (`^1.19.4`) | `src/app/dashboard/agenda/page.tsx` | Cuadrícula interactiva de la agenda médica con vistas día/semana/mes, horarios y eventos por paciente. | `03_react_big_calendar_code.png`<br>`04_react_big_calendar_ui.png` |
| **date-fns** | `date-fns` (`^4.1.0`) | `src/app/dashboard/agenda/page.tsx` | Localización en español (`es`), cálculo de inicio de semana (`startOfWeek`) y formateo dinámico de rangos de fechas. | `05_date_fns_code.png`<br>`06_date_fns_functional_usage.png` |
| **@react-pdf/renderer** | `@react-pdf/renderer` (`^4.4.1`) | `src/components/features/PrescriptionPDF.tsx`<br>`src/app/dashboard/expedientes/page.tsx` | Generación y previsualización de recetas médicas oficiales con membrete, cédula, medicamentos y firma. | `07_react_pdf_code.png`<br>`08_react_pdf_generated.png` |

---

## Estado de compilación

- **Ejecución de verificación:**  
  ```bash
  npm run build
  ```
- **Resultado de compilación:**  
  **Exitoso (`exit code 0`)**. La aplicación compiló satisfactoriamente con Next.js 16.2.3 (Turbopack), generando las 53 rutas estáticas y dinámicas de producción.
- **Distinción de errores de tipos:**  
  - **Errores introducidos por esta actividad:** **`0 errores`**. Ningún archivo de código productivo en `src/`, configuración ni dependencias en `package.json` fue modificado.
  - **Errores TypeScript preexistentes en el repositorio:** `17 errores` en 9 archivos preexistentes (por ejemplo incompatibilidades de tipos en SDK de Stripe y tipado flexible en vistas públicas y de configuración), los cuales no impiden la construcción ni ejecución productiva del sistema.
