import { TransactionType } from "@prisma/client";

export class TransactionDto {
  id: string;
  userId: string;
  budgetId?: string;
  categoryId?: string;
  description: string;
  amount: number;
  currency: string;
  date: Date;
  type: TransactionType;
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
}
