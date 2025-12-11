import { UUID, Timestamp } from './common.types';
export declare enum UserRole {
    ADMIN = "admin",
    USER = "user",
    VIEWER = "viewer"
}
export interface User {
    id: UUID;
    email: string;
    passwordHash?: string;
    firstName?: string;
    lastName?: string;
    role: UserRole;
    organizationId: UUID;
    teamId?: UUID;
    isActive: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    lastLoginAt?: Timestamp;
}
export interface CreateUserDTO {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    role: UserRole;
    organizationId: UUID;
    teamId?: UUID;
}
export interface UpdateUserDTO {
    firstName?: string;
    lastName?: string;
    role?: UserRole;
    teamId?: UUID;
    isActive?: boolean;
}
export interface Organization {
    id: UUID;
    name: string;
    slug: string;
    settings: Record<string, unknown>;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
export interface Team {
    id: UUID;
    organizationId: UUID;
    name: string;
    description?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
export interface JWTPayload {
    userId: UUID;
    email: string;
    role: UserRole;
    organizationId: UUID;
    iat: number;
    exp: number;
}
//# sourceMappingURL=user.types.d.ts.map