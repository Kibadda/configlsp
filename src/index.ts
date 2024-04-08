import { log } from "./log";
import { decode, encode } from "./rpc";
import { State } from "./state";
import {
  DidChangeTextDocumentNotification,
  DidCloseTextDocumentNotification,
  DidOpenTextDocumentNotification,
  InitializeRequest,
  InitializeResponse,
} from "./types";

log('Starting');

const state = new State();

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
          capabilities: {
            textDocumentSync: 2,
          },
        },
      };

      process.stdout.write(encode(result));

      break;
    }

    case 'textDocument/didOpen': {
      let notification = message as DidOpenTextDocumentNotification;

      log('Opened %s', notification.params.textDocument.uri);

      state.openTextDocument(notification);

      break;
    }

    case 'textDocument/didChange': {
      let notification = message as DidChangeTextDocumentNotification;

      log('Changed %s', notification.params.textDocument.uri);

      state.changeTextDocument(notification);

      break;
    }

    case 'textDocument/didClose': {
      let notification = message as DidCloseTextDocumentNotification;

      log('Closed %s', notification.params.textDocument.uri);

      state.closeTextDocument(notification);

      break;
    }

    default: {
      log('Method %s not found', message.method);
      log(JSON.stringify(message, null, 2));

      break;
    }
  }
});
