import { UserRole } from "../enums/UserRole";
import { User } from "./User";

export class Doctor extends User {
  public readonly specialty: string;
  public readonly licenseNumber: string;
  private teleconsultationEnabled: boolean;

  constructor(
    id: string,
    clinicId: string,
    firstName: string,
    lastName: string,
    email: string,
    phone: string | null,
    specialty: string,
    licenseNumber: string,
    teleconsultationEnabled: boolean = false,
    active: boolean = true
  ) {
    super(id, clinicId, firstName, lastName, email, phone, UserRole.DOCTOR, active);
    this.specialty = specialty;
    this.licenseNumber = licenseNumber;
    this.teleconsultationEnabled = teleconsultationEnabled;
  }

  public canAcceptTeleconsultation(): boolean {
    return this.isActive() && this.teleconsultationEnabled;
  }
}
