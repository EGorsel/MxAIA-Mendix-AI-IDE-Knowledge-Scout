# MxAIA: Mendix AI IDE Knowledge Scout (Deep Context 6.0)

![Mendix Support](https://img.shields.io/badge/Mendix-10.24%2B-blue.svg)
![MCP](https://img.shields.io/badge/protocol-MCP-purple.svg)
![TypeScript](https://img.shields.io/badge/language-TypeScript-green.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

**The ultimate AI Knowledge Gatherer for Mendix, designed to bridge the gap between Low-Code models and AI Reasoning.**

**MxAIA** transforms the Mendix Platform SDK into a high-fidelity intelligence layer. It doesn't just export metadata; it synthesizes **Developer Handbooks** that narrate the inner workings of your application, citing exact Microflow and Page names for seamless reasoning in AI-powered IDEs (Cursor, Claude Desktop, Antigravity).

---

## 🚀 Key Features (Deep Context 6.0)

*   **Developer Handbook Synthesis**: Rewrites raw metadata into narrative "Process Analysis" reports for every custom module.
*   **Narrative Workflows**: Identifies core "Process Hub" entities and maps logic into functional phases (Initiation, Management, Validation, Evaluation).
*   **Styling & Design System**: Extracts Design Tokens (SCSS variables) and maps the active `@import` hierarchy from `main.scss`.
*   **Industrial-Grade Robustness**: Robust null-safety and support for modern SDK properties (e.g., `microflowReturnType`), tested against Mendix 10.24.0.
*   **High-Speed Parallel Export**: Leverages parallel processing to export module context and generate documentation simultaneously.

---

## 🛠️ Installation & Portability

The **Mendix Cloud MCP Server** is designed to be highly portable. Developers can simply download this folder and paste it into the root of any Mendix project.

### Setup (Paste to Root Workflow)
1.  **Download & Paste**: Copy the `mendix-cloud-mcp` folder into your Mendix project's root directory.
    ```text
    MyProject/
    ├── theme/
    ├── javasource/
    ├── mendix-cloud-mcp/  <-- Paste folder here
    └── ...
    ```

2.  **Install Dependencies**:
    Navigate to the folder and install the required modules:
    ```bash
    cd mendix-cloud-mcp
    npm install
    ```

3.  **Configure `.env`**:
    Create a `.env` file inside the `mendix-cloud-mcp` folder with your credentials and the **target Project ID**:
    ```env
    MENDIX_TOKEN=your_pat_here
    MENDIX_USERNAME=your_email@domain.com
    MENDIX_PROJECT_ID=your_mendix_app_id_uuid
    ```

4.  **Build & Run**:
    ```bash
    npm run build
    node dist/run_enhanced_bulk.js
    ```

---

## 📖 Usage

### Automated Bulk Export & Documentation
Run the high-speed pipeline to generate a full local context directory:
```bash
node dist/run_enhanced_bulk.js
```
This will:
1.  Cleanly export all 33+ modules to JSON.
2.  Capture all SCSS styling assets and Design Tokens.
3.  Synthesize a **Discovery_Report.md** and individual **Report.md** handbooks for each custom module.

### MCP Tooling
Connect to Claude/Cursor using `dist/server.js`. The server exposes:
*   `export_module_context`: Export specific module metadata on-demand.
*   `export_project_metadata`: Capture Navigation, Security, and Integration global states.

---

## 📂 Project Structure

```text
mendix-cloud-mcp/
├── src/
│   ├── server.ts         # MCP Server & Tooling
│   ├── mappers.ts        # Robust SDK -> DTO Mapping
│   ├── constants.ts      # Centralized Configuration
│   ├── utils.ts          # Shared FS & Data Helpers
│   ├── export_styling.ts # Styling & Token Extraction
│   └── generate_documentation.ts # Handbook Synthesis Engine
└── dist/                 # Optimized Build Output
```

## 📜 License
MIT
