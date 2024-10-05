import {Client, KustoConnectionStringBuilder} from 'azure-kusto-data';
import {createInterface} from "readline";

export async function AzureKustoClusterScanner(kustoclusterresource:any):Promise<any> {

    const rl = createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    let resources:any = {};
    resources[kustoclusterresource.id] = kustoclusterresource;

    try {
        rl.write("\nSCAN KUSTO CLUSTER : " + kustoclusterresource.properties.uri);
        const kustoClient = new Client(KustoConnectionStringBuilder.withAzLoginIdentity(kustoclusterresource.properties.uri));
        
        const databasesrows = (await kustoClient.execute(null, ".show databases")).primaryResults[0].rows();
        for (const databaserow of databasesrows) {
            const databaseresource = JSON.parse(JSON.stringify(databaserow));
            databaseresource["subscriptionId"] = kustoclusterresource.subscriptionId;
            databaseresource["resourceGroup"] = kustoclusterresource.resourceGroup;
            databaseresource["id"] = kustoclusterresource.id+"/Databases/"+databaseresource.DatabaseName;
            databaseresource["type"] = "Microsoft.Kusto/Clusters/Databases";
            databaseresource["name"] = databaseresource.DatabaseName;
            
            rl.write("\nSCAN KUSTO DATABASE: "+databaseresource.name+ ": ");

            resources[databaseresource.id] = databaseresource;
            
            try {
                const schemata = {};
                const columns = (await kustoClient.execute(databaseresource.DatabaseName, ".show database "+databaseresource.DatabaseName+" schema")).primaryResults[0].rows();
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
                const policies = (await kustoClient.execute(databaseresource.DatabaseName, ".show table * policy update")).primaryResults[0].rows();
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
                const tables = (await kustoClient.execute(databaseresource.DatabaseName, ".show tables details")).primaryResults[0];
                for (const table of tables.rows()) {

                    counter++;

                    const payload = JSON.parse(JSON.stringify(table));
                    payload["schema"] = schemata[table.TableName];
                    payload["UpdatePolicies"] = updatepolicies[table.TableName];
                    payload["id"] = databaseresource.id+"/Tables/"+table.TableName;
                    payload["name"] = table.TableName;
                    payload["type"] = databaseresource.type + "/Tables"
                    payload["subscriptionId"] = kustoclusterresource.subscriptionId;
                    payload["resourceGroup"] = kustoclusterresource.resourceGroup;
                    resources[payload.id] = payload;
                }
                rl.write(counter + " Tables. ");
                
                var counter = 1;
                const functions = (await kustoClient.execute(databaseresource.DatabaseName, ".show functions")).primaryResults[0];
                for (const functionrow of functions.rows()) {

                    counter++;

                    const payload = JSON.parse(JSON.stringify(functionrow));
                    payload["id"] = databaseresource.id+"/Functions/"+functionrow.Name;
                    payload["name"] = functionrow.Name;
                    payload["type"] = databaseresource.type + "/Functions";
                    payload["subscriptionId"] = kustoclusterresource.subscriptionId;
                    payload["resourceGroup"] = kustoclusterresource.resourceGroup;
                    resources[payload.id] = payload;
                }
                rl.write(counter + " Functions. ");

                var counter = 1;
                const views = (await kustoClient.execute(databaseresource.DatabaseName, ".show materialized-views")).primaryResults[0];
                for (const view of views.rows()) {

                    counter++;

                    const payload = JSON.parse(JSON.stringify(view));
                    payload["id"] = databaseresource.id+"/MaterializedViews/"+view.Name;
                    payload["name"] = view.Name;
                    payload["type"] = databaseresource.type + "/MaterializedViews";
                    payload["subscriptionId"] = kustoclusterresource.subscriptionId;
                    payload["resourceGroup"] = kustoclusterresource.resourceGroup;
                    resources[payload.id] = payload;
                }
                rl.write(counter + " Materialized Views. ");

                var counter = 1;
                const externaltables = (await kustoClient.execute(databaseresource.DatabaseName, ".show external tables")).primaryResults[0];
                for (const externaltable of externaltables.rows()) {

                    counter++;

                    const payload = JSON.parse(JSON.stringify(externaltable));
                    payload["schema"] = schemata[externaltable.TableName];
                    payload["id"] = databaseresource.id+"/ExternalTables/"+externaltable.Name;
                    payload["name"] = externaltable.Name;
                    payload["type"] = databaseresource.type + "/ExternalTables";
                    payload["subscriptionId"] = kustoclusterresource.subscriptionId;
                    payload["resourceGroup"] = kustoclusterresource.resourceGroup;
                    resources[payload.id] = payload;
                }
                rl.write(counter + " External Tables. ");

            } catch (e) {
                rl.write(" ERROR. ");
            }

        }
    } catch(err) {
        rl.write(" ERROR.");
    }

    rl.write("\n");
    return resources;
}
