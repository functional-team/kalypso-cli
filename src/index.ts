#!/usr/bin/env node
import { Command } from 'commander';
import { CrawlCommand } from './commands';
import * as packageJSON from '../package.json';

const program = new Command();

program
    .version(packageJSON.version)
    .name('kalypso-cli')
    .description('CLI to crawl Azure');

program.addCommand(CrawlCommand());

program.parseAsync()