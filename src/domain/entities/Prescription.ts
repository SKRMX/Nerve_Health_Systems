export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes: string;
}

export class Prescription {
  public readonly id: string;
  public readonly clinicId: string;
  public readonly patientId: string;
  public readonly doctorId: string;
  public readonly medicalRecordId: string | null;
  private medications: Medication[];
  public readonly createdAt: Date;

  constructor(
    id: string,
    clinicId: string,
    patientId: string,
    doctorId: string,
    medicalRecordId: string | null = null,
    medications: Medication[] = [],
    createdAt: Date = new Date()
  ) {
    this.id = id;
    this.clinicId = clinicId;
    this.patientId = patientId;
    this.doctorId = doctorId;
    this.medicalRecordId = medicalRecordId;
    this.medications = [...medications];
    this.createdAt = createdAt;
  }

  public getMedications(): ReadonlyArray<Medication> {
    return [...this.medications];
  }

  public addMedication(medication: Medication): void {
    this.medications.push(medication);
  }

  public removeMedication(index: number): void {
    if (index < 0 || index >= this.medications.length) {
      return;
    }
    this.medications.splice(index, 1);
  }

  public hasMedications(): boolean {
    return this.medications.length > 0;
  }
}
