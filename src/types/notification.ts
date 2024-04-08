import * as base from "./base";
import * as basic from "./basic";

export interface DidOpenNotification extends base.Notification {
  params: {
    textDocument: {
      uri: string,
      text: string,
    },
  },
}

export interface DidChangeNotification extends base.Notification {
  params: {
    textDocument: {
      uri: string,
    },
    contentChanges: {
      range: basic.Range,
      text: string,
    }[],
  },
}

export interface DidSaveNotification extends base.Notification {
  params: {
    textDocument: {
      uri: string,
    },
    text?: string,
  },
}

export interface DidCloseNotification extends base.Notification {
  params: {
    textDocument: {
      uri: string,
    },
  },
}
