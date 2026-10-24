export class InventoryItem {
  public readonly id: string;
  public readonly clinicId: string;
  public readonly name: string;
  public readonly sku: string | null;
  private stock: number;
  public readonly purchasePrice: number;
  public readonly salePrice: number;
  public readonly minStockAlert: number;

  constructor(
    id: string,
    clinicId: string,
    name: string,
    sku: string | null,
    stock: number,
    purchasePrice: number,
    salePrice: number,
    minStockAlert: number = 5
  ) {
    if (stock < 0) {
      throw new Error("Initial stock cannot be negative");
    }

    this.id = id;
    this.clinicId = clinicId;
    this.name = name;
    this.sku = sku;
    this.stock = stock;
    this.purchasePrice = purchasePrice;
    this.salePrice = salePrice;
    this.minStockAlert = minStockAlert;
  }

  public getStock(): number {
    return this.stock;
  }

  public isLowStock(): boolean {
    return this.stock <= this.minStockAlert;
  }

  public decreaseStock(quantity: number): void {
    if (quantity <= 0) {
      throw new Error("Quantity must be greater than zero");
    }
    if (this.stock - quantity < 0) {
      throw new Error("Insufficient stock");
    }
    this.stock -= quantity;
  }

  public increaseStock(quantity: number): void {
    if (quantity <= 0) {
      throw new Error("Quantity must be greater than zero");
    }
    this.stock += quantity;
  }
}
