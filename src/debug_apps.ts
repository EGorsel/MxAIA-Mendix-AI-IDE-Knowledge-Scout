import { MendixPlatformClient } from "mendixplatformsdk";
import dotenv from "dotenv";
import path from "path";
// Load .env
dotenv.config({ path: path.join(__dirname, "../.env") });

async function main() {
    if (!process.env.MENDIX_TOKEN || !process.env.MENDIX_USERNAME) {
        console.error("Missing credentials in .env");
        return;
    }

    console.log("Authenticating with Mendix Platform...");
    const client = new MendixPlatformClient();

    try {
        console.log("Fetching accessible apps...");
        // const apps = await client.listApps();
        console.log("Debug script disabled.");
        const apps: any[] = [];

        console.log(`\nFound ${apps.length} accessible apps:`);
        console.log("---------------------------------------------------");
        for (const app of apps) {
            console.log(`Name: ${app.name}`);
            console.log(`ID:   ${app.id}`);
            console.log(`Url:  ${app.url}`);
            console.log("---------------------------------------------------");
        }

    } catch (e: any) {
        console.error("Error listing apps:", e.message);
        if (e.message.includes("401")) {
            console.error("Hint: Check if your MENDIX_TOKEN is valid and not expired.");
        }
        if (e.message.includes("403")) {
            console.error("Hint: Your token might lack 'mx:app:metadata:read' scope.");
        }
    }
}

main();
