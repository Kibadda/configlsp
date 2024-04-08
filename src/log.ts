import { createWriteStream } from "fs";
import { format } from "util";

const file = createWriteStream(__dirname + '/lsp.log', { flags: 'w' });

export function log(message: string, ...replacements: any[]): void {
  file.write(format(`[%s] ${message}\n`, new Date(), ...replacements));
}
