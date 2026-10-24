"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  ShieldAlert, Globe, ServerCrash, Building2, Users, CreditCard,
  TrendingUp, Clock, CheckCircle2, XCircle, AlertTriangle,
  Search, ChevronDown, ChevronUp, Activity, Calendar,
  UserCheck, DollarSign, Eye, BarChart3, RefreshCw, Gift, Loader2, Sparkles
} from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface ClinicData {
  id: string;
  name: string;
  subscription_tier: string | null;
  subscription_status: string;
  current_period_end: string | null;
  created_at: string;
  mp_customer_id: string | null;
  mp_subscription_id: string | null;
}

interface UserData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  phone: string | null;
  active: boolean;
  created_at: string;
  clinic_id: string | null;
}

interface ClinicStats {
  clinicId: string;
  patients: number;
  appointments: number;
  users: number;
}

type SortField = "name" | "created_at" | "subscription_status" | "users";
type SortDir = "asc" | "desc";

export default function SuperadminDashboard() {
  const { isSuperadmin, isLoading: authLoading } = useAuth();
  const [clinics, setClinics] = useState<ClinicData[]>([]);
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [clinicStats, setClinicStats] = useState<Record<string, ClinicStats>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expandedClinic, setExpandedClinic] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"clinics" | "users">("clinics");
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [editingPlans, setEditingPlans] = useState<Record<string, { tier: string; status: string }>>({});

  async function handleGiftMonths(clinicId: string, months: number) {
    setIsUpdating(clinicId);
    try {
      const res = await fetch("/api/superadmin/clinic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clinicId, action: "gift_months", months }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`¡Regalado! +${months} ${months === 1 ? "mes" : "meses"} agregado(s) con éxito.`);
        await fetchAll();
      } else {
        toast.error(data.error || "Error al regalar meses");
      }
    } catch (err) {
      toast.error("Error de conexión");
    } finally {
      setIsUpdating(null);
    }
  }

  async function handleUpdateSubscription(clinicId: string) {
    const edit = editingPlans[clinicId];
    if (!edit) return;
    setIsUpdating(clinicId);
    try {
      const res = await fetch("/api/superadmin/clinic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicId,
          action: "update_subscription",
          tier: edit.tier,
          status: edit.status
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Suscripción de clínica actualizada con éxito.");
        await fetchAll();
      } else {
        toast.error(data.error || "Error al actualizar");
      }
    } catch (err) {
      toast.error("Error de conexión");
    } finally {
      setIsUpdating(null);
    }
  }

  useEffect(() => {
    if (authLoading) return;
    if (isSuperadmin) fetchAll();
  }, [authLoading, isSuperadmin]);

  async function fetchAll() {
    setIsLoading(true);
    try {
      const [clinicsRes, usersRes] = await Promise.all([
        supabase.from("clinics").select("*").order("created_at", { ascending: false }),
        supabase.from("users").select("*").order("created_at", { ascending: false }),
      ]);

      if (clinicsRes.error) throw clinicsRes.error;
      if (usersRes.error) throw usersRes.error;

      const c = clinicsRes.data as ClinicData[];
      const u = usersRes.data as UserData[];
      setClinics(c);
      setAllUsers(u);

      // Fetch stats per clinic
      const statsMap: Record<string, ClinicStats> = {};
      for (const clinic of c) {
        const [pRes, aRes] = await Promise.all([
          supabase.from("patients").select("id", { count: "exact", head: true }).eq("clinic_id", clinic.id),
          supabase.from("appointments").select("id", { count: "exact", head: true }).eq("clinic_id", clinic.id),
        ]);
        statsMap[clinic.id] = {
          clinicId: clinic.id,
          patients: pRes.count || 0,
          appointments: aRes.count || 0,
          users: u.filter(usr => usr.clinic_id === clinic.id).length,
        };
      }
      setClinicStats(statsMap);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="text-amber-400 flex flex-col items-center gap-3">
          <div className="relative">
            <Globe className="h-10 w-10 animate-pulse" />
            <div className="absolute inset-0 h-10 w-10 rounded-full bg-amber-400/20 animate-ping" />
          </div>
          <p className="text-sm text-slate-400">Cargando panel de control global...</p>
        </div>
      </div>
    );
  }

  if (!isSuperadmin) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <ShieldAlert className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-semibold text-white">Acceso Denegado</h2>
          <p className="text-slate-400 text-sm">Esta área es exclusiva para el sistema NERVE Master.</p>
        </div>
      </div>
    );
  }

  // Computed stats
  const totalClinics = clinics.length;
  const activeSubs = clinics.filter(c => c.subscription_status === "active").length;
  const trialSubs = clinics.filter(c => c.subscription_status === "trialing").length;
  const expiredSubs = clinics.filter(c => ["past_due", "canceled", "expired"].includes(c.subscription_status)).length;
  const totalUsers = allUsers.length;
  const totalPatients = Object.values(clinicStats).reduce((s, c) => s + c.patients, 0);
  const totalAppointments = Object.values(clinicStats).reduce((s, c) => s + c.appointments, 0);

  // Revenue estimate
  const tierPrices: Record<string, number> = { solo: 149, pro: 1299, enterprise: 9999 };
  const mrr = clinics
    .filter(c => c.subscription_status === "active" && c.subscription_tier)
    .reduce((s, c) => s + (tierPrices[c.subscription_tier!] || 0), 0);

  // Search & sort clinics
  const filtered = clinics.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortField === "name") return a.name.localeCompare(b.name) * dir;
    if (sortField === "created_at") return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
    if (sortField === "subscription_status") return a.subscription_status.localeCompare(b.subscription_status) * dir;
    if (sortField === "users") return ((clinicStats[a.id]?.users || 0) - (clinicStats[b.id]?.users || 0)) * dir;
    return 0;
  });

  // Search users
  const filteredUsers = allUsers.filter(u =>
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronDown className="h-3 w-3 opacity-30" />;
    return sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
  };

  function getStatusBadge(status: string) {
    const map: Record<string, { cls: string; icon: React.ReactNode; label: string }> = {
      active: { cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: <CheckCircle2 className="h-3 w-3" />, label: "Activa" },
      trialing: { cls: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: <Clock className="h-3 w-3" />, label: "Trial" },
      past_due: { cls: "bg-red-500/10 text-red-400 border-red-500/20", icon: <AlertTriangle className="h-3 w-3" />, label: "Vencida" },
      canceled: { cls: "bg-red-500/10 text-red-400 border-red-500/20", icon: <XCircle className="h-3 w-3" />, label: "Cancelada" },
    };
    const cfg = map[status] || { cls: "bg-slate-500/10 text-slate-400 border-slate-500/20", icon: null, label: status };
    return (
      <Badge className={`${cfg.cls} flex items-center gap-1 text-[10px] font-medium`}>
        {cfg.icon}{cfg.label}
      </Badge>
    );
  }

  function getTierBadge(tier: string | null) {
    if (!tier) return <span className="text-slate-600 text-xs">—</span>;
    const map: Record<string, string> = {
      solo: "bg-slate-700/50 text-slate-300 border-slate-600/30",
      pro: "bg-violet-500/10 text-violet-400 border-violet-500/20",
      enterprise: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    };
    return (
      <Badge className={`${map[tier] || ""} uppercase text-[10px] font-bold tracking-wider`}>
        {tier}
      </Badge>
    );
  }

  function getRoleBadge(role: string) {
    const map: Record<string, string> = {
      superadmin: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      admin: "bg-violet-500/10 text-violet-400 border-violet-500/20",
      doctor: "bg-teal-500/10 text-teal-400 border-teal-500/20",
      receptionist: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    };
    return <Badge className={`${map[role] || "bg-slate-500/10 text-slate-400"} text-[10px] font-medium`}>{role}</Badge>;
  }

  function daysAgo(dateStr: string) {
    const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (d === 0) return "Hoy";
    if (d === 1) return "Ayer";
    return `Hace ${d} días`;
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
  }

  return (
    <div className="flex-1 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Globe className="h-5 w-5 text-amber-400" />
            </div>
            Panel de Control Global
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Centro de comando — Monitoreo de clínicas, usuarios y suscripciones</p>
        </div>
        <button
          onClick={() => fetchAll()}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-600 transition-all text-xs font-medium"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Actualizar
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center gap-3">
          <ServerCrash className="h-5 w-5 shrink-0" />
          <p className="text-sm">Error: {error}</p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: "Clínicas", value: totalClinics, icon: Building2, color: "text-white", bg: "bg-slate-800/50" },
          { label: "Activas", value: activeSubs, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/5" },
          { label: "En Trial", value: trialSubs, icon: Clock, color: "text-blue-400", bg: "bg-blue-500/5" },
          { label: "Vencidas", value: expiredSubs, icon: XCircle, color: "text-red-400", bg: "bg-red-500/5" },
          { label: "Usuarios", value: totalUsers, icon: Users, color: "text-violet-400", bg: "bg-violet-500/5" },
          { label: "Pacientes", value: totalPatients, icon: UserCheck, color: "text-teal-400", bg: "bg-teal-500/5" },
          { label: "MRR", value: `$${(mrr / 100).toLocaleString("es-MX")}`, icon: DollarSign, color: "text-amber-400", bg: "bg-amber-500/5" },
        ].map((kpi) => (
          <div key={kpi.label} className={`${kpi.bg} border border-slate-800/60 rounded-xl p-3.5 relative overflow-hidden group hover:border-slate-700/60 transition-all`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{kpi.label}</span>
              <kpi.icon className={`h-3.5 w-3.5 ${kpi.color} opacity-60`} />
            </div>
            <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
        <div className="flex gap-1 bg-slate-900/50 p-1 rounded-lg border border-slate-800/60">
          {(["clinics", "users"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-xs font-medium transition-all ${
                activeTab === tab
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {tab === "clinics" ? (
                <span className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> Clínicas ({totalClinics})</span>
              ) : (
                <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Usuarios ({totalUsers})</span>
              )}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder={activeTab === "clinics" ? "Buscar clínicas..." : "Buscar usuarios..."}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-900/50 border border-slate-800/60 rounded-lg text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/30 focus:ring-1 focus:ring-amber-500/20 transition-all"
          />
        </div>
      </div>

      {/* CLINICS TABLE */}
      {activeTab === "clinics" && (
        <div className="bg-slate-900/30 border border-slate-800/60 rounded-xl overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-950/60">
              <TableRow className="border-slate-800/60 hover:bg-transparent">
                <TableHead onClick={() => toggleSort("name")} className="text-slate-500 cursor-pointer hover:text-slate-300 transition-colors">
                  <span className="flex items-center gap-1">Clínica <SortIcon field="name" /></span>
                </TableHead>
                <TableHead className="text-slate-500">Plan</TableHead>
                <TableHead onClick={() => toggleSort("subscription_status")} className="text-slate-500 cursor-pointer hover:text-slate-300 transition-colors">
                  <span className="flex items-center gap-1">Estado <SortIcon field="subscription_status" /></span>
                </TableHead>
                <TableHead className="text-slate-500">Vigencia</TableHead>
                <TableHead onClick={() => toggleSort("users")} className="text-slate-500 cursor-pointer hover:text-slate-300 transition-colors text-center">
                  <span className="flex items-center gap-1 justify-center">Usuarios <SortIcon field="users" /></span>
                </TableHead>
                <TableHead className="text-slate-500 text-center">Pacientes</TableHead>
                <TableHead className="text-slate-500 text-center">Citas</TableHead>
                <TableHead onClick={() => toggleSort("created_at")} className="text-slate-500 cursor-pointer hover:text-slate-300 transition-colors text-right">
                  <span className="flex items-center gap-1 justify-end">Registro <SortIcon field="created_at" /></span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map(clinic => {
                const stats = clinicStats[clinic.id];
                const isExpanded = expandedClinic === clinic.id;
                const clinicUsers = allUsers.filter(u => u.clinic_id === clinic.id);
                return (
                  <React.Fragment key={clinic.id}>
                    <TableRow
                      className={`border-slate-800/40 cursor-pointer transition-colors ${isExpanded ? "bg-slate-800/20" : "hover:bg-slate-800/10"}`}
                      onClick={() => setExpandedClinic(isExpanded ? null : clinic.id)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400 shrink-0 border border-slate-700/50">
                            {clinic.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-200 text-sm">{clinic.name}</p>
                            <p className="text-[10px] text-slate-600 font-mono">{clinic.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getTierBadge(clinic.subscription_tier)}</TableCell>
                      <TableCell>{getStatusBadge(clinic.subscription_status)}</TableCell>
                      <TableCell className="text-slate-400 text-xs">
                        {clinic.current_period_end ? formatDate(clinic.current_period_end) : <span className="text-slate-600">—</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm font-semibold text-violet-400">{stats?.users || 0}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm font-semibold text-teal-400">{stats?.patients || 0}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm font-semibold text-blue-400">{stats?.appointments || 0}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="text-xs text-slate-400">{formatDate(clinic.created_at)}</div>
                        <div className="text-[10px] text-slate-600">{daysAgo(clinic.created_at)}</div>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow className="bg-slate-950/40 border-slate-800/30">
                        <TableCell colSpan={8} className="p-0">
                          <div className="p-6 pl-14 grid grid-cols-1 xl:grid-cols-12 gap-8">
                            {/* Left column: Members (col-span 7) */}
                            <div className="xl:col-span-7 space-y-4">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Miembros del equipo ({clinicUsers.length})</p>
                              </div>
                              {clinicUsers.length === 0 ? (
                                <p className="text-xs text-slate-600 italic py-4">No hay miembros del equipo registrados aún en esta clínica.</p>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                                  {clinicUsers.map(u => (
                                    <div key={u.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-900/40 border border-slate-800/50">
                                      <div className="w-7 h-7 rounded-full bg-slate-800/80 flex items-center justify-center text-[10px] font-bold text-slate-400 shrink-0 border border-slate-700/30">
                                        {u.first_name[0]}{u.last_name[0]}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-slate-300 truncate">{u.first_name} {u.last_name}</p>
                                        <p className="text-[10px] text-slate-500 truncate">{u.email}</p>
                                      </div>
                                      {getRoleBadge(u.role)}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Right column: Subscription management (col-span 5) */}
                            <div className="xl:col-span-5 space-y-5 bg-slate-900/20 border border-slate-800/60 rounded-xl p-4.5">
                              <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                                <p className="text-[10px] text-amber-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
                                  <Sparkles className="h-3.5 w-3.5" /> GESTIÓN DE SUSCRIPCIÓN (MASTER BYPASS)
                                </p>
                              </div>

                              {/* Gifting section */}
                              <div className="space-y-2">
                                <label className="text-[10px] text-slate-400 uppercase font-semibold block">Regalar tiempo de suscripción</label>
                                <div className="grid grid-cols-4 gap-1.5">
                                  {[
                                    { label: "+1 Mes", value: 1 },
                                    { label: "+3 Meses", value: 3 },
                                    { label: "+6 Meses", value: 6 },
                                    { label: "+1 Año", value: 12 },
                                  ].map(gift => (
                                    <button
                                      key={gift.label}
                                      disabled={isUpdating === clinic.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleGiftMonths(clinic.id, gift.value);
                                      }}
                                      className="py-1.5 text-[10px] font-bold rounded-lg bg-teal-950/40 hover:bg-teal-900/60 text-teal-400 border border-teal-500/20 hover:border-teal-500/30 transition-all flex items-center justify-center gap-1 group disabled:opacity-40"
                                    >
                                      <Gift className="h-3 w-3 transition-transform group-hover:scale-110" />
                                      {gift.label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Tier / Status Modification */}
                              <div className="space-y-3.5 pt-1.5 border-t border-slate-800/50">
                                <label className="text-[10px] text-slate-400 uppercase font-semibold block">Modificar Plan y Estado</label>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <span className="text-[10px] text-slate-500">Plan</span>
                                    <select
                                      onClick={e => e.stopPropagation()}
                                      value={editingPlans[clinic.id]?.tier ?? clinic.subscription_tier ?? "solo"}
                                      onChange={e => {
                                        setEditingPlans(prev => ({
                                          ...prev,
                                          [clinic.id]: {
                                            tier: e.target.value,
                                            status: editingPlans[clinic.id]?.status ?? clinic.subscription_status ?? "trialing"
                                          }
                                        }));
                                      }}
                                      className="w-full bg-slate-950 text-slate-200 border border-slate-800 text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:border-amber-500/30"
                                    >
                                      <option value="solo">Solo (Doctor Solo)</option>
                                      <option value="pro">Pro (Clínica)</option>
                                      <option value="enterprise">Enterprise</option>
                                    </select>
                                  </div>
                                  <div className="space-y-1">
                                    <span className="text-[10px] text-slate-500">Estado</span>
                                    <select
                                      onClick={e => e.stopPropagation()}
                                      value={editingPlans[clinic.id]?.status ?? clinic.subscription_status ?? "trialing"}
                                      onChange={e => {
                                        setEditingPlans(prev => ({
                                          ...prev,
                                          [clinic.id]: {
                                            tier: editingPlans[clinic.id]?.tier ?? clinic.subscription_tier ?? "solo",
                                            status: e.target.value
                                          }
                                        }));
                                      }}
                                      className="w-full bg-slate-950 text-slate-200 border border-slate-800 text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:border-amber-500/30"
                                    >
                                      <option value="active">Activa</option>
                                      <option value="trialing">Período de Prueba</option>
                                      <option value="past_due">Vencida (Bloqueada)</option>
                                      <option value="expired">Expirada (Bloqueada)</option>
                                      <option value="canceled">Cancelada (Bloqueada)</option>
                                    </select>
                                  </div>
                                </div>

                                <button
                                  disabled={isUpdating === clinic.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!editingPlans[clinic.id]) {
                                      // If no changes, pre-initialize it
                                      setEditingPlans(prev => ({
                                        ...prev,
                                        [clinic.id]: {
                                          tier: clinic.subscription_tier ?? "solo",
                                          status: clinic.subscription_status ?? "trialing"
                                        }
                                      }));
                                      toast.info("Ajusta los valores antes de actualizar.");
                                      return;
                                    }
                                    handleUpdateSubscription(clinic.id);
                                  }}
                                  className="w-full py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-all shadow-md shadow-amber-600/10 hover:shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-40"
                                >
                                  {isUpdating === clinic.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                                  ) : (
                                    "Actualizar Plan / Estado"
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
              {sorted.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-slate-500">
                    {searchTerm ? "No se encontraron resultados" : "No hay clínicas registradas aún."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* USERS TABLE */}
      {activeTab === "users" && (
        <div className="bg-slate-900/30 border border-slate-800/60 rounded-xl overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-950/60">
              <TableRow className="border-slate-800/60 hover:bg-transparent">
                <TableHead className="text-slate-500">Usuario</TableHead>
                <TableHead className="text-slate-500">Email</TableHead>
                <TableHead className="text-slate-500">Rol</TableHead>
                <TableHead className="text-slate-500">Clínica</TableHead>
                <TableHead className="text-slate-500">Teléfono</TableHead>
                <TableHead className="text-slate-500 text-center">Estado</TableHead>
                <TableHead className="text-slate-500 text-right">Fecha de registro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map(user => {
                const clinic = clinics.find(c => c.id === user.clinic_id);
                return (
                  <TableRow key={user.id} className="border-slate-800/40 hover:bg-slate-800/10">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 border border-slate-700/50">
                          {user.first_name[0]}{user.last_name[0]}
                        </div>
                        <p className="font-medium text-slate-200 text-sm">{user.first_name} {user.last_name}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-400 text-xs font-mono">{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell className="text-slate-400 text-xs">{clinic?.name || <span className="text-slate-600">Sin asignar</span>}</TableCell>
                    <TableCell className="text-slate-400 text-xs">{user.phone || <span className="text-slate-600">—</span>}</TableCell>
                    <TableCell className="text-center">
                      {user.active ? (
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">Activo</Badge>
                      ) : (
                        <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px]">Inactivo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="text-xs text-slate-400">{formatDate(user.created_at)}</div>
                      <div className="text-[10px] text-slate-600">{daysAgo(user.created_at)}</div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-slate-500">
                    {searchTerm ? "No se encontraron usuarios" : "No hay usuarios registrados."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Footer info */}
      <div className="flex items-center justify-between pt-2 pb-4">
        <p className="text-[10px] text-slate-600">
          NERVE Superadmin v1.0 — Última actualización: {new Date().toLocaleString("es-MX")}
        </p>
        <p className="text-[10px] text-slate-600 font-mono">
          {activeTab === "clinics" ? `${sorted.length} clínica(s)` : `${filteredUsers.length} usuario(s)`} mostrados
        </p>
      </div>
    </div>
  );
}
