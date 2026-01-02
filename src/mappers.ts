
import { domainmodels, microflows, pages, security, datatypes, enumerations, constants, navigation, rest, scheduledevents } from "mendixmodelsdk";

export interface DomainModelDTO {
    id: string;
    moduleName: string;
    entities: EntityDTO[];
    associations: AssociationDTO[];
}

export interface AccessRuleDTO {
    moduleRole: string;
    allowCreate: boolean;
    allowDelete: boolean;
    allowMemberRead: string[];
    allowMemberWrite: string[];
    xpathConstraint: string;
}

export interface EntityDTO {
    _type: string;
    name: string;
    documentation: string;
    location: { x: number; y: number };
    attributes: AttributeDTO[];
    generalization?: string;
    accessRules: AccessRuleDTO[];
    validationRules: ValidationRuleDTO[];
    eventHandlers: EventHandlerDTO[];
}

export interface ValidationRuleDTO {
    attribute: string;
    message: string;
    type: string;
}

export interface EventHandlerDTO {
    event: string;
    moment: string;
    microflow: string;
    raiseErrorOnFalse: boolean;
}

export interface AttributeDTO {
    name: string;
    type: string;
    defaultValue?: string;
    documentation: string;
}

export interface AssociationDTO {
    name: string;
    source: string;
    target: string;
    type: string;
    owner: string;
}

export interface MicroflowDTO {
    name: string;
    documentation: string;
    returnType: string;
    parameters: { name: string; type: string }[];
    activities: string[];
}

export interface PageDTO {
    name: string;
    documentation: string;
    layoutCall: string;
    url: string;
    widgets: string[];
}

export interface NanoflowDTO {
    name: string;
    documentation: string;
    returnType: string;
    parameters: { name: string; type: string }[];
    activities: string[];
}

export interface ProjectSecurityDTO {
    userRoles: {
        name: string;
        moduleRoles: string[];
    }[];
}

export interface NavigationDTO {
    profiles: {
        name: string;
        type: string;
        homePage?: string;
        roleHomePages: { role: string; page: string }[];
        menuItems: MenuItemDTO[];
    }[];
}

export interface MenuItemDTO {
    caption: string;
    targetPage?: string;
    targetMicroflow?: string;
    subItems: MenuItemDTO[];
}

export interface IntegrationDTO {
    consumedRestServices: string[];
    publishedRestServices: string[];
    scheduledEvents: string[];
}

export interface EnumerationDTO {
    name: string;
    documentation: string;
    values: string[];
}

export interface ConstantDTO {
    name: string;
    documentation: string;
    type: string;
    defaultValue: string;
}

export interface ModuleSecurityDTO {
    moduleRoles: string[];
}

export function mapEntity(entity: domainmodels.Entity): EntityDTO {
    const accessRules: AccessRuleDTO[] = (entity.accessRules || []).map(rule => {
        const r = rule as any;
        return {
            moduleRole: r.moduleRoles?.map((mr: any) => mr.name).join(', ') || "Unknown",
            allowCreate: rule.allowCreate,
            allowDelete: rule.allowDelete,
            allowMemberRead: r.memberAccesses?.filter((ma: any) => ma.access?.toString().includes('Read')).map((ma: any) => ma.attribute?.name || ma.association?.name || "Unknown") || [],
            allowMemberWrite: r.memberAccesses?.filter((ma: any) => ma.access?.toString().includes('Write')).map((ma: any) => ma.attribute?.name || ma.association?.name || "Unknown") || [],
            xpathConstraint: rule.xPathConstraint
        };
    });

    const validationRules: ValidationRuleDTO[] = (entity as any).validationRules?.map((rule: any) => ({
        attribute: rule.attribute?.name || "Unknown",
        message: rule.message?.translations?.[0]?.text || "No message",
        type: rule.structureTypeName?.split('$').pop() || "Validation"
    })) || [];

    const eventHandlers: EventHandlerDTO[] = (entity as any).eventHandlers?.map((eh: any) => ({
        event: eh.event?.toString() || "Unknown",
        moment: eh.moment?.toString() || "Unknown",
        microflow: eh.microflowQualifiedName || (eh.microflow as any)?.qualifiedName || "Unknown",
        raiseErrorOnFalse: eh.raiseErrorOnFalse || false
    })) || [];

    return {
        _type: "Entity",
        name: entity.name,
        documentation: entity.documentation,
        location: { x: entity.location.x, y: entity.location.y },
        attributes: entity.attributes.map(mapAttribute),
        generalization: (entity.generalization as any)?.generalizationQualifiedName,
        accessRules,
        validationRules,
        eventHandlers
    };
}

