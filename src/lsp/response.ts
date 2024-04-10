import { Response } from "./base";
import { CodeLens, Command } from "./basic";

export interface InitializeResponse extends Response {
  result: {
    capabilities: {
      textDocumentSync?: number,
      codeLensProvider?: object,
      executeCommandProvider?: {
        commands: string[],
      },
      codeActionProvider?: boolean,
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

export interface CodeActionResponse extends Response {
  result: Command[] | null,
}
