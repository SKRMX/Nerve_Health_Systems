"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CalendarDays, TrendingUp, Activity, UserCheck, CheckCircle2 } from "lucide-react";
import { useDoctorProfile } from "@/hooks/useDoctorProfile";
import { useAuth } from "@/hooks/useAuth";
import { DashboardChart } from "@/components/features/DashboardChart";
import { OnboardingChecklist } from "@/components/onboarding/OnboardingChecklist";

export default function DashboardHomePage() {
  const router = useRouter();
  const { profile } = useDoctorProfile();
  const { userProfile, user, isAdmin, isReceptionist, isLoading } = useAuth();
  const clinicId = userProfile?.clinic_id;
  const [hasMounted, setHasMounted] = useState(false);
  const [stats, setStats] = useState({ today: 0, active: 0, cancelled: 0, completed: 0 });
  const [totalPatients, setTotalPatients] = useState(0);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [weeklyChart, setWeeklyChart] = useState<{ day: string; count: number }[]>([]);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    if (clinicId) loadDashboard();
  }, [clinicId, user]);

  async function loadDashboard() {
    // 1. Upcoming appointments (from right now onwards)
    const now = new Date();
    let upcomingQuery = supabase
      .from('appointments')
      .select('id, title, type, start_time, status, color_hex, doctor_id, patients(first_name, last_name)')
      .eq('clinic_id', clinicId)
      .gte('start_time', now.toISOString())
      .order('start_time', { ascending: true })
      .limit(4);

    // 2. Today's stats (all appointments for today)
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    
    let todayQuery = supabase
      .from('appointments')
      .select('status, doctor_id')
      .eq('clinic_id', clinicId)
      .gte('start_time', startOfDay.toISOString())
      .lte('start_time', endOfDay.toISOString());

    // Filter both by doctor if not admin/receptionist
    if (!isAdmin && !isReceptionist && user) {
      upcomingQuery = upcomingQuery.eq('doctor_id', user.id);
      todayQuery = todayQuery.eq('doctor_id', user.id);
    }

    const [upcomingRes, todayRes] = await Promise.all([upcomingQuery, todayQuery]);

    if (upcomingRes.data) {
      setUpcoming(upcomingRes.data);
    }

    if (todayRes.data) {
      const todayData = todayRes.data;
      const activos = todayData.filter(d => d.status === 'En sala').length;
      const cancelados = todayData.filter(d => d.status === 'Cancelado').length;
      const completados = todayData.filter(d => d.status === 'Completado').length;
      setStats({ today: todayData.length, active: activos, cancelled: cancelados, completed: completados });
    }

    // Total patients in this clinic
    const { count } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', clinicId);
    setTotalPatients(count || 0);

    // Weekly chart: count appointments per day of the current week
    const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const dayOfWeek = now.getDay(); // 0=Sun
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    let weekQuery = supabase
      .from('appointments')
      .select('start_time')
      .eq('clinic_id', clinicId)
      .gte('start_time', monday.toISOString())
      .lte('start_time', sunday.toISOString());

    if (!isAdmin && !isReceptionist && user) {
      weekQuery = weekQuery.eq('doctor_id', user.id);
    }

    const { data: weekData } = await weekQuery;

    // Build counts per day (Mon–Sat, skip Sun)
    const counts: Record<number, number> = {};
    if (weekData) {
      for (const appt of weekData) {
        const d = new Date(appt.start_time).getDay();
        counts[d] = (counts[d] || 0) + 1;
      }
    }
    // Mon=1..Sat=6
    const chartData = [1, 2, 3, 4, 5, 6].map((dayIdx) => ({
      day: dayNames[dayIdx],
      count: counts[dayIdx] || 0,
    }));
    setWeeklyChart(chartData);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Hola, {hasMounted ? (isLoading ? "" : (() => {
              const raw = userProfile?.first_name || profile.full_name.split(' ')[0] || '';
              const filtered = raw.replace(/^(Dr\.|Dra\.|Dr|Dra)\s*/i, '').trim();
              return filtered || 'Doctor';
            })()) : ""} 👋
          </h1>
          <p className="text-slate-400 mt-1">Aquí está el resumen de tu práctica clínica de hoy.</p>
        </div>

        {/* Developer Action: Seed Demo Data */}
        {process.env.NODE_ENV === 'development' && (
          <div className="flex items-center gap-3 bg-teal-500/10 border border-teal-500/20 p-2 rounded-lg">
            <p className="text-[10px] text-teal-400 font-bold uppercase tracking-widest whitespace-nowrap ml-2">Developer Tools</p>
            <button
              onClick={async () => {
                if (!confirm("¿Deseas inyectar 30 pacientes y 20 citas de prueba en ESTA cuenta local?")) return;
                setIsSeeding(true);
                try {
                  const res = await fetch('/api/seed');
                  const data = await res.json();
                  if (data.success) {
                    alert("¡Éxito! Tu cuenta de Dr. NERVE ha sido poblada. Recargando...");
                    window.location.reload();
                  } else {
                    alert("Error: " + data.error);
                  }
                } catch (e) {
                  alert("Error de red");
                } finally {
                  setIsSeeding(false);
                }
              }}
              disabled={isSeeding}
              className="bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-md transition-all shadow-[0_0_15px_-3px_rgba(20,184,166,0.4)] disabled:opacity-50"
            >
              {isSeeding ? "Inyectando..." : "Llenar con Datos Demo"}
            </button>
          </div>
        )}
      </div>

      {/* Quick-Start Onboarding Checklist for Doctors */}
      <OnboardingChecklist totalPatients={totalPatients} />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Metric Cards */}
        <Card className="bg-slate-950/40 border-slate-800/60 backdrop-blur-xl shadow-lg ring-1 ring-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Citas Hoy</CardTitle>
            <CalendarDays className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">{stats.today}</div>
            <p className="text-xs text-slate-500 mt-1">
              {upcoming.length > 0 ? `Siguiente: ${new Date(upcoming[0].start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} (${upcoming[0].patients?.first_name || upcoming[0].title.split('-')[0]})` : "Sin pacientes pendientes"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-950/40 border-slate-800/60 backdrop-blur-xl shadow-lg ring-1 ring-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Citas Activas (En Espera/Sala)</CardTitle>
            <Activity className="h-4 w-4 text-teal-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">{stats.active}</div>
            <p className="text-xs text-teal-400 flex items-center mt-1">
              Pacientes esperando atención
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-950/40 border-slate-800/60 backdrop-blur-xl shadow-lg ring-1 ring-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Completadas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">{stats.completed}</div>
            <p className="text-xs text-green-400 flex items-center mt-1">
              Citas atendidas hoy
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-950/40 border-slate-800/60 backdrop-blur-xl shadow-lg ring-1 ring-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Pacientes</CardTitle>
            <UserCheck className="h-4 w-4 text-violet-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">{totalPatients}</div>
            <p className="text-xs text-violet-400 flex items-center mt-1">
              Pacientes registrados
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 border-t border-white/5 pt-8">
        <Card className="col-span-4 bg-slate-950/40 border-slate-800/60 backdrop-blur-xl shadow-lg ring-1 ring-white/5 min-h-[400px]">
          <CardHeader>
            <CardTitle className="text-slate-200">Visión de Agenda Mensual</CardTitle>
            <CardDescription className="text-slate-500">Métricas de ocupación y agendamiento interactivo (En Construcción)</CardDescription>
          </CardHeader>
          <CardContent className="h-full pt-2">
            <DashboardChart data={weeklyChart} />
          </CardContent>
        </Card>
        
        <Card className="col-span-3 bg-slate-950/40 border-slate-800/60 backdrop-blur-xl shadow-lg ring-1 ring-white/5">
          <CardHeader>
            <CardTitle className="text-slate-200">Próximos Pacientes</CardTitle>
            <CardDescription className="text-slate-500">Lista en tiempo real (Recepcionista)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {upcoming.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-4">Directorio vacío. Agenda citas para verlas aquí.</p>
              ) : (
                upcoming.map((appt, i) => {
                  const patientName = appt.patients ? `${appt.patients.first_name} ${appt.patients.last_name}` : appt.title.split('-')[0];
                  const initials = patientName.substring(0, 2).toUpperCase();
                  const time = new Date(appt.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                  return (
                    <div 
                      key={i} 
                      className="flex items-center cursor-pointer group hover:bg-slate-900/50 p-2 -mx-2 rounded-lg transition-colors"
                      onClick={() => router.push('/dashboard/agenda')}
                    >
                      <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-xs font-medium text-slate-300 mr-4 group-hover:bg-teal-900 transition-colors">
                        {initials}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none text-slate-300 group-hover:text-teal-400 transition-colors">{patientName}</p>
                        <p className="text-xs text-slate-500">
                          {appt.type} - {time}
                        </p>
                      </div>
                      <div className="ml-auto font-medium text-xs px-2 py-1 rounded-md text-slate-300 bg-slate-800/50" style={{ color: appt.color_hex.replace('0.2)', '1)') }}>
                        {appt.status}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
