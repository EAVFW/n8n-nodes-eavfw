import { INodeType, INodeTypeDescription, NodeConnectionType, ILoadOptionsFunctions, INodePropertyOptions, IDataObject, IHttpRequestOptions, IExecuteFunctions, ICredentialDataDecryptedObject, INodeExecutionData } from 'n8n-workflow';

export class EAVFW implements INodeType {
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
                displayName: 'Fields',
                name: 'fields',
                type: 'fixedCollection',
                displayOptions: {
                    show: {
                        operation: ['create_record'],
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
        ],
    };

    methods = {
        loadOptions: {
            async getTables(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
                const url = 'https://quizzical-chebyshev-000.env.medlemscentralen.dk/api/manifest';

                try {
                    const response = await this.helpers.request({
                        method: 'GET',
                        url,
                        json: true,
                    });

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
                const url = 'https://quizzical-chebyshev-000.env.medlemscentralen.dk/api/manifest';
                const selectedTable = this.getCurrentNodeParameter('table') as string;

                try {
                    const response = await this.helpers.request({
                        method: 'GET',
                        url,
                        json: true,
                    });

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
            const token = await getToken.call(this, credentials);

            // Process each item
            for (let i = 0; i < items.length; i++) {
                try {
                    // Get selected table and fields
                    const table = this.getNodeParameter('table', i) as string;
                    const fields = this.getNodeParameter('fields.field', i, []) as Array<{ fieldName: string; value: string }>;

                    // Get the manifest to find the collectionSchemaName
                    const manifestResponse = await this.helpers.request({
                        method: 'GET',
                        url: 'https://quizzical-chebyshev-000.env.medlemscentralen.dk/api/manifest',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                        json: true,
                    });

                    const entityInfo = manifestResponse.entities[table];
                    if (!entityInfo) {
                        throw new Error(`Entity ${table} not found in manifest`);
                    }

                    const collectionSchemaName = entityInfo.collectionSchemaName;

                    // Prepare the payload
                    const payload: IDataObject = {};

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

                    // Make the API call
                    const response = await this.helpers.request({
                        method: 'POST',
                        url: `https://quizzical-chebyshev-000.env.medlemscentralen.dk/api/entities/${collectionSchemaName}/records`,
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
                            fields,
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


// Separate function for getting the token
async function getToken(
    this: ILoadOptionsFunctions | IExecuteFunctions,
    credentials: ICredentialDataDecryptedObject,
): Promise<string> {
    const { tokenUrl, clientId, clientSecret, scope } = credentials;

    const options: IHttpRequestOptions = {
        method: 'POST',
        url: tokenUrl as string,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            authorization: `Basic ${btoa(clientId + ':' + clientSecret)}`,
        },       
        body: 'grant_type=client_credentials'
    };

    try {
        const response = await this.helpers.request(options);
        const data = JSON.parse(response);
        return data.access_token;
    } catch (error) {
        throw new Error(`OAuth2 authentication failed: ${error.message}`);
    }
}


export default EAVFW;