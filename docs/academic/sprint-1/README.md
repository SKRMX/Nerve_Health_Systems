# Sprint 1 — Guía de ejecución

## 1. Objetivo

Este Sprint 1 presenta una primera iteración funcional de **NERVE Health Systems**, plataforma web SaaS orientada a la gestión clínica y administrativa.

El propósito de esta entrega es demostrar un flujo pequeño pero completo y ejecutable, retomando el código desarrollado en las actividades previas de **Codificación** y **Librerías y API**.

## 2. Alcance funcional

El flujo evaluado comprende:

- inicio de sesión;
- listado y gestión de pacientes;
- agenda médica;
- consulta y gestión de citas;
- acceso a expedientes;
- generación y previsualización de recetas PDF.

Otros módulos del repositorio —pagos, WhatsApp, Telegram, reportes, inventario, finanzas, superadministración y aplicaciones móviles— quedan fuera del alcance académico de este Sprint 1.

## 3. Tecnologías principales

| Tecnología | Uso en el Sprint 1 |
|---|---|
| TypeScript 5 | Lenguaje principal y tipado |
| Next.js 16.2.3 | Aplicación web y rutas |
| React 19.2.4 | Interfaz y componentes |
| Supabase / PostgreSQL | Persistencia, autenticación y sesiones |
| react-big-calendar | Agenda médica |
| date-fns | Manejo y localización de fechas |
| @react-pdf/renderer | Generación de recetas PDF |

## 4. Requisitos

- Node.js 20 o superior.
- npm.
- Proyecto Supabase compatible con el esquema incluido en el repositorio.
- Navegador web moderno.

Los servicios externos de Stripe, Mercado Pago, WhatsApp, Resend y Telegram **no son necesarios para evaluar el núcleo del Sprint 1**.

## 5. Instalación

```bash
git clone https://github.com/SKRMX/Nerve_Health_Systems.git
cd Nerve_Health_Systems
npm install
```

## 6. Variables de entorno

Crear el archivo local a partir del ejemplo:

```bash
cp .env.example .env.local
```

Para el flujo académico deben configurarse, como mínimo, las variables de Supabase correspondientes al entorno de prueba:

```env
NEXT_PUBLIC_SUPABASE_URL="https://<proyecto>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon-key>"
SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
```

Las claves anteriores deben pertenecer al entorno utilizado por quien ejecute el proyecto. **Nunca deben versionarse credenciales reales.**

Las variables de pagos, mensajería y notificaciones pueden permanecer sin configurar mientras no se prueben esos módulos.

## 7. Base de datos

El esquema base se encuentra en:

```text
supabase_schema.sql
```

Este script contiene las entidades principales requeridas por el Sprint 1, entre ellas clínicas, usuarios, pacientes, citas, expedientes y recetas.

Para funcionalidades complementarias del perfil médico puede aplicarse también:

```text
supabase_schema_doctor_profiles.sql
```

Los scripts pueden ejecutarse desde el SQL Editor de Supabase en un entorno de prueba.

## 8. Ejecución

```bash
npm run dev
```

Abrir:

```text
http://localhost:3000
```

Para verificar compilación de producción:

```bash
npm run build
```

La última validación técnica previa a este empaquetado académico finalizó correctamente con Next.js 16.2.3 y generó las 53 rutas del proyecto. Este Sprint 1 documental no modifica código productivo.

## 9. Flujo sugerido de prueba

1. Iniciar sesión con un usuario de prueba.
2. Abrir **Pacientes** y verificar el directorio.
3. Abrir **Agenda**.
4. Consultar o crear una cita de demostración.
5. Abrir el expediente de un paciente de prueba.
6. Consultar la sección de recetas.
7. Previsualizar una receta mediante el visor PDF.

No utilizar información clínica real durante la demostración.

## 10. Evidencias relacionadas

- UML de clases: [docs/uml/diagrama-clases-nerve.png](../../uml/diagrama-clases-nerve.png)
- Evidencia de Supabase: [docs/evidence/libraries-api/02_supabase_functional_usage.png](../../evidence/libraries-api/02_supabase_functional_usage.png)
- Agenda médica: [docs/evidence/libraries-api/04_react_big_calendar_ui.png](../../evidence/libraries-api/04_react_big_calendar_ui.png)
- Localización de fechas: [docs/evidence/libraries-api/06_date_fns_functional_usage.png](../../evidence/libraries-api/06_date_fns_functional_usage.png)
- Receta PDF: [docs/evidence/libraries-api/08_react_pdf_generated.png](../../evidence/libraries-api/08_react_pdf_generated.png)

## 11. Seguridad

- No se almacenan secretos reales en GitHub.
- `.env.local` permanece fuera del control de versiones.
- Las evidencias académicas utilizan datos de demostración.
- La arquitectura multi-tenant utiliza `clinic_id` y políticas de acceso asociadas al backend Supabase.

## 12. Repositorio

https://github.com/SKRMX/Nerve_Health_Systems
