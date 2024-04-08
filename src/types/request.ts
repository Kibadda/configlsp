import * as base from "./base";

export interface InitializeRequest extends base.Request {
  params: {
    clientInfo?: {
      name: string,
      version?: string,
    },
  },
}

export interface CodeLensRequest extends base.Request {
  params: {
    textDocument: {
      uri: string
    },
  },
}

export interface ExecuteCommandRequest extends base.Request {
  params: {
    command: string,
    arguments?: object,
  },
}
