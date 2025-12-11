"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationEvent = exports.IntegrationType = void 0;
var IntegrationType;
(function (IntegrationType) {
    IntegrationType["AZURE_DEVOPS"] = "azure_devops";
    IntegrationType["GITHUB"] = "github";
    IntegrationType["GITLAB"] = "gitlab";
    IntegrationType["JENKINS"] = "jenkins";
    IntegrationType["SLACK"] = "slack";
    IntegrationType["TEAMS"] = "teams";
    IntegrationType["JIRA"] = "jira";
    IntegrationType["WEBHOOK"] = "webhook";
})(IntegrationType || (exports.IntegrationType = IntegrationType = {}));
var NotificationEvent;
(function (NotificationEvent) {
    NotificationEvent["EXECUTION_STARTED"] = "execution.started";
    NotificationEvent["EXECUTION_COMPLETED"] = "execution.completed";
    NotificationEvent["EXECUTION_FAILED"] = "execution.failed";
    NotificationEvent["TEST_FAILED"] = "test.failed";
    NotificationEvent["SELF_HEALING"] = "self.healing";
})(NotificationEvent || (exports.NotificationEvent = NotificationEvent = {}));
//# sourceMappingURL=integration.types.js.map