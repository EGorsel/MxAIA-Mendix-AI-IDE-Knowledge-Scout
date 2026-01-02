
import fs from "fs";
import path from "path";
import { SOURCE_THEME_DIR, STYLING_EXPORT_DIR } from "./constants.js";
import { copyFolderRecursiveSync, ensureDir } from "./utils.js";

function extractDesignTokens(varsPath: string): any {
    if (!fs.existsSync(varsPath)) return {};

    const content = fs.readFileSync(varsPath, "utf-8");
    const tokens: any = {
        brandColors: {},
        typography: {},
        spacing: {}
    };

    // Simple regex parser for SCSS variables
    const matches = content.matchAll(/^\s*\$([\w-]+):\s*([^;]+);/gm);
    for (const match of matches) {
        const name = match[1];
        const value = match[2].trim();

        if (name.startsWith("brand-") || name.startsWith("gray-")) {
            tokens.brandColors[name] = value;
        } else if (name.startsWith("font-")) {
            tokens.typography[name] = value;
        } else if (name.startsWith("spacing-")) {
            tokens.spacing[name] = value;
        }
    }

    return tokens;
}

function parseActiveImports(mainPath: string): string[] {
    if (!fs.existsSync(mainPath)) return [];

    const content = fs.readFileSync(mainPath, "utf-8");
    const imports: string[] = [];

    // Regex for: @import "path"; or @import 'path';
    const matches = content.matchAll(/@import\s+["']([^"']+)["']/g);
    for (const match of matches) {
        imports.push(match[1]);
    }

    return imports;
}

async function main() {
    console.log("Exporting styling assets...");

    if (!fs.existsSync(SOURCE_THEME_DIR)) {
        console.error(`Source theme directory not found: ${SOURCE_THEME_DIR}`);
        return;
    }

    try {
        if (fs.existsSync(STYLING_EXPORT_DIR)) {
            fs.rmSync(STYLING_EXPORT_DIR, { recursive: true, force: true });
        }

        ensureDir(STYLING_EXPORT_DIR);
        copyFolderRecursiveSync(SOURCE_THEME_DIR, STYLING_EXPORT_DIR, [".scss", ".css", ".json", ".html"]);
        console.log(`✅ Styling assets copied to ${STYLING_EXPORT_DIR}`);

        // Extract and save design tokens
        const varsPath = path.join(SOURCE_THEME_DIR, "custom-variables.scss");
        const tokens = extractDesignTokens(varsPath);
        fs.writeFileSync(path.join(STYLING_EXPORT_DIR, "DesignTokens.json"), JSON.stringify(tokens, null, 2));
        console.log("✅ DesignTokens.json generated.");

        // Parse active imports from main.scss
        const mainPath = path.join(SOURCE_THEME_DIR, "main.scss");
        const activeImports = parseActiveImports(mainPath);
        fs.writeFileSync(path.join(STYLING_EXPORT_DIR, "ActiveStyles.json"), JSON.stringify({ entryPoint: "main.scss", imports: activeImports }, null, 2));
        console.log(`✅ ActiveStyles.json generated (Found ${activeImports.length} imports).`);

    } catch (error: any) {
        console.error(`❌ Styling export failed: ${error.message}`);
    }
}

main();
