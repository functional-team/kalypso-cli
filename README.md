# kalypso-cli

Discover Azure resources [querying](https://aka.ms/AzureResourceGraph-QueryLanguage) Azure Resource Graph, crawl additional info and store everything into a local JSON file, which can be used with https://kalypso.tools  

Support currently limited to resource type `microsoft.kusto/clusters`

The CLI expects you to be authenticated in Azure already. This typically achieved with running `az login` before.


## Install the latest precompiled binary

```sh
curl -fsSL https://raw.githubusercontent.com/functional-team/kalypso-cli/refs/heads/main/install.sh | sh
```

## Usage

### Command line utility

```sh
Usage: kalypso-cli crawl [options]

Crawl Azure Resources

Options:
  -o|--output-path [string]     path to output file, default is set in configuration (default: "crawled.json")
  -q|--az-graph-query [string]  Use Resource Graph Query to specify scope of the crawl
  -k|--az-kusto-uri [string]    Use Kusto Cluster URI to crawl specific Cluster only
  -h, --help                    display help for command
```

### Examples

Using the precompiled binaries:

```sh
az login
kalypso-cli crawl --output-path "resources.json" --az-graph-query "type == 'microsoft.kusto/clusters' and resourceGroup contains 'dev'"
```

Cloning the repo and using an existing node.js installation

```sh
npm install
az login
npx ts-node ./src/index.ts crawl --output-path "resources.json" --az-graph-query "type == 'microsoft.kusto/clusters' and resourceGroup contains 'dev'"
```

## Developer guide 

### Build precompiled binaries (experimental)

   We use https://github.com/james-pre/xsea to ease the creation of single executable apps for all major platforms:

   ```shell
   npm install --global xsea
   sudo npm run build && sudo npm run package 
   ```
