export class Clinic {
  public readonly id: string;
  public readonly name: string;
  public readonly subscriptionTier: string;
  private subscriptionStatus: string;
  public readonly countryCode: string;
  public readonly currency: string;

  constructor(
    id: string,
    name: string,
    subscriptionTier: string,
    subscriptionStatus: string,
    countryCode: string = "MX",
    currency: string = "MXN"
  ) {
    this.id = id;
    this.name = name;
    this.subscriptionTier = subscriptionTier;
    this.subscriptionStatus = subscriptionStatus;
    this.countryCode = countryCode;
    this.currency = currency;
  }

  public getSubscriptionStatus(): string {
    return this.subscriptionStatus;
  }

  public isSubscriptionActive(): boolean {
    return this.subscriptionStatus === "active" || this.subscriptionStatus === "trialing";
  }
}
