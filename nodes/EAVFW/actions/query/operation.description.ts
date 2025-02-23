import { INodeProperties } from "n8n-workflow";


export const query_record = {
    name: 'Query Record',
    value: 'query_record',
    description: 'EAVFW operation description',
    action: 'Query Record',
};

export const query_record_properties: INodeProperties[] = [

    //{
    //    displayName: 'Search Criteria',
    //    name: 'searchCriteria',
    //    placeholder: 'Add Condition',
    //    type: 'filter',
    //    displayOptions: {
    //        show: {
    //            operation: ['query_record'],
    //        },
    //    },
    //    typeOptions: {
    //        filter: {
    //            version: 2,
    //            // Use the user options (below) to determine filter behavior
    //            caseSensitive: '={{!$parameter.options.ignoreCase}}',
    //            typeValidation: '={{$parameter.options.looseTypeValidation ? "loose" : "strict"}}',
    //        },
    //    },
    //    default: {},
    //    description: 'Define the search criteria to find existing records',
    //},
    {
        displayName: 'Search Criteria',
        name: 'searchCriteria',
        type: 'fixedCollection',
        displayOptions: {
            show: {
                operation: ['query_record'],
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
                        displayName: 'Operator',
                        name: 'operator',
                        type: 'options',
                        options: [
                            {
                                name: 'Equal',
                                value: 'eq',
                            },
                            {
                                name: 'Not Equal',
                                value: 'ne',
                            },
                            {
                                name: 'Greater Than',
                                value: 'gt',
                            },
                            {
                                name: 'Greater Than or Equal',
                                value: 'ge',
                            },
                            {
                                name: 'Less Than',
                                value: 'lt',
                            },
                            {
                                name: 'Less Than or Equal',
                                value: 'le',
                            },                            
                        ],
                        default: 'eq',
                        description: 'The value to search for',
                    },
                    {
                        displayName: 'Right',
                        name: 'right',
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
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        placeholder: 'Add option',
        default: {},
        displayOptions: {
            show: {
                operation: ['query_record'],
            },
        },
        options: [
            {
                displayName: 'Ignore Case',
                description: 'Whether to ignore letter case when evaluating conditions',
                name: 'ignoreCase',
                type: 'boolean',
                default: true,
            },
            {
                displayName: 'Less Strict Type Validation',
                description: 'Whether to try casting value types based on the selected operator',
                name: 'looseTypeValidation',
                type: 'boolean',
                default: true,
            },
        ],
    },
]