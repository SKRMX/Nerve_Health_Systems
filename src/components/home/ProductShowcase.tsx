"use client";

import React, { useState } from "react";

const MODULES = [
  {
    id: "dashboard",
    label: "Dashboard",
    title: "Panel de Gestión Central",
    desc: "Visualiza de un vistazo la ocupación de tu clínica, citas del día y métricas clave de rendimiento.",
    img: "/screenshots/dashboard.png",
  },
  {
    id: "agenda",
    label: "Agenda",
    title: "Calendario Inteligente",
    desc: "Administra citas con facilidad en vistas diaria, semanal y mensual. Arrastra y suelta para reprogramar.",
    img: "/screenshots/agenda.png",
  },
  {
    id: "pacientes",
    label: "Directorio",
    title: "Base de Datos Clínica",
    desc: "Busca y gestiona la información de tus pacientes de forma instantánea y organizada.",
    img: "/screenshots/pacientes.png",
  },
  {
    id: "expedientes",
    label: "Expedientes",
    title: "Historia Clínica Digital",
    desc: "Crea notas clínicas, diagnósticos y recetas electrónicas con un formato profesional y seguro.",
    img: "/screenshots/expedientes.png",
  },
  {
    id: "configuracion",
    label: "Perfil Público",
    title: "Perfil Público de Reservas",
    desc: "Página de reserva personalizada con galería de fotos, mapas interactivos y tu agenda en tiempo real.",
    img: "/screenshots/configuracion.png",
  },
];

export function ProductShowcase() {
  const [activeTab, setActiveTab] = useState(MODULES[0]);

  return (
    <div className="w-full">
      {/* Tabs Layout */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
        {MODULES.map((mod) => (
          <button
            key={mod.id}
            onClick={() => setActiveTab(mod)}
            className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 border ${
              activeTab.id === mod.id
                ? "bg-teal-600/10 border-teal-500/50 text-teal-400 shadow-[0_0_20px_-5px_rgba(20,184,166,0.3)]"
                : "bg-transparent border-white/5 text-slate-500 hover:text-slate-300 hover:border-white/10"
            }`}
          >
            {mod.label}
          </button>
        ))}
      </div>

      {/* Content Layout */}
      <div className="grid lg:grid-cols-12 gap-12 items-center">
        {/* Info Column */}
        <div className="lg:col-span-4 space-y-6 text-center lg:text-left">
          <div className="space-y-2">
            <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight animate-in fade-in slide-in-from-left-4 duration-500">
              {activeTab.title}
            </h3>
            <p className="text-slate-400 text-lg leading-relaxed animate-in fade-in slide-in-from-left-6 duration-700">
              {activeTab.desc}
            </p>
          </div>
          
          <div className="flex items-center gap-4 justify-center lg:justify-start py-4">
             <div className="flex -space-x-2">
                {[1,2,3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-[#050a12] bg-slate-800" />
                ))}
             </div>
             <p className="text-xs text-slate-500 font-medium">Validado por +150 Doctores</p>
          </div>
        </div>

        {/* Screenshot Column */}
        <div className="lg:col-span-8">
          <div className="relative group">
            {/* Backdrop glow */}
            <div className="absolute -inset-4 bg-teal-500/5 rounded-[2.5rem] blur-2xl group-hover:bg-teal-500/10 transition-colors duration-500" />
            
            <div className="relative rounded-2xl md:rounded-[2rem] border border-white/10 bg-slate-900/50 p-2 md:p-3 shadow-2xl overflow-hidden aspect-[16/10] md:aspect-[16/9]">
              <div className="absolute top-0 left-0 w-full h-full bg-slate-950 animate-pulse" />
              <img
                key={activeTab.id}
                src={activeTab.img}
                alt={activeTab.title}
                className="relative w-full h-full object-cover rounded-xl md:rounded-[1.5rem] animate-in fade-in zoom-in-95 duration-500 z-10"
                onLoad={(e) => {
                    (e.currentTarget.previousSibling as HTMLElement).classList.add('hidden');
                }}
              />
              
              {/* Device Frame Reflection */}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/[0.02] to-transparent z-20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
