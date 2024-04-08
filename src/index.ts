import { log } from "./log";
import { decode, encode } from "./rpc";
import {
  InitializeRequest,
  InitializeResponse,
} from "./types";

log('Starting');

process.stdin.on('data', data => {
  let message = decode(data);

  if (!message) {
    log('Something went wrong: %s', data.toString());

    return;
  }

  switch (message.method) {
    case 'initialize': {
      let request = message as InitializeRequest;

      log('Connected to: %s %s', request.params.clientInfo?.name ?? 'n/a', request.params.clientInfo?.version ?? 'n/a');

      let result: InitializeResponse = {
        id: request.id,
        jsonrpc: request.jsonrpc,
        result: {
          serverInfo: {
            name: 'configlsp',
            version: '0.1',
          },
          capabilities: {},
        },
      };

      process.stdout.write(encode(result));

      break;
    }

    default: {
      log('Method %s not found', message.method);
      log(JSON.stringify(message, null, 2));

      break;
    }
  }
});
