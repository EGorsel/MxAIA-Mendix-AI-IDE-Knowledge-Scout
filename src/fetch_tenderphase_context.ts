
import { MendixPlatformClient } from "mendixplatformsdk";
import { mapEntity, mapMicroflow, mapPage, mapModuleSecurity } from "./mappers.js";
import dotenv from "dotenv";

dotenv.config();

const MENDIX_TOKEN = process.env.MENDIX_TOKEN;
const MENDIX_USERNAME = process.env.MENDIX_USERNAME;
const PROJECT_ID = "b53eb465-09b0-4ad0-bf1a-b8c3d84c8689";
const MODULE_NAME = "TenderPhaseContent";

async function main() {
    process.env["MENDIX_TOKEN"] = MENDIX_TOKEN;
    process.env["MENDIX_USERNAME"] = MENDIX_USERNAME;

    try {
        const client = new MendixPlatformClient();
        console.log(`Connecting to PinkPro Project: ${PROJECT_ID}`);

        const app = client.getApp(PROJECT_ID);
        const workingCopy = await app.createTemporaryWorkingCopy("main");
        const model = await workingCopy.openModel();

        const domainModelInterface = model.allDomainModels().find(dm => dm.containerAsModule.name === MODULE_NAME);
        if (!domainModelInterface) {
            console.error(`Module '${MODULE_NAME}' not found.`);
            const availableModules = model.allDomainModels().map(dm => dm.containerAsModule.name).sort();
            console.log("Available Modules:", availableModules);
            return;
        }

        console.log(`Loading Implementation Context for ${MODULE_NAME}...`);

        // Data
        const domainModel = await domainModelInterface.load();
        const entities = domainModel.entities.map(mapEntity);

        // Logic
        const microflows = model.allMicroflows().filter(mf => mf.qualifiedName?.startsWith(`${MODULE_NAME}.`));
        const loadedMicroflows = await Promise.all(microflows.map(mf => mf.load()));
        const microflowDTOs = loadedMicroflows.map(mapMicroflow);

        // UI
        const pages = model.allPages().filter(p => p.qualifiedName?.startsWith(`${MODULE_NAME}.`));
        const loadedPages = await Promise.all(pages.map(p => p.load()));
        const pageDTOs = loadedPages.map(mapPage);

        // Security
        const security = model.allModuleSecurities().find(s => s.containerAsModule.name === MODULE_NAME);
        const securityDTO = security ? mapModuleSecurity(await security.load()) : undefined;

        console.log("--- CONTEXT START ---");
        console.log(JSON.stringify({
            module: MODULE_NAME,
            domainModel: entities,
            microflows: microflowDTOs,
            pages: pageDTOs,
            security: securityDTO
        }, null, 2));
        console.log("--- CONTEXT END ---");

    } catch (error: any) {
        console.error("SDK Error:", error);
    }
}

main();
