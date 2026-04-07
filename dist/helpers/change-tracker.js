"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadPreviousHashes = loadPreviousHashes;
exports.savePreviousHashes = savePreviousHashes;
exports.computeFileHash = computeFileHash;
exports.getChangedFiles = getChangedFiles;
// src/helpers/change-tracker.ts
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
const TYPESHARP_CACHE_DIR = '.typesharp';
const HASH_SNAPSHOT_FILE = path.join(TYPESHARP_CACHE_DIR, 'hashes.json');
/**
 * Load previous generation hashes
 */
function loadPreviousHashes() {
    if (!fs.existsSync(HASH_SNAPSHOT_FILE)) {
        return new Map();
    }
    try {
        const data = JSON.parse(fs.readFileSync(HASH_SNAPSHOT_FILE, 'utf-8'));
        return new Map(Object.entries(data));
    }
    catch {
        return new Map();
    }
}
/**
 * Save current hashes for next generation
 */
function savePreviousHashes(hashes) {
    // Create .typesharp directory if it doesn't exist
    if (!fs.existsSync(TYPESHARP_CACHE_DIR)) {
        fs.mkdirSync(TYPESHARP_CACHE_DIR, { recursive: true });
    }
    const obj = Object.fromEntries(hashes);
    fs.writeFileSync(HASH_SNAPSHOT_FILE, JSON.stringify(obj, null, 2), 'utf-8');
}
function computeFileHash(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    return crypto.createHash('md5').update(content).digest('hex');
}
function getChangedFiles(allCSharpFiles, previousHashes) {
    const changed = [];
    const currentHashes = new Map();
    for (const file of allCSharpFiles) {
        const hash = computeFileHash(file);
        currentHashes.set(file, hash);
        const prevHash = previousHashes.get(file);
        if (prevHash !== hash) {
            changed.push(file);
        }
    }
    const deleted = [];
    for (const [file] of previousHashes) {
        if (!currentHashes.has(file)) {
            deleted.push(file);
        }
    }
    return { changed, deleted };
}
//# sourceMappingURL=change-tracker.js.map