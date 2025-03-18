import {Transform, TransformOptions, TransformCallback} from 'stream';

export class CachingTransform extends Transform {
  chunkCache: Array<any>
  constructor(opts?: CachingTransformOptions) {
      super(opts)
      this.chunkCache = [];
  }
}

export interface CachingTransformOptions extends TransformOptions {
  transform?(this: CachingTransform, chunk: any, encoding: BufferEncoding, callback: TransformCallback): void;
}



export const jsonCutTransform = new CachingTransform({
  readableObjectMode: true,
  writableObjectMode: true,
  transform(chunk, encoding, callback) {
      if (this.chunkCache.length > 0) {
        chunk = Buffer.concat(this.chunkCache.concat([chunk]))
        // chunk = Buffer.from(this.chunkCache.join('') + chunk)
        this.chunkCache = []
      }
      const [encodedBrace,encodedBracket, encodedBraceC, encodedBracketC] = Buffer.from('{[}]', encoding? 'utf-8' : encoding).values()
      while (chunk.length > 0) {
      let opener, closer, start;
      let iBrace = chunk.indexOf(encodedBrace);
      let iBracket = chunk.indexOf(encodedBracket);
      if (iBrace >=0 && (iBracket < 0 || iBrace < iBracket)) {
          opener = encodedBrace;
          closer = encodedBraceC;
          start = iBrace;
      } else if (iBracket >=0 && (iBrace <0 || iBracket < iBrace)) {
          opener = encodedBracket
          closer = encodedBracketC
          start = iBracket;
      } else {
          this.chunkCache.push(chunk)
          break;
      }
      let counter = 0;
      chunk = chunk.slice(start,chunk.length)
      for (let [i,b] of chunk.entries()) {
          if (b == opener) counter++;
          else if (b == closer) counter--;
          if (counter==0) {
              this.push(chunk.slice(0,i).toString());
              chunk=chunk.slice(i+1,chunk.length)
              break;
          }
      }
      if (counter != 0) {
          this.chunkCache.push(chunk)
          break;
      }
  }
      callback();
    }
  });