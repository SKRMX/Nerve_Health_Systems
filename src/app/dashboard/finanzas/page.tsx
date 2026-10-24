"use client";

import React, { useState, useEffect } from "react";
import Script from "next/script";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  Calendar, 
  Loader2, 
  Plus, 
  Trash2, 
  X,
  FileText,
  Briefcase,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  ExternalLink
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { format, parseISO, subDays } from "date-fns";
import { es } from "date-fns/locale";

interface Expense {
  id: string;
  clinic_id: string;
  concept: string;
  category: string;
  amount: number;
  date: string;
  created_at: string;
}

interface AppointmentPayment {
  id: string;
  start_time: string;
  public_patient_name: string;
  appointment_type: string;
  payment_amount: number;
  platform_fee: number;
  mp_payment_id: string | null;
}

interface MedicineSale {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  inventory_items: {
    name: string;
    purchase_price: number;
  } | null;
  appointments: {
    public_patient_name: string;
  } | null;
}

export default function FinanzasPage() {
  const [loading, setLoading] = useState(true);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [doctorId, setDoctorId] = useState<string | null>(null);

  // Stripe Connect integration states
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
  const [stripeOnboardingCompleted, setStripeOnboardingCompleted] = useState(false);
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [stripePublishableKey, setStripePublishableKey] = useState<string>("");
  const [isStripeLoading, setIsStripeLoading] = useState(false);
  const [stripeScriptLoaded, setStripeScriptLoaded] = useState(false);

  // Data lists
  const [appointments, setAppointments] = useState<AppointmentPayment[]>([]);
  const [medicineSales, setMedicineSales] = useState<MedicineSale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Expenses Form Modal
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseConcept, setExpenseConcept] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Suministros");
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [isSavingExpense, setIsSavingExpense] = useState(false);

  // Time range filter (30 days default)
  const [timeRange, setTimeRange] = useState<30 | 90 | 365>(30);

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        setDoctorId(user.id);

        let { data: profile } = await supabase
          .from("doctor_profiles")
          .select("clinic_id, stripe_account_id, stripe_onboarding_completed")
          .or(`user_id.eq.${user.id},id.eq.${user.id}`)
          .maybeSingle();

        if (!profile?.stripe_account_id) {
          const { data: userProfile } = await supabase
            .from("users")
            .select("clinic_id")
            .eq("id", user.id)
            .maybeSingle();

          if (userProfile?.clinic_id) {
            const { data: clinicDoc } = await supabase
              .from("doctor_profiles")
              .select("clinic_id, stripe_account_id, stripe_onboarding_completed")
              .eq("clinic_id", userProfile.clinic_id)
              .not("stripe_account_id", "is", null)
              .maybeSingle();

            if (clinicDoc) profile = clinicDoc;
          }
        }

        if (profile) {
          if (profile.stripe_account_id) {
            setStripeAccountId(profile.stripe_account_id);
            setStripeOnboardingCompleted(!!profile.stripe_onboarding_completed);
          }
          if (profile.clinic_id) {
            setClinicId(profile.clinic_id);
            await loadFinancialData(profile.clinic_id, user.id);
          }
        }

      } catch (err) {
        console.error("Error setting up finance dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [timeRange]);

  // Fetch Stripe Account Session Client Secret
  useEffect(() => {
    if (stripeAccountId && stripeOnboardingCompleted) {
      loadStripeSession();
    }
  }, [stripeAccountId, stripeOnboardingCompleted]);

  const loadStripeSession = async () => {
    setIsStripeLoading(true);
    try {
      const res = await fetch("/api/doctor/stripe-session", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success && data.clientSecret) {
        setStripeClientSecret(data.clientSecret);
        setStripePublishableKey(data.publishableKey);
      }
    } catch (err) {
      console.error("Error al cargar la sesión de Stripe:", err);
    } finally {
      setIsStripeLoading(false);
    }
  };

  // Initialize and mount Stripe Connect Embedded Component
  useEffect(() => {
    const stripeConnectSDK = (window as any).StripeConnect;
    if (stripeConnectSDK && stripeClientSecret && stripePublishableKey) {
      try {
        console.log("Inicializando Stripe Connect Componentes Embebidos...");
        const stripeConnect = stripeConnectSDK.init({
          publishableKey: stripePublishableKey,
          clientSecret: stripeClientSecret,
          appearance: {
            overlays: "dialog",
            variables: {
              colorPrimary: "#0d9488", // color teal-600
              colorBackground: "#0f172a", // slate-900 para diseño oscuro
              colorText: "#f1f5f9", // slate-100
              colorDanger: "#ef4444", // red-500
              fontFamily: "Inter, system-ui, sans-serif",
              borderRadius: "16px"
            }
          }
        });

        const payoutsComponent = stripeConnect.create("payouts");
        payoutsComponent.mount("#stripe-payouts-embed");

        return () => {
          payoutsComponent.unmount();
        };
      } catch (err) {
        console.error("Error al inicializar componente Connect de Stripe:", err);
      }
    }
  }, [stripeClientSecret, stripePublishableKey, stripeScriptLoaded]);

  const loadFinancialData = async (cId: string, dId: string) => {
    const filterDate = subDays(new Date(), timeRange).toISOString();

    // 1. Fetch Paid Appointments
    const { data: aptsData } = await supabase
      .from("appointments")
      .select("id, start_time, public_patient_name, appointment_type, payment_amount, platform_fee, mp_payment_id")
      .eq("doctor_id", dId)
      .eq("payment_status", "pagado")
      .gte("start_time", filterDate)
      .order("start_time", { ascending: false });

    // 2. Fetch Medicine Sales
    const { data: salesData } = await supabase
      .from("appointment_sales")
      .select(`
        id,
        quantity,
        unit_price,
        total_price,
        created_at,
        inventory_items ( name, purchase_price ),
        appointments ( public_patient_name )
      `)
      .eq("clinic_id", cId)
      .gte("created_at", filterDate)
      .order("created_at", { ascending: false });

    // 3. Fetch Expenses
    const { data: expData } = await supabase
      .from("clinic_expenses")
      .select("*")
      .eq("clinic_id", cId)
      .gte("date", filterDate.split("T")[0])
      .order("date", { ascending: false });

    setAppointments(aptsData || []);
    setMedicineSales((salesData as any) || []);
    setExpenses(expData || []);
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicId || !expenseConcept || expenseAmount <= 0) return;

    setIsSavingExpense(true);
    try {
      const { data, error } = await supabase
        .from("clinic_expenses")
        .insert({
          clinic_id: clinicId,
          concept: expenseConcept.trim(),
          category: expenseCategory,
          amount: Number(expenseAmount),
          date: expenseDate
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Gasto registrado correctamente");
      setExpenses(prev => [data, ...prev]);
      setShowExpenseModal(false);
      setExpenseConcept("");
      setExpenseAmount(0);
    } catch (err: any) {
      toast.error("Error al guardar gasto", { description: err.message });
    } finally {
      setIsSavingExpense(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("¿Deseas eliminar este registro de gasto?")) return;

    try {
      const { error } = await supabase
        .from("clinic_expenses")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Registro de gasto eliminado");
      setExpenses(prev => prev.filter(e => e.id !== id));
    } catch (err: any) {
      toast.error("Error al eliminar", { description: err.message });
    }
  };

  // --- Calculations ---
  const consultationIncome = appointments.reduce((sum, apt) => sum + Number(apt.payment_amount || 0), 0);
  const medicineIncome = medicineSales.reduce((sum, sale) => sum + Number(sale.total_price || 0), 0);
  
  // Gross Income
  const grossIncome = consultationIncome + medicineIncome;

  // Platform Fees
  const platformFees = appointments.reduce((sum, apt) => sum + Number(apt.platform_fee || 0), 0);

  // Estimated Mercado Pago fees (3.4% + 4 MXN for each paid online transaction)
  const mpFees = appointments.reduce((sum, apt) => {
    if (apt.mp_payment_id) {
      return sum + (Number(apt.payment_amount) * 0.034 + 4);
    }
    return sum;
  }, 0);

  // Cost of Goods Sold (COGS) for medicines
  const medicineCOGS = medicineSales.reduce((sum, sale) => {
    const cost = sale.inventory_items?.purchase_price || 0;
    return sum + (cost * sale.quantity);
  }, 0);

  // Manual Registered Clinic Expenses
  const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);

  // Net Income
  const netIncome = grossIncome - platformFees - mpFees - medicineCOGS - totalExpenses;

  // Profit Margins
  const profitMarginPercent = grossIncome > 0 ? (netIncome / grossIncome) * 100 : 0;

  // --- SVG Chart Data Prep ---
  // Group income/expenses by day/date for the SVG chart
  const getChartData = () => {
    const days: Record<string, { date: string, income: number, expenses: number }> = {};
    
    // Initialize dates
    for (let i = timeRange - 1; i >= 0; i--) {
      const dateKey = format(subDays(new Date(), i), "yyyy-MM-dd");
      days[dateKey] = {
        date: format(subDays(new Date(), i), timeRange === 30 ? "dd MMM" : "MMM yy", { locale: es }),
        income: 0,
        expenses: 0
      };
    }

    // Accumulate appointments
    appointments.forEach(apt => {
      const key = apt.start_time.split("T")[0];
      if (days[key]) {
        days[key].income += Number(apt.payment_amount);
      }
    });

    // Accumulate medicine sales
    medicineSales.forEach(sale => {
      const key = sale.created_at.split("T")[0];
      if (days[key]) {
        days[key].income += Number(sale.total_price);
      }
    });

    // Accumulate expenses
    expenses.forEach(exp => {
      const key = exp.date;
      if (days[key]) {
        days[key].expenses += Number(exp.amount);
      }
    });

    return Object.values(days);
  };

  const chartData = getChartData();
  const maxVal = Math.max(...chartData.map(d => d.income), ...chartData.map(d => d.expenses), 1000);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-teal-500 mx-auto" />
          <p className="text-slate-500 text-sm">Cargando reportes financieros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-teal-500" />
            Panel Financiero
          </h1>
          <p className="text-slate-400 mt-1">
            Revisa tus ingresos brutos, gastos clínicos, comisiones y tu utilidad neta.
          </p>
        </div>
        
        <div className="flex items-center gap-2.5">
          <div className="flex bg-slate-900/60 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setTimeRange(30)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${timeRange === 30 ? "bg-teal-600 text-white font-medium" : "text-slate-400 hover:text-slate-200"}`}
            >
              30 Días
            </button>
            <button
              onClick={() => setTimeRange(90)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${timeRange === 90 ? "bg-teal-600 text-white font-medium" : "text-slate-400 hover:text-slate-200"}`}
            >
              90 Días
            </button>
            <button
              onClick={() => setTimeRange(365)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${timeRange === 365 ? "bg-teal-600 text-white font-medium" : "text-slate-400 hover:text-slate-200"}`}
            >
              1 Año
            </button>
          </div>
          
          <Button
            onClick={() => setShowExpenseModal(true)}
            className="rounded-xl px-4 bg-teal-600 hover:bg-teal-550 text-white font-medium shadow-[0_0_20px_-5px_rgba(13,148,136,0.4)] flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Registrar Gasto
          </Button>
        </div>
      </div>

      {/* Financial KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="bg-slate-950/40 border-slate-800/60 backdrop-blur-md shadow ring-1 ring-white/5 relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-slate-400 uppercase tracking-wider">Ingresos Brutos</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">${grossIncome.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</div>
            <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
              <span>Consultas: ${consultationIncome.toLocaleString("es-MX")}</span>
              <span>Medicinas: ${medicineIncome.toLocaleString("es-MX")}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-950/40 border-slate-800/60 backdrop-blur-md shadow ring-1 ring-white/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-slate-400 uppercase tracking-wider">Costos y Gastos</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">${(totalExpenses + medicineCOGS).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</div>
            <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
              <span>Fijos: ${totalExpenses.toLocaleString("es-MX")}</span>
              <span>COGS Meds: ${medicineCOGS.toLocaleString("es-MX")}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-950/40 border-slate-800/60 backdrop-blur-md shadow ring-1 ring-white/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-slate-400 uppercase tracking-wider">Comisiones de Pago</CardTitle>
            <Percent className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">${(platformFees + mpFees).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</div>
            <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
              <span>Plataforma: ${platformFees.toLocaleString("es-MX")}</span>
              <span>Mercado Pago: ${mpFees.toLocaleString("es-MX", { maximumFractionDigits: 0 })}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-950/45 border-teal-500/25 backdrop-blur-md shadow-[0_0_30px_-5px_rgba(13,148,136,0.15)] ring-1 ring-teal-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-teal-400 uppercase tracking-wider">Ganancia Neta Est.</CardTitle>
            <DollarSign className="h-4 w-4 text-teal-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-teal-400">${netIncome.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</div>
            <p className="text-slate-500 text-[10px] mt-1 flex items-center gap-1 font-mono">
              Margen de Utilidad: <span className="text-emerald-400 font-semibold">{profitMarginPercent.toFixed(0)}%</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* SVG Chart Panel */}
      <Card className="bg-slate-950/40 border-slate-800/60 backdrop-blur-md shadow ring-1 ring-white/5">
        <CardHeader>
          <CardTitle className="text-white text-base">Evolución de Finanzas</CardTitle>
          <CardDescription className="text-slate-400 text-xs">Progreso visual de ingresos (línea verde) contra gastos totales (barras rojas) en el período actual.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full relative pt-4">
            {/* SVG Chart */}
            <svg className="w-full h-full" viewBox="0 0 1000 240" preserveAspectRatio="none">
              {/* Grid Lines */}
              <line x1="0" y1="60" x2="1000" y2="60" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="0" y1="120" x2="1000" y2="120" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="0" y1="180" x2="1000" y2="180" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="0" y1="230" x2="1000" y2="230" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

              {/* Area under Income Line */}
              <path
                d={`
                  M 0,230 
                  ${chartData.map((d, i) => {
                    const x = (i / (chartData.length - 1)) * 1000;
                    const y = 230 - (d.income / maxVal) * 200;
                    return `L ${x},${y}`;
                  }).join(" ")} 
                  L 1000,230 Z
                `}
                fill="url(#incomeGrad)"
                opacity="0.15"
              />

              {/* Income Line */}
              <path
                d={chartData.map((d, i) => {
                  const x = (i / (chartData.length - 1)) * 1000;
                  const y = 230 - (d.income / maxVal) * 200;
                  return `${i === 0 ? "M" : "L"} ${x},${y}`;
                }).join(" ")}
                fill="none"
                stroke="#14b8a6"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Expense Bars */}
              {chartData.map((d, i) => {
                if (d.expenses <= 0) return null;
                const x = (i / (chartData.length - 1)) * 1000 - 4;
                const height = (d.expenses / maxVal) * 200;
                const y = 230 - height;
                return (
                  <rect
                    key={i}
                    x={x}
                    y={y}
                    width="8"
                    height={height}
                    fill="#ef4444"
                    opacity="0.6"
                    rx="2"
                  />
                );
              })}

              {/* Gradients Definition */}
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#14b8a6" />
                  <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>

            {/* X Axis Labels */}
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-3 px-2">
              <span>Hace {timeRange} días</span>
              <span>Medio período</span>
              <span>Hoy</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stripe Connect Embedded Balance & Payouts Component */}
      {stripeAccountId && stripeOnboardingCompleted && stripeClientSecret && (
        <Card className="bg-slate-950/40 border-slate-800/60 backdrop-blur-md shadow ring-1 ring-white/5 overflow-hidden">
          <CardHeader className="border-b border-white/5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-teal-400" />
                  Balances y Depósitos Automáticos (Stripe)
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs mt-0.5">
                  Visualiza el saldo disponible, cobros en tránsito, y el historial de transferencias automáticas a tu banco.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Depósitos Activos</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {isStripeLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-3">
                <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
                <p className="text-slate-400 text-xs">Cargando balance bancario de Stripe...</p>
              </div>
            ) : (
              <div 
                id="stripe-payouts-embed" 
                className="w-full min-h-[460px] bg-slate-900/10 rounded-xl overflow-hidden"
              ></div>
            )}
          </CardContent>
        </Card>
      )}

      <Script 
        src="https://connect-js.stripe.com/v1.0/sdk.js" 
        onLoad={() => {
          console.log("Stripe Connect JS cargado con éxito");
          setStripeScriptLoaded(true);
        }} 
      />

      {/* Split view: Expenses vs Transaction logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Registered Clinic Expenses (1/3) */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-slate-950/40 border-slate-800/60 backdrop-blur-md shadow ring-1 ring-white/5">
            <CardHeader className="border-b border-white/5 pb-4">
              <CardTitle className="text-white text-base">Gastos de Clínica</CardTitle>
              <CardDescription className="text-slate-400 text-xs">Registro e historial de egresos fijos y variables.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {expenses.length > 0 ? (
                <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                  {expenses.map(exp => (
                    <div key={exp.id} className="flex justify-between items-center bg-slate-900/30 border border-slate-900/60 p-3 rounded-xl hover:bg-slate-900/50 transition-colors">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-200">{exp.concept}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <span className="bg-slate-850 px-2 py-0.5 rounded text-slate-400">{exp.category}</span>
                          <span>•</span>
                          <span>{format(parseISO(exp.date), "dd MMM yyyy", { locale: es })}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-red-400 font-bold font-mono text-xs">${exp.amount.toFixed(0)}</span>
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="text-slate-600 hover:text-red-400 p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 text-center py-6">No hay gastos registrados en este período.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Detailed Transaction Logs (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-slate-950/40 border-slate-800/60 backdrop-blur-md shadow ring-1 ring-white/5">
            <CardHeader className="border-b border-white/5 pb-4">
              <CardTitle className="text-white text-base">Bitácora de Transacciones</CardTitle>
              <CardDescription className="text-slate-400 text-xs">Lista consolidada de consultas cobradas y ventas de medicamentos.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                {/* 1. Show Consultation payments */}
                {appointments.map(apt => (
                  <div key={apt.id} className="flex justify-between items-center bg-slate-900/20 border border-slate-900/60 p-3.5 rounded-xl hover:bg-slate-900/40 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 text-xs font-semibold shrink-0">
                        🩺
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-200">Consulta: {apt.public_patient_name}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                          <span>{format(parseISO(apt.start_time), "dd MMM yyyy - hh:mm a", { locale: es })}</span>
                          <span>•</span>
                          <span className="text-teal-400">{apt.appointment_type === "teleconsulta" ? "Online" : "Presencial"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-0.5">
                      <p className="text-emerald-400 font-bold font-mono text-xs">+${Number(apt.payment_amount).toFixed(2)}</p>
                      <p className="text-[9px] text-slate-500">Fee NERVE: $20.00</p>
                    </div>
                  </div>
                ))}

                {/* 2. Show Medicine sales */}
                {medicineSales.map(sale => (
                  <div key={sale.id} className="flex justify-between items-center bg-slate-900/20 border border-slate-900/60 p-3.5 rounded-xl hover:bg-slate-900/40 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 text-xs font-semibold shrink-0">
                        💊
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-200">Venta: {sale.inventory_items?.name || "Medicamento"}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                          <span>{format(parseISO(sale.created_at), "dd MMM yyyy", { locale: es })}</span>
                          <span>•</span>
                          <span>Paciente: {sale.appointments?.public_patient_name || "Venta Directa"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-0.5">
                      <p className="text-emerald-400 font-bold font-mono text-xs">+${Number(sale.total_price).toFixed(2)}</p>
                      <p className="text-[9px] text-slate-500">Cant: {sale.quantity}</p>
                    </div>
                  </div>
                ))}

                {appointments.length === 0 && medicineSales.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-12">No hay transacciones registradas en este período.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Manual Expense Registry Pop-up Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-slate-900 border-slate-800 shadow-2xl max-w-sm w-full relative overflow-hidden rounded-2xl">
            {/* inner glow */}
            <div className="absolute top-[-10%] right-[-10%] w-24 h-24 bg-teal-500/10 rounded-full blur-2xl" />

            <CardHeader className="pb-4 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-400" />
                  Registrar Gasto Clínico
                </CardTitle>
                <button
                  onClick={() => setShowExpenseModal(false)}
                  className="h-8 w-8 rounded-lg bg-slate-850 hover:bg-slate-800 flex items-center justify-center text-slate-400 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>
            <form onSubmit={handleAddExpense}>
              <CardContent className="space-y-4 pt-5">
                <div className="space-y-1.5">
                  <Label className="text-slate-300 text-xs">Concepto / Descripción</Label>
                  <Input
                    required
                    placeholder="Ej. Pago de renta del local, compra de gasas"
                    value={expenseConcept}
                    onChange={(e) => setExpenseConcept(e.target.value)}
                    className="bg-slate-950 border-slate-850 text-slate-200 focus-visible:ring-teal-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-slate-300 text-xs">Categoría</Label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                    className="w-full h-10 rounded-lg bg-slate-950 border border-slate-850 text-xs text-slate-200 px-3 focus:outline-none focus:border-teal-500"
                  >
                    <option value="Suministros">Suministros Médicos</option>
                    <option value="Renta">Renta / Servicios</option>
                    <option value="Salarios">Salarios / Honorarios</option>
                    <option value="Publicidad">Marketing / Publicidad</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-slate-300 text-xs">Monto ($ MXN)</Label>
                    <Input
                      type="number"
                      required
                      min="1"
                      placeholder="0.00"
                      value={expenseAmount || ""}
                      onChange={(e) => setExpenseAmount(parseFloat(e.target.value) || 0)}
                      className="bg-slate-950 border-slate-850 text-slate-200 focus-visible:ring-teal-500/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-300 text-xs">Fecha</Label>
                    <Input
                      type="date"
                      required
                      value={expenseDate}
                      onChange={(e) => setExpenseDate(e.target.value)}
                      className="bg-slate-950 border-slate-850 text-slate-200 focus-visible:ring-teal-500/50"
                    />
                  </div>
                </div>

                <Separator className="bg-slate-800/80 my-4" />

                <div className="flex gap-3 justify-end pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowExpenseModal(false)}
                    className="border-slate-800 bg-slate-900/20 text-slate-400 hover:bg-slate-900/40 rounded-xl"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSavingExpense}
                    className="bg-teal-600 hover:bg-teal-550 text-white rounded-xl shadow-[0_0_20px_-5px_rgba(13,148,136,0.3)] min-w-[100px]"
                  >
                    {isSavingExpense ? <Loader2 className="h-4 w-4 animate-spin" /> : "Registrar"}
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
