"use client";

import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import type { DoctorProfile } from '@/hooks/useDoctorProfile';

// ═══════════════════════════════════════════════
// PLANTILLA: CLÁSICA
// ═══════════════════════════════════════════════
const classicStyles = StyleSheet.create({
  page: { padding: 30, backgroundColor: '#ffffff', fontFamily: 'Helvetica' },
  pageHalf: { padding: 20, backgroundColor: '#ffffff', fontFamily: 'Helvetica' },
  header: { flexDirection: 'row', justifyContent: 'space-between', borderBottom: '1.5pt solid #0d9488', paddingBottom: 8, marginBottom: 10 },
  clinicName: { fontSize: 14, color: '#0f172a', fontWeight: 'bold' },
  clinicSub: { fontSize: 7, color: '#64748b', marginTop: 1 },
  clinicContact: { fontSize: 6, color: '#94a3b8', marginTop: 3 },
  doctorName: { fontSize: 9, color: '#0f172a', fontWeight: 'bold', textAlign: 'right' },
  doctorSpec: { fontSize: 7, color: '#0d9488', marginTop: 1, textAlign: 'right' },
  doctorLicense: { fontSize: 6, color: '#64748b', marginTop: 1, textAlign: 'right' },
  patientBox: { backgroundColor: '#f8fafc', padding: 6, borderRadius: 2, marginBottom: 8, flexDirection: 'row', border: '0.5pt solid #e2e8f0' },
  patientLabel: { fontSize: 5, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 1, letterSpacing: 0.5 },
  patientData: { fontSize: 7, color: '#1e293b', fontWeight: 'bold' },
  patientItem: { flex: 1 },
  rxSymbol: { fontSize: 16, color: '#0d9488', fontWeight: 'bold', marginBottom: 4 },
  rxTitle: { fontSize: 8, color: '#0d9488', fontWeight: 'bold', borderBottom: '0.5pt solid #e2e8f0', paddingBottom: 3, marginBottom: 6 },
  medItem: { marginBottom: 6, paddingLeft: 6, borderLeft: '1.5pt solid #0d9488' },
  medName: { fontSize: 8, color: '#0f172a', fontWeight: 'bold' },
  medDose: { fontSize: 7, color: '#334155', marginTop: 1 },
  medInstructions: { fontSize: 6, color: '#64748b', marginTop: 1, fontStyle: 'italic' },
  signatureBlock: { marginTop: 20, alignItems: 'flex-end' },
  signatureLine: { width: 140, borderTop: '0.5pt solid #334155', paddingTop: 3, textAlign: 'center' },
  signatureName: { fontSize: 7, color: '#0f172a', fontWeight: 'bold' },
  signatureLabel: { fontSize: 5, color: '#64748b', marginTop: 1 },
  footer: { position: 'absolute', bottom: 15, left: 30, right: 30, borderTop: '0.5pt solid #e2e8f0', paddingTop: 4, textAlign: 'center' },
  footerText: { fontSize: 5, color: '#94a3b8' },
  footerAddress: { fontSize: 5, color: '#b0b8c4', marginTop: 1 },
});

