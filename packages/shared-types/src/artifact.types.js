"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoQuality = exports.VideoFormat = exports.ArtifactMode = exports.ArtifactType = void 0;
var ArtifactType;
(function (ArtifactType) {
    ArtifactType["VIDEO"] = "video";
    ArtifactType["SCREENSHOT"] = "screenshot";
    ArtifactType["TRACE"] = "trace";
    ArtifactType["LOG"] = "log";
    ArtifactType["REPORT"] = "report";
})(ArtifactType || (exports.ArtifactType = ArtifactType = {}));
var ArtifactMode;
(function (ArtifactMode) {
    ArtifactMode["ALWAYS"] = "always";
    ArtifactMode["ON_FAILURE"] = "on-failure";
    ArtifactMode["PER_STEP"] = "per-step";
    ArtifactMode["NEVER"] = "never";
})(ArtifactMode || (exports.ArtifactMode = ArtifactMode = {}));
var VideoFormat;
(function (VideoFormat) {
    VideoFormat["WEBM"] = "webm";
    VideoFormat["MP4"] = "mp4";
})(VideoFormat || (exports.VideoFormat = VideoFormat = {}));
var VideoQuality;
(function (VideoQuality) {
    VideoQuality["LOW"] = "low";
    VideoQuality["MEDIUM"] = "medium";
    VideoQuality["HIGH"] = "high";
})(VideoQuality || (exports.VideoQuality = VideoQuality = {}));
//# sourceMappingURL=artifact.types.js.map