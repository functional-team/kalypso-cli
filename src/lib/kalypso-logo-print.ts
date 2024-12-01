import boxen from "boxen";
import chalk from "chalk";

const header = 
'____  __.      .__                              _________                      .__                \n' +
'|    |/ _|____  |  | ___.__.______  __________   \\_   ___ \\____________ __  _  _|  |   ___________ \n' +
'|      < \\__  \\ |  |<   |  |\\____ \\/  ___/  _ \\  /    \\  \\/\\_  __ \\__  \\\ \\/ \\/ /  | _/ __ \\_  __ \\ \n' +
'|    |  \\ / __ \\|  |_\\___  ||  |_> >___ (  <_> ) \\     \\____|  | \\// __ \\\     /|  |_\\  ___/|  | \\/ \n' +
'|____|__ (____  /____/ ____||   __/____  >____/   \\______  /|__|  (____  /\\/\\_/ |____/\\___  >__|   \n' +
'        \\/    \\/     \\/     |__|       \\/                \\/            \\/                 \\/       \n';


export function kalypsoPrint(content: string) {
  console.log(boxen(chalk.yellowBright(header) + content, {
    padding: 1,
    margin: 1,
    borderStyle: 'round'
  }))

}