export function mapAttribute(attr: domainmodels.Attribute): AttributeDTO {
    return {
        name: attr.name,
        type: attr.type?.structureTypeName?.split('$').pop()?.replace('AttributeType', '') || "Unknown",
        defaultValue: (attr.value as any)?.defaultValue,
        documentation: attr.documentation
    };
}

export function mapAssociation(assoc: domainmodels.Association): AssociationDTO {
    return {
        name: assoc.name,
        source: assoc.parent?.name || "Unknown",
        target: assoc.child?.name || "Unknown",
        type: (assoc.type as any)?.structureTypeName?.split('$').pop() || "Reference",
        owner: assoc.owner?.name || "Unknown"
    };
}

export function mapMicroflow(mf: microflows.Microflow): MicroflowDTO {
    const parameters: { name: string; type: string }[] = [];
    const activities: string[] = [];

    mf.objectCollection.objects.forEach(o => {
        if (o instanceof microflows.MicroflowParameterObject) {
            let paramType = "Unknown";
            try {
                const vt = o.variableType as any;
                if (vt instanceof datatypes.ObjectType) {
                    paramType = vt.entityQualifiedName || "ObjectType";
                } else if (vt instanceof datatypes.ListType) {
                    paramType = `List<${vt.entityQualifiedName || "ObjectType"}>`;
                } else if (vt?.structureTypeName) {
                    paramType = vt.structureTypeName.split('$').pop() || "Unknown";
                }
            } catch (e) { }
            parameters.push({ name: o.name, type: paramType });
        } else if (o instanceof microflows.ActionActivity) {
            const action = o.action;
            if (action) {
                let desc = (action as any).structureTypeName?.split('$').pop()?.replace('Action', '') || "Action";
                if (action instanceof microflows.CreateObjectAction) {
                    desc += `: ${action.entityQualifiedName}`;
                } else if (action instanceof microflows.RetrieveAction) {
                    desc += `: ${(action.retrieveSource as any)?.entityQualifiedName || (action.retrieveSource as any)?.associationQualifiedName || "Source"}`;
                } else if (action instanceof microflows.ChangeObjectAction) {
                    const entries = (action as any).items?.map((i: any) => `${i.attributeQualifiedName?.split('.').pop()} = ${i.value?.expression || "Value"}`).join(', ') || "";
                    desc += `: ${action.changeVariableName} [${entries}]`;
                } else if (action instanceof microflows.MicroflowCallAction) {
                    desc += `: ${action.microflowCall?.microflowQualifiedName}`;
                }
                activities.push(desc);
            }
        }
    });

    return {
        name: mf.name,
        documentation: mf.documentation,
        returnType: ((mf as any).microflowReturnType || (mf as any).returnType)?.structureTypeName?.split('$').pop() || "Unknown",
        parameters,
        activities: Array.from(new Set(activities))
    };
}

export function mapPage(page: pages.Page): PageDTO {
    const widgets: string[] = [];
    page.traverse(node => {
        const typeName = (node as any).structureTypeName || "";
        if (typeName.toLowerCase().startsWith('pages$')) {
            const name = typeName.split('$').pop();
            const skip = ['Page', 'LayoutCall', 'LayoutCallArgument', 'Appearance', 'PageParameter', 'DataViewSource', 'DesignPropertyValue'];
            if (name && !skip.includes(name)) {
                let desc = name;
                if (node instanceof pages.ActionButton) {
                    const action = (node.action as any)?.microflowCall?.microflowQualifiedName || (node.action as any)?.pageCall?.pageQualifiedName || "Action";
                    desc += ` (Call: ${action})`;
                } else if (node instanceof pages.DataView || node instanceof pages.ListView || node instanceof pages.DataGrid) {
                    const ds = (node as any).dataSource;
                    const dsType = ds?.structureTypeName?.split('$').pop() || "";
                    const entity = (ds as any).entityQualifiedName || (ds as any).associationQualifiedName || "Unknown";
                    desc += ` (Source: ${dsType} ${entity})`;
                }

                if ((node as any).conditionalVisibilitySettings) desc += ` [Conditional Visibility]`;
                if ((node as any).conditionalEditabilitySettings) desc += ` [Conditional Editability]`;

                widgets.push(desc);
            }
        }
    });

    return {
        name: page.name,
        documentation: page.documentation,
        layoutCall: page.layoutCall?.layout?.qualifiedName || "None",
        url: page.url,
        widgets: Array.from(new Set(widgets))
    };
}

