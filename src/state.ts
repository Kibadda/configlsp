import {
  DidChangeTextDocumentNotification,
  DidCloseTextDocumentNotification,
  DidOpenTextDocumentNotification,
} from "./types";

export class State {
  private textDocuments: Map<string, string> = new Map<string, string>();

  public openTextDocument(notification: DidOpenTextDocumentNotification): void {
    this.textDocuments.set(notification.params.textDocument.uri, notification.params.textDocument.text);
  }

  public changeTextDocument(notification: DidChangeTextDocumentNotification): void {
    let document = this.textDocuments.get(notification.params.textDocument.uri);

    if (!document) {
      return;
    }

    for (const change of notification.params.contentChanges) {
      let i = 0;
      let start: number | null = null;
      let end: number | null = null;

      if (!document.at(i)) {
        start = 0;
        end = 0;
      } else {
        let line = 0;
        let character = 0;

        while (document.at(i)) {
          if (start == null && line == change.range.start.line && character == change.range.start.character) {
            start = i;
          }

          if (end == null && line == change.range.end.line && character == change.range.end.character) {
            end = i;
          }

          if (document.at(i) == '\n') {
            line++;
            character = 0;
          } else {
            character++;
          }

          i++;

          if (start != null && end != null) {
            break;
          }
        }

        if (start != null && end == null) {
          end = i;
        }
      }

      if (start != null && end != null) {
        document = document.substring(0, start) + change.text + document.substring(end);
      }
    }

    this.textDocuments.set(notification.params.textDocument.uri, document);
  }

  public closeTextDocument(notification: DidCloseTextDocumentNotification): void {
    this.textDocuments.delete(notification.params.textDocument.uri);
  }
}
