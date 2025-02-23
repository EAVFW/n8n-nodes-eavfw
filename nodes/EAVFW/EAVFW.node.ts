import { INodeType, INodeTypeDescription, NodeConnectionType, ILoadOptionsFunctions, INodePropertyOptions, IDataObject, IHttpRequestOptions, IExecuteFunctions, ICredentialDataDecryptedObject, INodeExecutionData, IGetNodeParameterOptions } from 'n8n-workflow';



interface TokenCacheData {
    token: string;
    expiresAt: number;
}
interface EAVFWAttribute {
    displayName: string;
    description: string;
    logicalName: string;
    type: {
        type: string;
    }
}
export class EAVFW implements INodeType {

    // Add a static property to store manifest data
    static manifestCache: Map<string, {
        timestamp: number,
        data: any
    }> = new Map();


    static tokenCache: Map<string, TokenCacheData> = new Map();


    description: INodeTypeDescription = {
        displayName: 'EAVFW',
        name: 'EAVFW',
        group: ['transform'],
        version: 1,
        description: 'EAVFW node description',
        defaults: {
            name: 'EAVFW',
        },
        inputs: [NodeConnectionType.Main],
        outputs: [NodeConnectionType.Main],
        credentials: [
            {
                name: 'eavfwOAuth2Api',
                required: true,
            },
        ],
        properties: [
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                options: [
                    {
                        name: 'Create Record',
                        value: 'create_record',
                        description: 'EAVFW operation description',
                        action: 'Perform an EAVFW operation',
                    },
                ],
                default: 'create_record',
            },
            {
                displayName: 'Table',
                name: 'table',
                type: 'options',
                displayOptions: {
                    show: {
                        operation: ['create_record'],
                    },
                },
                default: '',
                required: true,
                typeOptions: {
                    loadOptionsMethod: 'getTables',
                },
                description: 'The table to create a record in',
            },
            {
                displayName: 'Input Type',
                name: 'inputType',
                type: 'options',
                options: [
                    {
                        name: 'Field Builder',
                        value: 'fieldBuilder',
                    },
                    {
                        name: 'JSON',
                        value: 'json',
                    },
                ],
                default: 'fieldBuilder',
                description: 'Choose how to input the data',
            },
            {
                displayName: 'Fields',
                name: 'fields',
                type: 'fixedCollection',
                displayOptions: {
                    show: {
                        operation: ['create_record'],
                        inputType: ['fieldBuilder'],
                    },
                },
                typeOptions: {
                    multipleValues: true,
                },
                default: {},
                options: [
                    {
                        name: 'field',
                        displayName: 'Field',
                        values: [
                            {
                                displayName: 'Field Name',
                                name: 'fieldName',
                                type: 'options',
                                typeOptions: {
                                    loadOptionsMethod: 'getFields',
                                    loadOptionsDependsOn: ['table'],
                                },
                                default: '',
                                description: 'The field to set the value of',
                            },
                            {
                                displayName: 'Value',
                                name: 'value',
                                type: 'string',
                                default: '',
                                description: 'The value to set',
                            },
                        ],
                    },
                ],
            },
            // JSON input option
            {
                displayName: 'JSON Payload',
                name: 'jsonPayload',
                type: 'json',
                displayOptions: {
                    show: {
                        operation: ['create_record'],
                        inputType: ['json'],
                    },
                },
                default: '{}',
                description: 'The JSON payload to send. Field names should match the logical names from the manifest.',
                typeOptions: {
                    loadOptionsDependsOn: ['table'],
                },
            },
        ],
    };

    methods = {
        loadOptions: {
            async getTables(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
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
            },

            async getFields(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
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
                            // You might want to add additional metadata about the field type
                            // to handle different input types in the future
                        }));

                    return options;
                } catch (error) {
                    console.error('Error loading fields:', error);
                    return [];
                }
            },

        },

    };


     
    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
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
                                // Add more type conversions as needed
                            }

                            payload[logicalName] = value;
                        });

                    } else {
                        // JSON input logic
                        const jsonString = this.getNodeParameter('jsonPayload', i) as string;
                        payload = JSON.parse(jsonString);

                        // Validate the payload against manifest
                        const manifestResponse = await getManifest.call(this, environmentUrl, token);
                        const entityInfo = manifestResponse.entities[table];

                        // Optional: validate fields against manifest
                        for (const [key, value] of Object.entries(payload)) {
                            const fieldInfo = Object.entries<EAVFWAttribute>(entityInfo.attributes)
                                .find(([_, attr]) => attr.logicalName === key || (attr.type.type === "lookup" && attr.logicalName === key+"id"));

                            if (!fieldInfo) {
                                throw new Error(`Field ${key} not found in entity ${table}`);
                            }

                            // Could add type validation here if needed
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
}


// Add a method to handle manifest fetching with caching
async function getManifest(
    this: ILoadOptionsFunctions | IExecuteFunctions,
    environmentUrl: string,
    token: string
): Promise<any> {
    const CACHE_DURATION = 1000 * 60 * 60; // 1 hour in milliseconds
    const cacheKey = environmentUrl;
    const cachedData = EAVFW.manifestCache.get(cacheKey);

    // Check if we have valid cached data
    if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
        return cachedData.data;
    }

    // If no cache or expired, fetch new data
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await this.helpers.request({
        method: 'GET',
        url: `${environmentUrl}/api/manifest`,
        headers,
        json: true,
    });

    // Store in cache
    EAVFW.manifestCache.set(cacheKey, {
        timestamp: Date.now(),
        data: response,
    });

    return response;
}


