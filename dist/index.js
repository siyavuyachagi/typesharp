"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTypeScriptFiles = exports.parseCSharpFiles = exports.createSampleConfig = exports.loadConfig = exports.generate = void 0;
// Main exports for programmatic usage
var core_1 = require("./core");
Object.defineProperty(exports, "generate", { enumerable: true, get: function () { return core_1.generate; } });
Object.defineProperty(exports, "loadConfig", { enumerable: true, get: function () { return core_1.loadConfig; } });
Object.defineProperty(exports, "createSampleConfig", { enumerable: true, get: function () { return core_1.createSampleConfig; } });
var parser_1 = require("./parser");
Object.defineProperty(exports, "parseCSharpFiles", { enumerable: true, get: function () { return parser_1.parseCSharpFiles; } });
var generator_1 = require("./generator");
Object.defineProperty(exports, "generateTypeScriptFiles", { enumerable: true, get: function () { return generator_1.generateTypeScriptFiles; } });
//# sourceMappingURL=index.js.map