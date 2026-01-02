
import { MendixPlatformClient } from "mendixplatformsdk";
import dotenv from "dotenv";

dotenv.config();

const PROJECT_ID = "b53eb465-09b0-4ad0-bf1a-b8c3d84c8689";

async function main() {
    const client = new MendixPlatformClient();
    const app = client.getApp(PROJECT_ID);
    const workingCopy = await app.createTemporaryWorkingCopy("main");
    const model = await workingCopy.openModel();

    const page = model.allPages().find(p => p.name === "Questionnaire_NewEdit");
    if (!page) {
        console.log("Page not found");
        return;
    }

    console.log(`Loading page ${page.name}...`);
    const loadedPage = await page.load();

    console.log("Structure Type:", (loadedPage as any).structureTypeName);

    // Check all properties
    const keys = Object.keys(loadedPage);
    console.log("Keys:", keys.filter(k => !k.startsWith('_')));

    // Try a manual traverse
    let count = 0;
    loadedPage.traverse(node => {
        count++;
        if (count < 20) {
            console.log(`Node ${count}:`, (node as any).structureTypeName);
        }
    });
    console.log(`Total nodes: ${count}`);

    // Check if allWidgets exists
    console.log("has allWidgets:", typeof (loadedPage as any).allWidgets);
}

main().catch(console.error);
