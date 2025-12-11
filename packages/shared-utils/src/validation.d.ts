export declare function isValidEmail(email: string): boolean;
export declare function isValidUUID(uuid: string): boolean;
export declare function isValidUrl(url: string): boolean;
export declare function sanitizeString(input: string): string;
export declare function validateRequired<T>(value: T | null | undefined, fieldName: string): T;
export declare function validateStringLength(value: string, fieldName: string, min?: number, max?: number): void;
export declare function validateEnum<T>(value: unknown, enumObj: Record<string, T>, fieldName: string): T;
//# sourceMappingURL=validation.d.ts.map