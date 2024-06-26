import { log } from "./log";
import { Request, Notification, Message } from "./lsp/base";

export function split(data: Buffer): Buffer | null {
  let split = data.toString().split(/\r\n\r\n/);

  if (split.length < 2) {
    return null;
  }

  let header = split[0];
  let match = header.match(/^Content\-Length: (\d+)$/);

  if (!match || match.length < 2) {
    return null;
  }

  let length = parseInt(match[1]);

  if (split[1].length < length) {
    return null;
  }

  return data.subarray(0, header.length + 4 + length);
}

export function decode(data: Buffer): Request | Notification | null {
  let split = data.toString().split(/\r\n\r\n/);

  if (split.length != 2) {
    log('split into %d parts', split.length);

    return null;
  }

  let header = split[0];
  let content = split[1];

  let match = header.match(/^Content\-Length: (\d+)$/);

  if (!match || match.length < 2) {
    log('match is empty or match did not find number');

    return null;
  }

  let length = parseInt(match[1]);
  let contentLength = Buffer.from(content).length

  if (length != contentLength) {
    log('expected: %d, actual: %d', length, contentLength);

    return null;
  }

  return JSON.parse(content);
}

export function encode(data: Message): string {
  let content = JSON.stringify(data);

  return `Content-Length: ${content.length}\r\n\r\n${content}`;
}
