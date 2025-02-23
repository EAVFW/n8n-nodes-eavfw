import { ILoadOptionsFunctions, INodePropertyOptions } from "n8n-workflow";
import { getManifest, getTokenWithCache } from "../helpers";


export async function getTables(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
    const credentials = await this.getCredentials('eavfwOAuth2Api');
    const environmentUrl = credentials.environmentUrl as string;

    try {
        const response = await getManifest.call(this, environmentUrl, await getTokenWithCache.call(this, credentials));
        const entities = response.entities;

        const options: INodePropertyOptions[] = Object.entries(entities).map(([key, value]: [string, any]) => ({
            name: value.displayName || key,
            value: key,
            description: value.description || '',
        }));

        return options;
    } catch (error) {
        console.error('Error loading tables:', error);
        return [];
    }
}


export async function getFields(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
    const credentials = await this.getCredentials('eavfwOAuth2Api');
    const environmentUrl = credentials.environmentUrl as string;
    const selectedTable = this.getCurrentNodeParameter('table') as string;

    try {
        const response = await getManifest.call(this, environmentUrl, await getTokenWithCache.call(this, credentials));
        const entity = response.entities[selectedTable];

        if (!entity || !entity.attributes) {
            return [];
        }

        // Transform attributes into options format
        const options: INodePropertyOptions[] = Object.entries(entity.attributes)
            .filter(([_, attr]: [string, any]) => !attr.readonly) // Optionally filter out readonly fields
            .map(([key, attr]: [string, any]) => ({
                name: attr.displayName || key,
                value: key,
                description: attr.description || '',
            }));

        return options;
    } catch (error) {
        console.error('Error loading fields:', error);
        return [];
    }
}
