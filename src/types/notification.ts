import { Notification } from "./base";
import { Range } from "./basic";

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
