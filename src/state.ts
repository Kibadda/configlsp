import { exec } from "child_process";
import { Treesitter } from "./treesitter";
import { CodeLens, Hover } from "./lsp/basic";
import { DidOpenNotification, DidSaveNotification, DidChangeNotification, DidCloseNotification } from "./lsp/notification";
import { CodeLensRequest, ExecuteCommandRequest, HoverRequest } from "./lsp/request";

export class State {
  private textDocuments: Map<string, string> = new Map();
  private codeLenses: Map<string, CodeLens[]> = new Map();
  private commands: Map<string, Function> = new Map();

  public isInitialized: boolean = false;
  public shouldExit: boolean = false;

  constructor() {
    this.commands.set('open_plugin_in_browser', function(data: { text: string }) {
      exec(`xdg-open https://github.com/${data.text}`);
    });
  }

  private calculateCodeLenses(uri: string): void {
    let document = this.textDocuments.get(uri);

    if (!document) {
      return;
    }

    let codeLenses = [];

    for (const plugin of Treesitter.plugins(document)) {
      let codeLens: basic.CodeLens = {
        range: {
          start: {
            line: plugin.start.row,
            character: plugin.start.column,
          },
          end: {
            line: plugin.end.row,
            character: plugin.end.column,
          },
        },
        command: {
          title: 'open plugin',
          command: 'open_plugin_in_browser',
          arguments: {
            text: plugin.text,
          },
        },
      };

      codeLenses.push(codeLens);
    }

    this.codeLenses.set(uri, codeLenses);
  }

  public openTextDocument(notification: DidOpenNotification): void {
    this.textDocuments.set(notification.params.textDocument.uri, notification.params.textDocument.text);
    this.calculateCodeLenses(notification.params.textDocument.uri);
  }

  public saveTextDocument(notification: DidSaveNotification): void {
    if (notification.params.text) {
      this.textDocuments.set(notification.params.textDocument.uri, notification.params.text);
    }
    this.calculateCodeLenses(notification.params.textDocument.uri);
  }

  public changeTextDocument(notification: DidChangeNotification): void {
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
    this.calculateCodeLenses(notification.params.textDocument.uri);
  }

  public closeTextDocument(notification: DidCloseNotification): void {
    this.textDocuments.delete(notification.params.textDocument.uri);
    this.codeLenses.delete(notification.params.textDocument.uri);
  }

  public getCodeLenses(request: CodeLensRequest): CodeLens[] | null {
    return this.codeLenses.get(request.params.textDocument.uri) ?? null;
  }

  public getCommands(): string[] {
    let keys: string[] = [];

    this.commands.forEach((_, key) => keys.push(key));

    return keys;
  }

  public executeCommand(request: ExecuteCommandRequest): void {
    let func = this.commands.get(request.params.command);

    if (func) {
      func(request.params.arguments);
    }
  }
}
