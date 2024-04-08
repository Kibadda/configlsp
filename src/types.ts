export interface Message {
  jsonrpc: string,
}

export interface Request extends Message {
  id: number | string,
  method: string,
  params?: object,
}

export interface Response extends Message {
  id?: number | string | null,
  result?: any | null,
}

export interface Notification extends Message {
  method: string,
  params?: object,
}
