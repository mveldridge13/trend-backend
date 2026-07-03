export class ClientDto {
  id: string;
  name: string;
  email: string;
  company?: string | null;
  address?: string | null;
  phone?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}
