import { UUID, Timestamp, JSONObject } from './common.types';
export declare enum IntegrationType {
    AZURE_DEVOPS = "azure_devops",
    GITHUB = "github",
    GITLAB = "gitlab",
    JENKINS = "jenkins",
    SLACK = "slack",
    TEAMS = "teams",
    JIRA = "jira",
    WEBHOOK = "webhook"
}
export declare enum NotificationEvent {
    EXECUTION_STARTED = "execution.started",
    EXECUTION_COMPLETED = "execution.completed",
    EXECUTION_FAILED = "execution.failed",
    TEST_FAILED = "test.failed",
    SELF_HEALING = "self.healing"
}
export interface Integration {
    id: UUID;
    organizationId: UUID;
    type: IntegrationType;
    name: string;
    config: JSONObject;
    credentials?: string;
    enabled: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
export interface CreateIntegrationDTO {
    type: IntegrationType;
    name: string;
    config: JSONObject;
    credentials?: string;
    enabled?: boolean;
}
export interface UpdateIntegrationDTO {
    name?: string;
    config?: JSONObject;
    credentials?: string;
    enabled?: boolean;
}
export interface Notification {
    id: UUID;
    organizationId: UUID;
    type: IntegrationType;
    events: NotificationEvent[];
    config: JSONObject;
    enabled: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
export interface WebhookPayload {
    event: string;
    source: string;
    timestamp: Timestamp;
    payload: JSONObject;
    testConfig?: {
        suiteId: UUID;
        environmentId?: UUID;
        browsers?: string[];
        parallel?: number;
    };
}
export interface NotificationPayload {
    event: NotificationEvent;
    executionId: UUID;
    suiteId: UUID;
    status: string;
    summary?: {
        total: number;
        passed: number;
        failed: number;
        duration: number;
    };
    url: string;
    timestamp: Timestamp;
}
//# sourceMappingURL=integration.types.d.ts.map