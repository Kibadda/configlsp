import { log } from "./log";
import { decode, encode } from "./rpc";
import { State } from "./state";
import * as base from "./types/base";
import * as notification from "./types/notification";
import * as request from "./types/request";
import * as response from "./types/response";

log('Starting');

const state = new State();

function write(result: base.Response): void {
  process.stdout.write(encode(result));
}

process.stdin.on('data', data => {
  let message = decode(data);

  if (!message) {
    log('Something went wrong: %s', data.toString());

    let result: base.Response = {
      id: null,
      jsonrpc: '2.0',
      error: {
        code: -32600,
        message: 'invalid request',
      },
    };

    write(result);

    return;
  }

  if (!['initialize', 'initialized', 'exit'].includes(message.method) && !state.isInitialized) {
    log('request/notification %s before initialized', message.method);

    let result: base.Response = {
      id: null,
      jsonrpc: '2.0',
      error: {
        code: -32002,
        message: 'server not initialized',
      },
    };

    write(result);

    return;
  }

  if (message.method != 'exit' && state.shouldExit) {
    log('request/notification %s after shutdown', message.method);

    return;
  }

  switch (message.method) {
    case 'initialize': {
      let request = message as request.InitializeRequest;

      log('Connected to: %s %s', request.params.clientInfo?.name ?? 'n/a', request.params.clientInfo?.version ?? 'n/a');

      let result: response.InitializeResponse = {
        id: request.id,
        jsonrpc: request.jsonrpc,
        result: {
          serverInfo: {
            name: 'configlsp',
            version: '0.1',
          },
          capabilities: {
            textDocumentSync: 2,
            codeLensProvider: {},
            executeCommandProvider: {
              commands: state.getCommands(),
            },
          },
        },
      };

      write(result);

      break;
    }

    case 'initialized': {
      log('initialized');

      state.isInitialized = true;

      break;
    }

    case 'shutdown': {
      let request: base.Request = message as base.Request;

      log('shutdown');

      state.shouldExit = true;

      let result: base.Response = {
        id: request.id,
        jsonrpc: request.jsonrpc,
        result: null,
      }

      write(result);

      break;
    }

    case 'exit': {
      log('exit');

      process.exit(!state.shouldExit ? 1 : 0);
    }

    case 'textDocument/didOpen': {
      let notification = message as notification.DidOpenNotification;

      log('Opened %s', notification.params.textDocument.uri);

      state.openTextDocument(notification);

      break;
    }

    case 'textDocument/didChange': {
      let notification = message as notification.DidChangeNotification;

      log('Changed %s', notification.params.textDocument.uri);

      state.changeTextDocument(notification);

      break;
    }

    case 'textDocument/didSave': {
      let notification = message as notification.DidSaveNotification;

      log('Saved %s', notification.params.textDocument.uri);

      state.saveTextDocument(notification);

      break;
    }

    case 'textDocument/didClose': {
      let notification = message as notification.DidCloseNotification;

      log('Closed %s', notification.params.textDocument.uri);

      state.closeTextDocument(notification);

      break;
    }

    case 'textDocument/codeLens': {
      let request = message as request.CodeLensRequest;

      log('requesting codelenses for %s', request.params.textDocument.uri);

      let result: response.CodeLensResponse = {
        id: request.id,
        jsonrpc: request.jsonrpc,
        result: state.getCodeLenses(request),
      };

      write(result);

      break;
    }

    case 'workspace/executeCommand': {
      let request = message as request.ExecuteCommandRequest;

      log('requesting command %s', request.params.command);

      state.executeCommand(request);

      let result: response.ExecuteCommandResponse = {
        id: request.id,
        jsonrpc: request.jsonrpc,
        result: null,
      };

      write(result);

      break;
    }

    default: {
      log('Method %s not found', message.method);
      log(JSON.stringify(message, null, 2));

      let result: base.Response = {
        id: null,
        jsonrpc: '2.0',
        error: {
          code: -32602,
          message: 'method not found',
        },
      };

      write(result);

      break;
    }
  }
});
