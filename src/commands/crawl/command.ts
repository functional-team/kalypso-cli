import { Command } from 'commander';
import { Options } from './options';
import { ResourceGraphClient } from "@azure/arm-resourcegraph";
import { AzureKustoClusterScanner } from '../../lib/azure/AzureKustoClusterScanner';
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
    .option("-q|--az-graph-query [string]", "Use Resource Graph Query to specify scope of the crawl")
    .option("-k|--az-kusto-uri [string]", "Use Kusto Cluster URI to crawl specific Cluster only")
    .action(action)

  return command;
}


async function action(options: Options) {
  
  let startTime = new Date();

  let azureresources:any = {};
  const creds = new DefaultAzureCredential();

  if (options.azGraphQuery) {
    const client = new ResourceGraphClient(creds, {})
    const graphresources = await client.resources({query: options.azGraphQuery})
  
    for (const resource of graphresources.data) {
      if (resource.type=="microsoft.kusto/clusters") {
        const kustoclusters = await AzureKustoClusterScanner(resource);
        azureresources = {...azureresources, ...kustoclusters};
      }
    }

  }
  if (options.azKustoUri) {
    const resource = {
      type: "microsoft.kusto/clusters",
      subscriptionId: "",
      resourceGroup: "",
      properties: {
        uri: options.azKustoUri
      }
    }
    const kustoclusters = await AzureKustoClusterScanner(resource);
    azureresources = {...azureresources, ...kustoclusters};
  }


  let finishTime = new Date();

  const exportdata = {"crawl": {"metadata": {"crawlerversion":"1.0", "started": startTime, "finished": finishTime, "az-graph-query": options.azGraphQuery}, "resources":azureresources}, "layout": null};
  
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