import { log } from "./log";
import { encode, split } from "./rpc";
import { handle } from "./handler";
import * as EventEmitter from "events";

log('Starting');

const listener = new EventEmitter();
let buffer = Buffer.from('');

process.stdin.on('data', data => {
  buffer = Buffer.concat([buffer, data]);
  listener.emit('data');
});

listener.on('data', () => {
  let data = split(buffer);

  if (data) {
    buffer = buffer.subarray(data.length);

    handle(data).then(response => {
      if (response) {
        process.stdout.write(encode(response));
      }
    });

    if (buffer.length > 0) {
      listener.emit('data');
    }
  }
});
