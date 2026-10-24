"use client";

import React from "react";
import { BarChart3 } from "lucide-react";

interface DataPoint {
  day: string;
  count: number;
}

interface DashboardChartProps {
  data?: DataPoint[];
}

export function DashboardChart({ data }: DashboardChartProps) {
  // Check if we have any real data
  const hasData = data && data.length > 0 && data.some((d) => d.count > 0);

  if (!hasData) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center py-12 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-slate-800/60 flex items-center justify-center">
          <BarChart3 className="h-7 w-7 text-slate-600" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-medium text-slate-400">Sin datos suficientes</p>
          <p className="text-xs text-slate-600 max-w-[240px]">
            Las métricas de ocupación se generarán automáticamente conforme agendes citas.
          </p>
        </div>
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count));
  const height = 180;
  const width = 450;
  const barWidth = 45;
  const gap = 20;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center pt-4">
      <div className="relative w-full max-w-[450px] aspect-[450/220]">
        <svg
          viewBox={`0 0 ${width} ${height + 40}`}
          className="w-full h-full overflow-visible"
        >
          {/* Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
            <line
              key={i}
              x1="0"
              y1={height - height * p}
              x2={width}
              y2={height - height * p}
              stroke="currentColor"
              className="text-slate-800/40"
              strokeDasharray="4 4"
            />
          ))}

          {/* Bars */}
          {data.map((d, i) => {
            const barHeight = maxCount > 0 ? (d.count / maxCount) * height : 0;
            const x = i * (barWidth + gap) + gap;
            const y = height - barHeight;

            return (
              <g key={i} className="group cursor-pointer">
                {/* Glow shadow for active bar */}
                {d.count === maxCount && d.count > 0 && (
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx="6"
                    fill="rgba(20, 184, 166, 0.15)"
                    filter="blur(10px)"
                  />
                )}
                
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx="6"
                  className={`transition-all duration-500 ease-out ${
                    d.count === maxCount && d.count > 0
                      ? "fill-teal-500 drop-shadow-[0_0_8px_rgba(20,184,166,0.5)]" 
                      : "fill-slate-800 group-hover:fill-slate-700"
                  }`}
                  style={{ transitionDelay: `${i * 100}ms` }}
                />

                {/* X Axis Labels */}
                <text
                  x={x + barWidth / 2}
                  y={height + 25}
                  textAnchor="middle"
                  className="text-[12px] font-medium fill-slate-500 group-hover:fill-slate-300 transition-colors"
                >
                  {d.day}
                </text>

                {/* Tooltip on Top */}
                {d.count > 0 && (
                  <text
                    x={x + barWidth / 2}
                    y={y - 10}
                    textAnchor="middle"
                    className="text-[10px] font-bold fill-teal-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {d.count} citas
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-8 flex items-center gap-6">
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.8)]" />
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">Pico de Demanda</span>
        </div>
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-slate-800" />
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">Normal</span>
        </div>
      </div>
    </div>
  );
}
