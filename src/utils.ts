
import fs from "fs";
import path from "path";
import { EXPORT_ROOT, MARKETPLACE_MODULES } from "./constants.js";

export function ensureDir(dir: string) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

export function copyFolderRecursiveSync(source: string, target: string, allowedExtensions: string[] = []) {
    ensureDir(target);

    const files = fs.readdirSync(source);
    files.forEach((file) => {
        const curSource = path.join(source, file);
        const curTarget = path.join(target, file);

        if (fs.lstatSync(curSource).isDirectory()) {
            copyFolderRecursiveSync(curSource, curTarget, allowedExtensions);
        } else {
            const ext = path.extname(file).toLowerCase();
            if (allowedExtensions.length === 0 || allowedExtensions.includes(ext)) {
                fs.copyFileSync(curSource, curTarget);
            }
        }
    });
}

export function getCustomModules(): string[] {
    if (!fs.existsSync(EXPORT_ROOT)) return [];

    return fs.readdirSync(EXPORT_ROOT).filter(f => {
        const fullPath = path.join(EXPORT_ROOT, f);
        return fs.statSync(fullPath).isDirectory() &&
            !MARKETPLACE_MODULES.includes(f) &&
            f !== "Styling";
    });
}

export function safeReadJson(filePath: string): any {
    if (!fs.existsSync(filePath)) return null;
    try {
        return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    } catch {
        return null;
    }
}
