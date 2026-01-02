import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Use process.cwd() as the anchor for both Node and PKG execution
// We assume the tool is run from the 'mendix-cloud-mcp' directory
const TOOL_ROOT = process.cwd();

// Load .env from the current tool directory
dotenv.config({ path: path.join(TOOL_ROOT, ".env") });

export const PROJECT_ID = process.env.MENDIX_PROJECT_ID || "";
if (!PROJECT_ID) {
    console.error("WARNING: MENDIX_PROJECT_ID is not set in .env");
}

// The Mendix Project Root is one level up from this tool folder
export const PROJECT_ROOT_PATH = path.resolve(TOOL_ROOT, "../");
export const EXPORT_ROOT = path.join(TOOL_ROOT, "export");

export const SOURCE_THEME_DIR = path.join(PROJECT_ROOT_PATH, "theme/web");
export const STYLING_EXPORT_DIR = path.join(EXPORT_ROOT, "Styling");

export const MARKETPLACE_MODULES = [
    "Atlas_Core", "Atlas_Web_Content", "CommunityCommons", "DataWidgets",
    "ExcelImporter", "MSAL", "MxModelReflection", "NanoflowCommons",
    "XLSReport", "WebServices", "Atlas_NativeMobile_Content", "Encryption",
    "SSO", "GoogleAuthenticator", "Atlas_DesignSystem", "NativeMobileResources",
    "WebPowerMailing", "FeedbackModule", "Styling", "Styling_Extended",
    "UserlibConflictChecker", "Atlas_UI_Resources"
];
