import { TransactionType, PaymentStatus } from "@prisma/client";

export class TransactionDto {
  id: string;
  userId: string;
  budgetId?: string;
  categoryId?: string;
  subcategoryId?: string;
  description: string;
  amount: number;
  currency: string;
  date: Date;
  dueDate?: Date;
  type: TransactionType;
  status?: PaymentStatus;
  recurrence: string;
  isAICategorized: boolean;
  aiConfidence?: number;
  notes?: string;
  location?: string;
  merchantName?: string;
  createdAt: Date;
  updatedAt: Date;

  // Related data
  budget?: {
    id: string;
    name: string;
  };

  category?: {
    id: string;
    name: string;
    icon?: string;
    color?: string;
    type: string;
  };

  subcategory?: {
    id: string;
    name: string;
    icon?: string;
    color?: string;
  };
}
