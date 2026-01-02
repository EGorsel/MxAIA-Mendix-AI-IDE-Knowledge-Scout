import { IAbstractUnit, IStructure, domainmodels, microflows, pages, IModel } from "mendixmodelsdk";

/**
 * RefResolver
 * 
 * Responsible for pre-loading Model Units to ensure that references in the main unit
 * (e.g., Microflow, Page) can be resolved to their Qualified Names.
 * 
 * This solves the "undefined" issue in JSON exports where properties like
 * `ChangeItem.attribute` are technically references to other units (DomainModel)
 * that might not be loaded in memory.
 */
export class RefResolver {
    private loadedUnits: Set<string> = new Set();
    private model: IModel;

    constructor(model: IModel) {
        this.model = model;
    }

    /**
     * Preloads all necessary dependencies for a list of Microflows.
     */
    async preloadMicroflows(mfs: microflows.Microflow[]): Promise<void> {
        const modulesToLoad = new Set<string>();

        for (const mf of mfs) {
            mf.traverse((element: IStructure) => {
                // 1. Check for ChangeObjectAction items (references to Attributes)
                if (element instanceof microflows.ChangeObjectAction) {
                    element.items.forEach(item => {
                        // Attempt to find module from attribute reference is hard without loading.
                        // But we can infer dependencies from other actions usually found in the same flow.
                    });
                }

                // 2. Check for RetrieveAction sources
                if (element instanceof microflows.RetrieveAction) {
                    const source = element.retrieveSource;
                    if (source instanceof microflows.DatabaseRetrieveSource) {
                        const qn = source.entityQualifiedName;
                        if (qn) {
                            const moduleName = qn.split('.')[0];
                            if (moduleName) modulesToLoad.add(moduleName);
                        }
                    } else if (source instanceof microflows.AssociationRetrieveSource) {
                        const qn = source.associationQualifiedName;
                        if (qn) {
                            const moduleName = qn.split('.')[0];
                            if (moduleName) modulesToLoad.add(moduleName);
                        }
                    }
                }

                // 3. Check for CreateObjectAction
                if (element instanceof microflows.CreateObjectAction) {
                    const qn = element.entityQualifiedName;
                    if (qn) {
                        const moduleName = qn.split('.')[0];
                        if (moduleName) modulesToLoad.add(moduleName);
                    }
                }

                // 4. Microflow Calls
                if (element instanceof microflows.MicroflowCallAction) {
                    const qn = element.microflowCall?.microflowQualifiedName;
                    if (qn) {
                        // Microflow loads do NOT require Domain Model loads directly, 
                        // but if we want to deep inspect that microflow later we might.
                        // For now we focus on data references (Entities).
                    }
                }
            });
        }

        const promises: Promise<IAbstractUnit>[] = [];
        for (const moduleName of modulesToLoad) {
            if (this.loadedUnits.has(moduleName)) continue;

            const dm = this.model.allDomainModels().find(d => d.containerAsModule.name === moduleName);
            if (dm) {
                this.loadedUnits.add(moduleName);
                promises.push(dm.load());
            }
        }

        if (promises.length > 0) {
            console.log(`[RefResolver] Preloading ${promises.length} external Domain Models...`);
            await Promise.all(promises);
        }
    }

    /**
     * Helper to resolve the name of a referenced Attribute.
     */
    async resolveAttributeName(attributeRef: domainmodels.IAttribute | null): Promise<string> {
        if (!attributeRef) return "Unknown";
        try {
            return attributeRef.name;
        } catch (e) {
            return "UnresolvedReference";
        }
    }

    getQualifiedName(element: any, propertyName: string): string | null {
        return null;
    }
}
