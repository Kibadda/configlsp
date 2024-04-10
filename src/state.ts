import { exec } from "child_process";
import { Capture, plugins } from "./treesitter";
import { CodeLens } from "./lsp/basic";
import { DidOpenNotification, DidSaveNotification, DidChangeNotification, DidCloseNotification } from "./lsp/notification";
import { CodeLensRequest, ExecuteCommandRequest } from "./lsp/request";
import { Message, Request } from "./lsp/base";

export class State {
  private textDocuments: Map<string, string> = new Map();
  private commands: Map<string, (data: any) => Request | null> = new Map();

  private plugins: Map<string, Capture[]> = new Map();

  private id: number = 0;

  public isInitialized: boolean = false;
  public shouldExit: boolean = false;

  constructor() {
    this.commands.set('open_plugin_in_browser', function(data: { text: string }): null {
      exec(`xdg-open https://github.com/${data.text}`);

      return null;
    });
  }

  private evaluate(uri: string): void {
    let document = this.textDocuments.get(uri);

    if (!document) {
      return;
    }

    this.plugins.set(uri, plugins(document));
  }

  public openTextDocument(notification: DidOpenNotification): void {
    this.textDocuments.set(notification.params.textDocument.uri, notification.params.textDocument.text);
    this.evaluate(notification.params.textDocument.uri);
  }

  public saveTextDocument(notification: DidSaveNotification): void {
    if (notification.params.text) {
      this.textDocuments.set(notification.params.textDocument.uri, notification.params.text);
    }
    this.evaluate(notification.params.textDocument.uri);
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
    this.evaluate(notification.params.textDocument.uri);
  }

  public closeTextDocument(notification: DidCloseNotification): void {
    this.textDocuments.delete(notification.params.textDocument.uri);
    this.plugins.delete(notification.params.textDocument.uri);
  }

  public getCodeLenses(request: CodeLensRequest): CodeLens[] {
    let codelenses: CodeLens[] = [];

    for (const plugin of this.plugins.get(request.params.textDocument.uri) ?? []) {
      codelenses.push({
        range: {
          start: {
            line: plugin.range.start.row,
            character: plugin.range.start.column,
          },
          end: {
            line: plugin.range.end.row,
            character: plugin.range.end.column,
          },
        },
        command: {
          title: 'open plugin',
          command: 'open_plugin_in_browser',
          arguments: {
            text: plugin.text,
          },
        },
      });
    }

    return codelenses;
  }

  public getCommands(): string[] {
    let keys: string[] = [];

    this.commands.forEach((_, key) => keys.push(key));

    return keys;
  }

  public executeCommand(request: ExecuteCommandRequest): Message | null {
    let func = this.commands.get(request.params.command);

    if (func) {
      let message = func(request.params.arguments);

      if (message) {
        message.id = this.id++;

        return message;
      }
    }

    return null;
  }
}
