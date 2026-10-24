"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Search, MoreHorizontal, User } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Tipado base
type Patient = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  birth_date: string;
  created_at: string;
};

// Mock de datos borrado permanentemente

export default function PacientesPage() {
  const { userProfile } = useAuth();
  const clinicId = userProfile?.clinic_id;
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const router = useRouter();

  // Form State
  const [formData, setFormData] = useState({
    first_name: "", last_name: "", email: "", phone: "", birth_date: ""
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filteredPatients = patients.filter((p) => 
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.email || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (clinicId) fetchPatients();
  }, [clinicId]);

  const fetchPatients = async () => {
    if (!clinicId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("clinic_id", clinicId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching patients:", error);
        toast.error("Error cargando base de datos", { description: error.message });
      } else {
        setPatients(data || []);
      }
    } catch (err) {
      console.error("Unexpected error in fetchPatients:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (patient: Patient) => {
    setEditingId(patient.id);
    setFormData({
      first_name: patient.first_name,
      last_name: patient.last_name,
      email: patient.email || "",
      phone: patient.phone || "",
      birth_date: patient.birth_date || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    const { error } = await supabase.from("patients").delete().eq("id", id).eq("clinic_id", clinicId);
    if (error) {
      toast.error("Error al borrar", { description: error.message });
      return;
    }
    setPatients(patients.filter(p => p.id !== id));
    toast.success("Paciente eliminado", {
      description: `El expediente de ${name} ha sido borrado del repositorio DB.`
    });
  };

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name || !formData.last_name) {
      toast.error("El nombre y apellido son obligatorios");
      return;
    }

    if (editingId) {
      const { data, error } = await supabase
        .from('patients')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          birth_date: formData.birth_date ? formData.birth_date : null
        })
        .eq('id', editingId)
        .select();

      if (error) {
        toast.error("Error al actualizar", { description: error.message });
        return;
      }
      
      toast.success("Información actualizada en la BD");
      setEditingId(null);
    } else {
      const { data, error } = await supabase
        .from('patients')
        .insert([{
          clinic_id: clinicId,
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          birth_date: formData.birth_date ? formData.birth_date : null
        }])
        .select();

      if (error) {
        toast.error("Error registrando paciente", { description: error.message });
        return;
      }
      toast.success("Paciente registrado en la nube");
    }

    fetchPatients();

    setIsDialogOpen(false);
    setFormData({ first_name: "", last_name: "", email: "", phone: "", birth_date: "" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Directorio de Pacientes</h1>
          <p className="text-slate-400 mt-1">Gestión de la base de datos clínica.</p>
        </div>
        
        {/* Modal / Dialog para crear Paciente */}
        <Button onClick={() => setIsDialogOpen(true)} className="bg-teal-600 hover:bg-teal-500 text-white rounded-xl shadow-[0_0_20px_-5px_rgba(13,148,136,0.4)] transition-all">
          <Plus className="h-4 w-4 mr-2" /> Nuevo Paciente
        </Button>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px] bg-slate-950 border-slate-800 text-slate-200">
            <DialogHeader>
              <DialogTitle className="text-xl font-medium text-white">{editingId ? "Editar Paciente" : "Registrar Nuevo Paciente"}</DialogTitle>
              <DialogDescription className="text-slate-400">
                {editingId ? "Actualiza la información del expediente clínico." : "Llenar los datos generales para dar de alta un nuevo expediente clínico."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddPatient} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-slate-300">Nombre</Label>
                  <Input 
                    id="firstName" 
                    placeholder="Ej. Juan" 
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    className="bg-slate-900/50 border-slate-800 focus-visible:ring-teal-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-slate-300">Apellido</Label>
                  <Input 
                    id="lastName" 
                    placeholder="Ej. Pérez" 
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    className="bg-slate-900/50 border-slate-800 focus-visible:ring-teal-500/50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Correo Electrónico (Opcional)</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="juan@ejemplo.com" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="bg-slate-900/50 border-slate-800 focus-visible:ring-teal-500/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-slate-300">Teléfono</Label>
                  <Input 
                    id="phone" 
                    placeholder="555..." 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="bg-slate-900/50 border-slate-800 focus-visible:ring-teal-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birth_date" className="text-slate-300">Fecha de Nacimiento</Label>
                  <Input 
                    id="birth_date" 
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
                    className="bg-slate-900/50 border-slate-800 focus-visible:ring-teal-500/50 text-slate-300 [color-scheme:dark]"
                  />
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="ghost" onClick={() => { setIsDialogOpen(false); setEditingId(null); setFormData({ first_name: "", last_name: "", email: "", phone: "", birth_date: "" }); }} className="text-slate-300 hover:text-white hover:bg-slate-800">
                  Cancelar
                </Button>
                <Button type="submit" className="bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-500/20">
                  {editingId ? "Guardar Cambios" : "Guardar Paciente"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-slate-950/40 border-slate-800/60 backdrop-blur-xl shadow-lg ring-1 ring-white/5">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-white/5 gap-4">
          <div className="space-y-1">
            <CardTitle className="text-lg text-slate-200">Base de Datos</CardTitle>
            <CardDescription className="text-slate-500">Muestra {filteredPatients.length} pacientes registrados.</CardDescription>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input 
              placeholder="Buscar por nombre o email..." 
              value={searchQuery}
              onChange={handleSearch}
              className="pl-9 bg-slate-900/30 border-slate-800 text-slate-300 focus-visible:ring-teal-500/50 h-9 rounded-full"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-900/50 hover:bg-slate-900/50">
              <TableRow className="border-slate-800/60">
                <TableHead className="text-slate-400 pl-6 w-[250px]">Paciente</TableHead>
                <TableHead className="text-slate-400">Contacto</TableHead>
                <TableHead className="text-slate-400">Fecha Nacimiento</TableHead>
                <TableHead className="text-slate-400">Alta</TableHead>
                <TableHead className="text-right pr-6"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                    Sincronizando con Supabase...
                  </TableCell>
                </TableRow>
              ) : filteredPatients.length > 0 ? (
                filteredPatients.map((patient) => (
                  <TableRow key={patient.id} className="border-slate-800/60 transition-colors hover:bg-slate-800/30 group">
                    <TableCell className="pl-6 font-medium text-slate-200 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                          <User className="h-4 w-4 text-teal-500" />
                        </div>
                        {patient.first_name} {patient.last_name}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-400">
                      <div className="flex flex-col">
                        <span>{patient.email || "—"}</span>
                        <span className="text-xs text-slate-500">{patient.phone || "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-400">{patient.birth_date || "—"}</TableCell>
                    <TableCell className="text-slate-400">{patient.created_at.split('T')[0]}</TableCell>
                    <TableCell className="text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="flex h-8 w-8 ml-auto items-center justify-center rounded-md text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-teal-400 hover:bg-teal-500/10 outline-none">
                          <MoreHorizontal className="h-4 w-4 pointer-events-none" />
                          <span className="sr-only">Abrir menú</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-slate-950 border-slate-800 text-slate-300">
                          <DropdownMenuGroup>
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-slate-800" />
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/expedientes?patient=${patient.id}`)} className="cursor-pointer focus:bg-teal-500/10 focus:text-teal-400">Ver Expediente Clínico</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/agenda?patient=${patient.id}`)} className="cursor-pointer focus:bg-teal-500/10 focus:text-teal-400">Agendar Cita</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(patient)} className="cursor-pointer focus:bg-teal-500/10 focus:text-teal-400">Editar Información</DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-800" />
                            <DropdownMenuItem onClick={() => handleDelete(patient.id, `${patient.first_name} ${patient.last_name}`)} className="cursor-pointer focus:bg-red-500/10 focus:text-red-400">Eliminar Paciente</DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                    No se encontraron pacientes en la base de datos.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
