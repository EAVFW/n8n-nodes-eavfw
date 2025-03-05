import { IExecuteFunctions, INodeExecutionData, NodeExecutionWithMetadata } from "n8n-workflow";
import { execute_create } from "./create/execute";
import { execute_query } from "./query/execute";
import { execute_upsert } from "./upsert/execute";


export async function router(this: IExecuteFunctions): Promise<INodeExecutionData[][] | NodeExecutionWithMetadata[][] | null> {
	console.log('Executing router: ', this.getNodeInputs()); 
	const operation = this.getNodeParameter('operation', 0);


	switch (operation) {
		case "create_record":
			return await execute_create.call(this);
		case "upsert_record":
			return await execute_upsert.call(this);
		case "query_record":
            return await execute_query.call(this);
	}

    throw new Error(`The operation "${operation}" is not supported!`);
}