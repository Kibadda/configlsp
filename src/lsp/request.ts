import { Request } from "./base";
import { Range } from "./basic";

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

export interface WorkspaceEditRequest extends Request {
  params: {
    label?: string,
    edit: {
      changes?: {
        [uri: string]: {
          range: Range,
          newText: string,
        }[],
      },
    },
  },
}

export interface CodeActionRequest extends Request {
  params: {
    textDocument: {
      uri: string,
    },
  },
}
