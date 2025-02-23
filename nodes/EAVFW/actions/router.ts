import { IExecuteFunctions, INodeExecutionData, NodeExecutionWithMetadata } from "n8n-workflow";
import { EAVFW } from "./node.type";
import { execute_create } from "./create/execute";
import { execute_upsert } from "./upsert/execute";
import { execute_query } from "./query/execute";


export async function router(this: IExecuteFunctions): Promise<INodeExecutionData[][] | NodeExecutionWithMetadata[][] | null> {
	const items = this.getInputData();
	const returnData: INodeExecutionData[] = [];

	const resource = this.getNodeParameter('table', 0) as string;
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