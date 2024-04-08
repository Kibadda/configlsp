import { Response } from "./base";
import { CodeLens } from "./basic";

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

export interface CodeLensResponse extends Response {
  result: CodeLens[] | null,
}

export interface ExecuteCommandResponse extends Response {
  result: null,
}
