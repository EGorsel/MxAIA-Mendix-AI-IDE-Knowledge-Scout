
import fs from "fs";
import path from "path";
import { EXPORT_ROOT, MARKETPLACE_MODULES, STYLING_EXPORT_DIR } from "./constants.js";
import { getCustomModules, safeReadJson } from "./utils.js";

interface Entity {
    name: string;
    documentation: string;
    attributes: any[];
    validationRules: any[];
    eventHandlers: any[];
    accessRules: any[];
}

interface Microflow {
    name: string;
    documentation: string;
    activities: string[];
}

function generateModuleReport(moduleName: string, modulePath: string): string {
    const dm = safeReadJson(path.join(modulePath, "DomainModel.json"));
    const mfs: Microflow[] = safeReadJson(path.join(modulePath, "Microflows.json")) || [];
    const nfs: any[] = safeReadJson(path.join(modulePath, "Nanoflows.json")) || [];
    const pages: any[] = safeReadJson(path.join(modulePath, "Pages.json")) || [];

    const entities: Entity[] = dm?.entities || [];
    const associations: any[] = dm?.associations || [];

    // --- CHAPTER 1: FUNCTIONAL PURPOSE ---
    let report = `# ${moduleName}: Developer Handbook\n\n`;

    let purpose = `The **${moduleName}** module serves as a functional component within the PinkPro application. `;
    if (entities.some(e => e.name.includes("Tender"))) purpose += `Its primary focus is on managing Tender-related processes, likely including creation, content definition, and evaluation. `;
    if (moduleName.includes("Portal") || moduleName.includes("Connector")) purpose += `It acts as an integration layer, facilitating communication between the Mendix core and external portal services. `;
    if (mfs.some(m => m.name.includes("Sync"))) purpose += `The module includes significant data synchronization logic. `;

    report += `## 1. Functional Purpose\n${purpose}\n\n`;

    // --- CHAPTER 2: DATA ARCHITECTURE ---
    report += `## 2. Core Data Structure\n`;
    const hubEntity = entities.find(e => e.name.toLowerCase().includes(moduleName.toLowerCase())) ||
        entities.sort((a, b) => (b.attributes.length) - (a.attributes.length))[0];

    if (hubEntity) {
        report += `The architecture is centered around **${hubEntity.name}**. This entity holds the primary state and business attributes for the module's core process.\n\n`;
    }

    report += `### Essential Entities:\n`;
    entities.forEach(ent => {
        let note = "";
        if (ent.name.includes("Helper")) note = "(Non-persistent UI Helper)";
        if (ent.name.includes("StamData")) note = "(Master Data Configuration)";
        if (ent.accessRules.length > 0) note += ` [Secured for ${ent.accessRules.length} roles]`;

        report += `*   **${ent.name}**: ${ent.documentation || "Manages " + ent.name + " data."} ${note}\n`;
    });
    report += `\n`;

    // --- CHAPTER 3: OPERATIONAL WORKFLOW ---
    report += `## 3. Operational Workflow (Inner Workings)\n`;

    const triggers = mfs.filter(m => m.name.startsWith("ACT_"));
    report += `### Step I: Initialization & Entry\n`;
    if (triggers.length > 0) {
        report += `The process is typically initiated by the user through the following actions:\n`;
        triggers.slice(0, 8).forEach(t => {
            report += `*   \`${t.name}\`: Triggers the initialization of the primary record.\n`;
        });
    }

    const processes = mfs.filter(m => m.name.startsWith("SUB_") || m.name.startsWith("OCh_"));
    if (processes.length > 0) {
        report += `\n### Step II: Business Logic & Processing\n`;
        report += `Once initiated, the following internal sub-processes handle the core business rules:\n`;
        processes.slice(0, 10).forEach(p => {
            report += `*   \`${p.name}\`: Performs ${p.name.includes("Copy") ? "data synchronization" : "internal logic"} for ${p.name.split('_')[1] || "related records"}.\n`;
        });
    }

    if (pages.length > 0) {
        report += `\n### Step III: User Interaction (Pages)\n`;
        report += `The following screens provide the interface for managing this module's data:\n`;
        pages.slice(0, 8).forEach(pg => {
            report += `*   \`${pg.name}\`: ${pg.name.includes("Dashboard") ? "Monitoring and oversight" : "Data entry and management"} screen.\n`;
        });
    }

    const validations = mfs.filter(m => m.name.startsWith("VAL_"));
    if (validations.length > 0) {
        report += `\n### Step IV: Verification & Integrity\n`;
        report += `Integrity checks are strictly enforced via:\n`;
        validations.forEach(v => {
            report += `*   \`${v.name}\`: Validates state transitions or data completeness.\n`;
        });
    }

    // --- CHAPTER 4: TECHNICAL OBSERVATIONS ---
    report += `\n## 4. Technical Observations\n`;

    const externalLinks = pages.filter(p => p.name.includes("Select") || p.name.includes("Lookup"));
    if (externalLinks.length > 0) {
        report += `*   **Integration Points**: Uses specialized lookups like ${externalLinks.slice(0, 2).map(l => `\`${l.name}\``).join(", ")} to link with other business domains.\n`;
    }

    if (mfs.some(m => m.name.includes("Calculate"))) {
        report += `*   **Calculation Engine**: Module contains dedicated logic for complex metrics or progress tracking.\n`;
    }

    if (entities.some(e => e.accessRules.length > 0)) {
        report += `*   **Security Model**: Granular access rules are defined at the entity level, ensuring data privacy across user roles.\n`;
    }

    return report;
}

async function main() {
    if (!fs.existsSync(EXPORT_ROOT)) {
        console.error("Project export root not found");
        return;
    }

    const modules = getCustomModules();
    console.log(`Generating DEVELOPER HANDBOOKS for ${modules.length} custom modules (PARALLEL)...`);

    // Parallelize module report generation
    await Promise.all(modules.map(async (mod) => {
        const modPath = path.join(EXPORT_ROOT, mod);
        const report = generateModuleReport(mod, modPath);
        fs.writeFileSync(path.join(modPath, "Report.md"), report);
    }));

    // Master Report synthesis
    let masterReport = `# PinkPro Application: Developer Discovery Report\n\n`;
    masterReport += `## Executive Summary\n`;
    masterReport += `This report serves as a detailed technical guide for the **PinkPro** application, synthesized from the latest Mendix Model metadata.\n\n`;

    masterReport += `## Core Business Modules (Handbooks)\n`;
    modules.forEach(mod => {
        masterReport += `### [${mod}](file:///./${mod}/Report.md)\nTechnical handbook describing inner workings and citations.\n\n`;
    });

    const nav = safeReadJson(path.join(EXPORT_ROOT, "Navigation.json"));
    if (nav) {
        masterReport += `## Global Navigation Architecture\n`;
        nav.profiles.forEach((p: any) => {
            masterReport += `*   **${p.name} Profile**: Entry via \`${p.homePage}\`.\n`;
        });
    }

    if (fs.existsSync(STYLING_EXPORT_DIR)) {
        let stylingReport = `\n## Design System & Active Hierarchy\n`;
        const active = safeReadJson(path.join(STYLING_EXPORT_DIR, "ActiveStyles.json"));
        if (active) {
            stylingReport += `*   **Active Style Stack**: ${active.imports.slice(0, 10).join(", ")}...\n`;
        }
        masterReport += stylingReport;
    }

    fs.writeFileSync(path.join(EXPORT_ROOT, "Discovery_Report.md"), masterReport);
    console.log("Master report generated: Discovery_Report.md");
}

main();
