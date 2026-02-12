export class SessionDto {
  id: string;
  createdAt: Date;
  lastUsedAt: Date;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  deviceName: string | null;
  isCurrent: boolean;
}

export class SessionListResponseDto {
  sessions: SessionDto[];
  totalCount: number;
}

export class RevokeSessionResponseDto {
  success: boolean;
  message: string;
}

export class RevokeOtherSessionsResponseDto {
  success: boolean;
  revokedCount: number;
  message: string;
}
