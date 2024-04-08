import { Request } from "./base";

export interface InitializeRequest extends Request {
  params: {
    clientInfo?: {
      name: string,
      version?: string,
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

export interface ExecuteCommandRequest extends Request {
  params: {
    command: string,
    arguments?: object,
  },
}
