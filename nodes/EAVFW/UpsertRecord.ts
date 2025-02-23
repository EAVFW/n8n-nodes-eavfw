import { INodeType, INodeTypeDescription, NodeConnectionType, ILoadOptionsFunctions, INodePropertyOptions, IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';

import { getManifest, getTokenWithCache } from './helpers/';
import { loadOptions } from './methods';
interface EAVFWAttribute {
    displayName: string;
    description: string;
    logicalName: string;
    type: {
        type: string;
    }
}

export class UpsertRecord  implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'EAVFW - Upsert Record',
        name: 'upsertRecord',
        group: ['transform'],
        version: 1,
        description: 'Creates or updates a record in EAVFW based on search criteria',
        defaults: {
            name: 'Upsert Record',
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
           
        ],
    };

    methods = {
        loadOptions
    }

   
}

export default UpsertRecord;
