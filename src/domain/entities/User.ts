import { UserRole } from "../enums/UserRole";

export abstract class User {
  public readonly id: string;
  public readonly clinicId: string;
  protected readonly firstName: string;
  protected readonly lastName: string;
  public readonly email: string;
  public readonly phone: string | null;
  private active: boolean;
  public readonly role: UserRole;

  protected constructor(
    id: string,
    clinicId: string,
    firstName: string,
    lastName: string,
    email: string,
    phone: string | null,
    role: UserRole,
    active: boolean = true
  ) {
    this.id = id;
    this.clinicId = clinicId;
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.phone = phone;
    this.role = role;
    this.active = active;
  }

  public getFullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  public getFirstName(): string {
    return this.firstName;
  }

  public getLastName(): string {
    return this.lastName;
  }

  public isActive(): boolean {
    return this.active;
  }

  public deactivate(): void {
    this.active = false;
  }

  public activate(): void {
    this.active = true;
  }
}
