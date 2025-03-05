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


export async function execute_upsert(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
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
                console.log(`Executing upsert for table '${table}' using inputtype ${inputType}`);
                const entityInfo = manifestResponse.entities[table];
                if (!entityInfo) {
                    throw new Error(`Entity ${table} not found in manifest`);
                }

                // Prepare the payload for create/update
                let payload: IDataObject = {};

                if (inputType === 'fieldBuilder') {
                    const fields = this.getNodeParameter('fields.field', i, []) as Array<{ fieldName: string; value: string }>;

                    // Convert fields array to proper payload format
                    fields.forEach((field) => {
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
                    console.log(`Processing JSON payload: ${jsonString}`);
                    payload = JSON.parse(jsonString);

                    // Validate fields against manifest
                    for (const [key] of Object.entries(payload)) {
                        const fieldInfo = Object.entries<EAVFWAttribute>(entityInfo.attributes)
                            .find(([_, attr]) => attr.logicalName === key || (attr.type.type === "lookup" && attr.logicalName === key + "id"));

                        if (!fieldInfo) {
                            throw new Error(`Field ${key} not found in entity ${table}`);
                        }
                    }
                }

                // Build search query parameters
                const searchParams = new URLSearchParams();

                if (this.getNodeParameter("search_builder", i) === "odata") {
                    searchParams.append(`$filter`, this.getNodeParameter("odata", i) as string);
                    console.log(`Using OData search criteria: ${this.getNodeParameter("odata", i)}`);
                } else {
                    const searchCriteria = this.getNodeParameter('searchCriteria.criteria', i, []) as Array<{ fieldName: string; value: string }>;

                    searchCriteria.forEach((criteria) => {
                        const fieldInfo = entityInfo.attributes[criteria.fieldName];
                        if (!fieldInfo) {
                            throw new Error(`Search field ${criteria.fieldName} not found in entity ${table}`);
                        }
                        switch (fieldInfo.type.type.toLowerCase()) {
                            case 'integer':
                            case 'decimal':
                            case 'float':
                                searchParams.append(`$filter`, `${fieldInfo.logicalName} eq ${criteria.value}`);
                                break;
                            default:
                                searchParams.append(`$filter`, `${fieldInfo.logicalName} eq '${criteria.value}'`);
                                break;

                        }

                    });
                }
                console.log(`Search parameters: ${searchParams.toString()}`);
                // First try to find existing record
                const searchResponse = await this.helpers.request({
                    method: 'GET',
                    url: `${environmentUrl}/api/entities/${entityInfo.collectionSchemaName}?${searchParams.toString()}`,
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    json: true,
                });
                console.log(searchResponse);
                let response;
                if (searchResponse && searchResponse.items && searchResponse.items.length > 0) {
                    // Record found - update using PATCH
                    const recordId = searchResponse.items[0].id;
                    payload = {
                        ...searchResponse.items[0],
                        ...payload
                    };
                    response = await this.helpers.request({
                        method: 'PATCH',
                        url: `${environmentUrl}/api/entities/${entityInfo.collectionSchemaName}/records/${recordId}`,
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                        body: payload,
                        json: true,
                    });
                } else {
                    // Record not found - create using POST
                    response = await this.helpers.request({
                        method: 'POST',
                        url: `${environmentUrl}/api/entities/${entityInfo.collectionSchemaName}/records`,
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                        body: payload,
                        json: true,
                    });
                }

                returnData.push({
                    json: {
                        success: true,
                        data: response,
                        table,
                        payload,
                        operation: searchResponse?.items?.length > 0 ? 'update' : 'create',
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