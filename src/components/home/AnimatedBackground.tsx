"use client";

import React from "react";

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden select-none">
      {/* Blurred Animated Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/10 blur-[120px] animate-blob" />
      <div className="absolute bottom-[10%] right-[-5%] w-[45%] h-[45%] rounded-full bg-indigo-500/10 blur-[130px] animate-blob animation-delay-2000" />
      <div className="absolute top-[20%] right-[10%] w-[35%] h-[35%] rounded-full bg-cyan-500/5 blur-[100px] animate-blob animation-delay-4000" />
      
      {/* Subtle Grid Pattern Overlay with Spotlight effect */}
      <div className="absolute inset-0 bg-[url('https://res.cloudinary.com/djp7d2lmt/image/upload/v1711202868/grid-pattern_qazwsc.svg')] opacity-[0.03] mix-blend-overlay"></div>
      
      {/* Spotlight Gradient - fully transparent center, fading to dark at the very edges only if needed */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_transparent_70%,_#030712_100%)] opacity-30" />

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 20s infinite alternate cubic-bezier(0.45, 0, 0.55, 1);
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
