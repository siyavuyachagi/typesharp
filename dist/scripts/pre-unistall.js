import fs from 'fs';
import path from 'path';
const targets = ['.typesharp', 'typesharp.config.ts', 'typesharp.config.js', 'typesharp.config.json'];
for (const target of targets) {
    const fullPath = path.join(process.cwd(), target);
    if (fs.existsSync(fullPath)) {
        fs.rmSync(fullPath, { recursive: true, force: true });
    }
}
//# sourceMappingURL=pre-unistall.js.map