export interface Message {
  jsonrpc: string,
}

export interface Request extends Message {
  id: number | string,
  method: string,
  params?: object,
}

export interface Response extends Message {
  id?: number | string | null,
  result?: any | null,
}

export interface Notification extends Message {
  method: string,
  params?: object,
}

export interface InitializeRequest extends Request {
  params: {
    clientInfo?: {
      name: string,
      version?: string,
    },
  },
}

export interface InitializeResponse extends Response {
  result: {
    capabilities: {
      textDocumentSync?: number,
      codeLensProvider?: object,
      executeCommandProvider?: {
        commands: string[],
      },
    },
    serverInfo?: {
      name: string,
      version?: string,
    },
  },
}

interface Position {
  line: number,
  character: number,
}

interface Range {
  start: Position,
  end: Position,
}

export interface DidOpenTextDocumentNotification extends Notification {
  params: {
    textDocument: {
      uri: string,
      text: string,
    },
  },
}

export interface DidChangeTextDocumentNotification extends Notification {
  params: {
    textDocument: {
      uri: string,
    },
    contentChanges: {
      range: Range,
      text: string,
    }[],
  },
}

export interface DidCloseTextDocumentNotification extends Notification {
  params: {
    textDocument: {
      uri: string,
    },
  },
}

export interface CodeLensRequest extends Request {
  params: {
    textDocument: {
      uri: string
    },
  },
}

export interface CodeLens {
  range: Range,
  command: {
    title: string,
    command: string,
    arguments?: object,
  },
}

export interface CodeLensResponse extends Response {
  result: CodeLens[] | null,
}

export interface ExecuteCommandRequest extends Request {
  params: {
    command: string,
    arguments?: object,
  },
}

export interface ExecuteCommandResponse extends Response {
  result: any,
}
