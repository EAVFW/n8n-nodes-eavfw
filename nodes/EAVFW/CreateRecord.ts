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

export class CreateRecord implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Create Record',
        name: 'createRecord',
        group: ['transform'],
        version: 1,
        description: 'Creates a record in EAVFW',
        defaults: {
            name: 'Create Record',
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
    };

   
}

export default CreateRecord;
