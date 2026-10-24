import { AppointmentStatus } from "../enums/AppointmentStatus";

export class Appointment {
  public readonly id: string;
  public readonly clinicId: string;
  public readonly patientId: string | null;
  public readonly doctorId: string;
  private startTime: Date;
  private endTime: Date;
  public readonly type: string;
  private status: AppointmentStatus;

  constructor(
    id: string,
    clinicId: string,
    patientId: string | null,
    doctorId: string,
    startTime: Date,
    endTime: Date,
    type: string,
    status: AppointmentStatus = AppointmentStatus.PROGRAMADO
  ) {
    if (endTime <= startTime) {
      throw new Error("endTime must be after startTime");
    }

    this.id = id;
    this.clinicId = clinicId;
    this.patientId = patientId;
    this.doctorId = doctorId;
    this.startTime = startTime;
    this.endTime = endTime;
    this.type = type;
    this.status = status;
  }

  public getStartTime(): Date {
    return this.startTime;
  }

  public getEndTime(): Date {
    return this.endTime;
  }

  public getStatus(): AppointmentStatus {
    return this.status;
  }

  public confirm(): void {
    this.status = AppointmentStatus.PROGRAMADO;
  }

  public markInRoom(): void {
    this.status = AppointmentStatus.EN_SALA;
  }

  public complete(): void {
    this.status = AppointmentStatus.COMPLETADO;
  }

  public cancel(): void {
    this.status = AppointmentStatus.CANCELADO;
  }

  public reschedule(startTime: Date, endTime: Date): void {
    if (endTime <= startTime) {
      throw new Error("endTime must be after startTime");
    }

    this.startTime = startTime;
    this.endTime = endTime;
  }
}
