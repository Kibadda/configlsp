import { log } from "./log";
import { decode } from "./rpc";
import { Message, Request, Response } from "./lsp/base";
import { State } from "./state";
import { CodeLensRequest, ExecuteCommandRequest, InitializeRequest } from "./lsp/request";
import { CodeLensResponse, ExecuteCommandResponse, InitializeResponse } from "./lsp/response";
import { DidChangeNotification, DidCloseNotification, DidOpenNotification, DidSaveNotification } from "./lsp/notification";

const state = new State();

export async function handle(data: Buffer): Promise<Response | Message[] | null> {
  let message = decode(data);

  if (!message) {
    log('Something went wrong: %s', data.toString());

    let response: Response = {
      id: null,
      jsonrpc: '2.0',
      error: {
        code: -32600,
        message: 'invalid request',
      },
    };

    return response;
  }

  if (!['initialize', 'initialized', 'exit'].includes(message.method) && !state.isInitialized) {
    log('request/notification %s before initialized', message.method);

    let response: Response = {
      id: null,
      jsonrpc: '2.0',
      error: {
        code: -32002,
        message: 'server not initialized',
      },
    };

    return response;
  }

  if (message.method != 'exit' && state.shouldExit) {
    log('request/notification %s after shutdown', message.method);

    return null;
  }

  switch (message.method) {
    case 'initialize': {
      let request = message as InitializeRequest;

      log('Connected to: %s %s', request.params.clientInfo?.name ?? 'n/a', request.params.clientInfo?.version ?? 'n/a');

      let response: InitializeResponse = {
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

      return response;
    }

    case 'initialized': {
      log('initialized');

      state.isInitialized = true;

      return null;
    }

    case 'shutdown': {
      let request: Request = message as Request;

      log('shutdown');

      state.shouldExit = true;

      let response: Response = {
        id: request.id,
        jsonrpc: request.jsonrpc,
        result: null,
      }

      return response;
    }

    case 'exit': {
      log('exit');

      process.exit(!state.shouldExit ? 1 : 0);
    }

    case 'textDocument/didOpen': {
      let notification = message as DidOpenNotification;

      log('Opened %s', notification.params.textDocument.uri);

      state.openTextDocument(notification);

      return null;
    }

    case 'textDocument/didChange': {
      let notification = message as DidChangeNotification;

      log('Changed %s', notification.params.textDocument.uri);

      state.changeTextDocument(notification);

      return null;
    }

    case 'textDocument/didSave': {
      let notification = message as DidSaveNotification;

      log('Saved %s', notification.params.textDocument.uri);

      state.saveTextDocument(notification);

      return null;
    }

    case 'textDocument/didClose': {
      let notification = message as DidCloseNotification;

      log('Closed %s', notification.params.textDocument.uri);

      state.closeTextDocument(notification);

      return null;
    }

    case 'textDocument/codeLens': {
      let request = message as CodeLensRequest;

      log('requesting codelenses for %s', request.params.textDocument.uri);

      let response: CodeLensResponse = {
        id: request.id,
        jsonrpc: request.jsonrpc,
        result: state.getCodeLenses(request),
      };

      return response;
    }

    case 'workspace/executeCommand': {
      let request = message as ExecuteCommandRequest;

      log('requesting command %s', request.params.command);

      let messages: Message[] = [];

      let additionalMessage = state.executeCommand(request);

      let response: ExecuteCommandResponse = {
        id: request.id,
        jsonrpc: request.jsonrpc,
        result: null,
      };

      messages.push(response);

      if (additionalMessage) {
        messages.push(additionalMessage);
      }

      return messages;
    }

    default: {
      log('Method %s not found', message.method);
      log(JSON.stringify(message, null, 2));

      // let response: Response = {
      //   id: null,
      //   jsonrpc: '2.0',
      //   error: {
      //     code: -32602,
      //     message: 'method not found',
      //   },
      // };

      // return response;

      return null;
    }
  }
}
