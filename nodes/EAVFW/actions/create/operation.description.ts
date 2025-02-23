import { INodeProperties } from "n8n-workflow";


export const create_record = {
    name: 'Create Record',
    value: 'create_record',
    description: 'EAVFW operation description',
    action: 'Create Record',
};

export const create_record_properties: INodeProperties[] = [
    {
        displayName: 'Input Type',
        name: 'inputType',
        type: 'options',
        displayOptions: {
            show: {
                operation: ['create_record'],
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
            }
        ]
    },
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
    }
]