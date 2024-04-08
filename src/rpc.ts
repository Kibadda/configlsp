import { log } from "./log";
import {
  Notification,
  Request,
  Response,
} from "./types/base";

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

export function encode(data: Response): string {
  let content = JSON.stringify(data);

  return `Content-Length: ${content.length}\r\n\r\n${content}`;
}
