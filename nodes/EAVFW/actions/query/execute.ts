import { IExecuteFunctions, INodeExecutionData, IDataObject } from "n8n-workflow";
import { getTokenWithCache, getManifest } from "../../helpers";



interface EAVFWAttribute {
    displayName: string;
    description: string;
    logicalName: string;
    type: {
        type: string;
    }
}


export async function execute_query(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    try {
        // Get credentials
        const credentials = await this.getCredentials('eavfwOAuth2Api');
        const environmentUrl = credentials.environmentUrl as string;
        const token = await getTokenWithCache.call(this, credentials);

        // Get the manifest to find the collectionSchemaName
        const manifestResponse = await getManifest.call(this, environmentUrl, token);

        // Process each item
        for (let i = 0; i < items.length; i++) {
            try {
                // Get selected table and fields
                const table = this.getNodeParameter('table', i) as string;
                const inputType = this.getNodeParameter('inputType', i) as string;
                const searchCriteria = this.getNodeParameter('searchCriteria)', i, []);

                console.log(searchCriteria);
            }
            catch {
            }
        }

        return [returnData];
    } catch (error) {
        if (this.continueOnFail()) {
            return [[{ json: { success: false, error: error.message } }]];
        }
        throw error;
    }
}