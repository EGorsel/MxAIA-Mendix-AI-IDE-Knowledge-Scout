
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
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

const client = new MendixPlatformClient();

// Create MCP Server
const server = new Server(
    { name: "mendix-cloud-mcp", version: "1.2.0" },
    { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
        {
            name: "export_module_context",
            description: "Export full metadata for a specific Mendix module to local JSON context.",
            inputSchema: {
                type: "object",
                properties: { moduleName: { type: "string", description: "Name of the module to export" } },
                required: ["moduleName"]
            }
        },
        {
            name: "export_project_metadata",
            description: "Export project-level metadata (Navigation, Security, Integrations).",
            inputSchema: { type: "object", properties: {} }
        }
    ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
        const app = client.getApp(PROJECT_ID);
        const workingCopy = await app.createTemporaryWorkingCopy("main");
        const model = await workingCopy.openModel();

        if (request.params.name === "export_module_context") {
            const { moduleName } = request.params.arguments as { moduleName: string };
            const moduleDir = path.join(EXPORT_ROOT, moduleName);
            ensureDir(moduleDir);

            // Export logic (same as in run_enhanced_bulk but scoped)
            const dmInt = model.allDomainModels().find(dm => dm.containerAsModule.name === moduleName);
            if (dmInt) {
                const dm = await dmInt.load();
                fs.writeFileSync(path.join(moduleDir, "DomainModel.json"), JSON.stringify({
                    entities: dm.entities.map(mapEntity),
                    associations: dm.associations.map(mapAssociation)
                }, null, 2));
            }

            const [mfs, pgs] = await Promise.all([
                Promise.all(model.allMicroflows().filter(mf => mf.qualifiedName?.startsWith(`${moduleName}.`)).map(mf => mf.load())),
                Promise.all(model.allPages().filter(p => p.qualifiedName?.startsWith(`${moduleName}.`)).map(p => p.load()))
            ]);

            fs.writeFileSync(path.join(moduleDir, "Microflows.json"), JSON.stringify(mfs.map(mapMicroflow), null, 2));
            fs.writeFileSync(path.join(moduleDir, "Pages.json"), JSON.stringify(pgs.map(mapPage), null, 2));

            return { content: [{ type: "text", text: `✅ Exported ${moduleName} context to ${moduleDir}` }] };
        }

        if (request.params.name === "export_project_metadata") {
            const [nav, projSec] = await Promise.all([
                model.allNavigationDocuments()[0]?.load(),
                model.allProjectSecurities()[0]?.load()
            ]);

            if (nav) fs.writeFileSync(path.join(EXPORT_ROOT, "Navigation.json"), JSON.stringify(mapNavigation(nav), null, 2));
            if (projSec) fs.writeFileSync(path.join(EXPORT_ROOT, "ProjectSecurity.json"), JSON.stringify(mapProjectSecurity(projSec), null, 2));

            return { content: [{ type: "text", text: `✅ Project metadata exported successfully.` }] };
        }

        throw new Error(`Unknown tool: ${request.params.name}`);
    } catch (error: any) {
        return { content: [{ type: "text", text: `❌ Error: ${error.message}` }], isError: true };
    }
});

async function run() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Mendix Cloud MCP Server running on stdio");
}

run().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
