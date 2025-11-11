import {createInterface} from "readline";
import { DefaultAzureCredential } from "@azure/identity";
import axios from "axios";
import { EventHubManagementClient } from "@azure/arm-eventhub";

export async function AzureEventHubScanner(eventhubnamespaceresource:any):Promise<any> {

    const rl = createInterface({
        input: process.stdin,
        output: process.stdout
    });

    let resources:any = {};

    try {
        rl.write("\nSCAN EVENTHUB NAMESPACE : " + eventhubnamespaceresource.id);

        const client = new EventHubManagementClient(new DefaultAzureCredential(), eventhubnamespaceresource.subscriptionId);

        const eventHubs = await client.eventHubs.listByNamespace(eventhubnamespaceresource.resourceGroup, eventhubnamespaceresource.name);
        for await (const eh of eventHubs) {

            let eventhub:any = {};
            eventhub["subscriptionId"] = eventhubnamespaceresource.subscriptionId;
            eventhub["resourceGroup"] = eventhubnamespaceresource.resourceGroup;
            eventhub["id"] = eventhubnamespaceresource.id+"/EventHubs/"+eh.name;
            eventhub["type"] = "Microsoft.EventHub/namespaces/eventHubs";
            eventhub["name"] = eh.name;

            rl.write("\n  EVENTHUB: " + eventhub["name"]);
            resources[eventhub.id] = eventhub;
        }

    } catch(err) {
        rl.write(" ERROR.", err);
    }

    rl.write("\n");
    return resources;
}
