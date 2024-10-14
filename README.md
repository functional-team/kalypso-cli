# kalypso-cli

## Overview
kalypso-cli is a command line tool to crawl resources in your Azure subscription and store it as local JSON file.
This output can be used to visualise your resources in the [Kalypso UI] (https://kalypso.tools/). The UI is running locally in your browser. There is no backend or other service and thus no data transfer whatsoever happening with your data. Everything stays on your local computer. 

## Installation

### Prerequisites

- [npm and node.js](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) are installed
- [azure cli](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) is installed 


 you just clone the repo and run:

   ```shell
   npm install
   ```
 

## Documentation

### Quickstart
Starting a crawl run is as simple as:

   ```shell
   #authenticate to your azure subscription(s)
   az login

   #run crawler
   npm run crawl
   ```

The crawl command supports two parameters:

* `--output-path`: file path for where the output JSON is getting stored. Defaults to ./crawled.json
* `--azure-query`: A KQL query that narrows down what resources should be crawled. Please refer to https://aka.ms/AzureResourceGraph-QueryLanguage for a reference.

### Example

   ```shell
   az login
   ```
This command opens a browser window to authenticate with your Azure subscription. After sucessful authentication, you should be seeing details about your Azure subscription starting with:
   ```shell
   [
  {
    "cloudName": "AzureCloud",
    "homeTenantId": ...
   ```


Now, crawling can be initiated by 

   ```shell
   npm run crawl 
   ```
The command output should now look like this:
   ```shell
SCAN KUSTO CLUSTER : https://myawesomecluster.westeurope.kusto.windows.net
SCAN KUSTO DATABASE: myawesomedatabase: 45 Schemas. 63 Update Policies. 45 Tables. 143 Functions. 20 Materialized Views. 1 External Tables.
...
   ```


