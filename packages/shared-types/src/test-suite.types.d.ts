import { UUID, Timestamp } from './common.types';
export declare enum TestFramework {
    PLAYWRIGHT = "playwright",
    SELENIUM = "selenium",
    CYPRESS = "cypress"
}
export declare enum BrowserType {
    CHROME = "chrome",
    FIREFOX = "firefox",
    SAFARI = "safari",
    EDGE = "edge",
    OPERA = "opera"
}
export interface TestSuite {
    id: UUID;
    organizationId: UUID;
    name: string;
    description?: string;
    framework: TestFramework;
    createdBy: UUID;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
export interface CreateTestSuiteDTO {
    name: string;
    description?: string;
    framework: TestFramework;
}
export interface UpdateTestSuiteDTO {
    name?: string;
    description?: string;
}
export interface TestScript {
    id: UUID;
    suiteId: UUID;
    name: string;
    filePath: string;
    framework: TestFramework;
    timeout?: number;
    retryCount?: number;
    tags?: string[];
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
export interface TestEnvironment {
    id: UUID;
    organizationId: UUID;
    name: string;
    baseUrl: string;
    variables: Record<string, string>;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
export interface CreateEnvironmentDTO {
    name: string;
    baseUrl: string;
    variables?: Record<string, string>;
}
export interface TestSchedule {
    id: UUID;
    suiteId: UUID;
    cronExpression: string;
    environmentId: UUID;
    browsers: BrowserType[];
    enabled: boolean;
    lastRun?: Timestamp;
    nextRun: Timestamp;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
//# sourceMappingURL=test-suite.types.d.ts.map