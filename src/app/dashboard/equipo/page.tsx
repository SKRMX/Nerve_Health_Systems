"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@supabase/supabase-js";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle 
} from "@/components/ui/dialog";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { 
  Users, Plus, Mail, MoreHorizontal, ShieldCheck, UserRound, 
  HeadphonesIcon, XCircle, CheckCircle2, Send, Shield, Loader2
} from "lucide-react";
import { toast } from "sonner";

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  doctor: "Doctor",
  receptionist: "Recepcionista",
};

const roleColors: Record<string, { bg: string; text: string; icon: any }> = {
  admin: { bg: "bg-violet-500/10 border-violet-500/20", text: "text-violet-400", icon: ShieldCheck },
  doctor: { bg: "bg-teal-500/10 border-teal-500/20", text: "text-teal-400", icon: UserRound },
  receptionist: { bg: "bg-blue-500/10 border-blue-500/20", text: "text-blue-400", icon: HeadphonesIcon },
};

export default function EquipoPage() {
  const router = useRouter();
  const { isAdmin, userProfile, clinic, user } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [inviteData, setInviteData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    role: "receptionist", // default to receptionist
    specialty: "",
    temp_password: "",
  });

  const isSoloPlan = clinic?.subscription_tier === "solo";

  useEffect(() => {
    // Guard: redirect if not admin
    if (userProfile && !isAdmin) {
      router.replace("/dashboard");
      return;
    }
    
    if (userProfile?.clinic_id) {
      fetchMembers();
    } else {
      setIsLoading(false);
    }
  }, [isAdmin, userProfile]);

  const fetchMembers = async () => {
    if (!userProfile?.clinic_id) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, first_name, last_name, email, role, active, created_at")
        .eq("clinic_id", userProfile?.clinic_id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching members:", error);
        toast.error("Error al cargar el equipo");
      } else {
        setMembers(data || []);
      }
    } catch (err) {
      console.error("Unexpected error in fetchMembers:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const generateTempPassword = () => {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#";
    return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  };

  const handleOpenInvite = () => {
    setInviteData(prev => ({ 
      ...prev, 
      temp_password: generateTempPassword(),
      role: isSoloPlan ? "receptionist" : "doctor" 
    }));
    setIsInviteOpen(true);
  };

  const handleCreateMember = async () => {
    if (!inviteData.email || !inviteData.first_name || !inviteData.last_name) {
      toast.error("Completa nombre y correo del nuevo miembro");
      return;
    }
    if (!inviteData.temp_password || inviteData.temp_password.length < 6) {
      toast.error("La contraseña temporal debe tener al menos 6 caracteres");
      return;
    }
    setIsSending(true);

    try {
      // Create a temporary Supabase client that does NOT persist the session in localStorage
      // This prevents the new user's session from overwriting the doctor's active session!
      const tempClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false } }
      );

      const { data: authData, error: authError } = await tempClient.auth.signUp({
        email: inviteData.email,
        password: inviteData.temp_password,
        options: {
          data: {
            full_name: `${inviteData.first_name} ${inviteData.last_name}`,
            role: inviteData.role,
          }
        }
      });

      if (authError) {
        toast.error("Error creando cuenta", { description: authError.message });
        setIsSending(false);
        return;
      }

      if (!authData.user) {
        toast.error("No se pudo crear el usuario");
        setIsSending(false);
        return;
      }

      // 2. Insert into users table linking to this clinic
      const { error: profileError } = await supabase
        .from("users")
        .insert([{
          id: authData.user.id,
          clinic_id: userProfile?.clinic_id,
          role: inviteData.role,
          first_name: inviteData.first_name,
          last_name: inviteData.last_name,
          email: inviteData.email,
        }]);

      if (profileError) {
        toast.error("Error vinculando a la clínica", { description: profileError.message });
        setIsSending(false);
        return;
      }

      // Auto-deactivate other receptionists if this is a Solo plan to enforce 1 active max
      if (inviteData.role === "receptionist" && isSoloPlan) {
        const otherActive = members.filter(m => m.role === "receptionist" && m.active);
        for (const other of otherActive) {
          await supabase.from("users").update({ active: false }).eq("id", other.id);
        }
      }

      // 3. If doctor, create a doctor_profile
      if (inviteData.role === "doctor" || inviteData.role === "admin") {
        await supabase.from("doctor_profiles").insert([{
          user_id: authData.user.id,
          clinic_id: userProfile?.clinic_id,
          full_name: `${inviteData.first_name} ${inviteData.last_name}`,
          specialty: inviteData.specialty || "",
          license_number: "",
          university: "",
          clinic_name: clinic?.name || "",
          clinic_subtitle: "",
          clinic_address: "",
          clinic_phone: "",
          clinic_email: inviteData.email,
          signature_label: `${inviteData.first_name.toUpperCase()} ${inviteData.last_name.toUpperCase()}`,
          footer_text: "Esta receta es un documento médico oficial.",
          template_style: "classic",
          page_size: "full",
        }]);
      }

      toast.success(`¡${roleLabels[inviteData.role]} creado!`, {
        description: `Credenciales: ${inviteData.email} / ${inviteData.temp_password}. Comparte esto de forma segura.`
      });

      setIsInviteOpen(false);
      setInviteData({ first_name: "", last_name: "", email: "", role: "doctor", specialty: "", temp_password: "" });
      fetchMembers();
    } catch (err: any) {
      toast.error(err.message);
    }
    setIsSending(false);
  };

  const handleToggleActive = async (member: any) => {
    // If turning ON a receptionist under a Solo plan, turn OFF others
    if (!member.active && member.role === "receptionist" && isSoloPlan) {
      const otherActive = members.filter(m => m.role === "receptionist" && m.active);
      for (const other of otherActive) {
        await supabase.from("users").update({ active: false }).eq("id", other.id);
      }
      toast.info("Límite aplicado", {
        description: "Se ha desactivado a la recepcionista anterior para habilitar la actual."
      });
    }

    const { error } = await supabase
      .from("users")
      .update({ active: !member.active })
      .eq("id", member.id);

    if (error) {
      toast.error("Error actualizando estado");
    } else {
      toast.success(member.active ? "Miembro desactivado" : "Miembro reactivado");
      fetchMembers();
    }
  };

  // Stats
  const doctorCount = members.filter(m => m.role === "doctor" || m.role === "admin").length;
  const receptionistCount = members.filter(m => m.role === "receptionist").length;
  const activeCount = members.filter(m => m.active).length;

  const activeReceptionistCount = members.filter(m => m.role === "receptionist" && m.active).length;
  const canAddMore = true; // Permite agregar pero el sistema auto-desactiva a las demás

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            {isSoloPlan ? "Gestión de Asistente" : "Gestión de Equipo"}
          </h1>
          <p className="text-slate-400 mt-1">
            {isSoloPlan 
              ? `Administra el acceso de tu recepcionista para ${clinic?.name}.`
              : `Administra los médicos y recepcionistas de ${clinic?.name}.`
            }
          </p>
        </div>
        <Button
          onClick={handleOpenInvite}
          className="bg-teal-600 hover:bg-teal-500 text-white rounded-xl shadow-[0_0_20px_-5px_rgba(13,148,136,0.4)] transition-all"
        >
          <Plus className="h-4 w-4 mr-2" /> {isSoloPlan ? "Reemplazar Recepcionista" : "Agregar Miembro"}
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-slate-950/40 border-slate-800/60 backdrop-blur-xl ring-1 ring-white/5">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-slate-400">Total Miembros</CardTitle>
            <Users className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{members.length}</div>
            <p className="text-xs text-slate-500 mt-1">{activeCount} activos</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-950/40 border-slate-800/60 backdrop-blur-xl ring-1 ring-white/5">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-slate-400">Doctores</CardTitle>
            <UserRound className="h-4 w-4 text-teal-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{doctorCount}</div>
            <p className="text-xs text-slate-500 mt-1">Médicos activos</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-950/40 border-slate-800/60 backdrop-blur-xl ring-1 ring-white/5">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-slate-400">Recepcionistas</CardTitle>
            <HeadphonesIcon className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{receptionistCount}</div>
            <p className="text-xs text-slate-500 mt-1">Asistentes activos</p>
          </CardContent>
        </Card>
      </div>

      {/* Members Table */}
      <Card className="bg-slate-950/40 border-slate-800/60 backdrop-blur-xl ring-1 ring-white/5">
        <CardHeader className="border-b border-slate-800/60">
          <CardTitle className="text-base text-white font-medium">Miembros del equipo</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>Aún no hay miembros. Agrega al primer miembro del equipo.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800/60 hover:bg-transparent">
                  <TableHead className="text-slate-500">Nombre</TableHead>
                  <TableHead className="text-slate-500">Rol</TableHead>
                  <TableHead className="text-slate-500">Correo</TableHead>
                  <TableHead className="text-slate-500">Estado</TableHead>
                  <TableHead className="text-slate-500 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => {
                  const roleCfg = roleColors[member.role as keyof typeof roleColors] || roleColors.doctor;
                  const RoleIcon = roleCfg.icon;
                  const isCurrentUser = member.id === user?.id;
                  return (
                    <TableRow key={member.id} className="border-slate-800/40 hover:bg-white/[0.02]">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${roleCfg.bg}`}>
                            <RoleIcon className={`h-4 w-4 ${roleCfg.text}`} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-200">
                              {member.first_name} {member.last_name}
                              {isCurrentUser && <span className="ml-2 text-[10px] text-slate-500">(tú)</span>}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs font-medium px-2 py-1 rounded-md border ${roleCfg.bg} ${roleCfg.text}`}>
                          {roleLabels[member.role] || member.role}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-400 text-sm">{member.email}</TableCell>
                      <TableCell>
                        {member.active ? (
                          <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Activo
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs text-red-400">
                            <XCircle className="h-3.5 w-3.5" /> Inactivo
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!isCurrentUser && (
                          <DropdownMenu>
                            <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:text-white hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-teal-500/50 outline-none">
                              <MoreHorizontal className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-slate-950 border-slate-800 text-slate-300">
                              <DropdownMenuItem
                                className="cursor-pointer focus:bg-white/5"
                                onClick={() => handleToggleActive(member)}
                              >
                                {member.active ? (
                                  <><XCircle className="h-4 w-4 mr-2 text-red-400" /> Desactivar</>
                                ) : (
                                  <><CheckCircle2 className="h-4 w-4 mr-2 text-emerald-400" /> Reactivar</>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="sm:max-w-[460px] bg-slate-950 border-slate-800 text-slate-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-medium text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-teal-400" /> {isSoloPlan ? "Agregar Recepcionista" : "Agregar Miembro"}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Crea la cuenta del nuevo miembro. Comparte las credenciales de forma segura.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-slate-400 text-xs">Nombre</Label>
                <Input
                  placeholder="Juan"
                  value={inviteData.first_name}
                  onChange={e => setInviteData(p => ({ ...p, first_name: e.target.value }))}
                  className="bg-slate-900/50 border-slate-800 text-slate-200 h-9 focus-visible:ring-teal-500/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-400 text-xs">Apellido</Label>
                <Input
                  placeholder="López"
                  value={inviteData.last_name}
                  onChange={e => setInviteData(p => ({ ...p, last_name: e.target.value }))}
                  className="bg-slate-900/50 border-slate-800 text-slate-200 h-9 focus-visible:ring-teal-500/50"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-400 text-xs">Rol</Label>
              <Select value={inviteData.role} onValueChange={v => setInviteData(p => ({ ...p, role: v || "receptionist" }))} disabled={isSoloPlan}>
                <SelectTrigger className="bg-slate-900/50 border-slate-800 text-slate-200 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-950 border-slate-800">
                  {!isSoloPlan && (
                    <SelectItem value="doctor" className="text-slate-300">
                      <div className="flex items-center gap-2">
                        <UserRound className="h-3.5 w-3.5 text-teal-400" /> Doctor
                      </div>
                    </SelectItem>
                  )}
                  <SelectItem value="receptionist" className="text-slate-300">
                    <div className="flex items-center gap-2">
                      <HeadphonesIcon className="h-3.5 w-3.5 text-blue-400" /> Recepcionista
                    </div>
                  </SelectItem>
                  {!isSoloPlan && (
                    <SelectItem value="admin" className="text-slate-300">
                      <div className="flex items-center gap-2">
                        <Shield className="h-3.5 w-3.5 text-violet-400" /> Admin/Doctor
                      </div>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {(inviteData.role === "doctor" || inviteData.role === "admin") && (
              <div className="space-y-1.5">
                <Label className="text-slate-400 text-xs">Especialidad (opcional)</Label>
                <Input
                  placeholder="Ej. Cardiología..."
                  value={inviteData.specialty}
                  onChange={e => setInviteData(p => ({ ...p, specialty: e.target.value }))}
                  className="bg-slate-900/50 border-slate-800 text-slate-200 h-9 focus-visible:ring-teal-500/50"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-slate-400 text-xs">Correo Electrónico</Label>
              <Input
                type="email"
                placeholder="doctor@clinica.com"
                value={inviteData.email}
                onChange={e => setInviteData(p => ({ ...p, email: e.target.value }))}
                className="bg-slate-900/50 border-slate-800 text-slate-200 h-9 focus-visible:ring-teal-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-400 text-xs">Contraseña Temporal</Label>
              <div className="flex gap-2">
                <Input
                  value={inviteData.temp_password}
                  onChange={e => setInviteData(p => ({ ...p, temp_password: e.target.value }))}
                  className="bg-slate-900/50 border-slate-800 text-slate-200 h-9 focus-visible:ring-teal-500/50 font-mono"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInviteData(p => ({ ...p, temp_password: generateTempPassword() }))}
                  className="border-slate-700 text-slate-400 hover:text-white h-9 px-3 whitespace-nowrap"
                >
                  Regenerar
                </Button>
              </div>
              <p className="text-[10px] text-slate-500">Comparte esta contraseña de forma segura. El miembro podrá cambiarla desde su perfil.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsInviteOpen(false)} className="text-slate-400">
              Cancelar
            </Button>
            <Button
              onClick={handleCreateMember}
              disabled={isSending}
              className="bg-teal-600 hover:bg-teal-500 text-white"
            >
              {isSending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creando...</> : <><Send className="h-4 w-4 mr-2" /> Crear cuenta</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
