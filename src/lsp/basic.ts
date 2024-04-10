export interface Position {
  line: number,
  character: number,
}

export interface Range {
  start: Position,
  end: Position,
}

export interface Command {
  title: string,
  command: string,
  arguments?: object,
}

export interface CodeLens {
  range: Range,
  command: Command,
}
