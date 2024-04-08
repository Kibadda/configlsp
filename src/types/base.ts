export interface Message {
  jsonrpc: string,
}

export interface Request extends Message {
  id: number | string,
  method: string,
  params?: object,
}

export interface Response extends Message {
  id: number | string | null,
  result?: any,
  error?: {
    code: number,
    message: string,
  },
}

export interface Notification extends Message {
  method: string,
  params?: object,
}
