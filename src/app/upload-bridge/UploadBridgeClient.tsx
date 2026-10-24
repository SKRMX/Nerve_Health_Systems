"use client";

import React, { useState, useRef } from "react";
import { Camera, Upload, CheckCircle2, AlertCircle, Loader2, Image as ImageIcon } from "lucide-react";

interface UploadBridgeClientProps {
  token: string;
  patientName: string;
}

export function UploadBridgeClient({ token, patientName }: UploadBridgeClientProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (!selected.type.startsWith("image/")) {
        setErrorMessage("Por favor, selecciona únicamente archivos de imagen.");
        return;
      }
      setFile(selected);
      setErrorMessage(null);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selected);
    }
  };

  const triggerCamera = () => {
    cameraInputRef.current?.click();
  };

  const triggerGallery = () => {
    galleryInputRef.current?.click();
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("token", token);
    if (description.trim()) {
      formData.append("description", description.trim());
    }

    try {
      const response = await fetch("/api/attachments/upload", {
        method: "POST",
        body: formData,
      });

      const contentType = response.headers.get("content-type");
      let data: any = null;
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      }

      if (response.ok && data?.success) {
        setUploadSuccess(true);
        setFile(null);
        setPreview(null);
        setDescription("");
      } else {
        setErrorMessage(data?.error || `Error en el servidor (${response.status})`);
      }
    } catch (err) {
      setErrorMessage("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setUploadSuccess(false);
    setFile(null);
    setPreview(null);
    setDescription("");
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col items-center justify-center p-4">
      {/* Background radial effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-md h-[400px] bg-gradient-radial from-teal-500/[0.08] via-transparent to-transparent pointer-events-none" />

      <div className="w-full max-w-md bg-slate-950/60 border border-slate-900 rounded-3xl p-6 backdrop-blur-2xl shadow-2xl relative z-10 flex flex-col gap-6">
        
        {/* Brand header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 mb-3 shadow-[0_0_15px_-3px_rgba(20,184,166,0.3)]">
            <span className="font-bold tracking-wider text-lg">N</span>
          </div>
          <h2 className="text-sm font-semibold tracking-widest text-teal-500 uppercase">NERVE Health Systems</h2>
          <p className="text-xs text-slate-500 mt-0.5">Asistente de Carga Móvil</p>
        </div>

        {uploadSuccess ? (
          /* SUCCESS SCREEN */
          <div className="text-center py-8 space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto text-green-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">¡Carga exitosa!</h3>
              <p className="text-xs text-slate-400 mt-2 px-4 leading-relaxed">
                La foto se ha integrado correctamente al expediente del paciente en tiempo real. Ya puedes verla en tu pantalla principal.
              </p>
            </div>
            <button
              onClick={resetUpload}
              className="w-full py-3 px-5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-200 hover:bg-slate-850 hover:text-white transition-all text-sm font-semibold flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4" />
              Cargar otra imagen
            </button>
          </div>
        ) : (
          /* FORM UPLOAD */
          <form onSubmit={handleUpload} className="space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-5">
              
              {/* Patient info card */}
              <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-4 flex flex-col gap-1.5">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Cargando fotos para:</span>
                <span className="text-sm font-bold text-slate-200">{patientName}</span>
              </div>

              {/* Photo selector area */}
              <input
                type="file"
                ref={cameraInputRef}
                onChange={handleFileChange}
                accept="image/*"
                capture="environment" // Fuerza apertura de cámara trasera en móviles
                className="hidden"
              />
              <input
                type="file"
                ref={galleryInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />

              {!preview ? (
                <div className="grid grid-cols-2 gap-4">
                  {/* BOTÓN CÁMARA */}
                  <button
                    type="button"
                    onClick={triggerCamera}
                    className="aspect-square rounded-2xl border-2 border-dashed border-slate-800/80 bg-slate-950/40 hover:bg-slate-900/20 hover:border-teal-500/30 flex flex-col items-center justify-center gap-3 group transition-all"
                  >
                    <div className="w-12 h-12 rounded-full bg-teal-500/5 group-hover:bg-teal-500/10 flex items-center justify-center text-teal-400 transition-colors border border-teal-500/10 shadow-[0_0_15px_-3px_rgba(20,184,166,0.1)]">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div className="text-center px-1">
                      <p className="text-xs font-semibold text-slate-300">Usar Cámara</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Capturar ahora</p>
                    </div>
                  </button>

                  {/* BOTÓN GALERÍA */}
                  <button
                    type="button"
                    onClick={triggerGallery}
                    className="aspect-square rounded-2xl border-2 border-dashed border-slate-800/80 bg-slate-950/40 hover:bg-slate-900/20 hover:border-teal-500/30 flex flex-col items-center justify-center gap-3 group transition-all"
                  >
                    <div className="w-12 h-12 rounded-full bg-teal-500/5 group-hover:bg-teal-500/10 flex items-center justify-center text-teal-400 transition-colors border border-teal-500/10 shadow-[0_0_15px_-3px_rgba(20,184,166,0.1)]">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <div className="text-center px-1">
                      <p className="text-xs font-semibold text-slate-300">Subir de Galería</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Buscar foto existente</p>
                    </div>
                  </button>
                </div>
              ) : (
                /* IMAGE PREVIEW */
                <div className="space-y-4">
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
                    <img src={preview} alt="Vista previa" className="object-contain w-full h-full" />
                    <button
                      type="button"
                      onClick={() => { setFile(null); setPreview(null); }}
                      className="absolute top-2 right-2 px-3 py-1 text-[11px] bg-slate-950/80 border border-slate-800 hover:bg-slate-900 text-slate-300 rounded-xl font-medium transition-colors"
                    >
                      Cambiar foto
                    </button>
                  </div>

                  {/* Input for photo description */}
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Observaciones (opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej. Herida post-quirúrgica, pre-tratamiento..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500/40 transition-colors"
                      maxLength={150}
                    />
                  </div>
                </div>
              )}

              {/* Error Box */}
              {errorMessage && (
                <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-400 text-xs flex items-start gap-2.5 leading-relaxed">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            {/* ACTION BUTTON */}
            {file && (
              <button
                type="submit"
                disabled={uploading}
                className="w-full py-3.5 px-5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm transition-all shadow-lg shadow-teal-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Subiendo imagen...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Subir al expediente
                  </>
                )}
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