export function mapModuleSecurity(sec: security.ModuleSecurity): ModuleSecurityDTO {
    return { moduleRoles: sec.moduleRoles.map(r => r.name) };
}

export function mapEnumeration(en: enumerations.Enumeration): EnumerationDTO {
    return {
        name: en.name,
        documentation: en.documentation,
        values: en.values.map(v => v.name)
    };
}

export function mapConstant(c: constants.Constant): ConstantDTO {
    return {
        name: c.name,
        documentation: c.documentation,
        type: (c as any).type?.structureTypeName?.split('$').pop() || "Unknown",
        defaultValue: c.defaultValue
    };
}

export function mapNavigation(nav: navigation.NavigationDocument): NavigationDTO {
    return {
        profiles: nav.profiles.map(p => {
            const profile = p as any;
            return {
                name: p.name,
                type: p.structureTypeName.split('$').pop() || "Profile",
                homePage: profile.homePage?.page?.qualifiedName || profile.homePage?.microflow?.qualifiedName,
                roleHomePages: (profile.roleHomePages || []).map((rh: any) => ({
                    role: rh.userRole?.name || "Unknown",
                    page: rh.page?.qualifiedName || rh.microflow?.qualifiedName || "Unknown"
                })),
                menuItems: profile.menuItemCollection ? mapMenuItems(profile.menuItemCollection) : []
            };
        })
    };
}

function mapMenuItems(collection: any): MenuItemDTO[] {
    if (!collection || !collection.items) return [];
    return collection.items.map((item: any) => {
        const action = item.action as any;
        return {
            caption: item.caption?.text || "Item",
            targetPage: action?.pageCall?.pageQualifiedName || action?.page?.qualifiedName,
            targetMicroflow: action?.microflowCall?.microflowQualifiedName || action?.microflow?.qualifiedName,
            subItems: item.menuItemCollection ? mapMenuItems(item.menuItemCollection) : []
        };
    });
}

export function mapIntegrations(
    consumedRest: rest.IConsumedRestService[],
    publishedRest: rest.IPublishedRestService[],
    scheduledEvents: scheduledevents.IScheduledEvent[]
): IntegrationDTO {
    return {
        consumedRestServices: consumedRest.map(s => s.qualifiedName || "Unknown"),
        publishedRestServices: publishedRest.map(s => s.qualifiedName || "Unknown"),
        scheduledEvents: scheduledEvents.map(e => e.qualifiedName || "Unknown")
    };
}

export function mapNanoflow(nf: microflows.Nanoflow): NanoflowDTO {
    const parameters = (nf as any).parameterCollection?.parameters?.map((p: any) => ({
        name: p.name,
        type: p.variableType?.structureTypeName?.split('$').pop() || "Unknown"
    })) || [];

    const activities: string[] = [];
    nf.objectCollection.objects.forEach(o => {
        if (o instanceof microflows.ActionActivity) {
            const action = o.action;
            if (action) {
                let desc = (action as any).structureTypeName?.split('$').pop()?.replace('Action', '') || "Action";
                if (action instanceof microflows.ChangeObjectAction) desc += `: ${action.changeVariableName}`;
                else if (action instanceof microflows.MicroflowCallAction) desc += `: ${action.microflowCall?.microflowQualifiedName}`;
                activities.push(desc);
            }
        }
    });

    return {
        name: nf.name,
        documentation: nf.documentation,
        returnType: ((nf as any).microflowReturnType || (nf as any).returnType)?.structureTypeName?.split('$').pop() || "Unknown",
        parameters,
        activities: Array.from(new Set(activities))
    };
}

export function mapProjectSecurity(sec: security.ProjectSecurity): ProjectSecurityDTO {
    return {
        userRoles: sec.userRoles.map(ur => ({
            name: ur.name || "Unknown",
            moduleRoles: (ur.moduleRoles || [])
                .map(mr => mr?.qualifiedName)
                .filter((qn): qn is string => typeof qn === 'string')
        }))
    };
}