// Get token with caching
async function getTokenWithCache(
    this: ILoadOptionsFunctions | IExecuteFunctions,
    credentials: ICredentialDataDecryptedObject,
): Promise<string> {
    const { environmentUrl, clientId, clientSecret } = credentials;
    const cacheKey = `${environmentUrl}:${clientId}`; // Use combination of URL and clientId as cache key

    // Check cache first
    const cachedToken = EAVFW.tokenCache.get(cacheKey);
    if (cachedToken && Date.now() < cachedToken.expiresAt) {
        return cachedToken.token;
    }

    // If no valid cached token, get a new one
    const tokenUrl = `${environmentUrl}/connect/token`;

    const options: IHttpRequestOptions = {
        method: 'POST',
        url: tokenUrl,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            authorization: `Basic ${btoa(clientId + ':' + clientSecret)}`,
        },
        body: 'grant_type=client_credentials'
    };

    try {
        const response = await this.helpers.request(options);
        const data = JSON.parse(response);

        // Cache the token
        // Subtract 5 minutes from expiry to be safe
        const expiresIn = (data.expires_in || 3600) * 1000; // Convert to milliseconds
        const expiresAt = Date.now() + expiresIn - (5 * 60 * 1000); // Current time + expiry - 5 minutes

        EAVFW.tokenCache.set(cacheKey, {
            token: data.access_token,
            expiresAt,
        });

        return data.access_token;
    } catch (error) {
        throw new Error(`OAuth2 authentication failed: ${error.message}`);
    }
}


async function generateDefaultJsonData(
    this: ILoadOptionsFunctions | IExecuteFunctions,
    table: string,
    manifest: any
): Promise<string> {
    const entityInfo = manifest.entities[table];
    if (!entityInfo || !entityInfo.attributes) {
        return '{}';
    }

    const exampleData: Record<string, any> = {};

    // Generate example values based on attribute types
    for (const [key, attr] of Object.entries<EAVFWAttribute>(entityInfo.attributes)) {


        const logicalName = attr.logicalName;

        // Generate appropriate example values based on type
        switch (attr.type.type.toLowerCase()) {
            case 'string':
                exampleData[logicalName] = `Example ${attr.displayName || key}`;
                break;
            case 'integer':
                exampleData[logicalName] = 42;
                break;
            case 'decimal':
            case 'float':
                exampleData[logicalName] = 42.42;
                break;
            case 'boolean':
                exampleData[logicalName] = false;
                break;
            case 'datetime':
                exampleData[logicalName] = new Date().toISOString();
                break;
            case 'lookup':
                exampleData[logicalName] = "00000000-0000-0000-0000-000000000000";
                break;
            // Add more types as needed
        }
    }

    return JSON.stringify(exampleData, null, 2);
}

export default EAVFW;