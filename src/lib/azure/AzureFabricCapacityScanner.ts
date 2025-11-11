import { DefaultAzureCredential } from "@azure/identity";
import axios from "axios";
import { AzureFabricEventhouseScanner } from "./AzureFabricEventhouseScanner";
import { AzureFabricEventstreamScanner } from "./AzureFabricEventstreamScanner";

/**
 * Scans a Microsoft Fabric Capacity resource and returns its details, including listing workspaces and their eventhouses via Fabric Core REST API.
 * For each eventhouse, invokes AzureKustoClusterScanner with a resource object mapping queryServiceUri to properties.uri.
 * @param fabricCapacityResourceFromGraph The resource object for the Fabric Capacity
 * @returns A Promise resolving to an object containing scanned resource details
 */
export async function AzureFabricCapacityScanner(fabricCapacityResourceFromGraph: any): Promise<any> {
    let resources: any = {};
    let fabricCapacityResource:any = {};

    // Authenticate and get an access token for the Fabric Core REST API
    const credential = new DefaultAzureCredential();
    const token = (await credential.getToken("https://api.fabric.microsoft.com/.default"))?.token;
    if (!token) {
        console.error("Could not acquire Fabric API access token");
        return resources;  
    }
    else {
        console.debug(`Bearer Token for accessing Fabric: ${token}`);
    }

    // Fetch all capacities and replace fabricCapacityResource with the full object from the API
    try {
        const capacitiesResp = await axios.get("https://api.fabric.microsoft.com/v1/capacities", {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
        const allCapacities = capacitiesResp.data.value || [];
        const matchedCapacity = allCapacities.find((cap: any) => cap.displayName === fabricCapacityResourceFromGraph.name);
        if (matchedCapacity) {
            fabricCapacityResource = matchedCapacity;
        } else {
            console.error(`Could not find capacity with name ${fabricCapacityResourceFromGraph.name}`);
            return resources;
        }
    } catch (err) {
        console.error("Error fetching capacities:", err?.response?.data || err);
        return resources;
    }

    resources[fabricCapacityResourceFromGraph.id] = fabricCapacityResourceFromGraph;

    // Print/log the resource being scanned
    console.log("SCAN FABRIC CAPACITY : " + (fabricCapacityResourceFromGraph.name));

    // Get the capacityId (name) for filtering workspaces
    const capacityId = fabricCapacityResource.id.split("/").pop();

    // Call the Fabric Core REST API to list all connections
    let allConnectionsUrl = "https://api.fabric.microsoft.com/v1/connections";
    let allConnectionsContinuationToken: string | undefined = undefined;
    try {
        do {
            const response = await axios.get(allConnectionsUrl, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
            const data = response.data;
            if (data.value) {

                for (const con of data.value) {
                    let connection = con;
                    connection["type"] = "Microsoft.Fabric/Connections";
                    connection["id"] = "/subscriptions/"+fabricCapacityResourceFromGraph.subscriptionId+"/resourceGroups/"+fabricCapacityResourceFromGraph.resourceGroup+"/providers/Microsoft.Fabric/Connections/"+connection.id;
                    connection["subscriptionId"] = fabricCapacityResourceFromGraph.subscriptionId || undefined;
                    connection["resourceGroup"] = fabricCapacityResourceFromGraph.resourceGroup || undefined;
                    resources[connection.id] = connection;
                }

            }
            allConnectionsContinuationToken = data.continuationToken;
            if (allConnectionsContinuationToken) {
                allConnectionsUrl = `https://api.fabric.microsoft.com/v1/connections?continuationToken=${encodeURIComponent(allConnectionsContinuationToken)}`;
            }
        } while (allConnectionsContinuationToken);
    
    } catch (err) {
        console.error("Error listing connections for Fabric capacity:", err?.response?.data || err);
    }

    // Call the Fabric Core REST API to list all workspaces
    let url = "https://api.fabric.microsoft.com/v1/workspaces";
    let allWorkspaces: any[] = [];
    let continuationToken: string | undefined = undefined;
    try {
        do {
            const response = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
            const data = response.data;
            if (data.value) {
                allWorkspaces.push(...data.value);
            }
            continuationToken = data.continuationToken;
            if (continuationToken) {
                url = `https://api.fabric.microsoft.com/v1/workspaces?continuationToken=${encodeURIComponent(continuationToken)}`;
            }
        } while (continuationToken);

        // For each workspace, fetch its details to get the capacityId
        const workspaceDetails: any[] = [];
        for (const ws of allWorkspaces) {
            try {
                const wsDetailResp = await axios.get(`https://api.fabric.microsoft.com/v1/workspaces/${ws.id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                });
                workspaceDetails.push(wsDetailResp.data);
            } catch (err) {
                console.error(`  Error fetching details for workspace ${ws.id}:`, err?.response?.data || err);
            }
        }

        // Filter workspaces by capacityId (name)
        const matchingWorkspaces = workspaceDetails.filter(ws => ws.capacityId === capacityId);
        console.log(`Found ${matchingWorkspaces.length} workspaces assigned to capacity ${capacityId}`);
        for (const ws of matchingWorkspaces) {

            const workspace = JSON.parse(JSON.stringify(ws));
            workspace["type"] = "Microsoft.Fabric/Workspaces";
            workspace["id"] = "/subscriptions/"+fabricCapacityResourceFromGraph.subscriptionId+"/resourceGroups/"+fabricCapacityResourceFromGraph.resourceGroup+"/providers/Microsoft.Fabric/Workspaces/"+ws.id;
            resources[workspace.id] = workspace;

            // Query eventhouses for each workspace
            try {
                const eventhouseUrl = `https://api.fabric.microsoft.com/v1/workspaces/${ws.id}/eventhouses`;
                const eventhouseResp = await axios.get(eventhouseUrl, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                });
                const eventhouses = eventhouseResp.data.value || [];
                console.log(`  WORKSPACE ${ws.displayName} ID ${ws.id}: Found ${eventhouses.length} eventhouses`);
                for (const eh of eventhouses) {
                    
                    const eventhouseresource = {
                        type: "microsoft.fabric/eventhouses",
                        id: workspace.id + "/Eventhouses/"+eh.id,
                        name: eh.displayName,
                        displayName: eh.displayName,
                        properties: {
                            uri: eh.properties.queryServiceUri
                        },
                        subscriptionId: fabricCapacityResourceFromGraph.subscriptionId || undefined,
                        resourceGroup: fabricCapacityResourceFromGraph.resourceGroup || undefined
                    };
                    resources[eventhouseresource.id] = eventhouseresource;

                    // Invoke AzureFabricEventhouseScanner for each eventhouse
                    if (eh.properties?.queryServiceUri) {
                        try {
                            const kustoResources = await AzureFabricEventhouseScanner(eventhouseresource);
                            resources = { ...resources, ...kustoResources };
                        } catch (kerr) {
                            console.error(`    Error scanning Kusto cluster for eventhouse ${eh.id}:`, kerr);
                        }
                    }
                }
            } catch (err) {
                console.error(`  Error listing eventhouses for workspace ${ws.id}:`, err?.response?.data || err);
            }

            try {
                const eventstreamUrl = `https://api.fabric.microsoft.com/v1/workspaces/${ws.id}/eventstreams`;
                const eventstreamResp = await axios.get(eventstreamUrl, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                });
                const eventstreams = eventstreamResp.data.value || [];
                console.log(`  WORKSPACE ${ws.displayName} ID ${ws.id}: Found ${eventstreams.length} eventstreams`);
                for (const es of eventstreams) {
                    const eventstreamDef = await AzureFabricEventstreamScanner(es, token);
                    const eventstreamMeta = {
                        type: "microsoft.fabric/eventstreams",
                        id: workspace.id + "/Eventstreams/"+es.id,
                        name: es.displayName,
                        displayName: es.displayName,
                        subscriptionId: fabricCapacityResourceFromGraph.subscriptionId || undefined,
                        resourceGroup: fabricCapacityResourceFromGraph.resourceGroup || undefined
                    }
                    
                    resources[eventstreamMeta.id] = {...eventstreamMeta, ...eventstreamDef};
                }

            } catch (err) {
                console.error(`  Error listing eventstreams for workspace ${ws.id}:`, err?.response?.data || err);
            }                
            
        }
    } catch (err) {
        console.error("Error listing workspaces for Fabric capacity:", err?.response?.data || err);
    }

    return resources;
} 