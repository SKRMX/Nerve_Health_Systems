# NERVE Health Systems — Sprint 1 académico

Este documento concentra la entrega de **Evaluación Unidad III — Primer sprint del proyecto** de la asignatura Desarrollo de Software.

## Acceso rápido

- [Guía de ejecución del Sprint 1](docs/academic/sprint-1/README.md)
- [Reporte funcional del Sprint 1](docs/academic/sprint-1/sprint_report.md)
- [Índice de evidencias](docs/academic/sprint-1/evidence/README.md)

## Alcance certificado

El Sprint 1 se delimita al flujo funcional principal de NERVE Health Systems:

1. autenticación e ingreso al sistema;
2. gestión de pacientes;
3. agenda médica;
4. consulta y gestión de citas;
5. acceso a expedientes;
6. generación y previsualización de recetas PDF.

El repositorio completo contiene módulos adicionales, pero para esta actividad el alcance evaluado se limita a este flujo.

## Repositorio

https://github.com/SKRMX/Nerve_Health_Systems

## Ejecución básica

```bash
git clone https://github.com/SKRMX/Nerve_Health_Systems.git
cd Nerve_Health_Systems
npm install
cp .env.example .env.local
npm run dev
```

La aplicación requiere un proyecto Supabase compatible. Las instrucciones detalladas se encuentran en la [guía del Sprint 1](docs/academic/sprint-1/README.md).

> No se incluyen credenciales, tokens ni secretos reales en el repositorio.
