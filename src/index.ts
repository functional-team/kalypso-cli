#!/usr/bin/env node
import { Command } from 'commander';
import { CrawlCommand } from './commands';
import * as packageJSON from '../package.json';
import {parse} from 'JSONStream';
import {pipeline}  from 'stream/promises';
import {Transform, TransformCallback, TransformOptions, Readable} from 'stream';
import { CachingTransform, jsonCutTransform} from './lib/pipelinetransformers/transformers';
import { categorize } from './lib/pipelinetransformers/categorize';

async function app() {
const program = new Command();

program
    .version(packageJSON.version)
    .name('kalypso-cli')
    .description('CLI to crawl Azure');

program.addCommand(CrawlCommand());


const storedDocuments = []
const store = new Transform({
    readableObjectMode: true,
    writableObjectMode: true,
    transform(chunk, encoding, callback) {
        storedDocuments.push(chunk);
        // this.push(chunk);
        callback();
    }
})

const printJson = new Transform({
    readableObjectMode: true,
    writableObjectMode: true,
    transform(chunk, encoding, callback) {
        console.log(chunk)
        callback();
    },

})
const nop = new Transform({
    readableObjectMode: true,
    writableObjectMode: true,
    transform(chunk, encoding, callback) {
        callback();
    },

})

if (! process.stdin.isTTY) {
    
    try{
        await pipeline(process.stdin, jsonCutTransform ,categorize, nop)
        console.log("pipeline finished");
        console.log(storedDocuments.length);
    } catch(e) {
        console.log("error")
        console.log(e)
    }
}

program.parseAsync()

}
app()