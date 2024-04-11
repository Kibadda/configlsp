import { exec } from "child_process";
import { Capture, enabled, plugins } from "./treesitter";
import { CodeLens, Command } from "./lsp/basic";
import { DidOpenNotification, DidSaveNotification, DidChangeNotification, DidCloseNotification } from "./lsp/notification";
import { CodeActionRequest, CodeLensRequest, ExecuteCommandRequest, WorkspaceEditRequest } from "./lsp/request";
import { Message, Request } from "./lsp/base";

export class State {
  private textDocuments: Map<string, string> = new Map();
  private commands: Map<string, (data: any) => Request | null> = new Map();

  private plugins: Map<string, Capture[]> = new Map();
  private enabled: Map<string, Capture | null> = new Map();

  private id: number = 0;

  public isInitialized: boolean = false;
  public shouldExit: boolean = false;

  constructor() {
    this.commands.set('open_plugin_in_browser', function(data: { text: string }): null {
      exec(`xdg-open https://github.com/${data.text}`);

      return null;
    });

    this.commands.set('toggle_plugin', function(data: { enabled: Capture | null, uri: string }): WorkspaceEditRequest | null {
      let edit: WorkspaceEditRequest = {
        id: -1,
        jsonrpc: '2.0',
        method: 'workspace/applyEdit',
        params: {
          edit: {}
        },
      }

      if (!data.enabled) {
        edit.params = {
          label: 'disable plugin',
          edit: {
            changes: {
              [data.uri]: [
                {
                  range: {
                    start: {
                      line: 2,
                      character: 0,
                    },
                    end: {
                      line: 2,
                      character: 0,
                    },
                  },
                  newText: '  enabled = false,\n',
                },
              ],
            }
          }
        };
      } else if (data.enabled.text == 'true') {
        edit.params = {
          label: 'disable plugin',
          edit: {
            changes: {
              [data.uri]: [
                {
                  range: {
                    start: {
                      line: data.enabled.range.start.row,
                      character: data.enabled.range.start.column,
                    },
                    end: {
                      line: data.enabled.range.end.row,
                      character: data.enabled.range.end.column,
                    },
                  },
                  newText: 'enabled = false',
                },
              ],
            },
          },
        };
      } else if (data.enabled.text == 'false') {
        edit.params = {
          label: 'enable plugin',
          edit: {
            changes: {
              [data.uri]: [
                {
                  range: {
                    start: {
                      line: data.enabled.range.start.row,
                      character: 0,
                    },
                    end: {
                      line: data.enabled.range.end.row + 1,
                      character: 0,
                    },
                  },
                  newText: '',
                },
              ],
            },
          },
        };
      }

      return edit.params.label ? edit : null;
    });
  }

  private evaluate(uri: string): void {
    if (!this.isPluginFile(uri)) {
      return;
    }

    let document = this.textDocuments.get(uri);

    if (!document) {
      return;
    }

    this.plugins.set(uri, plugins(document));
    this.enabled.set(uri, enabled(document));
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
          title: 'open',
          command: 'open_plugin_in_browser',
          arguments: {
            text: plugin.text,
          },
        },
      });
    }

    let capture = this.enabled.get(request.params.textDocument.uri);

    if (this.isPluginFile(request.params.textDocument.uri) && (!capture || capture.text == 'true' || capture.text == 'false')) {
      codelenses.push({
        range: {
          start: {
            line: 0,
            character: 0,
          },
          end: {
            line: 1,
            character: 0,
          },
        },
        command: {
          title: !capture || capture.text == 'true' ? 'disable' : 'enable',
          command: 'toggle_plugin',
          arguments: {
            enabled: capture ?? null,
            uri: request.params.textDocument.uri,
          },
        },
      });
    }

    return codelenses;
  }

  public getCodeActions(request: CodeActionRequest): Command[] {
    let commands: Command[] = [];

    for (const plugin of this.plugins.get(request.params.textDocument.uri) ?? []) {
      commands.push({
        title: `open ${plugin.text}`,
        command: 'open_plugin_in_browser',
        arguments: {
          text: plugin.text,
        },
      });
    }

    let capture = this.enabled.get(request.params.textDocument.uri);

    if (this.isPluginFile(request.params.textDocument.uri) && (!capture || capture.text == 'true' || capture.text == 'false')) {
      commands.push({
        title: `${!capture || capture.text == 'true' ? 'disable' : 'enable'} plugin`,
        command: 'toggle_plugin',
        arguments: {
          enabled: capture ?? null,
          uri: request.params.textDocument.uri,
        },
      });
    }

    return commands;
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

  private isPluginFile(uri: string): boolean {
    return /.*lua\/user\/plugins\/(?:[^\/\.]+\.lua|[^\/]+\/init\.lua)/.test(uri);
  }
}
