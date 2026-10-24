import { UserRole } from "../enums/UserRole";
import { User } from "./User";

export class Receptionist extends User {
  constructor(
    id: string,
    clinicId: string,
    firstName: string,
    lastName: string,
    email: string,
    phone: string | null,
    active: boolean = true
  ) {
    super(id, clinicId, firstName, lastName, email, phone, UserRole.RECEPTIONIST, active);
  }

  public canManageAppointments(): boolean {
    return true;
  }
}
