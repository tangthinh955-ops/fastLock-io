export class CreateProductDto {
  sku: string;
  name: string;
  price: number;
  stock: number;
  imageUrl?: string;
  sellerId: string;
}
