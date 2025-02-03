// the cli may emit pretty large json files that can be challenging to navigate
// a little utility helps to extract relevant parts of the output
// The idea is to use the debugger view of vs code, wich allows to drill into large object trees
// inspired by https://dev.to/dtinth/viewing-and-navigating-huge-json-files-with-ease-using-visual-studio-code-246m

const data = require('./resources.json');
let clone = [];
let types = new Set();
for(const i in data.crawl.resources) {
    const r = data.crawl.resources[i];
    types.add(r.type);
    if (r.type == "Microsoft.Kusto/Clusters/Databases/ContinuousExports") {
        clone.push(structuredClone(r));
    }
}
debugger