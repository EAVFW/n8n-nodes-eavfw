import { INodeProperties } from "n8n-workflow";


export const upsert_record = {
    name: 'Upsert Record',
    value: 'upsert_record',
    description: 'EAVFW operation description',
    action: 'Upsert Record',
};

export const upsert_record_properties: INodeProperties[] = [
    {
        displayName: 'Search Builder',
        name: 'search_builder',
        type: 'options',
        displayOptions: {
            show: {
                operation: ['upsert_record'],
            },
        },
        options: [
            {
                name: 'Field Builder',
                value: 'builder',
            },
            {
                name: 'OData',
                value: 'odata',
            },
        ],
        default: 'odata',
        description: 'Choose how to search',
    },
    {
        displayName: 'Search Criteria',
        name: 'searchCriteria',
        type: 'fixedCollection',
        displayOptions: {
            show: {
                search_builder: ['builder'],
                operation: ['upsert_record'],
            },
        },
        typeOptions: {
            multipleValues: true,
        },
        default: {},
        options: [
            {
                name: 'criteria',
                displayName: 'Search Field',
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
                        description: 'The field to search by',
                    },
                    {
                        displayName: 'Value',
                        name: 'value',
                        type: 'string',
                        default: '',
                        description: 'The value to search for',
                    },
                ],
            },
        ],
        description: 'Define the search criteria to find existing records',
    },
    {
        displayName: 'OData Filter',
        name: 'odata',
        type: 'string',
        displayOptions: {
            show: {
                search_builder: ['odata'],
                operation: ['upsert_record'],
            },
        },
        default: '',
        description: 'The odata filter'
    },
    {
        displayName: 'Input Type',
        name: 'inputType',
        type: 'options',
        displayOptions: {
            show: {
                operation: ['upsert_record'],
            },
        },
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
                operation: ['upsert_record'],
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
    {
        displayName: 'JSON Payload',
        name: 'jsonPayload',
        type: 'json',
        displayOptions: {
            show: {
                inputType: ['json'],
                operation: ['upsert_record'],
            },
        },
        default: '{}',
        description: 'The JSON payload to send. Field names should match the logical names from the manifest.',
        typeOptions: {
            loadOptionsDependsOn: ['table'],
        },
    },
]