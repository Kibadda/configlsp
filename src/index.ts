import { log } from "./log";
import { decode, encode } from "./rpc";
import { State } from "./state";
import {
  Request,
  Response
} from "./types/base";
import {
  DidChangeTextDocumentNotification,
  DidCloseTextDocumentNotification,
  DidOpenTextDocumentNotification,
} from "./types/notification";
import {
  CodeLensRequest,
  ExecuteCommandRequest,
  InitializeRequest,
} from "./types/request";
import {
  CodeLensResponse,
  ExecuteCommandResponse,
  InitializeResponse,
} from "./types/response";

log('Starting');

const state = new State();

function response(result: Response): void {
  process.stdout.write(encode(result));
}

process.stdin.on('data', data => {
  let message = decode(data);

  if (!message) {
    log('Something went wrong: %s', data.toString());

    let result: Response = {
      id: null,
      jsonrpc: '2.0',
      error: {
        code: -32600,
        message: 'invalid request',
      },
    };

    response(result);

    return;
  }

  if (!['initialize', 'initialized', 'exit'].includes(message.method) && !state.isInitialized) {
    log('request/notification %s before initialized', message.method);

    let result: Response = {
      id: null,
      jsonrpc: '2.0',
      error: {
        code: -32002,
        message: 'server not initialized',
      },
    };

    response(result);

    return;
  }

  if (message.method != 'exit' && state.shouldExit) {
    log('request/notification %s after shutdown', message.method);

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
            codeLensProvider: {},
            executeCommandProvider: {
              commands: state.getCommands(),
            },
          },
        },
      };

      response(result);

      break;
    }

    case 'initialized': {
      log('initialized');

      state.isInitialized = true;

      break;
    }

    case 'shutdown': {
      let request: Request = message as Request;

      log('shutdown');

      state.shouldExit = true;

      let result: Response = {
        id: request.id,
        jsonrpc: request.jsonrpc,
        result: null,
      }

      response(result);

      break;
    }

    case 'exit': {
      log('exit');

      process.exit(!state.shouldExit ? 1 : 0);
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

    case 'textDocument/codeLens': {
      let request = message as CodeLensRequest;

      log('requesting codelenses for %s', request.params.textDocument.uri);

      let result: CodeLensResponse = {
        id: request.id,
        jsonrpc: request.jsonrpc,
        result: state.getCodeLenses(request),
      };

      response(result);

      break;
    }

    case 'workspace/executeCommand': {
      let request = message as ExecuteCommandRequest;

      log('requesting command %s', request.params.command);

      state.executeCommand(request);

      let result: ExecuteCommandResponse = {
        id: request.id,
        jsonrpc: request.jsonrpc,
        result: null,
      };

      response(result);

      break;
    }

    default: {
      log('Method %s not found', message.method);
      log(JSON.stringify(message, null, 2));

      let result: Response = {
        id: null,
        jsonrpc: '2.0',
        error: {
          code: -32602,
          message: 'method not found',
        },
      };

      response(result);

      break;
    }
  }
});
