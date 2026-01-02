
import { MendixPlatformClient } from "mendixplatformsdk";
import { pages } from "mendixmodelsdk";
import dotenv from "dotenv";

dotenv.config();

async function debug() {
    const client = new MendixPlatformClient();
    const app = client.getApp("b53eb465-09b0-4ad0-bf1a-b8c3d84c8689");
    const wc = await app.createTemporaryWorkingCopy("main");
    const model = await wc.openModel();

    const page = await model.allPages().find(p => p.qualifiedName === "QuestionnaireTender.TenderPhaseContent_NewEdit_Dashboard_Test")?.load();
    if (!page) return;

    page.traverse(node => {
        if (node instanceof pages.ListView || node instanceof pages.DataView) {
            const ds = (node as any).dataSource;
            if (ds) {
                console.log(`Widget ${node.structureTypeName} DS: ${ds.structureTypeName}`);
                console.log("Keys:", Object.keys(ds));
                if (ds.structureTypeName.includes("MicroflowSource")) {
                    console.log("MF:", (ds as any).microflowQualifiedName, (ds as any).microflow?.qualifiedName);
                }
                if (ds.structureTypeName.includes("AssociationSource")) {
                    console.log("Assoc:", (ds as any).associationQualifiedName, (ds as any).association?.qualifiedName);
                }
            }
        }
    });
}
debug();
