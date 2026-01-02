# MxAIA: Mendix AI IDE Knowledge Scout

![Mendix Support](https://img.shields.io/badge/Mendix-10.24%2B-blue.svg)
![MCP](https://img.shields.io/badge/protocol-MCP-purple.svg)
![TypeScript](https://img.shields.io/badge/language-TypeScript-green.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

**The "Rosetta Stone" for High-Code AI Agents working on Low-Code Platforms.**

**MxAIA** linearizes Mendix applications into strict, reasoned pseudo-code. It transforms purely visual models (Microflows, Pages) into a "Developer Handbook" that AI IDEs (Cursor, Copilot, Antigravity) can natively read, understand, and debug. Use this to enable "Chat with my Codebase" for Mendix.

---

## 🚀 Key Features (Deep Context 6.0)

*   **Developer Handbook Synthesis**: Rewrites raw metadata into narrative "Process Analysis" reports for every custom module.
*   **Narrative Workflows**: Identifies core "Process Hub" entities and maps logic into functional phases (Initiation, Management, Validation, Evaluation).
*   **Styling & Design System**: Extracts Design Tokens (SCSS variables) and maps the active `@import` hierarchy from `main.scss`.
*   **Industrial-Grade Robustness**: Robust null-safety and support for modern SDK properties (e.g., `microflowReturnType`), tested against Mendix 10.24.0.
*   **High-Speed Parallel Export**: Leverages parallel processing to export module context and generate documentation simultaneously.

---

### ⚡ Quick Start

#### Option A: Standalone Executable (Recommended)
*No NodeJS installation required.*

1.  **Download**: Grab the latest `mxaia.exe` from the [Releases](https://github.com/your-repo/releases) page.
2.  **Paste**: Place the `.exe` file into a folder in your Mendix project root (e.g., `_DevTools/`).
3.  **Configure**: Create a `.env` file next to the `.exe` with your credentials:
    ```env
    MENDIX_TOKEN=your_pat_here
    MENDIX_USERNAME=your_email@...
    MENDIX_PROJECT_ID=your_app_id
    ```
4.  **Run**: Double-click `mxaia.exe` or run it from CMD.
    ```cmd
    mxaia.exe
    ```
    🎉 **Done!** Check the `export/` folder for your readable Developer Handbook.

#### Option B: From Source (For Developers)

1.  **Install**:
    Clone this repo into your Mendix project root.
    ```bash
    npm install
    ```
2.  **Configure**: Create `.env`.
3.  **Run**:
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
├── examples/             # 📂 Sample Output (See what you get!)
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
