"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { 
  Plus, 
  Search, 
  FileText, 
  History, 
  Stethoscope, 
  ChevronRight, 
  User,
  Calendar,
  ClipboardList,
  Download,
  Eye,
  CheckCircle2,
  MessageSquare,
  Loader2,
  CalendarPlus,
  Send,
  Camera,
  QrCode,
  Trash2,
  AlertTriangle,
  Upload,
  Image as ImageIcon,
  Package,
  Video
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale/es";
import { PrescriptionPDF } from "@/components/features/PrescriptionPDF";
import { useDoctorProfile } from "@/hooks/useDoctorProfile";
import { v4 as uuidv4 } from "uuid";

const PDFViewer = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFViewer),
  { ssr: false }
);

function ExpedientesContent() {
  const searchParams = useSearchParams();
  const patientIdParam = searchParams.get("patient");
  const { profile: doctorProfile } = useDoctorProfile();
  const { userProfile, user, isLoading: isAuthLoading } = useAuth();
  const clinicId = userProfile?.clinic_id;

  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isWritingNote, setIsWritingNote] = useState(false);
  const [isWritingPrescription, setIsWritingPrescription] = useState(false);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [selectedPrescriptionForPDF, setSelectedPrescriptionForPDF] = useState<any>(null);
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Estados para Fotos Clínicas
  const [photos, setPhotos] = useState<any[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [qrUrl, setQrUrl] = useState("");
  const [qrLoading, setQrLoading] = useState(false);
  const [localFileUploading, setLocalFileUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ photoId: string; filePath: string; fileName: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Estados para Carga de Fotos Locales (PC)
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadAppointmentId, setUploadAppointmentId] = useState<string>("none");
  const [patientAppointments, setPatientAppointments] = useState<any[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Finalization state
  const [isFinalizingConsultation, setIsFinalizingConsultation] = useState(false);
  const [isSendingSummary, setIsSendingSummary] = useState(false);
  const [finalizationNotes, setFinalizationNotes] = useState("");
  const [scheduleFollowUp, setScheduleFollowUp] = useState(false);
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpTime, setFollowUpTime] = useState("10:00");

  // Medicine sales & stock management
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [selectedMedicineId, setSelectedMedicineId] = useState<string>("");
  const [quantityToSell, setQuantityToSell] = useState<number>(1);
  const [soldMedicines, setSoldMedicines] = useState<any[]>([]);
  const [activeAppointment, setActiveAppointment] = useState<any>(null);

  // New Note Form State
  const [newNote, setNewNote] = useState({
    diagnosis: "",
    clinical_notes: ""
  });

  // New Prescription Form State
  const [newPrescription, setNewPrescription] = useState<any[]>([
    { medication: "", dosage: "", instructions: "" }
  ]);

  useEffect(() => {
    if (clinicId) fetchPatients();
  }, [clinicId]);

  useEffect(() => {
    if (patientIdParam && patients.length > 0) {
      const patient = patients.find(p => p.id === patientIdParam);
      if (patient) handleSelectPatient(patient);
    }
  }, [patientIdParam, patients]);

  useEffect(() => {
    if (!selectedPatient) return;

    // Suscribirse a cambios en tiempo real en la tabla medical_record_photos
    const channel = supabase
      .channel(`photos-patient-${selectedPatient.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "medical_record_photos",
          filter: `patient_id=eq.${selectedPatient.id}`,
        },
        (payload) => {
          console.log("Cambio en fotos detectado en tiempo real:", payload);
          fetchPhotos(selectedPatient.id);
          if (payload.eventType === "INSERT") {
            toast.success("📸 Nueva foto clínica agregada al expediente");
          } else if (payload.eventType === "DELETE") {
            toast.success("🗑️ Foto clínica eliminada del expediente");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedPatient]);

  const fetchPatients = async () => {
    if (!clinicId) {
      if (!isAuthLoading) setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("clinic_id", clinicId)
        .order("first_name");
      if (error) {
        console.error("Error fetching patients:", error);
      } else {
        setPatients(data || []);
      }
    } catch (err) {
      console.error("Unexpected error in fetchPatients:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInventory = async () => {
    if (!clinicId) return;
    try {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*")
        .eq("clinic_id", clinicId)
        .order("name", { ascending: true });
      if (error) {
        console.error("Error fetching inventory:", error);
      } else {
        setInventoryItems(data || []);
      }
    } catch (err) {
      console.error("Unexpected error fetching inventory:", err);
    }
  };

  const fetchActiveAppointment = async (pId: string, forcedAppointmentId?: string) => {
    try {
      let query = supabase
        .from("appointments")
        .select("*")
        .eq("patient_id", pId);

      if (forcedAppointmentId && forcedAppointmentId !== "none") {
        query = query.eq("id", forcedAppointmentId);
      } else {
        query = query.eq("status", "Programado");
      }

      const { data } = await query.order("start_time", { ascending: false });

      if (data && data.length > 0) {
        if (forcedAppointmentId && forcedAppointmentId !== "none") {
          setActiveAppointment(data[0]);
        } else {
          const todayStr = new Date().toISOString().split('T')[0];
          const todayApt = data.find(apt => apt.start_time.startsWith(todayStr));
          setActiveAppointment(todayApt || data[0]);
        }
      } else {
        setActiveAppointment(null);
      }
    } catch (err) {
      console.error("Error fetching active appointment:", err);
    }
  };

  const fetchRecords = async (patientId: string) => {
    if (!clinicId) return;
    setIsLoading(true);
    try {
      // Fetch Medical Records
      const { data: recordsData, error: recordsError } = await supabase
        .from("medical_records")
        .select("*")
        .eq("patient_id", patientId)
        .eq("clinic_id", clinicId)
        .order("created_at", { ascending: false });
      
      if (recordsError) {
        console.error("Error fetching medical records:", recordsError);
      } else {
        setRecords(recordsData || []);
      }

      // Fetch Prescriptions
      const { data: prescriptionsData, error: prescriptionsError } = await supabase
        .from("prescriptions")
        .select("*, medical_records(diagnosis)")
        .eq("patient_id", patientId)
        .eq("clinic_id", clinicId)
        .order("created_at", { ascending: false });
      
      if (prescriptionsError) {
        console.error("Error fetching prescriptions:", prescriptionsError);
      } else {
        setPrescriptions(prescriptionsData || []);
      }

      // Fetch Appointments for dropdown
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from("appointments")
        .select("*")
        .eq("patient_id", patientId)
        .eq("clinic_id", clinicId)
        .order("start_time", { ascending: false });

      if (appointmentsError) {
        console.error("Error fetching appointments:", appointmentsError);
      } else {
        setPatientAppointments(appointmentsData || []);
      }
    } catch (err) {
      console.error("Unexpected error in fetchRecords:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPhotos = async (patientId: string) => {
    if (!clinicId) return;
    setPhotosLoading(true);
    try {
      const response = await fetch(`/api/attachments/list?patientId=${patientId}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setPhotos(data.photos || []);
      } else {
        console.error("Error fetching photos:", data.error);
        setPhotos([]);
      }
    } catch (err) {
      console.error("Unexpected error in fetchPhotos:", err);
      setPhotos([]);
    } finally {
      setPhotosLoading(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!deleteConfirm) return;
    const { photoId, filePath } = deleteConfirm;

    setIsDeleting(true);
    try {
      // 1. Eliminar archivo físico de Supabase Storage
      const { error: storageError } = await supabase.storage
        .from("clinical-attachments")
        .remove([filePath]);

      if (storageError) {
        console.error("Error deleting from storage:", storageError);
      }

      // 2. Eliminar registro en base de datos
      const { error: dbError } = await supabase
        .from("medical_record_photos")
        .delete()
        .eq("id", photoId);

      if (dbError) {
        toast.error("Fallo al eliminar el registro en la base de datos");
      } else {
        toast.success("Foto clínica eliminada correctamente");
        if (selectedPatient) fetchPhotos(selectedPatient.id);
      }
    } catch (err) {
      console.error("Unexpected error in handleDeletePhoto:", err);
      toast.error("Error al procesar la eliminación");
    } finally {
      setIsDeleting(false);
      setDeleteConfirm(null);
    }
  };

  const handleLocalPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPatient || !clinicId) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecciona únicamente archivos de imagen");
      return;
    }

    setSelectedUploadFile(file);
    setUploadDescription("");
    
    // Set default appointment id from search params or "none"
    const aptId = searchParams.get("appointmentId") || "none";
    setUploadAppointmentId(aptId);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setIsUploadModalOpen(true);
    
    // Reset file input value so onChange will fire again if same file is picked later
    e.target.value = "";
  };

  const executeLocalPhotoUpload = async () => {
    if (!selectedUploadFile || !selectedPatient || !clinicId) return;

    setLocalFileUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedUploadFile);
      formData.append("patientId", selectedPatient.id);
      if (uploadDescription.trim()) {
        formData.append("description", uploadDescription.trim());
      }
      if (uploadAppointmentId && uploadAppointmentId !== "none") {
        formData.append("appointmentId", uploadAppointmentId);
      }

      const response = await fetch("/api/attachments/upload-direct", {
        method: "POST",
        body: formData,
      });

      const contentType = response.headers.get("content-type");
      let data: any = null;
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      }

      if (response.ok && data?.success) {
        toast.success("Foto clínica agregada con éxito");
        fetchPhotos(selectedPatient.id);
        setIsUploadModalOpen(false);
        setSelectedUploadFile(null);
        setUploadPreview(null);
        setUploadDescription("");
      } else {
        toast.error(data?.error || `Error en el servidor (${response.status})`);
      }
    } catch (err) {
      console.error("Unexpected error in local upload:", err);
      toast.error("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setLocalFileUploading(false);
    }
  };

  const handleGenerateQR = async () => {
    if (!selectedPatient || !clinicId) return;
    
    setQrLoading(true);
    setQrUrl("");
    setIsQRModalOpen(true);
    
    try {
      // Solicitar token temporal desde nuestra API
      const appointmentId = searchParams.get("appointmentId") || "none";
      const response = await fetch(`/api/attachments/token?patientId=${selectedPatient.id}&recordId=none&appointmentId=${appointmentId}`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        const origin = window.location.origin;
        const bridgeUrl = `${origin}/upload-bridge?token=${encodeURIComponent(data.token)}`;
        // Usar api.qrserver.com para generar el código QR de manera estable
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(bridgeUrl)}`;
        setQrUrl(qrCodeUrl);
      } else {
        toast.error(data.error || "Fallo al generar el enlace de carga QR");
        setIsQRModalOpen(false);
      }
    } catch (err) {
      console.error("Unexpected error generating QR:", err);
      toast.error("Error al generar el código QR");
      setIsQRModalOpen(false);
    } finally {
      setQrLoading(false);
    }
  };

  const handleSelectPatient = (patient: any) => {
    setSelectedPatient(patient);
    fetchRecords(patient.id);
    fetchPhotos(patient.id);
    setIsWritingNote(false);
    setIsWritingPrescription(false);
    setSoldMedicines([]);
    fetchInventory();
    fetchActiveAppointment(patient.id, searchParams.get("appointmentId") || undefined);
  };

  const handleSaveNote = async () => {
    if (!newNote.diagnosis) {
      toast.error("El diagnóstico es obligatorio");
      return;
    }

    const { data, error } = await supabase.from("medical_records").insert([{
      clinic_id: clinicId,
      patient_id: selectedPatient.id,
      doctor_id: user?.id,
      diagnosis: newNote.diagnosis,
      clinical_notes: newNote.clinical_notes
    }]).select();

    if (error) {
      toast.error("Error al guardar nota", { description: error.message });
    } else {
      toast.success("Nota clínica guardada");
      setNewNote({ diagnosis: "", clinical_notes: "" });
      setIsWritingNote(false);
      fetchRecords(selectedPatient.id);
    }
  };

  const handleAddMedication = () => {
    setNewPrescription([...newPrescription, { medication: "", dosage: "", instructions: "" }]);
  };

  const handleRemoveMedication = (index: number) => {
    setNewPrescription(newPrescription.filter((_, i) => i !== index));
  };

  const handleMedicationChange = (index: number, field: string, value: string) => {
    const updated = [...newPrescription];
    updated[index][field] = value;
    setNewPrescription(updated);
  };

  const handleSavePrescription = async () => {
    const validMeds = newPrescription.filter(m => m.medication && m.dosage);
    if (validMeds.length === 0) {
      toast.error("Debes agregar al menos un medicamento con dosis");
      return;
    }

    const { error } = await supabase.from("prescriptions").insert([{
      clinic_id: clinicId,
      patient_id: selectedPatient.id,
      doctor_id: user?.id,
      details: { medications: validMeds }
    }]);

    if (error) {
      toast.error("Error al guardar receta", { description: error.message });
    } else {
      toast.success("Receta médica guardada");
      setNewPrescription([{ medication: "", dosage: "", instructions: "" }]);
      setIsWritingPrescription(false);
      fetchRecords(selectedPatient.id);
    }
  };

  const handleSelectPrescription = (prescription: any) => {
    setSelectedPrescriptionForPDF(prescription);
    setIsPDFModalOpen(true);
  };

  const handleFinalizeConsultation = async () => {
    if (!selectedPatient) return;

    // Get the latest diagnosis
    const latestRecord = records[0];
    if (!latestRecord) {
      toast.error("Primero registra un diagnóstico en las notas clínicas");
      return;
    }

    setIsSendingSummary(true);

    // Get latest prescription medications
    const latestPrescription = prescriptions[0];
    const medications = latestPrescription?.details?.medications || [];

    // Build next appointment data
    let nextAppointment = undefined;
    if (scheduleFollowUp && followUpDate && followUpTime) {
      // Create the follow-up appointment
      const start = new Date(`${followUpDate}T${followUpTime}`);
      const end = new Date(start.getTime() + 45 * 60000);

      const { data: newApt, error: aptErr } = await supabase
        .from('appointments')
        .insert([{
          clinic_id: clinicId,
          doctor_id: user?.id,
          patient_id: selectedPatient.id,
          title: `Seguimiento: ${latestRecord.diagnosis}`,
          type: 'Seguimiento',
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          status: 'Programado',
          color_hex: 'rgba(59, 130, 246, 0.2)',
        }])
        .select()
        .single();

      if (aptErr) {
        toast.error("Error al crear cita de seguimiento", { description: aptErr.message });
      } else {
        // Format for the message
        const fDate = new Date(`${followUpDate}T${followUpTime}`);
        nextAppointment = {
          date: format(fDate, "d 'de' MMMM 'de' yyyy", { locale: es }),
          time: format(fDate, 'hh:mm a', { locale: es }),
        };
        toast.success("Cita de seguimiento creada");
      }
    }

    // Get appointment ID from URL params to mark as completed
    const appointmentId = searchParams.get('appointmentId') || undefined;

    // Process direct medicine sales and decrement inventory stock
    if (soldMedicines.length > 0) {
      const resolvedAptId = appointmentId || activeAppointment?.id || null;
      for (const item of soldMedicines) {
        try {
          // 1. Insert into appointment_sales
          const { error: saleErr } = await supabase
            .from("appointment_sales")
            .insert({
              clinic_id: clinicId,
              appointment_id: resolvedAptId,
              item_id: item.id,
              quantity: item.quantity,
              unit_price: Number(item.sale_price),
              total_price: Number(item.quantity * item.sale_price)
            });

          if (saleErr) {
            console.error(`[EHR Direct Sales] Failed to insert sale for ${item.name}:`, saleErr);
            continue;
          }

          // 2. Decrement stock in inventory_items
          const { data: currentItem } = await supabase
            .from("inventory_items")
            .select("stock")
            .eq("id", item.id)
            .single();

          if (currentItem) {
            const newStock = Math.max(0, currentItem.stock - item.quantity);
            await supabase
              .from("inventory_items")
              .update({ stock: newStock })
              .eq("id", item.id);
          }
        } catch (saleEx) {
          console.error(`[EHR Direct Sales] Exception selling ${item.name}:`, saleEx);
        }
      }
    }

    try {
      const res = await fetch('/api/notifications/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          diagnosis: latestRecord.diagnosis,
          notes: finalizationNotes || latestRecord.clinical_notes,
          medications,
          nextAppointment,
          appointmentId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('📩 Resumen enviado al paciente por WhatsApp');
      } else {
        const errorDesc = data.whatsappError || data.result?.whatsapp?.error || data.error || 'Error desconocido';
        toast.error('WhatsApp no enviado', { description: errorDesc });
      }
    } catch {
      toast.error('Error de red al enviar resumen');
    }

    setIsSendingSummary(false);
    setIsFinalizingConsultation(false);
    setFinalizationNotes("");
    setScheduleFollowUp(false);
    setFollowUpDate("");
  };

  const filteredPatients = patients.filter(p => 
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-8rem)] gap-6 overflow-hidden">
      <Dialog open={isPDFModalOpen} onOpenChange={setIsPDFModalOpen}>
        <DialogContent className="max-w-4xl h-[90vh] bg-slate-900 border-slate-800 p-0 overflow-hidden flex flex-col">
          <DialogHeader className="p-6 border-b border-white/5">
            <DialogTitle className="text-white">Vista Previa de Receta</DialogTitle>
            <DialogDescription className="text-slate-400">Generando documento oficial de NERVE.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 bg-slate-800">
            {selectedPrescriptionForPDF && (
              <PDFViewer width="100%" height="100%" showToolbar={true}>
                <PrescriptionPDF 
                  patient={selectedPatient} 
                  medications={selectedPrescriptionForPDF.details.medications} 
                  date={format(new Date(selectedPrescriptionForPDF.created_at), "PPP", { locale: es })}
                  doctorProfile={doctorProfile}
                />
              </PDFViewer>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal del Código QR para Carga Móvil */}
      <Dialog open={isQRModalOpen} onOpenChange={setIsQRModalOpen}>
        <DialogContent className="sm:max-w-[420px] bg-slate-950 border-slate-800 text-slate-200">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-medium text-white flex items-center justify-center gap-2">
              <QrCode className="h-5 w-5 text-teal-400" />
              Vincular Celular
            </DialogTitle>
            <DialogDescription className="text-slate-400 mt-2 text-xs leading-relaxed">
              Escanea este código QR con la cámara de tu celular para tomar fotos de tus pacientes y subirlas directamente a este expediente en tiempo real.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center py-6 gap-4">
            <div className="w-[270px] h-[270px] bg-white rounded-3xl p-4 flex items-center justify-center border border-slate-800 shadow-[0_0_30px_rgba(20,184,166,0.1)]">
              {qrLoading ? (
                <div className="flex flex-col items-center justify-center gap-2 text-slate-800">
                  <Loader2 className="h-8 w-8 text-teal-500 animate-spin" />
                  <span className="text-[10px] font-semibold text-slate-500">Generando enlace...</span>
                </div>
              ) : qrUrl ? (
                <img src={qrUrl} alt="Vínculo QR para carga de fotos" className="w-full h-full" />
              ) : (
                <div className="text-xs text-red-500">Error al generar código QR</div>
              )}
            </div>
            
            <div className="text-center space-y-1">
              <span className="text-[10px] text-teal-400 font-bold uppercase tracking-widest animate-pulse">Enlace Temporal Activo</span>
              <p className="text-[10px] text-slate-500">Expira en 5 minutos. No requiere inicio de sesión en tu celular.</p>
            </div>
          </div>
          
          <div className="border-t border-white/5 pt-4 flex justify-center">
            <Button
              variant="ghost"
              onClick={() => setIsQRModalOpen(false)}
              className="text-slate-400 hover:text-white text-xs"
            >
              Cerrar y volver
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmación de Eliminación de Foto */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => { if (!open) setDeleteConfirm(null); }}>
        <DialogContent className="sm:max-w-[420px] bg-slate-950 border-slate-800 text-slate-200">
          <DialogHeader className="text-center">
            <DialogTitle className="text-lg font-medium text-white flex items-center justify-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              Eliminar Foto Clínica
            </DialogTitle>
            <DialogDescription className="text-slate-400 mt-2 text-sm leading-relaxed">
              ¿Estás seguro de que deseas eliminar esta foto del expediente? Esta acción es permanente y no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          {deleteConfirm && (
            <div className="py-4">
              <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Archivo a eliminar</p>
                  <p className="text-sm text-slate-200 font-medium truncate mt-0.5">{deleteConfirm.fileName}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-white/5">
            <Button
              variant="ghost"
              onClick={() => setDeleteConfirm(null)}
              disabled={isDeleting}
              className="text-slate-400 hover:text-white text-sm"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeletePhoto}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-500 text-white text-sm px-6 shadow-lg shadow-red-600/20"
            >
              {isDeleting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Eliminando...</>
              ) : (
                <><Trash2 className="h-4 w-4 mr-2" /> Eliminar permanentemente</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Carga de Foto Clínica (PC) */}
      <Dialog open={isUploadModalOpen} onOpenChange={(open) => { if (!open) { setIsUploadModalOpen(false); setSelectedUploadFile(null); setUploadPreview(null); } }}>
        <DialogContent className="sm:max-w-[480px] bg-slate-950 border-slate-800 text-slate-200">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium text-white flex items-center gap-2">
              <Camera className="h-5 w-5 text-teal-400" />
              Cargar Foto Clínica
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-sm">
              Completa los detalles para guardar la foto clínica en el expediente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Vista Previa de la Imagen */}
            {uploadPreview && (
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950/80 flex items-center justify-center">
                <img src={uploadPreview} alt="Vista previa de carga" className="object-contain max-h-[180px] w-full" />
                {selectedUploadFile && (
                  <div className="absolute bottom-2 left-2 right-2 bg-slate-950/85 backdrop-blur-sm border border-slate-800/80 rounded-xl px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="truncate max-w-[200px]" title={selectedUploadFile.name}>{selectedUploadFile.name}</span>
                    <span>{(selectedUploadFile.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                )}
              </div>
            )}

            {/* Asignación de Consulta / Cita */}
            <div className="space-y-1.5">
              <Label htmlFor="upload-appointment-id" className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Cita / Consulta Médica</Label>
              <select
                id="upload-appointment-id"
                value={uploadAppointmentId}
                onChange={(e) => setUploadAppointmentId(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl text-slate-200 text-sm focus:border-teal-500 focus:ring-teal-500 w-full p-2.5 h-10 outline-none transition-colors"
              >
                <option value="none">Ninguna (Solo guardar en historial general)</option>
                {patientAppointments.map((apt) => (
                  <option key={apt.id} value={apt.id}>
                    {format(new Date(apt.start_time), "d MMM, yyyy - hh:mm a", { locale: es })} ({apt.title || "Consulta"})
                  </option>
                ))}
              </select>
            </div>

            {/* Descripción */}
            <div className="space-y-1.5">
              <Label htmlFor="upload-description" className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Descripción / Notas Clínicas</Label>
              <Textarea
                id="upload-description"
                placeholder="Ej. Control de herida post-operatoria, Día 5..."
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                className="bg-slate-900 border-slate-800 text-slate-200 placeholder-slate-600 focus:border-teal-500 min-h-[80px] rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
            <Button
              variant="ghost"
              onClick={() => { setIsUploadModalOpen(false); setSelectedUploadFile(null); setUploadPreview(null); }}
              disabled={localFileUploading}
              className="text-slate-400 hover:text-white text-sm"
            >
              Cancelar
            </Button>
            <Button
              onClick={executeLocalPhotoUpload}
              disabled={localFileUploading}
              className="bg-teal-600 hover:bg-teal-500 text-white text-sm px-6 shadow-lg shadow-teal-600/20"
            >
              {localFileUploading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Cargando...</>
              ) : (
                <><Upload className="h-4 w-4 mr-2" /> Guardar en Expediente</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sidebar: Patient Search */}
      <div className="w-full md:w-80 flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input 
            placeholder="Buscar paciente..." 
            className="pl-10 bg-slate-950/40 border-slate-800"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Card className="flex-1 bg-slate-950/40 border-slate-800/60 backdrop-blur-xl shadow-lg ring-1 ring-white/5 overflow-hidden flex flex-col">
          <CardHeader className="py-4 border-b border-white/5">
            <CardTitle className="text-sm font-medium text-slate-300">Directorio</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto">
            {filteredPatients.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">No hay resultados</p>
            ) : (
              filteredPatients.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPatient(p)}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors border-b border-white/5 group hover:bg-slate-800/40 ${selectedPatient?.id === p.id ? 'bg-teal-500/10 border-r-2 border-r-teal-500' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${selectedPatient?.id === p.id ? 'bg-teal-500 text-white' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'}`}>
                    {p.first_name[0]}{p.last_name[0]}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className={`text-sm font-medium truncate ${selectedPatient?.id === p.id ? 'text-teal-400' : 'text-slate-300'}`}>
                      {p.first_name} {p.last_name}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">{p.email || "No email"}</p>
                  </div>
                  <ChevronRight className="h-3 w-3 text-slate-600 group-hover:text-slate-400 transition-colors" />
                </button>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content: Patient Ledger */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        {selectedPatient ? (
          <>
            {/* Patient Profile Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500/20 to-blue-500/20 flex items-center justify-center border border-teal-500/30">
                  <User className="h-7 w-7 text-teal-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-white">{selectedPatient.first_name} {selectedPatient.last_name}</h2>
                  <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                    <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {selectedPatient.birth_date || "S/N"}</span>
                    <span className="flex items-center gap-1.5"><Stethoscope className="h-3 w-3" /> Paciente Activo</span>
                  </div>
                </div>
              </div>
                  <div className="flex items-center gap-2">
                    {activeAppointment?.teleconsulta_url && (activeAppointment?.type?.toLowerCase() === 'teleconsulta' || activeAppointment?.appointment_type === 'teleconsulta') && (
                      <Button 
                        asChild
                        className="bg-sky-600 hover:bg-sky-500 text-white animate-pulse"
                      >
                        <a href={activeAppointment.teleconsulta_url} target="_blank" rel="noopener noreferrer">
                          <Video className="h-4 w-4 mr-2" /> Iniciar Videollamada
                        </a>
                      </Button>
                    )}
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setIsFinalizingConsultation(true);
                        setIsWritingNote(false);
                        setIsWritingPrescription(false);
                      }}
                      className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" /> Finalizar Consulta
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setIsWritingPrescription(!isWritingPrescription);
                        setIsWritingNote(false);
                        setIsFinalizingConsultation(false);
                      }}
                      className="border-slate-800 text-slate-300 hover:bg-slate-800"
                    >
                      <ClipboardList className="h-4 w-4 mr-2" /> Receta
                    </Button>
                    <Button 
                      onClick={() => {
                        setIsWritingNote(!isWritingNote);
                        setIsWritingPrescription(false);
                        setIsFinalizingConsultation(false);
                      }}
                      className="bg-teal-600 hover:bg-teal-500 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" /> {isWritingNote ? "Ver Historial" : "Nueva Nota Clínica"}
                    </Button>
                  </div>
                </div>


              <Card className="flex-1 bg-slate-950/40 border-slate-800/60 backdrop-blur-xl shadow-lg ring-1 ring-white/5 overflow-hidden flex flex-col">
                {isFinalizingConsultation ? (
                  <CardContent className="pt-0 flex-1 overflow-y-auto flex flex-col">
                    {/* Sticky top action bar */}
                    <div className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur border-b border-white/5 px-4 py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <Send className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span className="text-sm font-semibold text-white">Finalizar Consulta</span>
                        <span className="text-xs text-slate-500 hidden sm:inline">— Revisa y notifica al paciente</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Follow-up checkbox inline */}
                        <label className="flex items-center gap-1.5 cursor-pointer mr-2">
                          <input 
                            type="checkbox" 
                            checked={scheduleFollowUp} 
                            onChange={(e) => setScheduleFollowUp(e.target.checked)}
                            className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-900 text-teal-500 focus:ring-teal-500"
                          />
                          <CalendarPlus className="h-3.5 w-3.5 text-teal-400" />
                          <span className="text-xs text-slate-300 font-medium">Seguimiento</span>
                        </label>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setIsFinalizingConsultation(false)} 
                          className="text-slate-400 h-8 px-3 text-xs"
                        >
                          Cancelar
                        </Button>
                        <Button 
                          size="sm"
                          onClick={handleFinalizeConsultation}
                          disabled={isSendingSummary || !records[0]}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white h-8 px-4 text-xs shadow-lg shadow-emerald-500/20"
                        >
                          {isSendingSummary ? (
                            <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Enviando...</>
                          ) : (
                            <><MessageSquare className="h-3.5 w-3.5 mr-1.5" /> Finalizar y Notificar</>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Follow-up date/time (shows below header when checked) */}
                    {scheduleFollowUp && (
                      <div className="px-4 py-2 border-b border-slate-800/40 bg-teal-500/5">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] uppercase text-teal-400 font-bold shrink-0">Cita de seguimiento:</span>
                          <div className="flex gap-2 flex-1">
                            <Input 
                              type="date" 
                              value={followUpDate} 
                              onChange={(e) => setFollowUpDate(e.target.value)}
                              className="bg-slate-950 border-slate-800 h-7 text-xs flex-1"
                            />
                            <Input 
                              type="time" 
                              value={followUpTime} 
                              onChange={(e) => setFollowUpTime(e.target.value)}
                              className="bg-slate-950 border-slate-800 h-7 text-xs w-28"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-4 space-y-4 flex-1">
                      {/* Summary preview */}
                      <div className="bg-slate-900/50 border border-slate-800/60 rounded-xl p-4 space-y-2">
                        <p className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">Resumen automático</p>
                        {records[0] ? (
                          <>
                            <div className="flex gap-4 text-sm">
                              <div className="flex-1">
                                <p className="text-[10px] text-slate-500">Diagnóstico</p>
                                <p className="text-white font-medium">{records[0].diagnosis}</p>
                              </div>
                            </div>
                            {records[0].clinical_notes && (
                              <div>
                                <p className="text-[10px] text-slate-500">Notas clínicas</p>
                                <p className="text-xs text-slate-300 whitespace-pre-wrap line-clamp-3">{records[0].clinical_notes}</p>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-amber-400">⚠️ No hay diagnóstico registrado. Crea una nota clínica primero.</p>
                        )}
                        {prescriptions[0]?.details?.medications?.length > 0 && (
                          <div>
                            <p className="text-[10px] text-slate-500 mb-1">Medicamentos recetados</p>
                            <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                              {prescriptions[0].details.medications.map((m: any, i: number) => (
                                <div key={i} className="flex items-center gap-1.5 text-xs">
                                  <span className="text-emerald-400">💊</span>
                                  <span className="text-slate-200">{m.medication}</span>
                                  <span className="text-slate-500">—</span>
                                  <span className="text-slate-400">{m.dosage}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Direct medicine sales panel */}
                      <div className="bg-slate-900/50 border border-slate-800/60 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Package className="h-3.5 w-3.5" />
                            Venta de Medicamentos (Almacén)
                          </p>
                          <span className="text-[10px] text-slate-500 font-mono">Venta Directa</span>
                        </div>

                        {inventoryItems.length > 0 ? (
                          <div className="space-y-3">
                            <div className="flex gap-2 items-end">
                              <div className="flex-1">
                                <select
                                  value={selectedMedicineId}
                                  onChange={(e) => setSelectedMedicineId(e.target.value)}
                                  className="w-full h-8 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 px-2 focus:outline-none focus:border-teal-500"
                                >
                                  <option value="">-- Seleccionar medicamento --</option>
                                  {inventoryItems
                                    .filter(item => item.stock > 0)
                                    .map(item => (
                                      <option key={item.id} value={item.id}>
                                        {item.name} (${Number(item.sale_price).toFixed(2)} MXN — Stock: {item.stock})
                                      </option>
                                    ))}
                                </select>
                              </div>
                              <Input
                                type="number"
                                min="1"
                                value={quantityToSell}
                                onChange={(e) => setQuantityToSell(Math.max(1, parseInt(e.target.value) || 1))}
                                className="h-8 w-16 bg-slate-950 border-slate-800 text-xs text-center"
                              />
                              <Button
                                type="button"
                                onClick={() => {
                                  if (!selectedMedicineId) return;
                                  const medicine = inventoryItems.find(item => item.id === selectedMedicineId);
                                  if (!medicine) return;
                                  const existingSale = soldMedicines.find(m => m.id === selectedMedicineId);
                                  const totalQty = (existingSale?.quantity || 0) + quantityToSell;
                                  if (totalQty > medicine.stock) {
                                    toast.error(`Stock insuficiente. Solo quedan ${medicine.stock} unidades.`);
                                    return;
                                  }
                                  if (existingSale) {
                                    setSoldMedicines(prev => prev.map(m => m.id === selectedMedicineId ? { ...m, quantity: totalQty } : m));
                                  } else {
                                    setSoldMedicines(prev => [...prev, { ...medicine, quantity: quantityToSell }]);
                                  }
                                  setSelectedMedicineId("");
                                  setQuantityToSell(1);
                                  toast.success(`${medicine.name} añadido a la cuenta`);
                                }}
                                className="h-8 bg-teal-600 hover:bg-teal-550 text-white rounded-lg text-xs font-semibold px-3 flex items-center gap-1 shrink-0"
                              >
                                <Plus className="h-3.5 w-3.5" /> Añadir
                              </Button>
                            </div>

                            {soldMedicines.length > 0 && (
                              <div className="border border-slate-800 rounded-lg overflow-hidden">
                                <table className="w-full text-[11px] text-left">
                                  <thead className="bg-slate-950/60 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-800">
                                    <tr>
                                      <th className="py-1.5 px-3">Medicamento</th>
                                      <th className="py-1.5 px-3 text-center">Cant</th>
                                      <th className="py-1.5 px-3 text-right">Precio</th>
                                      <th className="py-1.5 px-3 text-right">Total</th>
                                      <th className="py-1.5 px-3"></th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-800 bg-slate-950/20">
                                    {soldMedicines.map((m, idx) => (
                                      <tr key={idx} className="hover:bg-slate-900/30">
                                        <td className="py-1.5 px-3 text-slate-300 font-semibold">{m.name}</td>
                                        <td className="py-1.5 px-3 text-center text-slate-400">{m.quantity}</td>
                                        <td className="py-1.5 px-3 text-right text-slate-400">${Number(m.sale_price).toFixed(2)}</td>
                                        <td className="py-1.5 px-3 text-right text-teal-400 font-semibold">${(m.quantity * m.sale_price).toFixed(2)}</td>
                                        <td className="py-1.5 px-3 text-right">
                                          <button type="button" onClick={() => setSoldMedicines(prev => prev.filter((_, i) => i !== idx))} className="text-slate-500 hover:text-red-400">
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}

                            {/* Total */}
                            <div className="bg-slate-950/40 border border-slate-800 p-3 rounded-lg text-xs flex flex-col gap-1">
                              <div className="flex justify-between text-slate-500">
                                <span>Consulta base:</span>
                                <span>${Number(
                                  (activeAppointment?.appointment_type === 'teleconsulta' || activeAppointment?.type?.toLowerCase() === 'teleconsulta')
                                    ? doctorProfile?.teleconsulta_price || 0
                                    : doctorProfile?.presencial_price || 0
                                ).toFixed(2)} MXN</span>
                              </div>
                              <div className="flex justify-between text-slate-500">
                                <span>Medicamentos:</span>
                                <span className="text-teal-400 font-semibold">${soldMedicines.reduce((sum, m) => sum + (m.quantity * m.sale_price), 0).toFixed(2)} MXN</span>
                              </div>
                              <Separator className="my-0.5 border-slate-800" />
                              <div className="flex justify-between font-bold text-white text-sm">
                                <span>Total a cobrar:</span>
                                <span className="text-emerald-400">${(
                                  Number(
                                    (activeAppointment?.appointment_type === 'teleconsulta' || activeAppointment?.type?.toLowerCase() === 'teleconsulta')
                                      ? doctorProfile?.teleconsulta_price || 0
                                      : doctorProfile?.presencial_price || 0
                                  ) + soldMedicines.reduce((sum, m) => sum + (m.quantity * m.sale_price), 0)
                                ).toFixed(2)} MXN</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500">No hay medicamentos disponibles en el almacén.</p>
                        )}
                      </div>

                      {/* Additional notes */}
                      <div className="space-y-1.5">
                        <Label className="text-slate-300 text-xs">Indicaciones adicionales para el paciente (opcional)</Label>
                        <Textarea 
                          placeholder="Ej. Reposo por 3 días, tomar abundante agua..."
                          className="min-h-[60px] bg-slate-900/50 border-slate-800 resize-none text-sm"
                          value={finalizationNotes}
                          onChange={(e) => setFinalizationNotes(e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                ) : isWritingNote ? (

                  <CardContent className="pt-6 space-y-6 flex-1 overflow-y-auto">
                    <div className="space-y-4 max-w-2xl mx-auto py-8">
                      <div className="space-y-2 text-center mb-8">
                        <Stethoscope className="h-10 w-10 text-teal-500 mx-auto mb-2" />
                        <h3 className="text-xl font-medium text-white">Nueva Nota de Evolución</h3>
                        <p className="text-slate-400 text-sm">Registra los hallazgos médicos y el diagnóstico actual.</p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-300">Diagnóstico Principal</Label>
                        <Input 
                          placeholder="Ej. Hipertensión Arterial Primaria"
                          className="bg-slate-900/50 border-slate-800"
                          value={newNote.diagnosis}
                          onChange={(e) => setNewNote({...newNote, diagnosis: e.target.value})}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-slate-300">Notas y Evolución</Label>
                        <Textarea 
                          placeholder="Escribe aquí los detalles de la consulta, síntomas, examen físico..."
                          className="min-h-[250px] bg-slate-900/50 border-slate-800 resize-none"
                          value={newNote.clinical_notes}
                          onChange={(e) => setNewNote({...newNote, clinical_notes: e.target.value})}
                        />
                      </div>
                      
                      <div className="pt-4 flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setIsWritingNote(false)} className="text-slate-400">Cancelar</Button>
                        <Button onClick={handleSaveNote} className="bg-teal-600 hover:bg-teal-500 text-white px-8">Guardar Expediente</Button>
                      </div>
                    </div>
                  </CardContent>
                ) : isWritingPrescription ? (
                  <CardContent className="pt-6 space-y-6 flex-1 overflow-y-auto">
                    <div className="space-y-6 max-w-3xl mx-auto py-8">
                       <div className="space-y-2 text-center mb-8">
                        <ClipboardList className="h-10 w-10 text-teal-500 mx-auto mb-2" />
                        <h3 className="text-xl font-medium text-white">Generar Receta Médica</h3>
                        <p className="text-slate-400 text-sm">Agrega los medicamentos e instrucciones para el paciente.</p>
                      </div>

                      <div className="space-y-4">
                        {newPrescription.map((med, index) => (
                          <div key={index} className="grid grid-cols-12 gap-3 p-4 bg-slate-900/40 border border-slate-800 rounded-xl relative group">
                            <div className="col-span-12 md:col-span-4 space-y-1.5">
                              <Label className="text-[10px] uppercase text-slate-500 font-bold">Medicamento</Label>
                              <Input 
                                placeholder="Ej. Paracetamol 500mg" 
                                className="bg-slate-950 border-slate-800 text-sm h-9"
                                value={med.medication}
                                onChange={(e) => handleMedicationChange(index, "medication", e.target.value)}
                              />
                            </div>
                            <div className="col-span-12 md:col-span-3 space-y-1.5">
                              <Label className="text-[10px] uppercase text-slate-500 font-bold">Dosis / Frecuencia</Label>
                              <Input 
                                placeholder="Ej. 1 cada 8 horas" 
                                className="bg-slate-950 border-slate-800 text-sm h-9"
                                value={med.dosage}
                                onChange={(e) => handleMedicationChange(index, "dosage", e.target.value)}
                              />
                            </div>
                            <div className="col-span-12 md:col-span-4 space-y-1.5">
                              <Label className="text-[10px] uppercase text-slate-500 font-bold">Instrucciones</Label>
                              <Input 
                                placeholder="Ej. Por 5 días después de alimento" 
                                className="bg-slate-950 border-slate-800 text-sm h-9"
                                value={med.instructions}
                                onChange={(e) => handleMedicationChange(index, "instructions", e.target.value)}
                              />
                            </div>
                            <div className="col-span-12 md:col-span-1 flex items-end justify-center pb-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleRemoveMedication(index)}
                                className="h-8 w-8 text-slate-600 hover:text-red-400 hover:bg-red-400/10"
                                disabled={newPrescription.length === 1}
                              >
                                <Plus className="h-4 w-4 rotate-45" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        
                        <Button 
                          variant="ghost" 
                          onClick={handleAddMedication}
                          className="w-full border border-dashed border-slate-800 text-slate-400 hover:text-teal-400 hover:bg-teal-500/5 hover:border-teal-500/30"
                        >
                          <Plus className="h-4 w-4 mr-2" /> Agregar Medicamento
                        </Button>
                      </div>

                      <div className="pt-8 flex justify-end gap-3 border-t border-white/5">
                        <Button variant="ghost" onClick={() => setIsWritingPrescription(false)} className="text-slate-400">Cancelar</Button>
                        <Button onClick={handleSavePrescription} className="bg-teal-600 hover:bg-teal-500 text-white px-8 shadow-lg shadow-teal-500/20">Generar Receta</Button>
                      </div>
                    </div>
                  </CardContent>
                ) : (
                <Tabs defaultValue="history" className="flex-1 flex flex-col overflow-hidden">
                  <div className="px-6 border-b border-white/5 bg-slate-900/20">
                    <TabsList className="bg-transparent border-none">
                      <TabsTrigger value="history" className="data-[state=active]:bg-transparent data-[state=active]:text-teal-400 data-[state=active]:border-b-2 data-[state=active]:border-teal-500 rounded-none py-4 px-6 flex gap-2">
                        <History className="h-4 w-4" /> Historial Clínico
                      </TabsTrigger>
                      <TabsTrigger value="prescriptions" className="data-[state=active]:bg-transparent data-[state=active]:text-teal-400 data-[state=active]:border-b-2 data-[state=active]:border-teal-500 rounded-none py-4 px-6 flex gap-2">
                        <ClipboardList className="h-4 w-4" /> Recetas
                      </TabsTrigger>
                      <TabsTrigger value="photos" className="data-[state=active]:bg-transparent data-[state=active]:text-teal-400 data-[state=active]:border-b-2 data-[state=active]:border-teal-500 rounded-none py-4 px-6 flex gap-2">
                        <ImageIcon className="h-4 w-4" /> Fotos Clínicas
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  
                  <TabsContent value="history" className="flex-1 overflow-y-auto p-6 m-0">
                    <div className="space-y-6">
                      {isLoading ? (
                        <p className="text-center text-slate-500 py-12">Cargando historial...</p>
                      ) : records.length === 0 ? (
                        <div className="text-center py-20 border border-dashed border-slate-800 rounded-xl">
                          <FileText className="h-10 w-10 text-slate-700 mx-auto mb-3" />
                          <p className="text-slate-500">Aún no hay notas clínicas registradas.</p>
                          <Button variant="link" onClick={() => setIsWritingNote(true)} className="text-teal-500 mt-2">Crear la primera nota</Button>
                        </div>
                      ) : (
                        records.map(record => (
                          <div key={record.id} className="relative pl-8 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-px before:bg-slate-800">
                            <div className="absolute left-[-4px] top-2 h-2 w-2 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.5)]" />
                            <div className="bg-slate-900/30 border border-slate-800/40 rounded-xl p-5 mb-4 hover:border-teal-500/30 transition-colors">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold text-teal-500 uppercase tracking-wider">
                                  {format(new Date(record.created_at), "PPP", { locale: es })}
                                </span>
                                <span className="text-[10px] text-slate-500 italic">Dr. Mauricio (MD)</span>
                              </div>
                              <h4 className="text-white font-medium mb-2">{record.diagnosis}</h4>
                              <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">{record.clinical_notes}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="prescriptions" className="flex-1 overflow-y-auto p-6 m-0">
                    <div className="space-y-4">
                      {isLoading ? (
                        <p className="text-center text-slate-500 py-12">Cargando recetas...</p>
                      ) : prescriptions.length === 0 ? (
                        <div className="text-center py-20 border border-dashed border-slate-800 rounded-xl">
                          <ClipboardList className="h-10 w-10 text-slate-700 mx-auto mb-3" />
                          <p className="text-slate-500">Aún no hay recetas registradas.</p>
                          <Button variant="link" onClick={() => setIsWritingPrescription(true)} className="text-teal-500 mt-2">Crear la primera receta</Button>
                        </div>
                      ) : (
                        <div className="grid gap-4">
                          {prescriptions.map((prescription) => (
                            <div key={prescription.id} className="bg-slate-900/30 border border-slate-800/40 rounded-xl p-5 flex items-center justify-between hover:border-teal-500/30 transition-colors">
                              <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-500">
                                  <ClipboardList className="h-5 w-5" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-slate-200">
                                    Receta - {format(new Date(prescription.created_at), "PPP", { locale: es })}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {prescription.details.medications?.length || 0} medicamentos indicados
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleSelectPrescription(prescription)}
                                  className="border-slate-800 text-xs hover:bg-slate-800"
                                >
                                  <Eye className="h-3.5 w-3.5 mr-2" /> Previsualizar
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="photos" className="flex-1 overflow-y-auto p-6 m-0">
                    <div className="space-y-6">
                      
                      {/* Barra de Acciones de Carga */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 bg-slate-900/40 border border-slate-800 rounded-2xl">
                        <div>
                          <p className="text-sm font-semibold text-white">Adjuntos e Historial Fotográfico</p>
                          <p className="text-xs text-slate-500 mt-0.5">Sube imágenes médicas del paciente para documentar su evolución.</p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <input
                            type="file"
                            id="desktop-photo-upload"
                            accept="image/*"
                            onChange={handleLocalPhotoUpload}
                            className="hidden"
                            disabled={localFileUploading}
                          />
                          <Button
                            variant="outline"
                            onClick={() => document.getElementById("desktop-photo-upload")?.click()}
                            disabled={localFileUploading}
                            className="border-slate-800 text-xs hover:bg-slate-800"
                          >
                            {localFileUploading ? (
                              <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> Subiendo...</>
                            ) : (
                              <><ImageIcon className="h-3.5 w-3.5 mr-2" /> Subir desde PC</>
                            )}
                          </Button>
                          
                          <Button
                            onClick={handleGenerateQR}
                            className="bg-teal-600 hover:bg-teal-500 text-white text-xs flex items-center gap-2"
                          >
                            <QrCode className="h-3.5 w-3.5" />
                            Subir desde Celular
                          </Button>
                        </div>
                      </div>

                      {/* Cuadrícula de fotos */}
                      {photosLoading ? (
                        <p className="text-center text-slate-500 py-12">Cargando fotos del paciente...</p>
                      ) : photos.length === 0 ? (
                        <div className="text-center py-20 border border-dashed border-slate-800 rounded-xl">
                          <Camera className="h-10 w-10 text-slate-700 mx-auto mb-3" />
                          <p className="text-slate-500">Aún no hay fotos clínicas en el expediente de este paciente.</p>
                          <p className="text-xs text-slate-600 mt-1">Usa tu celular o PC para documentar heridas, evoluciones o radiografías.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                          {photos.map((photo) => (
                            <div
                              key={photo.id}
                              className="group relative bg-slate-900/30 border border-slate-800/50 rounded-2xl overflow-hidden hover:border-teal-500/20 transition-all flex flex-col"
                            >
                              {/* Contenedor de la Imagen */}
                              <div className="aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden border-b border-slate-800/40 relative">
                                {photo.url ? (
                                  <img
                                    src={photo.url}
                                    alt={photo.file_name}
                                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                                  />
                                ) : (
                                  <div className="text-xs text-red-500">Error al cargar la imagen</div>
                                )}
                                
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirm({ photoId: photo.id, filePath: photo.file_path, fileName: photo.file_name })}
                                  className="absolute top-2 right-2 p-1.5 bg-slate-950/80 border border-slate-850 hover:bg-red-500/10 hover:text-red-400 text-slate-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Eliminar foto"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Datos y descripción */}
                              <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                                <div>
                                  <p className="text-[10px] text-teal-400 font-semibold uppercase tracking-wider">
                                    {format(new Date(photo.created_at), "d 'de' MMMM 'de' yyyy, hh:mm a", { locale: es })}
                                  </p>
                                  <p className="text-xs font-medium text-slate-200 mt-1 truncate" title={photo.file_name}>
                                    {photo.file_name}
                                  </p>
                                  {photo.description && (
                                    <p className="text-xs text-slate-400 mt-2 leading-relaxed italic line-clamp-2">
                                      &ldquo;{photo.description}&rdquo;
                                    </p>
                                  )}
                                  
                                  {photo.appointments && (
                                    <div className="mt-3 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-teal-500/5 border border-teal-500/10 text-[9px] text-teal-400 font-semibold">
                                      <Calendar className="w-3 h-3 text-teal-500" />
                                      <span>Consulta: {format(new Date((photo.appointments as any).start_time), "d 'de' MMM, yy, hh:mm a", { locale: es })}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </Card>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-3xl p-12 text-center text-slate-500">
            <div className="w-20 h-20 bg-slate-900/50 rounded-full flex items-center justify-center mb-6">
              <Search className="h-10 w-10 text-slate-700" />
            </div>
            <h3 className="text-xl font-medium text-slate-300 mb-2">Selecciona un paciente</h3>
            <p className="max-w-xs mx-auto">Busca y elige un paciente del directorio para visualizar o crear su expediente clínico electrónico.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExpedientesPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-slate-400">Cargando expedientes...</div>}>
      <ExpedientesContent />
    </React.Suspense>
  );
}
