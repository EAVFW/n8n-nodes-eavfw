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

export async function execute_create(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
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
        for(let i = 0; i <items.length; i++) {
    try {
        // Get selected table and fields
        const table = this.getNodeParameter('table', i) as string;
        const inputType = this.getNodeParameter('inputType', i) as string;

        const entityInfo = manifestResponse.entities[table];
        if (!entityInfo) {
            throw new Error(`Entity ${table} not found in manifest`);
        }

        // Prepare the payload
        let payload: IDataObject = {};

        if (inputType === 'fieldBuilder') {
            const fields = this.getNodeParameter('fields.field', i, []) as Array<{ fieldName: string; value: string }>;

            // Convert fields array to proper payload format
            fields.forEach((field) => {
                // Get the logical name of the field from manifest
                const fieldInfo = entityInfo.attributes[field.fieldName];
                if (!fieldInfo) {
                    throw new Error(`Field ${field.fieldName} not found in entity ${table}`);
                }

                const logicalName = fieldInfo.logicalName;

                // Convert value based on field type
                let value: any = field.value;
                switch (fieldInfo.type.type.toLowerCase()) {
                    case 'integer':
                        value = parseInt(field.value);
                        break;
                    case 'decimal':
                    case 'float':
                        value = parseFloat(field.value);
                        break;
                    case 'boolean':
                        value = field.value.toLowerCase() === 'true';
                        break;
                    case 'datetime':
                        value = new Date(field.value).toISOString();
                        break;
                    case 'lookup':
                        // Handle lookup fields - expecting a GUID
                        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(field.value)) {
                            throw new Error(`Invalid GUID format for lookup field ${field.fieldName}`);
                        }
                        break;
                }

                payload[logicalName] = value;
            });
        } else {
            // JSON input logic
            const jsonString = this.getNodeParameter('jsonPayload', i) as string;
            payload = JSON.parse(jsonString);

            // Optional: validate fields against manifest
            for (const [key] of Object.entries(payload)) {
                const fieldInfo = Object.entries<EAVFWAttribute>(entityInfo.attributes)
                    .find(([_, attr]) => attr.logicalName === key || (attr.type.type === "lookup" && attr.logicalName === key + "id"));

                if (!fieldInfo) {
                    throw new Error(`Field ${key} not found in entity ${table}`);
                }
            }
        }

        // Make the API call
        const response = await this.helpers.request({
            method: 'POST',
            url: `${environmentUrl}/api/entities/${entityInfo.collectionSchemaName}/records`,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: payload,
            json: true,
        });

        returnData.push({
            json: {
                success: true,
                data: response,
                table,
                payload,
            },
        });
    } catch (error) {
        if (this.continueOnFail()) {
            returnData.push({
                json: {
                    success: false,
                    error: error.message,
                    payload: error.payload,
                    response: error.response,
                },
            });
            continue;
        }
        throw error;
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