// ═══════════════════════════════════════════════
// PLANTILLA: MODERNA
// ═══════════════════════════════════════════════
const modernStyles = StyleSheet.create({
  page: { padding: 30, backgroundColor: '#ffffff', fontFamily: 'Helvetica' },
  pageHalf: { padding: 20, backgroundColor: '#ffffff', fontFamily: 'Helvetica' },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 8, marginBottom: 10, borderBottom: '2pt solid #2563eb' },
  clinicName: { fontSize: 14, color: '#1e293b', fontWeight: 'bold', letterSpacing: 0.5 },
  clinicSub: { fontSize: 6, color: '#3b82f6', marginTop: 2, textTransform: 'uppercase', letterSpacing: 1.5 },
  clinicContact: { fontSize: 6, color: '#94a3b8', marginTop: 3 },
  doctorName: { fontSize: 9, color: '#1e293b', fontWeight: 'bold', textAlign: 'right' },
  doctorSpec: { fontSize: 6, color: '#3b82f6', marginTop: 1, textAlign: 'right', textTransform: 'uppercase', letterSpacing: 0.8 },
  doctorLicense: { fontSize: 6, color: '#64748b', marginTop: 1, textAlign: 'right' },
  patientBox: { backgroundColor: '#eff6ff', padding: 6, borderRadius: 2, marginBottom: 8, flexDirection: 'row', border: '0.5pt solid #bfdbfe' },
  patientLabel: { fontSize: 5, color: '#64748b', textTransform: 'uppercase', marginBottom: 1, letterSpacing: 0.8 },
  patientData: { fontSize: 7, color: '#1e293b', fontWeight: 'bold' },
  patientItem: { flex: 1 },
  rxSymbol: { fontSize: 16, color: '#2563eb', fontWeight: 'bold', marginBottom: 4 },
  rxTitle: { fontSize: 8, color: '#1e293b', fontWeight: 'bold', borderBottom: '1pt solid #dbeafe', paddingBottom: 3, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  medItem: { marginBottom: 6, paddingLeft: 6, borderLeft: '2pt solid #3b82f6' },
  medName: { fontSize: 8, color: '#0f172a', fontWeight: 'bold' },
  medDose: { fontSize: 7, color: '#334155', marginTop: 1 },
  medInstructions: { fontSize: 6, color: '#64748b', marginTop: 1, fontStyle: 'italic' },
  signatureBlock: { marginTop: 20, alignItems: 'flex-end' },
  signatureLine: { width: 140, borderTop: '1.5pt solid #2563eb', paddingTop: 3, textAlign: 'center' },
  signatureName: { fontSize: 7, color: '#0f172a', fontWeight: 'bold' },
  signatureLabel: { fontSize: 5, color: '#64748b', marginTop: 1 },
  footer: { position: 'absolute', bottom: 15, left: 30, right: 30, borderTop: '0.5pt solid #e2e8f0', paddingTop: 4, textAlign: 'center' },
  footerText: { fontSize: 5, color: '#94a3b8' },
  footerAddress: { fontSize: 5, color: '#b0b8c4', marginTop: 1 },
});

// ═══════════════════════════════════════════════
// PLANTILLA: MINIMALISTA
// ═══════════════════════════════════════════════
const minimalStyles = StyleSheet.create({
  page: { padding: 35, backgroundColor: '#ffffff', fontFamily: 'Helvetica' },
  pageHalf: { padding: 20, backgroundColor: '#ffffff', fontFamily: 'Helvetica' },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 8, marginBottom: 10, borderBottom: '0.5pt solid #cbd5e1' },
  clinicName: { fontSize: 12, color: '#334155', fontWeight: 'bold' },
  clinicSub: { fontSize: 6, color: '#94a3b8', marginTop: 2 },
  clinicContact: { fontSize: 5, color: '#cbd5e1', marginTop: 3 },
  doctorName: { fontSize: 9, color: '#334155', fontWeight: 'bold', textAlign: 'right' },
  doctorSpec: { fontSize: 6, color: '#64748b', marginTop: 1, textAlign: 'right' },
  doctorLicense: { fontSize: 5, color: '#94a3b8', marginTop: 1, textAlign: 'right' },
  patientBox: { padding: 4, marginBottom: 8, flexDirection: 'row', borderBottom: '0.5pt solid #e2e8f0' },
  patientLabel: { fontSize: 5, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 1, letterSpacing: 0.5 },
  patientData: { fontSize: 7, color: '#334155' },
  patientItem: { flex: 1 },
  rxSymbol: { fontSize: 14, color: '#64748b', marginBottom: 4 },
  rxTitle: { fontSize: 8, color: '#334155', borderBottom: '0.5pt solid #e2e8f0', paddingBottom: 3, marginBottom: 6 },
  medItem: { marginBottom: 5, paddingLeft: 6, borderLeft: '0.5pt solid #94a3b8' },
  medName: { fontSize: 7, color: '#1e293b', fontWeight: 'bold' },
  medDose: { fontSize: 6, color: '#475569', marginTop: 1 },
  medInstructions: { fontSize: 5, color: '#94a3b8', marginTop: 1, fontStyle: 'italic' },
  signatureBlock: { marginTop: 15, alignItems: 'flex-end' },
  signatureLine: { width: 130, borderTop: '0.5pt solid #64748b', paddingTop: 3, textAlign: 'center' },
  signatureName: { fontSize: 7, color: '#334155' },
  signatureLabel: { fontSize: 5, color: '#94a3b8', marginTop: 1 },
  footer: { position: 'absolute', bottom: 15, left: 35, right: 35, borderTop: '0.5pt solid #e2e8f0', paddingTop: 4, textAlign: 'center' },
  footerText: { fontSize: 4, color: '#cbd5e1' },
  footerAddress: { fontSize: 4, color: '#cbd5e1', marginTop: 1 },
});

