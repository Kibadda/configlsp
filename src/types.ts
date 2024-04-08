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

export interface InitializeRequest extends Request {
  params: {
    clientInfo?: {
      name: string,
      version?: string,
    },
  },
}

export interface InitializeResponse extends Response {
  result: {
    capabilities: object,
    serverInfo?: {
      name: string,
      version?: string,
    },
  },
}
