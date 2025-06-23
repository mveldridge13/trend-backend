export declare class AuthResponseDto {
    access_token: string;
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        username: string | null;
        currency: string;
        timezone: string;
        createdAt: Date;
        income: number | null;
        setupComplete: boolean;
        hasSeenBalanceCardTour: boolean;
        hasSeenAddTransactionTour: boolean;
        hasSeenTransactionSwipeTour: boolean;
    };
}
