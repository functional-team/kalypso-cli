#!/usr/bin/env node
import { Command } from 'commander';
import { CrawlCommand } from './commands';
import * as packageJSON from '../package.json';
import {parse} from 'JSONStream';
import stream from 'stream';

import pump from 'pump';

const program = new Command();

program
    .version(packageJSON.version)
    .name('kalypso-cli')
    .description('CLI to crawl Azure');

program.addCommand(CrawlCommand());


parse('*')
if (! process.stdin.isTTY) {

    process.exit(0)
}


program.parseAsync()