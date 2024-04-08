import { log } from "./log";
import { decode } from "./rpc";

log('Starting');

process.stdin.on('data', data => {
  let message = decode(data);

  if (!message) {
    log('Something went wrong: %s', data.toString());

    return;
  }

  switch (message.method) {
    default: {
      log('Method %s not found', message.method);
      log(JSON.stringify(message, null, 2));

      break;
    }
  }
});
