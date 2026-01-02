
import { MendixPlatformClient } from "mendixplatformsdk";
import {
    mapEntity, mapMicroflow, mapPage, mapModuleSecurity, mapAssociation,
    mapEnumeration, mapConstant, mapNavigation, mapIntegrations, mapNanoflow, mapProjectSecurity
} from "./mappers.js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { PROJECT_ID, EXPORT_ROOT } from "./constants.js";
import { ensureDir } from "./utils.js";

dotenv.config();

const MENDIX_TOKEN = process.env.MENDIX_TOKEN;
const MENDIX_USERNAME = process.env.MENDIX_USERNAME;

async function main() {
    if (!MENDIX_TOKEN || !MENDIX_USERNAME) {
        console.error("Missing credentials in .env");
        return;
    }

    try {
        if (fs.existsSync(EXPORT_ROOT)) {
            console.log(`Cleaning up existing directory: ${EXPORT_ROOT}`);
            fs.rmSync(EXPORT_ROOT, { recursive: true, force: true });
        }
        ensureDir(EXPORT_ROOT);

        const client = new MendixPlatformClient();
        console.log(`Connecting to project ${PROJECT_ID}...`);
        const app = client.getApp(PROJECT_ID);
        const workingCopy = await app.createTemporaryWorkingCopy("main");
        const model = await workingCopy.openModel();

        const allModules = model.allModules();
        console.log(`Found ${allModules.length} modules. Starting full context export...`);

        for (const module of allModules) {
            const moduleName = module.name;
            process.stdout.write(`Exporting ${moduleName}... `);

            try {
                const moduleDir = path.join(EXPORT_ROOT, moduleName);
                ensureDir(moduleDir);

                // Domain Model
                const dmInt = model.allDomainModels().find(dm => dm.containerAsModule.name === moduleName);
                if (dmInt) {
                    const dm = await dmInt.load();
                    fs.writeFileSync(path.join(moduleDir, "DomainModel.json"), JSON.stringify({
                        entities: dm.entities.map(mapEntity),
                        associations: dm.associations.map(mapAssociation)
                    }, null, 2));
                }

                // Logic & UI (Parallel loads per module)
                const [mfs, nfs, pgs, enms, cnsts] = await Promise.all([
                    Promise.all(model.allMicroflows().filter(mf => mf.qualifiedName?.startsWith(`${moduleName}.`)).map(mf => mf.load())),
                    Promise.all(model.allNanoflows().filter(nf => nf.qualifiedName?.startsWith(`${moduleName}.`)).map(nf => nf.load())),
                    Promise.all(model.allPages().filter(p => p.qualifiedName?.startsWith(`${moduleName}.`)).map(p => p.load())),
                    Promise.all(model.allEnumerations().filter(e => e.qualifiedName?.startsWith(`${moduleName}.`)).map(e => e.load())),
                    Promise.all(model.allConstants().filter(c => c.qualifiedName?.startsWith(`${moduleName}.`)).map(c => c.load()))
                ]);

                fs.writeFileSync(path.join(moduleDir, "Microflows.json"), JSON.stringify(mfs.map(mapMicroflow), null, 2));
                fs.writeFileSync(path.join(moduleDir, "Nanoflows.json"), JSON.stringify(nfs.map(mapNanoflow), null, 2));
                fs.writeFileSync(path.join(moduleDir, "Pages.json"), JSON.stringify(pgs.map(mapPage), null, 2));
                fs.writeFileSync(path.join(moduleDir, "Enumerations.json"), JSON.stringify(enms.map(mapEnumeration), null, 2));
                fs.writeFileSync(path.join(moduleDir, "Constants.json"), JSON.stringify(cnsts.map(mapConstant), null, 2));

                const seq = model.allModuleSecurities().find(s => s.containerAsModule.name === moduleName);
                if (seq) fs.writeFileSync(path.join(moduleDir, "Security.json"), JSON.stringify(mapModuleSecurity(await seq.load()), null, 2));

                console.log("✅");
            } catch (modError: any) {
                console.log(`❌ (${modError.message})`);
            }
        }

        // Project Metadata
        console.log("Exporting project-level metadata...");
        const [nav, projSec] = await Promise.all([
            model.allNavigationDocuments()[0]?.load(),
            model.allProjectSecurities()[0]?.load()
        ]);

        if (nav) fs.writeFileSync(path.join(EXPORT_ROOT, "Navigation.json"), JSON.stringify(mapNavigation(nav), null, 2));
        if (projSec) fs.writeFileSync(path.join(EXPORT_ROOT, "ProjectSecurity.json"), JSON.stringify(mapProjectSecurity(projSec), null, 2));

        const ints = mapIntegrations(
            await Promise.all(model.allConsumedRestServices().map(s => s.load())),
            await Promise.all(model.allPublishedRestServices().map(s => s.load())),
            await Promise.all(model.allScheduledEvents().map(e => e.load()))
        );
        fs.writeFileSync(path.join(EXPORT_ROOT, "Integrations.json"), JSON.stringify(ints, null, 2));

        console.log("\nBulk Export Complete!");

        // Finalize Pipeline
        const { execSync } = await import("child_process");
        console.log("\nFinalizing Context (Styling & Docs)...");
        execSync("node dist/export_styling.js", { stdio: "inherit" });
        execSync("node dist/generate_documentation.js", { stdio: "inherit" });
        console.log("\n✅ Optimization Phase Complete.");

    } catch (error: any) {
        console.error("SDK Error:", error);
    }
}

main();
