import fs from 'fs';
import path from 'path';

const targets = ['.typesharp'];

for (const target of targets) {
    const fullPath = path.join(process.cwd(), target);
    if (fs.existsSync(fullPath)) {
        fs.rmSync(fullPath, { recursive: true, force: true });
    }
}