import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Load .env from the current tool directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

export const PROJECT_ID = process.env.MENDIX_PROJECT_ID || "";
if (!PROJECT_ID) {
    console.error("WARNING: MENDIX_PROJECT_ID is not set in .env");
}

// Assume this folder (mendix-cloud-mcp) is in the project root
export const PROJECT_ROOT_PATH = path.resolve(__dirname, "../../");
export const EXPORT_ROOT = path.join(PROJECT_ROOT_PATH, "mendix-cloud-mcp/export");

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
