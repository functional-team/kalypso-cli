import {KustoManagementClient, ReadOnlyFollowingDatabase, ReadWriteDatabase} from '@azure/arm-kusto';
import {Client, KustoConnectionStringBuilder, ClientRequestProperties} from 'azure-kusto-data';
import {createInterface} from "readline";

export async function AzureKustoScanner(creds: any, kustoclusterresource:any):Promise<any> {

    const rl = createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    const kusto = new KustoManagementClient(creds, kustoclusterresource.subscriptionId);
    const cluster = await kusto.clusters.get(kustoclusterresource.resourceGroup, kustoclusterresource.name);
    const resources:any = {};

    rl.write("SCAN KUSTO CLUSTER : " + cluster.name+": ");

    cluster["subscriptionId"] = kustoclusterresource.subscriptionId;
    cluster["resourceGroup"] = kustoclusterresource.resourceGroup;
    resources[cluster.id] = cluster;

    if (cluster.state != "Stopped") {

        const kustoClient = new Client(KustoConnectionStringBuilder.withAzLoginIdentity(cluster.uri));
        const databases = await kusto.databases.listByCluster(kustoclusterresource.resourceGroup, cluster.name);
        rl.write("RUNNING.");

        for await (const database of databases) {
            
            // TODO: resources should not be an array but a map, keyed by ResourceId or extensionResourceId
            // https://learn.microsoft.com/en-us/azure/azure-resource-manager/templates/template-functions-resource

            if (database.kind == "ReadWrite") {
                const rwdatabase = database as ReadWriteDatabase;
                rwdatabase["subscriptionId"] = kustoclusterresource.subscriptionId;
                rwdatabase["resourceGroup"] = kustoclusterresource.resourceGroup;
                resources[rwdatabase.id] = rwdatabase;
                                       
                rl.write("\nSCAN KUSTO DATABASE: "+database.name+ ": ");
            } else 
            if (database.kind == "ReadOnlyFollowing") {
                const rodatabase = database as ReadOnlyFollowingDatabase;
                rodatabase["subscriptionId"] = kustoclusterresource.subscriptionId;
                rodatabase["resourceGroup"] = kustoclusterresource.resourceGroup;
                resources[rodatabase.id] = rodatabase;
                rl.write("\nSCAN KUSTO DATABASE: "+database.name+ ": ");
            }

            try {
                const schemata = {};
                const columns = (await kustoClient.execute(database.name.split("/")[1], ".show database "+database.name.split("/")[1]+" schema")).primaryResults[0].rows();
                for (const column of columns) {
                    const columnrow = JSON.parse(JSON.stringify(column));
                    const tablename = columnrow.TableName;
                    delete columnrow["DatabaseName"]
                    delete columnrow["TableName"]
                    if (!(tablename in schemata)) {schemata[tablename] = []}
                    schemata[tablename].push(columnrow)
                }
                rl.write(Object.keys(schemata).length + " Schemas. ");

                const updatepolicies = {};
                const policies = (await kustoClient.execute(database.name.split("/")[1], ".show table * policy update")).primaryResults[0].rows();
                for (const policy of policies) {
                    const policyrow = JSON.parse(JSON.stringify(policy));
                    const tablename = policyrow.EntityName.split(".")[1].replace("[", '').replace("]", '')
                    delete policyrow["PolicyName"]
                    delete policyrow["EntityName"]
                    delete policyrow["EntityType"]
                    if (!(tablename in updatepolicies)) {updatepolicies[tablename] = []}
                    updatepolicies[tablename].push(policyrow)
                }
                rl.write(Object.keys(updatepolicies).length + " Update Policies. ");

                var counter = 1;
                const tables = (await kustoClient.execute(database.name.split("/")[1], ".show tables details")).primaryResults[0];
                for (const table of tables.rows()) {

                    counter++;

                    const payload = JSON.parse(JSON.stringify(table));
                    payload["schema"] = schemata[table.TableName];
                    payload["UpdatePolicies"] = updatepolicies[table.TableName];
                    payload["id"] = database.id+"/Tables/"+table.TableName;
                    payload["name"] = table.TableName;
                    payload["type"] = database.type + "/Tables"
                    resources[payload.id] = payload;
                }
                rl.write(counter + " Tables. ");
                
                var counter = 1;
                const functions = (await kustoClient.execute(database.name.split("/")[1], ".show functions")).primaryResults[0];
                for (const functionrow of functions.rows()) {

                    counter++;

                    const payload = JSON.parse(JSON.stringify(functionrow));
                    payload["id"] = database.id+"/Functions/"+functionrow.Name;
                    payload["name"] = functionrow.Name;
                    payload["type"] = database.type + "/Functions"
                    resources[payload.id] = payload;
                }
                rl.write(counter + " Functions. ");

                var counter = 1;
                const views = (await kustoClient.execute(database.name.split("/")[1], ".show materialized-views")).primaryResults[0];
                for (const view of views.rows()) {

                    counter++;

                    const payload = JSON.parse(JSON.stringify(view));
                    payload["id"] = database.id+"/MaterializedViews/"+view.Name;
                    payload["name"] = view.Name;
                    payload["type"] = database.type + "/MaterializedViews"
                    resources[payload.id] = payload;
                }
                rl.write(counter + " Materialized Views. ");

                var counter = 1;
                const externaltables = (await kustoClient.execute(database.name.split("/")[1], ".show external tables")).primaryResults[0];
                for (const externaltable of externaltables.rows()) {

                    counter++;

                    const payload = JSON.parse(JSON.stringify(externaltable));
                    payload["schema"] = schemata[externaltable.TableName];
                    payload["id"] = database.id+"/ExternalTables/"+externaltable.Name;
                    payload["name"] = externaltable.Name;
                    payload["type"] = database.type + "/ExternalTables"
                    resources[payload.id] = payload;
                }
                rl.write(counter + " External Tables. ");

            } catch (e) {
                rl.write("ERROR. ");
            }

        }
    } else {
        rl.write("NOT RUNNING.");
     }
 
    rl.write("\n")
    return resources;
}
