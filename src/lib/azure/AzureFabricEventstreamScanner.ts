import {createInterface} from "readline";
import { DefaultAzureCredential } from "@azure/identity";
import axios from "axios";

export async function AzureFabricEventstreamScanner(eventstreamresource:any, token:string):Promise<any> {

    const rl = createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    let resource:any = {};

    try {
        rl.write("\nSCAN EVENTSTREAM : " + eventstreamresource.id);

        const eventstreamUrl = `https://api.fabric.microsoft.com/v1/workspaces/${eventstreamresource.workspaceId}/eventstreams/${eventstreamresource.id}/getDefinition`;
        const eventstreamResp = await axios.post(eventstreamUrl, 
            {}, 
            {headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
        const eventstreamDefParts = eventstreamResp.data.definition.parts || [];
        for (const part of eventstreamDefParts) {
            if (part.path == "eventstream.json") {
                const payload_b64 = part.payload;
                let bufferObj = Buffer.from(payload_b64, "base64");
                let decodedString = bufferObj.toString("utf8");
                let def = JSON.parse(decodedString);
                resource["sources"] = def.sources
                resource["destinations"] = def.destinations

            }
        }

    } catch(err) {
        rl.write(" ERROR.");
    }

    rl.write("\n");
    return resource;
}
