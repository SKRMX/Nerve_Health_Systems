# Reporte funcional — NERVE Health Systems Sprint 1

## 1. Descripción

NERVE Health Systems es una plataforma web SaaS para la gestión clínica y administrativa de consultorios. La aplicación productiva es más amplia que el alcance solicitado por la actividad, por lo que para la Evaluación de Unidad III se delimitó un **Sprint 1 académico** con un flujo funcional verificable.

## 2. Resultado del Sprint 1

La primera iteración certificada permite demostrar el siguiente recorrido:

```text
Autenticación
    ↓
Pacientes
    ↓
Agenda médica
    ↓
Gestión de cita
    ↓
Expediente
    ↓
Receta PDF
```

Este flujo integra interfaz, persistencia, modelo de dominio y librerías externas dentro del mismo proyecto.

## 3. Funcionalidades incluidas

### 3.1 Autenticación

El sistema utiliza Supabase para establecer la sesión del usuario y obtener su perfil. La sesión permite identificar la clínica y rol asociados.

### 3.2 Pacientes

El directorio de pacientes consulta información mediante Supabase y mantiene separación lógica por clínica.

### 3.3 Agenda

La Agenda utiliza `react-big-calendar` para representar las citas y `date-fns` para el cálculo y formato de fechas en español.

Las citas se obtienen de PostgreSQL/Supabase y se convierten en eventos visuales del calendario.

### 3.4 Gestión de cita

Desde la Agenda es posible seleccionar eventos y gestionar información como fecha, hora, duración, tipo y estado dentro del flujo implementado.

### 3.5 Expedientes

El módulo de Expedientes centraliza información clínica, notas y recetas asociadas al paciente.

### 3.6 Receta PDF

`@react-pdf/renderer` permite construir y previsualizar recetas PDF desde la propia aplicación mediante componentes React.

## 4. Correspondencia con actividades previas

| Elemento del curso | Aplicación en el Sprint 1 |
|---|---|
| Programación Orientada a Objetos | Capa `src/domain/` con User, Doctor, Receptionist, Patient y Appointment |
| TypeScript | Tipado del dominio, componentes, estados y datos |
| Librerías y API | Supabase, react-big-calendar, date-fns y @react-pdf/renderer |
| Persistencia | PostgreSQL mediante Supabase |
| Arquitectura por componentes | Separación entre páginas, componentes, hooks, librerías y dominio |
| Control de versiones | Historial de Git y GitHub con commits independientes |

## 5. Conceptos y elementos del curso más útiles

### Programación Orientada a Objetos

La POO permitió traducir entidades del dominio médico a clases explícitas. La clase abstracta `User` concentra comportamiento común y `Doctor` y `Receptionist` representan especializaciones. `Patient` y `Appointment` modelan entidades centrales del flujo clínico.

Este enfoque resultó útil porque mantiene una relación clara entre el análisis previo, el diagrama UML y el código.

### TypeScript y tipado

TypeScript facilita expresar contratos de datos, enumeraciones, propiedades y estados. En un proyecto con pacientes, citas, usuarios y distintos roles, el tipado reduce ambigüedades y mejora la mantenibilidad frente a JavaScript sin tipos.

### Uso de librerías y APIs

Uno de los aprendizajes más importantes fue identificar cuándo conviene utilizar herramientas especializadas en lugar de desarrollar todas las funciones desde cero.

Supabase resuelve persistencia y autenticación; react-big-calendar resuelve la representación temporal de eventos; date-fns estandariza fechas; y @react-pdf/renderer genera documentos PDF dentro del ecosistema React.

### Separación de responsabilidades

La organización del proyecto en `app/`, `components/`, `hooks/`, `lib/` y `domain/` permite separar presentación, acceso a datos, lógica compartida y modelo de dominio. Esto facilita modificar una parte del sistema sin concentrar toda la lógica en un solo archivo.

### Git y GitHub

GitHub resultó fundamental para documentar la evolución del proyecto mediante commits independientes. El repositorio funciona como evidencia verificable de las actividades de Codificación, Librerías/API y del presente Sprint 1.

## 6. Evidencia previa reutilizada

Las actividades anteriores ya dejaron evidencia técnica versionada:

- diagrama UML formal;
- implementación POO en `src/domain/`;
- cliente Supabase y consultas multi-tenant;
- Agenda médica funcionando;
- localización de fechas con date-fns;
- receta PDF generada desde NERVE.

Índice: [evidence/README.md](evidence/README.md)

## 7. Validación

Antes del empaquetado académico del Sprint 1, la versión funcional del proyecto fue validada mediante:

```bash
npm run build
```

Resultado documentado en la actividad previa:

- build exitoso;
- Next.js 16.2.3;
- 53 rutas generadas;
- 0 errores introducidos por la documentación académica.

La presente entrega añade exclusivamente documentación y no modifica el código productivo de NERVE.

## 8. Conclusión

El Sprint 1 demuestra que los conceptos vistos durante el curso pueden integrarse en un flujo funcional de software y no únicamente en ejercicios aislados. La combinación de POO, TypeScript, componentes, persistencia, librerías externas y control de versiones permite mantener un proyecto real con una estructura más clara y verificable.

La funcionalidad presentada constituye una primera iteración académica del sistema; NERVE continúa incluyendo módulos adicionales fuera del alcance evaluado en esta unidad.
