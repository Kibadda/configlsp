import { Notification } from "./base";
import { Range } from "./basic";

export interface DidOpenNotification extends Notification {
  params: {
    textDocument: {
      uri: string,
      text: string,
    },
  },
}

export interface DidChangeNotification extends Notification {
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

export interface DidSaveNotification extends Notification {
  params: {
    textDocument: {
      uri: string,
    },
    text?: string,
  },
}

export interface DidCloseNotification extends Notification {
  params: {
    textDocument: {
      uri: string,
    },
  },
}
