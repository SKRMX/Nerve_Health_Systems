export class Patient {
  public readonly id: string;
  public readonly clinicId: string;
  private readonly firstName: string;
  private readonly lastName: string;
  public readonly email: string | null;
  public readonly phone: string | null;
  public readonly birthDate: Date | null;

  constructor(
    id: string,
    clinicId: string,
    firstName: string,
    lastName: string,
    email: string | null = null,
    phone: string | null = null,
    birthDate: Date | string | null = null
  ) {
    this.id = id;
    this.clinicId = clinicId;
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.phone = phone;
    if (birthDate instanceof Date) {
      this.birthDate = Number.isNaN(birthDate.getTime()) ? null : birthDate;
    } else if (typeof birthDate === "string" && birthDate.trim() !== "") {
      const parsed = new Date(birthDate);
      this.birthDate = Number.isNaN(parsed.getTime()) ? null : parsed;
    } else {
      this.birthDate = null;
    }
  }

  public getFirstName(): string {
    return this.firstName;
  }

  public getLastName(): string {
    return this.lastName;
  }

  public getFullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  public getAge(referenceDate: Date = new Date()): number | null {
    if (!this.birthDate || Number.isNaN(this.birthDate.getTime())) {
      return null;
    }

    let age = referenceDate.getFullYear() - this.birthDate.getFullYear();
    const monthDiff = referenceDate.getMonth() - this.birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < this.birthDate.getDate())) {
      age--;
    }

    return age >= 0 ? age : null;
  }
}
