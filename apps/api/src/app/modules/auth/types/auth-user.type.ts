export type AuthenticatedUser = {
    sub: string;
    email?: string;
    sid: string;
    typ: 'access' | 'refresh';
    iat?: number;
    exp?: number;
};
