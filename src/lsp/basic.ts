export interface Position {
  line: number,
  character: number,
}

export interface Range {
  start: Position,
  end: Position,
}

export interface CodeLens {
  range: Range,
  command: {
    title: string,
    command: string,
    arguments?: object,
  },
}
