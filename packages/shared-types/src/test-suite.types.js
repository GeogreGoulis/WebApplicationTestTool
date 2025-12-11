"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserType = exports.TestFramework = void 0;
var TestFramework;
(function (TestFramework) {
    TestFramework["PLAYWRIGHT"] = "playwright";
    TestFramework["SELENIUM"] = "selenium";
    TestFramework["CYPRESS"] = "cypress";
})(TestFramework || (exports.TestFramework = TestFramework = {}));
var BrowserType;
(function (BrowserType) {
    BrowserType["CHROME"] = "chrome";
    BrowserType["FIREFOX"] = "firefox";
    BrowserType["SAFARI"] = "safari";
    BrowserType["EDGE"] = "edge";
    BrowserType["OPERA"] = "opera";
})(BrowserType || (exports.BrowserType = BrowserType = {}));
//# sourceMappingURL=test-suite.types.js.map