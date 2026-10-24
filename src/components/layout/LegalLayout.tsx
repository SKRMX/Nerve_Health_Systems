import React from "react";
import Link from "next/link";
import Image from "next/image";

interface LegalLayoutProps {
  children: React.ReactNode;
  title: string;
  lastUpdated: string;
}

export function LegalLayout({ children, title, lastUpdated }: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-[#050a12] text-slate-300 antialiased selection:bg-teal-500/30 selection:text-teal-200">
      {/* Navbar simplificada */}
      <nav className="border-b border-white/[0.04] bg-[#050a12]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
              <Image src="/logo_nerve.svg" alt="NERVE" width={18} height={18} />
            </div>
            <span className="font-semibold text-white tracking-wide">NERVE</span>
          </Link>
          <Link href="/" className="text-sm text-slate-500 hover:text-white transition-colors">
            Volver al inicio
          </Link>
        </div>
      </nav>

      {/* Contenido Legal */}
      <main className="max-w-4xl mx-auto px-6 py-20">
        <header className="mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
            {title}
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Última actualización: {lastUpdated}
          </p>
        </header>

        <div className="prose prose-invert prose-slate max-w-none 
          prose-headings:text-white prose-headings:font-semibold prose-headings:tracking-tight
          prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:border-b prose-h2:border-white/5 prose-h2:pb-2
          prose-p:text-slate-400 prose-p:leading-relaxed prose-p:mb-6
          prose-strong:text-slate-200 prose-strong:font-bold
          prose-ul:my-6 prose-li:text-slate-400 prose-li:mb-2
          prose-a:text-teal-400 prose-a:no-underline hover:prose-a:text-teal-300">
          {children}
        </div>
      </main>

      {/* Footer simplificado */}
      <footer className="border-t border-white/[0.04] py-12 mt-20 bg-slate-950/20">
        <div className="max-w-4xl mx-auto px-6 text-center">
            <p className="text-xs text-slate-600 mb-2">© 2026 NERVE Health Systems. Todos los derechos reservados.</p>
            <p className="text-[10px] text-slate-700 tracking-widest uppercase mb-1">Misión Crítica. Aislamiento de Datos. Grado Médico.</p>
        </div>
      </footer>
    </div>
  );
}
