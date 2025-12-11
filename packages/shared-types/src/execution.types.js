"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TriggerSource = exports.ExecutionStatus = void 0;
var ExecutionStatus;
(function (ExecutionStatus) {
    ExecutionStatus["PENDING"] = "pending";
    ExecutionStatus["RUNNING"] = "running";
    ExecutionStatus["PASSED"] = "passed";
    ExecutionStatus["FAILED"] = "failed";
    ExecutionStatus["SKIPPED"] = "skipped";
    ExecutionStatus["CANCELLED"] = "cancelled";
    ExecutionStatus["TIMEOUT"] = "timeout";
})(ExecutionStatus || (exports.ExecutionStatus = ExecutionStatus = {}));
var TriggerSource;
(function (TriggerSource) {
    TriggerSource["MANUAL"] = "manual";
    TriggerSource["SCHEDULED"] = "scheduled";
    TriggerSource["WEBHOOK"] = "webhook";
    TriggerSource["API"] = "api";
})(TriggerSource || (exports.TriggerSource = TriggerSource = {}));
//# sourceMappingURL=execution.types.js.map