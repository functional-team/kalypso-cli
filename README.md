# kalypso-cli


## Installation

kalypso-cli is a Javascript Application written in Typescript that requires node to run. Assuming `node` and `npm` are working you just clone the repo and run:

   ```shell
   npm install
   ```

In most cases you'll need the Azure CLI `az` as well in order to properly authenticate before running a crawl.  

## Documentation

Starting a crawl run is as simple as:

   ```shell
   az login
   npm run crawl
   ```

The crawl command supports two parameters:

* `--output-path`: file path for where the output JSON is getting stored. Defaults to ./crawled.json
* `--azure-query`: A KQL query that narrows down what resources should be crawled. Please refer to https://aka.ms/AzureResourceGraph-QueryLanguage for a reference.

