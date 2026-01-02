import { microflows, datatypes, domainmodels } from "mendixmodelsdk";

export class PseudoCodeEngine {
    generate(mf: microflows.Microflow): string {
        const lines: string[] = [];

        // Header
        const params = mf.objectCollection.objects
            .filter(o => o instanceof microflows.MicroflowParameterObject)
            .map(o => (o as microflows.MicroflowParameterObject).name)
            .join(", ");

        lines.push(`def ${mf.name}(${params}):`);
        lines.push(`    """`);
        const docText = mf.documentation ? mf.documentation : this.generateAutoDocumentation(mf);
        lines.push(`    ${docText}`);
        lines.push(`    """`);

        // Build Adjacency Map (ID-based)
        const adjacencyMap: Record<string, microflows.SequenceFlow[]> = {};

        // Initialize map for all nodes to ensure safe lookup
        mf.objectCollection.objects.forEach(obj => {
            if (obj instanceof microflows.MicroflowObject) {
                adjacencyMap[obj.id] = [];
            }
        });

        // Populate map with flows
        // SequenceFlows are stored in 'flows', not 'objectCollection'
        const allFlows = mf.flows;
        for (const flow of allFlows) {
            if (flow instanceof microflows.SequenceFlow && flow.origin) {
                const originId = flow.origin.id;
                if (!adjacencyMap[originId]) {
                    adjacencyMap[originId] = [];
                }
                adjacencyMap[originId].push(flow);
            }
        }

        // Find Start Event
        const start = mf.objectCollection.objects.find(o => o instanceof microflows.StartEvent);
        if (!start) return lines.join("\n") + "\n    # No Start Event found";

        const visited = new Set<string>();

        this.tracePath(start, 1, lines, visited, adjacencyMap);

        return lines.join("\n");
    }

    private tracePath(
        node: microflows.MicroflowObject,
        indent: number,
        lines: string[],
        visited: Set<string>,
        adjacencyMap: Record<string, microflows.SequenceFlow[]>
    ) {
        if (!node) return;
        const indentStr = "    ".repeat(indent);

        // Render the node instructions
        if (node instanceof microflows.StartEvent) {
            // Start implementation
        } else if (node instanceof microflows.EndEvent) {
            const val = (node as any).returnValue;
            lines.push(`${indentStr}return ${val || ""}`);
            return;
        } else if (node instanceof microflows.ActionActivity) {
            lines.push(`${indentStr}${this.getActionDescription(node.action)}`);
        } else if (node instanceof microflows.ExclusiveSplit) {
            lines.push(`${indentStr}# Decision: ${(node as any).caption || "Split"}`);
        } else if (node instanceof microflows.LoopedActivity) {
            lines.push(`${indentStr}foreach $Item in Collection:`);
            this.traceLoop(node, indent + 1, lines);
            return;
        }

        if (visited.has(node.id)) {
            const caption = (node as any).caption || "previous step";
            lines.push(`${indentStr}# (Merge/Loop back to ${caption})`);
            return;
        }
        visited.add(node.id);

        // Get Outgoing Flows from Map
        const flows = adjacencyMap[node.id] || [];

        if (flows.length === 0) return;

        if (flows.length === 1) {
            const flow = flows[0];
            if (flow.destination instanceof microflows.MicroflowObject) {
                this.tracePath(flow.destination, indent, lines, visited, adjacencyMap);
            }
        } else {
            for (const flow of flows) {
                // Handle new SDK 'caseValues' array for splits (Mendix 10+)
                let valStr = "else";
                if (flow.caseValues && flow.caseValues.length > 0) {
                    valStr = flow.caseValues.map(cv => (cv as any).value || "val").join(" OR ");
                } else if ((flow as any).caseValue) {
                    // Fallback for older models/SDKs if typed loosely
                    valStr = (flow as any).caseValue.value || "else";
                }

                lines.push(`${indentStr}if (${valStr}):`);
                if (flow.destination instanceof microflows.MicroflowObject) {
                    this.tracePath(flow.destination, indent + 1, lines, new Set(visited), adjacencyMap);
                }
            }
        }
    }

    private traceLoop(loop: microflows.LoopedActivity, indent: number, lines: string[]) {
        loop.objectCollection.objects.forEach(o => {
            if (o instanceof microflows.ActionActivity) {
                lines.push(`${"    ".repeat(indent)}${this.getActionDescription(o.action)}`);
            }
        });
    }

    private getActionDescription(action: microflows.MicroflowAction | null): string {
        if (!action) return "Unknown Action";

        if (action instanceof microflows.CreateObjectAction) {
            return `$NewVar = Create(${action.entityQualifiedName})`;
        } else if (action instanceof microflows.RetrieveAction) {
            const src = action.retrieveSource;
            let sourceStr = "Unknown";
            if (src instanceof microflows.DatabaseRetrieveSource) sourceStr = src.entityQualifiedName || "Unknown";
            if (src instanceof microflows.AssociationRetrieveSource) sourceStr = src.associationQualifiedName || "Unknown";
            return `$List = Retrieve(${sourceStr})`;
        } else if (action instanceof microflows.ChangeObjectAction) {
            const changes = action.items.map(i => {
                const attrName = (i.attribute as any)?.name || "Attr";
                const expr = (i.value as any)?.expression || "Value";
                return `${attrName} = ${expr}`;
            }).join(", ");
            return `Change(${action.changeVariableName}, {${changes}})`;
        } else if (action instanceof microflows.MicroflowCallAction) {
            return `Call ${action.microflowCall?.microflowQualifiedName}()`;
        } else if (action instanceof microflows.ShowMessageAction) {
            return `ShowMessage("${(action.template as any)?.text || "Msg"}")`;
        }

        const typeName = (action as any).structureTypeName.split('$').pop().replace('Action', '');
        return `${typeName}()`;
    }

    private generateAutoDocumentation(mf: microflows.Microflow): string {
        const objs = mf.objectCollection.objects;

        // Statistics
        const splits = objs.filter(o => o instanceof microflows.ExclusiveSplit).length;
        const loops = objs.filter(o => o instanceof microflows.LoopedActivity).length;

        // Data Impact
        const creates = objs.filter(o => o instanceof microflows.ActionActivity && o.action instanceof microflows.CreateObjectAction).length;
        const retrieves = objs.filter(o => o instanceof microflows.ActionActivity && o.action instanceof microflows.RetrieveAction).length;
        const commits = objs.filter(o => {
            if (o instanceof microflows.ActionActivity) {
                if (o.action instanceof microflows.ChangeObjectAction) return o.action.commit === microflows.CommitEnum.Yes;
                if (o.action instanceof microflows.CreateObjectAction) return o.action.commit === microflows.CommitEnum.Yes;
                if (o.action instanceof microflows.CommitAction) return true;
            }
            return false;
        }).length;

        const returnType = mf.microflowReturnType || "Void";

        return `Auto-Summary:
    - Logic Depth: ${splits} decisions, ${loops} loops.
    - Data Impact: ${creates} creates, ${retrieves} retrieves, ${commits} commits.
    - Return Type: ${returnType}`;
    }
}
