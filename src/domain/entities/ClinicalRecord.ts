export class ClinicalRecord {
  public readonly id: string;
  public readonly clinicId: string;
  public readonly patientId: string;
  public readonly doctorId: string;
  public readonly appointmentId: string | null;
  private diagnosis: string;
  private clinicalNotes: string;
  public readonly createdAt: Date;

  constructor(
    id: string,
    clinicId: string,
    patientId: string,
    doctorId: string,
    appointmentId: string | null,
    diagnosis: string,
    clinicalNotes: string,
    createdAt: Date = new Date()
  ) {
    this.id = id;
    this.clinicId = clinicId;
    this.patientId = patientId;
    this.doctorId = doctorId;
    this.appointmentId = appointmentId;
    this.diagnosis = diagnosis;
    this.clinicalNotes = clinicalNotes;
    this.createdAt = createdAt;
  }

  public getDiagnosis(): string {
    return this.diagnosis;
  }

  public getClinicalNotes(): string {
    return this.clinicalNotes;
  }

  public updateDiagnosis(diagnosis: string): void {
    this.diagnosis = diagnosis;
  }

  public updateClinicalNotes(notes: string): void {
    this.clinicalNotes = notes;
  }
}
