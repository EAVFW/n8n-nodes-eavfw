import { INodeTypeDescription } from "n8n-workflow";
import { create_record, create_record_properties } from "./create/operation.description";
import { upsert_record, upsert_record_properties } from "./upsert/operation.description";
import { query_record, query_record_properties } from "./query/operation.description";


export const description: Partial<INodeTypeDescription> & { properties: INodeTypeDescription["properties"] } = {
    usableAsTool: true,
    properties: [
        {
            displayName: 'Table',
            name: 'table',
            type: 'options',
            default: '',
            required: true,
            typeOptions: {
                loadOptionsMethod: 'getTables',
            },
            description: 'The table to create a record in',
        },
        {
            displayName: 'Operation',
            name: 'operation',
            type: 'options',
            noDataExpression: true,
            options: [
                create_record,
                upsert_record,
				query_record
            ],
            default: 'create_record',
        },
        ...create_record_properties,
        ...upsert_record_properties,
        ...query_record_properties
        ]
	
}