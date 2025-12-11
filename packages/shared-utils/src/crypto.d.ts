export declare function hashPassword(password: string): Promise<string>;
export declare function verifyPassword(password: string, hash: string): Promise<boolean>;
export declare function generateSecureToken(length?: number): string;
export declare function generateUUID(): string;
export declare function encrypt(text: string, key: string): string;
export declare function decrypt(text: string, key: string): string;
//# sourceMappingURL=crypto.d.ts.map