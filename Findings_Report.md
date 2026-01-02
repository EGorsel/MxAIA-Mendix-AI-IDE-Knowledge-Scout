# Findings Report: Standalone Executable for MxAIA

## 1. Executive Summary
After analyzing the architecture of both **MxAIA** (Node.js/TypeScript) and the reference **Mendix Userlib Cleanup** (Python), it is **Highly Feasible** and **Strongly Recommended** to compile MxAIA into a standalone executable (`.exe`).

While MxAIA uses a different technology stack (Node.js vs. Python), modern bundling tools like **pkg** allow us to achieve the same "Drop & Run" experience that made the Userlib Cleanup tool successful.

## 2. Comparative Analysis

| Feature | Userlib Cleanup (Reference) | MxAIA (Current) | MxAIA (Proposed .exe) |
| :--- | :--- | :--- | :--- |
| **Language** | Python | Node.js / TypeScript | Node.js (Bundled) |
| **Distribution** | Single `.exe` file | Source Code / NPM | Single `.exe` file |
| **Dependencies** | None (Bundled Python runtime) | Requires Node.js & `npm install` | None (Bundled Node runtime) |
| **File Size** | ~10-15 MB | ~50 MB (node_modules) | ~60-80 MB |
| **Updates** | Download new `.exe` | `git pull` && `npm install` | Download new `.exe` |
| **User Experience** | Instant (Double Click / CMD) | High Friction (Install Node, Dependencies) | Instant (Double Click / CMD) |

### Key Findings from Reference Repository
The *Mendix Userlib Cleanup* succeed because it removed the "Environment Setup" barrier. Mendix developers are often not Node.js experts. Asking them to manage `npm` versions, `package.json` conflicts, or proxy settings for npm is a significant friction point.
The reference repo uses a build script (`local_build.bat`) to compile the Python source. We can replicate this automation.

## 3. Technical Feasibility (Node.js)

### The Tooling: `pkg`
We can use [pkg](https://github.com/vercel/pkg) to package the Node.js project into an executable.
*   **How it works**: It packages the Node.js binary (V8 engine) *and* your javascript source code (and `node_modules`) into a single file.
*   **FileSystem Access**: Standard `fs` calls work normally. We must ensure we use `process.cwd()` (where the user runs the exe) instead of `__dirname` (inside the virtual exe filesystem) for reading/writing the `export/` folder.
*   **Configuration**: The Mendix Model SDK is a standard library and compiles well.

### Challenges & Mitigations
1.  **File Size**: The exe will be larger (~60MB+) because it includes the entire Chrome V8 engine.
    *   *Mitigation*: This is acceptable for a developer tool in 2026.
2.  **Anti-Virus Flags**: Unsigned `.exe` files from `pkg` are often flagged by Windows Defender.
    *   *Mitigation*: We can sign the executable or provide a hash checksum. The Userlib Cleanup tool faced this too (referenced in its "Security & Trust" section).

## 4. Desirability & Strategic Fit
Transitioning to an `.exe` aligns perfectly with the **GTM Strategy** developed earlier:
1.  **Audience Fit**: Target audience is "High-Code Mendix Developers". They have Mendix Studio Pro installed, but maybe not Node.js 20+.
2.  **Reduction of Support**: "it doesn't work on my machine" tickets related to npm versioning disappear.
3.  **Portability**: Consultants can carry the tool on a USB drive to client sites where installing Node.js is blocked by IT policies.

## 5. Future Steps (Implementation Plan)

### Phase 1: Prototype (Immediate)
1.  Install `pkg`: `npm install -g pkg`
2.  Add a `bin` entry to `package.json`.
3.  Run `pkg . --target node18-win-x64 --output dist/mxaia.exe`.
4.  Test the `.exe` effectively reads `.env` from the real disk.

### Phase 2: Automation (CI/CD)
1.  Create a GitHub Action to build the `.exe` on every release.
2.  Upload the `.exe` to GitHub Releases (just like Userlib Cleanup).

### Phase 3: Developer Experience
Rename the entry point command to simply:
```cmd
mxaia.exe
```
This runs the bulk export by default.

## 6. Conclusion
**Proceed with creating the Executable.** It transforms MxAIA from a "script repo" into a "product".