const TEMPLATES: Record<string, any> = {
  classic: classicStyles,
  modern: modernStyles,
  minimal: minimalStyles,
};

interface PrescriptionPDFProps {
  patient: any;
  medications: any[];
  date: string;
  doctorProfile: DoctorProfile;
}

export const PrescriptionPDF = ({ patient, medications, date, doctorProfile }: PrescriptionPDFProps) => {
  const templateKey = doctorProfile.template_style || "classic";
  const s = TEMPLATES[templateKey] || classicStyles;
  const isHalf = doctorProfile.page_size === "half";
  const pageStyle = isHalf ? s.pageHalf : s.page;
  const pageSize = isHalf ? { width: 612, height: 396 } : "LETTER";

  return (
    <Document>
      <Page size={pageSize as any} style={pageStyle} wrap={false}>
        {/* === ENCABEZADO === */}
        <View style={s.header}>
          <View style={{ flex: 1 }}>
            {doctorProfile.clinic_name ? (
              <Text style={s.clinicName}>{doctorProfile.clinic_name}</Text>
            ) : (
              <Text style={s.clinicName}>{doctorProfile.full_name}</Text>
            )}
            {doctorProfile.clinic_subtitle && (
              <Text style={s.clinicSub}>{doctorProfile.clinic_subtitle}</Text>
            )}
            {(doctorProfile.clinic_phone || doctorProfile.clinic_email) && (
              <Text style={s.clinicContact}>
                {doctorProfile.clinic_phone && `Tel: ${doctorProfile.clinic_phone}`}
                {doctorProfile.clinic_phone && doctorProfile.clinic_email && "  |  "}
                {doctorProfile.clinic_email}
              </Text>
            )}
          </View>
          <View style={{ maxWidth: 180, textAlign: 'right' }}>
            {doctorProfile.clinic_name && (
              <Text style={s.doctorName}>{doctorProfile.full_name}</Text>
            )}
            {doctorProfile.specialty && (
              <Text style={s.doctorSpec}>{doctorProfile.specialty}</Text>
            )}
            {doctorProfile.license_number && (
              <Text style={s.doctorLicense}>Cédula: {doctorProfile.license_number}</Text>
            )}
            {doctorProfile.university && (
              <Text style={s.doctorLicense}>{doctorProfile.university}</Text>
            )}
          </View>
        </View>

        {/* === PACIENTE === */}
        <View style={s.patientBox}>
          <View style={s.patientItem}>
            <Text style={s.patientLabel}>Paciente</Text>
            <Text style={s.patientData}>{patient?.first_name} {patient?.last_name}</Text>
          </View>
          <View style={s.patientItem}>
            <Text style={s.patientLabel}>Fecha</Text>
            <Text style={s.patientData}>{date}</Text>
          </View>
        </View>

        {/* === RECETA === */}
        <Text style={s.rxSymbol}>Rx</Text>
        <Text style={s.rxTitle}>Indicaciones Médicas</Text>
        
        {medications.map((med: any, index: number) => (
          <View key={index} style={s.medItem}>
            <Text style={s.medName}>{index + 1}. {med.medication}</Text>
            <Text style={s.medDose}>Dosis: {med.dosage}</Text>
            {med.instructions && (
              <Text style={s.medInstructions}>{med.instructions}</Text>
            )}
          </View>
        ))}

        {/* === FIRMA === */}
        <View style={s.signatureBlock}>
          <View style={s.signatureLine}>
            <Text style={s.signatureName}>{doctorProfile.full_name}</Text>
            <Text style={s.signatureLabel}>
              {doctorProfile.signature_label || 
                [doctorProfile.specialty, doctorProfile.license_number && `Céd. ${doctorProfile.license_number}`].filter(Boolean).join(" - ") || 
                "Médico"}
            </Text>
          </View>
        </View>

        {/* === PIE DE PÁGINA === */}
        <View style={s.footer}>
          <Text style={s.footerText}>{doctorProfile.footer_text}</Text>
          {doctorProfile.clinic_address && (
            <Text style={s.footerAddress}>{doctorProfile.clinic_address}</Text>
          )}
        </View>
      </Page>
    </Document>
  );
};
