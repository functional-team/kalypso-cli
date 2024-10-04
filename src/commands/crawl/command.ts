import { Command } from 'commander';
import { Options } from './options';
import { ResourceGraphClient } from "@azure/arm-resourcegraph";
import { AzureKustoScanner } from '../../lib/azure/AzureKustoClusterScanner';
import  * as fs from 'fs';

const { DefaultAzureCredential } = require("@azure/identity");
type CommandInput = {
  options: Options;
};

export function CrawlCommand(): Command {
  const command = new Command()
    .createCommand('crawl')
    .description('Crawl Azure Resources')
    .option("-o|--output-path [string]", "path to output file, default is set in configuration", "crawled.json")
    .option("-q|--azure-query [string]", "Use Resource Graph Query to specify scope of the crawl", "Resources | where type contains 'microsoft.kusto/clusters' and name contains 'dev' | project id, name, type, location, subscriptionId, resourceGroup")
    .action(action)

  return command;
}


async function action(options: Options) {
  
  let startTime = new Date();

  let azureresources:any = {};
  const creds = new DefaultAzureCredential();

  const client = new ResourceGraphClient(creds, {})
  const graphresources = await client.resources({query: options.query})

  for (const resource of graphresources.data) {
    if (resource.type=="microsoft.kusto/clusters") {
      const kustoclusters = await AzureKustoScanner(creds, resource);
      azureresources = {...azureresources, ...kustoclusters};
    }
  }
  let finishTime = new Date();

  const exportdata = {"crawl": {"metadata": {"crawlerversion":"1.0", "started": startTime, "finished": finishTime}, "resources":azureresources}, "layout": null};
  
  fs.writeFile(options.outputPath, JSON.stringify(exportdata),
    function (err) {
      if (err) {
        console.log(`WRITE OUTPUT FILE : ERROR: ${options.outputPath}!`);
        console.log(err);
        process.exit(1);
      }
      else {
        console.log(`WRITE OUTPUT FILE  : ${options.outputPath}`);
        process.exit(0);
      }
    }
  );

}