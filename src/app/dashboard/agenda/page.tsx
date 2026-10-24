"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Clock, Plus, User, Trash2, Edit3, Timer, Stethoscope, CheckCircle2, AlertCircle, Video } from "lucide-react";
import { Calendar, dateFnsLocalizer, Event as RBCEvent, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es } from "date-fns/locale/es"; // Locale Spanish
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import "react-big-calendar/lib/css/react-big-calendar.css";

// 1. Configuración de zona horaria y localización para español
const locales = {
  "es": es,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }), // Iniciar la semana en Lunes
  getDay,
  locales,
});

// Estructura extendida de evento
interface ClinicEvent extends RBCEvent {
  id: string;
  patientId: string | null;
  patientName: string;
  doctorName: string;
  type: string;
  status: "En sala" | "Programado" | "Cancelado" | "Completado";
  colorHex: string;
  publicPatientName?: string | null;
  publicPatientPhone?: string | null;
  publicPatientEmail?: string | null;
  matchStatus?: "linked" | "pending" | "new_patient" | null;
  teleconsulta_url?: string | null;
}

// Mock Data borrado. La DB inyectará los datos.

// Diccionario puro de traducción
const messages = {
  allDay: "Todo el día",
  previous: "Anterior",
  next: "Siguiente",
  today: "Hoy",
  month: "Mes",
  week: "Semana",
  day: "Día",
  agenda: "Agenda",
  date: "Fecha",
  time: "Hora",
  event: "Evento",
  noEventsInRange: "No hay citas en este rango.",
  showMore: (total: number) => `+ ${total} más`
};

