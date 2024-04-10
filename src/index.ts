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

    handle(data).then(message => {
      if (Array.isArray(message)) {
        message.forEach(m => {
          process.stdout.write(encode(m));
        });
      } else if (message) {
        process.stdout.write(encode(message));
      }
    });

    if (buffer.length > 0) {
      listener.emit('data');
    }
  }
});
