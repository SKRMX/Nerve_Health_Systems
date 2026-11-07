# Evidencias de Librerías y API en NERVE Health Systems

Índice de capturas técnicas y funcionales que comprueban la selección, integración y funcionamiento de las cuatro librerías/API fundamentales del sistema:

| Archivo | Librería/API | Qué demuestra |
|---|---|---|
| `00_package_dependencies.png` | Dependencias del Proyecto | Declaración formal de `@supabase/supabase-js`, `@supabase/ssr`, `react-big-calendar`, `date-fns` y `@react-pdf/renderer` en `package.json`. |
| `01_supabase_dependency_code.png` | Supabase JS / SSR | Inicialización del cliente mediante `createBrowserClient` en `src/lib/supabase/client.ts` y consultas multi-tenant con aislamiento por `clinic_id` en `src/app/dashboard/agenda/page.tsx`. |
| `02_supabase_functional_usage.png` | Supabase JS / SSR | NERVE en ejecución interactuando con PostgreSQL/Supabase: cita y expediente de prueba cargados dinámicamente y modal de gestión clínica desplegado. |
| `03_react_big_calendar_code.png` | react-big-calendar | Importación, configuración de `dateFnsLocalizer`, localización en español y renderizado de la cuadrícula `<Calendar ... />` en `src/app/dashboard/agenda/page.tsx`. |
| `04_react_big_calendar_ui.png` | react-big-calendar | Interfaz real de la Agenda médica de NERVE: cuadrícula semanal interactiva, bloques horarios y citas agendadas con código de color. |
| `05_date_fns_code.png` | date-fns | Uso de funciones auxiliares (`format`, `parse`, `startOfWeek`, `getDay`), locale en español `es` y función `getToolbarDateLabel` para la navegación de la agenda. |
| `06_date_fns_functional_usage.png` | date-fns | Renderizado visual localizado en español dentro de la Agenda: rango dinámico semanal (`2 - 8 DE NOVIEMBRE`) y cabeceras de columnas traducidas (`lun`, `mar`, `mié`, `jue`, `vie`, `sáb`, `dom`). |
| `07_react_pdf_code.png` | @react-pdf/renderer | Importación de primitivas PDF (`Document`, `Page`, `View`, `Text`, `StyleSheet`) y construcción de la plantilla de receta médica en `src/components/features/PrescriptionPDF.tsx`. |
| `08_react_pdf_generated.png` | @react-pdf/renderer | Documento oficial de receta médica PDF generado dinámicamente en NERVE, previsualizado en el visor `PDFViewer` con membrete clínico, paciente, medicamentos indicados y firma digital. |
