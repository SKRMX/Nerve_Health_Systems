"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
  BarChart3, Users, CalendarDays, CheckCircle2, TrendingUp, 
  Clock, Activity, UserRound, Loader2
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { es } from "date-fns/locale/es";

interface DoctorStats {
  id: string;
  name: string;
  specialty: string;
  total: number;
  completed: number;
  scheduled: number;
  cancelled: number;
  patients: number;
  completionRate: number;
}

export default function ReportesPage() {
  const router = useRouter();
  const { isAdmin, userProfile, clinic } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [doctorStats, setDoctorStats] = useState<DoctorStats[]>([]);
  const [period, setPeriod] = useState("current"); // current | last | last3
  const [totalStats, setTotalStats] = useState({
    totalAppointments: 0,
    completedAppointments: 0,
    totalPatients: 0,
    activeDoctors: 0,
  });

  useEffect(() => {
    if (userProfile && !isAdmin) {
      router.replace("/dashboard");
      return;
    }
    if (isAdmin) fetchReports();
  }, [isAdmin, userProfile, period]);

  const getDateRange = () => {
    const now = new Date();
    switch (period) {
      case "last":
        return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
      case "last3":
        return { start: startOfMonth(subMonths(now, 3)), end: endOfMonth(now) };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const fetchReports = async () => {
    setIsLoading(true);
    const { start, end } = getDateRange();

    // Fetch all doctors/admin in clinic
    const { data: doctors } = await supabase
      .from("users")
      .select("id, first_name, last_name")
      .in("role", ["doctor", "admin"])
      .eq("active", true);

    // Fetch all appointments in period
    const { data: appointments } = await supabase
      .from("appointments")
      .select("doctor_id, status, patient_id")
      .gte("start_time", start.toISOString())
      .lte("start_time", end.toISOString());

    // Fetch doctor profiles for specialty
    const { data: profiles } = await supabase
      .from("doctor_profiles")
      .select("user_id, specialty");

    // Fetch total patients
    const { count: totalPatients } = await supabase
      .from("patients")
      .select("*", { count: "exact", head: true });

    if (doctors && appointments) {
      const stats: DoctorStats[] = doctors.map(doc => {
        const docAppts = appointments.filter(a => a.doctor_id === doc.id);
        const completed = docAppts.filter(a => a.status === "Completado").length;
        const total = docAppts.length;
        const uniquePatients = new Set(docAppts.map(a => a.patient_id)).size;
        const profile = profiles?.find(p => p.user_id === doc.id);

        return {
          id: doc.id,
          name: `${doc.first_name} ${doc.last_name}`,
          specialty: profile?.specialty || "Sin especialidad",
          total,
          completed,
          scheduled: docAppts.filter(a => a.status === "Programado" || a.status === "En sala").length,
          cancelled: docAppts.filter(a => a.status === "Cancelado").length,
          patients: uniquePatients,
          completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        };
      });

      stats.sort((a, b) => b.completed - a.completed);
      setDoctorStats(stats);

      const totalAppts = appointments.length;
      const totalCompleted = appointments.filter(a => a.status === "Completado").length;
      setTotalStats({
        totalAppointments: totalAppts,
        completedAppointments: totalCompleted,
        totalPatients: totalPatients || 0,
        activeDoctors: doctors.length,
      });
    }
    setIsLoading(false);
  };

  const periodLabels: Record<string, string> = {
    current: "Este mes",
    last: "Mes anterior",
    last3: "Últimos 3 meses",
  };

  const getBarWidth = (value: number, max: number) => {
    if (max === 0) return "0%";
    return `${Math.round((value / max) * 100)}%`;
  };
  const maxCompleted = Math.max(...doctorStats.map(d => d.completed), 1);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Reportes y Métricas</h1>
          <p className="text-slate-400 mt-1">Productividad clínica de <span className="text-teal-400">{clinic?.name}</span>.</p>
        </div>
        <Select value={period} onValueChange={(val) => setPeriod(val || "current")}>
          <SelectTrigger className="w-44 bg-slate-900/50 border-slate-800 text-slate-300">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-950 border-slate-800">
            <SelectItem value="current" className="text-slate-300">Este mes</SelectItem>
            <SelectItem value="last" className="text-slate-300">Mes anterior</SelectItem>
            <SelectItem value="last3" className="text-slate-300">Últimos 3 meses</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Citas", value: totalStats.totalAppointments, icon: CalendarDays, color: "text-teal-400" },
          { label: "Completadas", value: totalStats.completedAppointments, icon: CheckCircle2, color: "text-emerald-400" },
          { label: "Total Pacientes", value: totalStats.totalPatients, icon: Users, color: "text-blue-400" },
          { label: "Doctores Activos", value: totalStats.activeDoctors, icon: UserRound, color: "text-violet-400" },
        ].map(stat => (
          <Card key={stat.label} className="bg-slate-950/40 border-slate-800/60 backdrop-blur-xl ring-1 ring-white/5">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-medium text-slate-400">{stat.label}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.color}`}>
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stat.value}
              </div>
              <p className="text-xs text-slate-600 mt-0.5">{periodLabels[period]}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Doctor Performance */}
      <Card className="bg-slate-950/40 border-slate-800/60 backdrop-blur-xl ring-1 ring-white/5">
        <CardHeader className="border-b border-slate-800/60">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-white font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-teal-400" />
              Productividad por Doctor
            </CardTitle>
            <span className="text-xs text-slate-500">{periodLabels[period]}</span>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
            </div>
          ) : doctorStats.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No hay datos para el período seleccionado.</p>
            </div>
          ) : (
            doctorStats.map((doc, index) => (
              <div key={doc.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                      <span className="text-xs font-bold text-teal-400">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200">{doc.name}</p>
                      <p className="text-xs text-slate-500">{doc.specialty}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-right">
                    <div>
                      <p className="text-lg font-bold text-white">{doc.completed}</p>
                      <p className="text-[10px] text-slate-500">completadas</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">{doc.total}</p>
                      <p className="text-[10px] text-slate-500">total</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">{doc.patients}</p>
                      <p className="text-[10px] text-slate-500">pacientes</p>
                    </div>
                    <div className="w-14">
                      <p className={`text-lg font-bold ${doc.completionRate >= 70 ? "text-emerald-400" : doc.completionRate >= 40 ? "text-amber-400" : "text-red-400"}`}>
                        {doc.completionRate}%
                      </p>
                      <p className="text-[10px] text-slate-500">tasa</p>
                    </div>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-700"
                    style={{ width: getBarWidth(doc.completed, maxCompleted) }}
                  />
                </div>
                {/* Mini stats */}
                <div className="flex gap-4 text-[10px]">
                  <span className="text-emerald-400">✓ {doc.completed} completadas</span>
                  <span className="text-slate-500">◷ {doc.scheduled} programadas</span>
                  <span className="text-red-400/70">✗ {doc.cancelled} canceladas</span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
