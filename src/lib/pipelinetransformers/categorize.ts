import { CachingTransform } from "./transformers"

export const categorize = new CachingTransform({
    readableObjectMode: true,
    writableObjectMode: true,
    transform(chunk, encoding, callback) {
      if ( chunk.indexOf('k8s') >= 0 || chunk.indexOf('kubernetes') >= 0)
      console.log("assuming kubernetes resource")
      console.log("---")
      callback();
    }    
})