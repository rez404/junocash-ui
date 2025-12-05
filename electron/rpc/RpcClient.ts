import * as http from 'http';

interface RpcConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  timeout?: number;
}

interface RpcRequest {
  jsonrpc: '1.0';
  id: string;
  method: string;
  params: any[];
}

interface RpcResponse<T = any> {
  result: T;
  error: { code: number; message: string } | null;
  id: string;
}

export class RpcClient {
  private config: RpcConfig;
  private requestId: number = 0;

  constructor(config: RpcConfig) {
    this.config = {
      timeout: 30000,
      ...config,
    };
  }

  async call<T = any>(method: string, params: any[] = []): Promise<T> {
    const request: RpcRequest = {
      jsonrpc: '1.0',
      id: `${++this.requestId}`,
      method,
      params,
    };

    const body = JSON.stringify(request);
    const auth = Buffer.from(
      `${this.config.username}:${this.config.password}`
    ).toString('base64');

    return new Promise((resolve, reject) => {
      const options: http.RequestOptions = {
        hostname: this.config.host,
        port: this.config.port,
        path: '/',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          Authorization: `Basic ${auth}`,
        },
        timeout: this.config.timeout,
      };

      const req = http.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const response: RpcResponse<T> = JSON.parse(data);

            if (response.error) {
              reject(
                new RpcError(response.error.code, response.error.message)
              );
            } else {
              resolve(response.result);
            }
          } catch (e) {
            reject(new Error(`Failed to parse RPC response: ${data}`));
          }
        });
      });

      req.on('error', (error) => {
        if ((error as any).code === 'ECONNREFUSED') {
          reject(new Error('Cannot connect to daemon. Is it running?'));
        } else {
          reject(error);
        }
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('RPC request timed out'));
      });

      req.write(body);
      req.end();
    });
  }

  // Convenience methods for common RPC calls

  async getInfo() {
    return this.call('getinfo');
  }

  async getBlockchainInfo() {
    return this.call('getblockchaininfo');
  }

  async getNetworkInfo() {
    return this.call('getnetworkinfo');
  }

  async getMiningInfo() {
    return this.call('getmininginfo');
  }

  async getBalance(minconf: number = 1) {
    return this.call('getbalance', ['', minconf]);
  }

  async getTotalBalance(minconf: number = 1) {
    return this.call('z_gettotalbalance', [minconf]);
  }

  async getNewAddress() {
    return this.call('getnewaddress');
  }

  async getNewZAddress(type: string = 'sapling') {
    return this.call('z_getnewaddress', [type]);
  }

  async listTransactions(count: number = 10, from: number = 0) {
    return this.call('listtransactions', ['*', count, from]);
  }

  async sendToAddress(address: string, amount: number, comment?: string) {
    const params: any[] = [address, amount];
    if (comment) {
      params.push(comment);
    }
    return this.call('sendtoaddress', params);
  }

  async zSendMany(
    fromAddress: string,
    amounts: Array<{ address: string; amount: number; memo?: string }>,
    minconf: number = 1,
    fee: number = 0.0001
  ) {
    return this.call('z_sendmany', [fromAddress, amounts, minconf, fee]);
  }

  async getOperationStatus(opids: string[]) {
    return this.call('z_getoperationstatus', [opids]);
  }

  async getOperationResult(opids: string[]) {
    return this.call('z_getoperationresult', [opids]);
  }

  async setGenerate(generate: boolean, threads?: number) {
    const params: any[] = [generate];
    if (threads !== undefined) {
      params.push(threads);
    }
    return this.call('setgenerate', params);
  }

  async getGenerate() {
    return this.call('getgenerate');
  }

  async getPeerInfo() {
    return this.call('getpeerinfo');
  }

  async getMemoryInfo() {
    return this.call('getmemoryinfo');
  }

  async stop() {
    return this.call('stop');
  }
}

export class RpcError extends Error {
  code: number;

  constructor(code: number, message: string) {
    super(message);
    this.code = code;
    this.name = 'RpcError';
  }

  static getReadableMessage(code: number): string {
    const messages: Record<number, string> = {
      [-28]: 'Daemon is warming up, please wait...',
      [-5]: 'Invalid address',
      [-6]: 'Insufficient funds',
      [-8]: 'Invalid parameter',
      [-4]: 'Wallet error',
      [-13]: 'Wallet is locked. Please unlock it first.',
      [-32700]: 'Parse error',
      [-32600]: 'Invalid request',
    };
    return messages[code] || `Unknown error (code: ${code})`;
  }
}
