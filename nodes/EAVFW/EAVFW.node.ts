import {
    INodeType,
    INodeTypeDescription,
    NodeConnectionType
} from 'n8n-workflow';
import { description } from './actions/node.description';
import { router } from './actions/router';
import { loadOptions } from './methods';



export class EAVFW implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'EAVFW',
        name: 'eavfw',
        group: ['transform'],
        version: 1,
        description: 'Work with the EAVFW Environment',
        defaults: {
            name: 'EAVFW',
        },
        inputs: [NodeConnectionType.Main],
        outputs: [NodeConnectionType.Main], 
        subtitle: '={{$parameter["operation"] + ": " + $parameter["table"]}}',
        credentials: [
            {
                name: 'eavfwOAuth2Api',
                required: true,
            },
        ],

        ...description
    }

    methods = {
        loadOptions
    };
    execute = router 

}

export default EAVFW;