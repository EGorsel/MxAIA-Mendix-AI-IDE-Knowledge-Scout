import { microflows, domainmodels, datatypes } from "mendixmodelsdk";

export class MermaidEngine {

    generateDomainModel(dm: domainmodels.DomainModel): string {
        const lines: string[] = ["erDiagram"];

        // Entities
        dm.entities.forEach(entity => {
            const sanitizedName = this.sanitizeName(entity.name);
            lines.push(`    ${sanitizedName} {`);

            // Attributes
            entity.attributes.forEach(attr => {
                const typeName = (attr.type as any)?.structureTypeName?.split('$').pop() || "Type";
                lines.push(`        ${typeName.replace('AttributeType', '')} ${attr.name}`);
            });
            lines.push(`    }`);

            // Generalization
            const gen = entity.generalization;
            if (gen instanceof domainmodels.Generalization) {
                const parent = gen.generalizationQualifiedName;
                if (parent) {
                    const parentName = this.sanitizeName(parent.split('.').pop()!);
                    lines.push(`    ${sanitizedName} |o--|| ${parentName} : "inherits"`);
                }
            }
        });

        // Associations
        dm.associations.forEach(assoc => {
            const source = assoc.parent ? this.sanitizeName(assoc.parent.name) : "Unknown";
            const target = assoc.child ? this.sanitizeName(assoc.child.name) : "Unknown";
            const name = assoc.name;
            lines.push(`    ${source} ||--o{ ${target} : "${name}"`);
        });

        return lines.join("\n");
    }

    generateMicroflow(mf: microflows.Microflow): string {
        const lines: string[] = ["flowchart TD"];

        // Nodes
        mf.objectCollection.objects.forEach(obj => {
            const id = this.getNodeId(obj);
            let label = "";
            let shape = ""; // default rect

            if (obj instanceof microflows.StartEvent) {
                label = "Start";
                shape = "((Start))";
            } else if (obj instanceof microflows.EndEvent) {
                label = "End";
                shape = "((End))";
            } else if (obj instanceof microflows.ActionActivity) {
                const action = obj.action;
                label = this.getActionLabel(action); // action can be null? SDK says usually defined.
                shape = `[${label}]`;
            } else if (obj instanceof microflows.ExclusiveSplit) {
                label = obj.caption || "Split";
                shape = `{${label}}`;
            } else if (obj instanceof microflows.LoopedActivity) {
                label = "Loop";
                shape = `[[${label}]]`;
            } else if (obj instanceof microflows.MicroflowParameterObject) {
                // Updated type from Parameter to MicroflowParameterObject
                // Skip inputs in flowchart usually
            }

            if (label) {
                lines.push(`    ${id}${shape}`);
            }
        });

        // Links (Sequence Flows)
        // Links (Sequence Flows)
        const sequenceFlows = mf.flows; // Use strict flow collection
        sequenceFlows.forEach(obj => {
            const origin = obj.origin;
            const destination = obj.destination;
            if (origin && destination) {
                const originId = this.getNodeId(origin as any);
                const destId = this.getNodeId(destination as any);

                let label = "";
                if ((obj as any).caseValues && (obj as any).caseValues.length > 0) {
                    label = (obj as any).caseValues.map((v: any) => v.value).join("/");
                } else if ((obj as any).caseValue) {
                    label = (obj as any).caseValue.value || "";
                }

                const arrow = label ? `--"${label}"-->` : "-->";
                lines.push(`    ${originId} ${arrow} ${destId}`);
            }
        });

        return lines.join("\n");
    }

    private getNodeId(obj: any): string {
        // Use GUID but make it alpha-numeric safe
        return "id" + obj.id.replace(/-/g, '').substring(0, 8);
    }

    private sanitizeName(name: string): string {
        return name.replace(/\s+/g, '_');
    }

    private getActionLabel(action: microflows.MicroflowAction | null): string {
        if (!action) return "Unknown"; // Fix null safety

        if (action instanceof microflows.RetrieveAction) return "Retrieve";
        if (action instanceof microflows.ChangeObjectAction) return "Change";
        if (action instanceof microflows.CreateObjectAction) return "Create";
        if (action instanceof microflows.MicroflowCallAction) return "Call " + (action.microflowCall?.microflowQualifiedName?.split('.').pop() || "Sub");
        return (action as any).structureTypeName.split('$').pop().replace('Action', '');
    }
}
