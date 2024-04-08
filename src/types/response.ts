import * as base from "./base";
import * as basic from "./basic";

export interface InitializeResponse extends base.Response {
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

export interface CodeLensResponse extends base.Response {
  result: basic.CodeLens[] | null,
}

export interface ExecuteCommandResponse extends base.Response {
  result: null,
}