export default function AgendaPage() {
  const router = useRouter();
  const { user, userProfile, clinic, isAdmin, isReceptionist, isLoading: isAuthLoading } = useAuth();
  const [hasMounted, setHasMounted] = useState(false);
  const [events, setEvents] = useState<ClinicEvent[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]); // for receptionist filter
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string>("all");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [currentView, setCurrentView] = useState<any>(Views.WEEK);

  // Automatically switch calendar view to Day view on mobile screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCurrentView(Views.DAY);
      } else {
        setCurrentView(Views.WEEK);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleNavigatePrev = () => {
    const d = new Date(currentDate);
    if (currentView === Views.MONTH) d.setMonth(d.getMonth() - 1);
    else if (currentView === Views.WEEK) d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const handleNavigateNext = () => {
    const d = new Date(currentDate);
    if (currentView === Views.MONTH) d.setMonth(d.getMonth() + 1);
    else if (currentView === Views.WEEK) d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  const getToolbarDateLabel = () => {
    if (currentView === Views.MONTH) {
      return format(currentDate, "MMMM yyyy", { locale: es }).toUpperCase();
    } else if (currentView === Views.WEEK) {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      
      if (start.getMonth() === end.getMonth()) {
        return `${format(start, "d", { locale: es })} - ${format(end, "d 'de' MMMM", { locale: es })}`.toUpperCase();
      } else {
        return `${format(start, "d 'de' MMM", { locale: es })} - ${format(end, "d 'de' MMM", { locale: es })}`.toUpperCase();
      }
    } else {
      return format(currentDate, "EEEE, d 'de' MMMM yyyy", { locale: es }).toUpperCase();
    }
  };

  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTelehealthConfirmOpen, setIsTelehealthConfirmOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ClinicEvent | null>(null);
  const [editData, setEditData] = useState({
    title: "",
    type: "Consulta General",
    date: "",
    time: "",
    duration: "45",
    status: "Programado",
  });

  // Appointment Form State
  const [appointmentData, setAppointmentData] = useState({
    patient_id: "",
    title: "",
    type: "Consulta General",
    date: "",
    time: "",
    duration: "45",
    status: "Programado",
    color_hex: "rgba(20, 184, 166, 0.2)"
  });

  // Duration options
  const durationOptions = [
    { value: "15", label: "15 min" },
    { value: "30", label: "30 min" },
    { value: "45", label: "45 min" },
    { value: "60", label: "1 hora" },
    { value: "120", label: "2 horas" },
  ];

  // Compute start/end Date objects from date + time + duration
  const computeStartEnd = (date: string, time: string, duration: string) => {
    const start = new Date(`${date}T${time}`);
    const end = new Date(start.getTime() + parseInt(duration) * 60000);
    return { start, end };
  };

  // Patient Search & Creation state
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatientForAppointment, setSelectedPatientForAppointment] = useState<any>(null);
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const [newPatientData, setNewPatientData] = useState({ first_name: "", last_name: "", phone: "" });

  // Triage state for online bookings
  const [triageSearch, setTriageSearch] = useState("");

  // Filtered patients based on search
  const filteredPatientsForAppointment = patients.filter((p: any) => {
    const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
    return fullName.includes(patientSearch.toLowerCase());
  });

  // Create new patient inline and auto-select
  const handleCreateAndSelectPatient = async () => {
    const clinicId = userProfile?.clinic_id;
    const { data, error } = await supabase
      .from("patients")
      .insert([{ 
        clinic_id: clinicId,
        first_name: newPatientData.first_name, 
        last_name: newPatientData.last_name,
        phone: newPatientData.phone || null 
      }])
      .select()
      .single();

    if (error) {
      toast.error("Error creando paciente", { description: error.message });
      return;
    }

    // Auto-select the new patient
    setSelectedPatientForAppointment(data);
    setAppointmentData(prev => ({ ...prev, patient_id: data.id }));
    setShowNewPatientForm(false);
    setNewPatientData({ first_name: "", last_name: "", phone: "" });
    
    // Refresh patient list
    fetchPatients();
    toast.success("Paciente creado y seleccionado");
  };

  useEffect(() => {
    setHasMounted(true);
    setAppointmentData(prev => ({
      ...prev,
      date: new Date().toISOString().split('T')[0],
      time: `${String(new Date().getHours()).padStart(2,'0')}:${String(new Date().getMinutes()).padStart(2,'0')}`
    }));
    
    // Only fetch if profile is ready
    if (userProfile?.clinic_id) {
      fetchPatients();
      if (isAdmin || isReceptionist) fetchDoctors();
    }
  }, [user, userProfile, isAdmin, isReceptionist]);

  useEffect(() => {
    if (userProfile?.clinic_id) {
      fetchEvents();
    } else if (!isAuthLoading) {
      setIsLoading(false);
    }
  }, [user, userProfile, selectedDoctorFilter, isAuthLoading]);

  const fetchPatients = async () => {
    if (!userProfile?.clinic_id) return;
    try {
      const { data } = await supabase
        .from("patients")
        .select("id, first_name, last_name, phone, email")
        .eq("clinic_id", userProfile?.clinic_id)
        .order("first_name", { ascending: true });
      if (data) setPatients(data);
    } catch (err) {
      console.error("Error in fetchPatients:", err);
    }
  };

  // Fetch all doctors in this clinic (for receptionist/admin filter)
  const fetchDoctors = async () => {
    if (!userProfile?.clinic_id) return;
    try {
      const { data } = await supabase
        .from("users")
        .select("id, first_name, last_name, role")
        .eq("clinic_id", userProfile?.clinic_id)
        .in("role", ["doctor", "admin"])
        .eq("active", true);
      if (data) setDoctors(data);
    } catch (err) {
      console.error("Error in fetchDoctors:", err);
    }
  };

  const fetchEvents = async () => {
    if (!user || !userProfile?.clinic_id) {
      // If we finished auth loading but still don't have a clinic_id, release the UI
      setIsLoading(false);
      return;
    }
    setIsLoading(true);

    try {
      let query = supabase.from('appointments').select(`
        id,
        patient_id,
        doctor_id,
        title,
        type,
        start_time,
        end_time,
        status,
        color_hex,
        public_patient_name,
        public_patient_phone,
        public_patient_email,
        match_status,
        teleconsulta_url,
        patients ( first_name, last_name ),
        users:doctor_id ( first_name, last_name )
      `).eq('clinic_id', userProfile?.clinic_id);

      // === ROLE-BASED FILTERING ===
      const isSoloPlan = clinic?.subscription_tier === 'solo';

      if (!isAdmin && !isReceptionist) {
        // DOCTOR: only see their own appointments
        query = query.eq('doctor_id', user.id);
      } else if (isReceptionist && isSoloPlan) {
        // RECEPTIONIST in SOLO plan
      } else if (isReceptionist && !isSoloPlan) {
        // RECEPTIONIST in CLINIC plan
        if (selectedDoctorFilter !== 'all') {
          query = query.eq('doctor_id', selectedDoctorFilter);
        }
      } else if (isAdmin) {
        // ADMIN
        if (selectedDoctorFilter !== 'all') {
          query = query.eq('doctor_id', selectedDoctorFilter);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching agenda:", error);
        toast.error("Error al cargar citas");
      } else if (data) {
        const parsedEvents: ClinicEvent[] = data.map((evt: any) => ({
          id: evt.id,
          patientId: evt.patient_id,
          doctorId: evt.doctor_id,
          title: evt.title,
          patientName: evt.match_status === 'pending'
            ? `⚠️ [Pendiente] ${evt.public_patient_name}`
            : (evt.patients ? `${evt.patients.first_name} ${evt.patients.last_name}` : evt.title),
          doctorName: evt.users ? `${evt.users.first_name} ${evt.users.last_name}` : '',
          type: evt.type,
          start: new Date(evt.start_time),
          end: new Date(evt.end_time),
          status: evt.status,
          colorHex: evt.match_status === 'pending' ? 'rgba(239, 68, 68, 0.15)' : evt.color_hex,
          publicPatientName: evt.public_patient_name,
          publicPatientPhone: evt.public_patient_phone,
          publicPatientEmail: evt.public_patient_email,
          matchStatus: evt.match_status,
          teleconsulta_url: evt.teleconsulta_url
        }));
        setEvents(parsedEvents);
      }
    } catch (err) {
      console.error("Unexpected error in fetchEvents:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    setAppointmentData({
      ...appointmentData,
      patient_id: "",
      title: "",
      date: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`,
      time: `${pad(start.getHours())}:${pad(start.getMinutes())}`,
      duration: "45",
    });
    setSelectedPatientForAppointment(null);
    setPatientSearch("");
    setShowNewPatientForm(false);
    setIsDialogOpen(true);
  };

  const handleSaveAppointment = async () => {
    if (!appointmentData.patient_id) {
      toast.error("Debes seleccionar un paciente");
      return;
    }
    if (!appointmentData.title) {
      toast.error("Debes ingresar un motivo de cita");
      return;
    }

    const { start, end } = computeStartEnd(appointmentData.date, appointmentData.time, appointmentData.duration);

    const { data, error } = await supabase
      .from("appointments")
      .insert([
        {
          clinic_id: userProfile?.clinic_id,
          doctor_id: user?.id,
          patient_id: appointmentData.patient_id,
          title: appointmentData.title,
          type: appointmentData.type,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          status: appointmentData.status,
          color_hex: appointmentData.color_hex,
        },
      ])
      .select();

    if (error) {
      toast.error("Error al agendar cita", { description: error.message });
    } else {
      toast.success("Cita agendada correctamente");
      setIsDialogOpen(false);
      fetchEvents();
      // Send confirmation notification (async, non-blocking)
      if (data && data[0]?.id) {
        fetch('/api/notifications/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ appointmentId: data[0].id, type: 'confirmation' }),
        }).then(res => res.json()).then(r => {
          if (r.success) toast.success('📩 Notificación enviada al paciente', { duration: 3000 });
        }).catch(() => { /* notification fail is non-critical */ });
      }
    }
  };

  const handleSelectEvent = (event: ClinicEvent) => {
    const s = event.start as Date;
    const e = event.end as Date;
    const pad = (n: number) => n.toString().padStart(2, '0');
    const diffMin = Math.round((e.getTime() - s.getTime()) / 60000);
    const closestDuration = durationOptions.reduce((prev, curr) => 
      Math.abs(parseInt(curr.value) - diffMin) < Math.abs(parseInt(prev.value) - diffMin) ? curr : prev
    ).value;

    setEditingEvent(event);
    setTriageSearch("");
    setEditData({
      title: event.title as string || "",
      type: event.type,
      date: `${s.getFullYear()}-${pad(s.getMonth() + 1)}-${pad(s.getDate())}`,
      time: `${pad(s.getHours())}:${pad(s.getMinutes())}`,
      duration: closestDuration,
      status: event.status,
    });
    setIsEditDialogOpen(true);
  };

  const handleLinkToExistingPatient = async (patientId: string) => {
    if (!editingEvent) return;
    const { error } = await supabase
      .from("appointments")
      .update({
        patient_id: patientId,
        match_status: "linked"
      })
      .eq("id", editingEvent.id);

    if (error) {
      toast.error("Error al vincular cita", { description: error.message });
    } else {
      toast.success("Cita vinculada exitosamente");
      setIsEditDialogOpen(false);
      fetchEvents();
    }
  };

  const handleCreateTriagePatient = async () => {
    if (!editingEvent) return;
    const clinicId = userProfile?.clinic_id;
    const parts = (editingEvent.publicPatientName || "").trim().split(/\s+/);
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || 'Pérez';

    const { data: newPatient, error: patientError } = await supabase
      .from("patients")
      .insert({
        clinic_id: clinicId,
        first_name: firstName,
        last_name: lastName,
        phone: editingEvent.publicPatientPhone || null,
        email: editingEvent.publicPatientEmail || null
      })
      .select()
      .single();

    if (patientError) {
      toast.error("Error al crear expediente", { description: patientError.message });
      return;
    }

    const { error: appError } = await supabase
      .from("appointments")
      .update({
        patient_id: newPatient.id,
        match_status: "new_patient"
      })
      .eq("id", editingEvent.id);

    if (appError) {
      toast.error("Error al vincular cita", { description: appError.message });
    } else {
      toast.success("Expediente creado y cita vinculada");
      setIsEditDialogOpen(false);
      fetchEvents();
      fetchPatients();
    }
  };

  const handleUpdateAppointment = async () => {
    if (!editingEvent) return;
    const { start, end } = computeStartEnd(editData.date, editData.time, editData.duration);
    const { error } = await supabase
      .from("appointments")
      .update({
        title: editData.title,
        type: editData.type,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        status: editData.status,
      })
      .eq("id", editingEvent.id);

    if (error) {
      toast.error("Error al actualizar", { description: error.message });
    } else {
      toast.success("Cita actualizada");
      setIsEditDialogOpen(false);
      fetchEvents();
      // Send reschedule notification
      fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: editingEvent.id, type: 'reschedule' }),
      }).then(res => res.json()).then(r => {
        if (r.success) toast.success('📩 Notificación de reagendamiento enviada', { duration: 3000 });
      }).catch(() => {});
    }
  };

  const handleDeleteAppointment = async () => {
    if (!editingEvent) return;

    // Send cancellation notification BEFORE deleting (so the API can still fetch appointment data)
    fetch('/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointmentId: editingEvent.id, type: 'cancellation' }),
    }).catch(() => {});

    const { error } = await supabase
      .from("appointments")
      .delete()
      .eq("id", editingEvent.id);

    if (error) {
      toast.error("Error al eliminar", { description: error.message });
    } else {
      toast.success("Cita eliminada");
      setIsEditDialogOpen(false);
      fetchEvents();
    }
  };

  const handleCompleteAppointment = async () => {
    if (!editingEvent) return;
    const { error } = await supabase
      .from("appointments")
      .update({ status: "Completado" })
      .eq("id", editingEvent.id);

    if (error) {
      toast.error("Error al completar", { description: error.message });
    } else {
      toast.success("Cita marcada como completada ✅");
      setIsEditDialogOpen(false);
      fetchEvents();
    }
  };

  // Sobrescritura extrema del CSS para BigCalendar para que coincida con nuestro Glassmorphism
  const customCalendarStyles = `
    .rbc-calendar { font-family: inherit; }
    .rbc-header { padding: 14px 4px; font-weight: 600; text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.05em; color: #94a3b8; border-color: rgba(255,255,255,0.06) !important; background: rgba(15, 23, 42, 0.5); }
    .rbc-today { background-color: rgba(20, 184, 166, 0.08) !important; }
    .rbc-month-view, .rbc-time-view { border-color: rgba(255,255,255,0.06) !important; border-radius: 0.75rem; overflow: hidden; background: rgba(2, 6, 23, 0.3); }
    .rbc-month-row, .rbc-day-bg, .rbc-time-header-content { border-color: rgba(255,255,255,0.06) !important; }
    .rbc-time-content { border-top: 1px solid rgba(255,255,255,0.06); overflow-y: auto !important; }
    .rbc-timeslot-group { border-color: rgba(255,255,255,0.06) !important; min-height: 60px; }
    .rbc-time-slot { border-color: rgba(255,255,255,0.03) !important; min-height: 30px; }
    .rbc-off-range-bg { background-color: rgba(15, 23, 42, 0.3) !important; }
    .rbc-date-cell { padding: 8px; font-size: 0.875rem; color: #cbd5e1; font-weight: 500; }
    .rbc-off-range { color: #475569; }
    .rbc-time-header.rbc-overflowing { border-right: none; }
    .rbc-time-gutter .rbc-timeslot-group { 
      border-bottom: 1px solid rgba(255,255,255,0.04); 
      font-size: 0.7rem; 
      color: #64748b; 
      padding-right: 10px; 
      min-width: 60px;
    }
    .rbc-time-gutter .rbc-label { 
      font-size: 0.7rem;
      font-weight: 500;
      color: #64748b;
      padding: 0 8px 2px 4px;
    }
    .rbc-current-time-indicator {
      background-color: #14b8a6;
      height: 2px;
      box-shadow: 0 0 8px rgba(20, 184, 166, 0.6);
    }
    .rbc-current-time-indicator::before {
      content: '';
      position: absolute;
      left: -5px;
      top: -4px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #14b8a6;
      box-shadow: 0 0 6px rgba(20, 184, 166, 0.5);
    }
    
    /* Evento — más visible y con más padding */
    .rbc-event { 
      padding: 4px 8px; 
      border-radius: 8px; 
      border: none !important; 
      border-left: 3px solid rgba(255,255,255,0.3) !important;
      margin: 1px 2px; 
      transition: all 0.2s ease; 
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      min-height: 28px !important;
    }
    .rbc-event:hover { 
      filter: brightness(1.3); 
      z-index: 10 !important; 
      transform: scale(1.03); 
      box-shadow: 0 4px 16px rgba(0,0,0,0.5);
    }
    .rbc-event-content { font-size: 0.7rem; font-weight: 600; letter-spacing: -0.01em; line-height: 1.3; }
    .rbc-event-label { font-size: 0.65rem; font-weight: 500; color: rgba(255,255,255,0.8); }
    
    /* Evento mensual */
    .rbc-row-segment .rbc-event { min-height: 22px !important; }
    .rbc-show-more { color: #14b8a6; font-size: 0.7rem; font-weight: 600; padding: 2px 8px; }
    
    /* Custom scrollbar para la vista de tiempo */
    .rbc-time-content::-webkit-scrollbar { width: 6px; }
    .rbc-time-content::-webkit-scrollbar-track { background: rgba(15, 23, 42, 0.3); border-radius: 3px; }
    .rbc-time-content::-webkit-scrollbar-thumb { background: rgba(100, 116, 139, 0.4); border-radius: 3px; }
    .rbc-time-content::-webkit-scrollbar-thumb:hover { background: rgba(100, 116, 139, 0.6); }
    
    /* Scroll fade indicator */
    .rbc-time-view::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 40px;
      background: linear-gradient(to top, rgba(2, 6, 23, 0.8), transparent);
      pointer-events: none;
      z-index: 5;
      border-radius: 0 0 0.75rem 0.75rem;
    }
    
    /* Toolbar escondido para usar nuestro custom */
    .rbc-toolbar { margin-bottom: 20px; display: none; }
    
    /* Selección de slot */
    .rbc-slot-selection { background: rgba(20, 184, 166, 0.15) !important; border: 1px dashed rgba(20, 184, 166, 0.4) !important; border-radius: 6px; }
    
    /* Day column más visible */
    .rbc-day-slot .rbc-time-slot { border-top: 1px solid rgba(255,255,255,0.03); }
    .rbc-allday-cell { display: none; }
    .rbc-time-view .rbc-header { border-bottom: 2px solid rgba(20, 184, 166, 0.15); }
  `;

  // Custom Event Wrapper
  const EventComponent = ({ event }: { event: ClinicEvent }) => {
    const isCompleted = event.status === "Completado";
    const isPending = event.matchStatus === 'pending';
    return (
      <div className="h-full flex flex-col justify-start gap-0.5 py-0.5">
        <span className={`font-bold text-[11px] leading-tight drop-shadow-md ${
          isCompleted ? 'line-through opacity-70 text-green-200' 
          : isPending ? 'text-amber-100'
          : 'text-white'
        }`}>
          {isPending && '⚠ '}{event.patientName}
        </span>
        <span className={`text-[10px] leading-tight font-medium ${
          isCompleted ? 'text-green-300/60' 
          : isPending ? 'text-amber-300/80'
          : 'text-white/70'
        }`}>
          {isCompleted ? '✓ Completado' : isPending ? 'Pendiente vincular' : event.type}
        </span>
      </div>
    );
  };

  // Custom Prop Getter para inyectar los colores del mock
  const eventStyleGetter = (event: ClinicEvent) => {
    if (event.status === "Completado") {
      return {
        style: {
          backgroundColor: 'rgba(34, 197, 94, 0.2)',
          borderLeft: '3px solid rgba(34, 197, 94, 0.7)',
          color: '#bbf7d0',
          opacity: 0.75,
        }
      };
    }
    if (event.matchStatus === 'pending') {
      return {
        style: {
          backgroundColor: 'rgba(245, 158, 11, 0.2)',
          borderLeft: '3px solid rgba(245, 158, 11, 0.8)',
          color: '#fef3c7',
        }
      };
    }
    // Default: use the event's color with better opacity
    const baseColor = event.colorHex || 'rgba(20, 184, 166, 0.3)';
    return {
      style: {
        backgroundColor: baseColor,
        borderLeft: `3px solid ${baseColor.includes('rgba') ? baseColor.replace(/[\d.]+\)$/, '0.9)') : baseColor}`,
        color: '#f8fafc'
      }
    };
  };

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col pt-2">
      <style>{customCalendarStyles}</style>

      {/* Modern Toolbar Custom */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            {isAdmin ? "Agenda General" : isReceptionist ? "Agenda de Consultas" : "Mi Agenda"}
          </h1>
          <p className="text-slate-400 mt-1">Control interactivo de tiempos y atenciones.</p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap justify-end">
          {/* Doctor filter — visible to admin and clinic-plan receptionists */}
          {(isAdmin || (isReceptionist && clinic?.subscription_tier !== 'solo')) && doctors.length > 0 && (
            <Select value={selectedDoctorFilter} onValueChange={(val) => setSelectedDoctorFilter(val || "all")}>
              <SelectTrigger className="w-48 bg-slate-900/50 border-slate-800 text-slate-300 h-9">
                <SelectValue placeholder="Filtrar por doctor" />
              </SelectTrigger>
              <SelectContent className="bg-slate-950 border-slate-800">
                <SelectItem value="all" className="text-slate-300">Todos los doctores</SelectItem>
                {doctors.map((doc: any) => (
                  <SelectItem key={doc.id} value={doc.id} className="text-slate-300">
                    {doc.first_name} {doc.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div className="flex items-center bg-slate-900/50 p-1 rounded-lg border border-slate-800/60">
            {['month', 'week', 'day'].map((v) => (
              <Button 
                key={v} 
                size="sm" 
                variant="ghost" 
                onClick={() => setCurrentView(v)}
                className={`hover:text-white capitalize px-4 h-8 transition-colors ${
                  currentView === v ? "bg-slate-800 text-white shadow-sm" : "text-slate-400"
                }`}
              >
                {messages[v as 'month' | 'week' | 'day']}
              </Button>
            ))}
          </div>

          <Button 
            onClick={() => setIsDialogOpen(true)}
            className="bg-teal-600 hover:bg-teal-500 text-white rounded-xl shadow-[0_0_20px_-5px_rgba(13,148,136,0.4)] transition-all"
          >
            <Plus className="h-4 w-4 mr-2" /> Agendar
          </Button>
        </div>

      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setPatientSearch(""); setShowNewPatientForm(false); } }}>
        <DialogContent className="sm:max-w-[480px] bg-slate-950 border-slate-800 text-slate-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-medium text-white">Agendar Cita</DialogTitle>
            <DialogDescription className="text-slate-400">
              Busca un paciente o crea uno nuevo para programar la cita.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Patient Search & Select */}
            <div className="space-y-2">
              <Label className="text-slate-300">Paciente</Label>
              
              {selectedPatientForAppointment ? (
                /* Selected Patient Chip */
                <div className="flex items-center justify-between bg-teal-500/10 border border-teal-500/30 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-bold">
                      {selectedPatientForAppointment.first_name[0]}{selectedPatientForAppointment.last_name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-teal-300">{selectedPatientForAppointment.first_name} {selectedPatientForAppointment.last_name}</p>
                      <p className="text-[10px] text-slate-500">Paciente seleccionado</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => { setSelectedPatientForAppointment(null); setAppointmentData({...appointmentData, patient_id: ""}); setPatientSearch(""); }}
                    className="text-slate-500 hover:text-red-400 h-7 px-2 text-xs"
                  >
                    Cambiar
                  </Button>
                </div>
              ) : showNewPatientForm ? (
                /* New Patient Inline Form */
                <div className="space-y-3 p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium text-teal-400">Nuevo Paciente</p>
                    <Button variant="ghost" size="sm" onClick={() => setShowNewPatientForm(false)} className="text-slate-500 h-6 px-2 text-[10px]">
                      Volver a buscar
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase text-slate-500 font-bold">Nombre</Label>
                      <Input 
                        placeholder="Nombre" 
                        className="bg-slate-950 border-slate-800 h-8 text-sm"
                        value={newPatientData.first_name}
                        onChange={(e) => setNewPatientData({...newPatientData, first_name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase text-slate-500 font-bold">Apellido</Label>
                      <Input 
                        placeholder="Apellido" 
                        className="bg-slate-950 border-slate-800 h-8 text-sm"
                        value={newPatientData.last_name}
                        onChange={(e) => setNewPatientData({...newPatientData, last_name: e.target.value})}
                      />
                    </div>
                  </div>
                  <Input 
                    placeholder="Teléfono (opcional)" 
                    className="bg-slate-950 border-slate-800 h-8 text-sm"
                    value={newPatientData.phone}
                    onChange={(e) => setNewPatientData({...newPatientData, phone: e.target.value})}
                  />
                  <Button 
                    onClick={handleCreateAndSelectPatient}
                    disabled={!newPatientData.first_name || !newPatientData.last_name}
                    className="w-full bg-teal-600 hover:bg-teal-500 text-white h-8 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-2" /> Crear y Seleccionar
                  </Button>
                </div>
              ) : (
                /* Search Input + Results */
                <div className="relative">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input 
                      placeholder="Escribe el nombre del paciente..."
                      className="pl-10 bg-slate-900/50 border-slate-800 focus-visible:ring-teal-500/50"
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                      autoFocus
                    />
                  </div>
                  
                  {/* Filtered Results */}
                  {patientSearch.length > 0 && (
                    <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl">
                      {filteredPatientsForAppointment.length > 0 ? (
                        filteredPatientsForAppointment.map((p: any) => (
                          <button
                            key={p.id}
                            onClick={() => {
                              setSelectedPatientForAppointment(p);
                              setAppointmentData({...appointmentData, patient_id: p.id});
                              setPatientSearch("");
                            }}
                            className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-teal-500/10 transition-colors border-b border-white/5 last:border-none"
                          >
                            <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">
                              {p.first_name[0]}{p.last_name[0]}
                            </div>
                            <div>
                              <p className="text-sm text-slate-200">{p.first_name} {p.last_name}</p>
                              <p className="text-[10px] text-slate-500">{p.phone || p.email || "Sin contacto"}</p>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-center">
                          <p className="text-xs text-slate-500 mb-3">No se encontró ningún paciente con "{patientSearch}"</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => { 
                              setShowNewPatientForm(true); 
                              const parts = patientSearch.trim().split(" ");
                              setNewPatientData({ first_name: parts[0] || "", last_name: parts.slice(1).join(" ") || "", phone: "" });
                            }}
                            className="border-teal-500/30 text-teal-400 hover:bg-teal-500/10 text-xs"
                          >
                            <Plus className="h-3 w-3 mr-2" /> Crear "{patientSearch}" como nuevo paciente
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {patientSearch.length === 0 && (
                    <p className="text-[10px] text-slate-600 mt-1.5 px-1">
                      Empieza a escribir para buscar, o <button onClick={() => setShowNewPatientForm(true)} className="text-teal-500 hover:underline">crea un paciente nuevo</button>
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title" className="text-slate-300">Motivo / Título</Label>
              <Input 
                id="title" 
                placeholder="Ej. Chequeo General" 
                value={appointmentData.title}
                onChange={(e) => setAppointmentData({...appointmentData, title: e.target.value})}
                className="bg-slate-900/50 border-slate-800 focus-visible:ring-teal-500/50"
              />
            </div>

            {/* Date / Time / Duration Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-slate-300 flex items-center gap-2">
                  <CalendarIcon className="h-3.5 w-3.5 text-slate-500" /> Fecha
                </Label>
                <Input 
                  type="date"
                  value={appointmentData.date}
                  onChange={(e) => setAppointmentData({...appointmentData, date: e.target.value})}
                  className="bg-slate-900/50 border-slate-800 focus-visible:ring-teal-500/50 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300 flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-slate-500" /> Hora
                </Label>
                <Input 
                  type="time"
                  value={appointmentData.time}
                  onChange={(e) => setAppointmentData({...appointmentData, time: e.target.value})}
                  className="bg-slate-900/50 border-slate-800 focus-visible:ring-teal-500/50 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300 flex items-center gap-2">
                  <Timer className="h-3.5 w-3.5 text-slate-500" /> Duración
                </Label>
                <Select value={appointmentData.duration || ""} onValueChange={(val) => setAppointmentData({...appointmentData, duration: val || ""})}>
                  <SelectTrigger className="bg-slate-900/50 border-slate-800 focus:ring-teal-500/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-950 border-slate-800 text-slate-200">
                    {durationOptions.map(d => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type" className="text-slate-300">Tipo</Label>
                <Select 
                  value={appointmentData.type || ""} 
                  onValueChange={(val) => setAppointmentData({...appointmentData, type: val || ""})}
                >
                  <SelectTrigger className="bg-slate-900/50 border-slate-800 focus:ring-teal-500/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-950 border-slate-800 text-slate-200">
                    <SelectItem value="Consulta General">Consulta General</SelectItem>
                    <SelectItem value="Urgencia">Urgencia</SelectItem>
                    <SelectItem value="Seguimiento">Seguimiento</SelectItem>
                    <SelectItem value="Estudio">Estudio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status" className="text-slate-300">Estado Inicial</Label>
                <Select 
                  value={appointmentData.status} 
                  onValueChange={(val) => setAppointmentData({...appointmentData, status: val as any})}
                >
                  <SelectTrigger className="bg-slate-900/50 border-slate-800 focus:ring-teal-500/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-950 border-slate-800 text-slate-200">
                    <SelectItem value="Programado">Programado</SelectItem>
                    <SelectItem value="En sala">En sala</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-slate-400 hover:text-white">Cancelar</Button>
            <Button onClick={handleSaveAppointment} className="bg-teal-600 hover:bg-teal-500 text-white">Guardar Cita</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit / Reschedule Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[540px] bg-slate-950 border-slate-800 text-slate-200 overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-medium text-white flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-teal-500" /> Editar / Reagendar Cita
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {editingEvent && (
                <span>Paciente: <span className="text-teal-400 font-medium">{editingEvent.patientName}</span></span>
              )}
            </DialogDescription>
          </DialogHeader>

          {/* Triage Section for Pending Online Appointments */}
          {editingEvent?.matchStatus === "pending" && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 space-y-4 mb-2 text-slate-300">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-400">Cita pendiente de vincular</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Esta cita se reservó en línea pero requiere validación manual porque el número coincide con otro expediente pero el nombre o correo difiere.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-950/40 p-3 rounded-lg border border-slate-900">
                <div>
                  <span className="text-slate-500 block">Nombre ingresado:</span>
                  <strong className="text-slate-300">{editingEvent.publicPatientName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Teléfono ingresado:</span>
                  <strong className="text-slate-300">{editingEvent.publicPatientPhone}</strong>
                </div>
                {editingEvent.publicPatientEmail && (
                  <div className="col-span-2">
                    <span className="text-slate-500 block">Correo ingresado:</span>
                    <strong className="text-slate-300">{editingEvent.publicPatientEmail}</strong>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-300">¿Qué deseas hacer?</p>
                <div className="flex flex-col gap-3">
                  {/* Option 1: Search and Link to Existing Patient */}
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-400">Opción 1: Vincular a un expediente existente</Label>
                    <div className="relative">
                      <Input
                        placeholder="Buscar expediente..."
                        value={triageSearch}
                        onChange={(e) => setTriageSearch(e.target.value)}
                        className="bg-slate-950 border-slate-800 text-xs h-8 focus-visible:ring-teal-500/50"
                      />
                      {triageSearch.length > 0 && (
                        <div className="absolute left-0 right-0 mt-1 max-h-36 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950 z-20 shadow-xl">
                          {patients
                            .filter((p: any) =>
                              `${p.first_name} ${p.last_name}`
                                .toLowerCase()
                                .includes(triageSearch.toLowerCase())
                            )
                            .map((p: any) => (
                              <button
                                key={p.id}
                                onClick={() => handleLinkToExistingPatient(p.id)}
                                className="w-full text-left px-3 py-2 hover:bg-teal-500/10 text-xs text-slate-300 flex justify-between items-center border-b border-slate-900 last:border-none"
                              >
                                <span>{p.first_name} {p.last_name}</span>
                                <span className="text-[10px] text-slate-500">{p.phone || p.email}</span>
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Option 2: Create as New Patient */}
                  <div>
                    <Label className="text-xs text-slate-400 block mb-1">Opción 2: Crear un expediente nuevo</Label>
                    <Button
                      onClick={handleCreateTriagePatient}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs h-8 rounded-lg"
                    >
                      Crear expediente y vincular cita
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Motivo / Título</Label>
              <Input 
                value={editData.title}
                onChange={(e) => setEditData({...editData, title: e.target.value})}
                className="bg-slate-900/50 border-slate-800 focus-visible:ring-teal-500/50"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-slate-300 flex items-center gap-2">
                  <CalendarIcon className="h-3.5 w-3.5 text-slate-500" /> Fecha
                </Label>
                <Input 
                  type="date"
                  value={editData.date}
                  onChange={(e) => setEditData({...editData, date: e.target.value})}
                  className="bg-slate-900/50 border-slate-800 focus-visible:ring-teal-500/50 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300 flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-slate-500" /> Hora
                </Label>
                <Input 
                  type="time"
                  value={editData.time}
                  onChange={(e) => setEditData({...editData, time: e.target.value})}
                  className="bg-slate-900/50 border-slate-800 focus-visible:ring-teal-500/50 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300 flex items-center gap-2">
                  <Timer className="h-3.5 w-3.5 text-slate-500" /> Duración
                </Label>
                <Select value={editData.duration || ""} onValueChange={(val) => setEditData({...editData, duration: val || ""})}>
                  <SelectTrigger className="bg-slate-900/50 border-slate-800"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-950 border-slate-800 text-slate-200">
                    {durationOptions.map(d => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Tipo</Label>
                <Select value={editData.type || ""} onValueChange={(val) => setEditData({...editData, type: val || ""})}>
                  <SelectTrigger className="bg-slate-900/50 border-slate-800"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-950 border-slate-800 text-slate-200">
                    <SelectItem value="Consulta General">Consulta General</SelectItem>
                    <SelectItem value="Urgencia">Urgencia</SelectItem>
                    <SelectItem value="Seguimiento">Seguimiento</SelectItem>
                    <SelectItem value="Estudio">Estudio</SelectItem>
                    <SelectItem value="Teleconsulta">Teleconsulta</SelectItem>
                    <SelectItem value="Consulta Presencial">Consulta Presencial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Estado</Label>
                <Select value={editData.status || ""} onValueChange={(val) => setEditData({...editData, status: val || ""})}>
                  <SelectTrigger className="bg-slate-900/50 border-slate-800"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-950 border-slate-800 text-slate-200">
                    <SelectItem value="Programado">Programado</SelectItem>
                    <SelectItem value="En sala">En sala</SelectItem>
                    <SelectItem value="Completado">Completado</SelectItem>
                    <SelectItem value="Cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-col gap-3 sm:flex-col pt-2">
            <div className="flex items-center justify-between w-full">
              <Button 
                variant="ghost" 
                onClick={handleDeleteAppointment} 
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10" 
                size="sm"
              >
                <Trash2 className="h-4 w-4 mr-1.5" /> Eliminar
              </Button>
              <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)} className="text-slate-400 hover:text-white" size="sm">Cancelar</Button>
            </div>
            <div className="flex items-center gap-2 w-full">
              {editingEvent?.type?.toLowerCase() === "teleconsulta" && editingEvent?.teleconsulta_url && (
                <Button 
                  asChild
                  className="bg-sky-600 hover:bg-sky-500 text-white flex-1"
                  size="sm"
                >
                  <a href={editingEvent.teleconsulta_url} target="_blank" rel="noopener noreferrer">
                    <Video className="h-4 w-4 mr-1.5" /> Videollamada
                  </a>
                </Button>
              )}
              {editingEvent?.status !== "Completado" && (
                <Button 
                  onClick={handleCompleteAppointment}
                  className="bg-green-600 hover:bg-green-500 text-white flex-1"
                  size="sm"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1.5" /> Completar
                </Button>
              )}
                <Button 
                onClick={() => {
                  if (editingEvent?.patientId) {
                    if (editingEvent?.type?.toLowerCase() === 'teleconsulta' && editingEvent?.teleconsulta_url) {
                      setIsTelehealthConfirmOpen(true);
                    } else {
                      setIsEditDialogOpen(false);
                      router.push(`/dashboard/expedientes?patient=${editingEvent.patientId}&appointmentId=${editingEvent.id}`);
                    }
                  }
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white flex-1"
                size="sm"
              >
                <Stethoscope className="h-4 w-4 mr-1.5" /> Atender
              </Button>
              <Button onClick={handleUpdateAppointment} className="bg-teal-600 hover:bg-teal-500 text-white flex-1" size="sm">Guardar Cambios</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Telehealth Confirmation Dialog */}
      <Dialog open={isTelehealthConfirmOpen} onOpenChange={setIsTelehealthConfirmOpen}>
        <DialogContent className="sm:max-w-[400px] bg-slate-950 border-slate-800 text-slate-200">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium text-white flex items-center gap-2">
              <Video className="h-5 w-5 text-sky-400" /> Consulta de Telemedicina
            </DialogTitle>
            <DialogDescription className="text-slate-400 mt-2">
              Esta consulta está programada en línea (Teleconsulta). ¿Deseas iniciar la videollamada de Jitsi en una pestaña nueva al abrir el expediente?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 sm:flex-col pt-4">
            <Button
              onClick={() => {
                if (editingEvent?.teleconsulta_url) {
                  window.open(editingEvent.teleconsulta_url, '_blank');
                }
                setIsTelehealthConfirmOpen(false);
                setIsEditDialogOpen(false);
                if (editingEvent?.patientId) {
                  router.push(`/dashboard/expedientes?patient=${editingEvent.patientId}&appointmentId=${editingEvent.id}`);
                }
              }}
              className="bg-sky-600 hover:bg-sky-500 text-white w-full"
            >
              <Video className="h-4 w-4 mr-1.5" /> Sí, abrir videollamada y atender
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsTelehealthConfirmOpen(false);
                setIsEditDialogOpen(false);
                if (editingEvent?.patientId) {
                  router.push(`/dashboard/expedientes?patient=${editingEvent.patientId}&appointmentId=${editingEvent.id}`);
                }
              }}
              className="border-slate-800 text-slate-300 hover:bg-slate-800 w-full"
            >
              Solo ir al Expediente
            </Button>
            <Button
              variant="ghost"
              onClick={() => setIsTelehealthConfirmOpen(false)}
              className="text-slate-500 hover:text-slate-400 w-full"
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Calendar Space */}
      <Card className="flex-1 bg-slate-950/40 border-slate-800/60 backdrop-blur-xl shadow-lg ring-1 ring-white/5 flex flex-col overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-white/5 bg-slate-900/20">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCurrentDate(new Date())}
              className="h-8 bg-slate-900/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              Hoy
            </Button>
            <div className="flex items-center text-slate-300 font-medium px-2 gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleNavigatePrev}
                className="h-8 w-8 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                 {"<"}
              </Button>
              <span className="text-center font-semibold text-teal-400 tracking-wider transition-all">{getToolbarDateLabel()}</span>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleNavigateNext}
                className="h-8 w-8 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                {">"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-4 pb-8 overflow-hidden flex flex-col">
          {isLoading ? (
            <div className="flex-1 flex justify-center items-center text-slate-500 font-medium">
              Conectando con Supabase...
            </div>
          ) : (
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              culture="es"
              messages={messages}
              view={currentView}
              onView={setCurrentView}
              date={currentDate}
              onNavigate={setCurrentDate}
              views={['month', 'week', 'day']}
              min={new Date(new Date().setHours(7, 0, 0))} // Start 7AM
              max={new Date(new Date().setHours(21, 0, 0))} // End 9PM
              step={30}
              timeslots={1}
              toolbar={false} // Hidden natively, using custom
              eventPropGetter={eventStyleGetter}
              scrollToTime={new Date(new Date().setHours(8, 0, 0))}
              components={{
                event: EventComponent
              }}
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              selectable
              className="flex-1 w-full text-slate-300"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
