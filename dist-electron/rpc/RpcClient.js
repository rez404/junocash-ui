"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.RpcError = exports.RpcClient = void 0;
const http = __importStar(require("http"));
class RpcClient {
    constructor(config) {
        this.requestId = 0;
        this.config = {
            timeout: 30000,
            ...config,
        };
    }
    async call(method, params = []) {
        const request = {
            jsonrpc: '1.0',
            id: `${++this.requestId}`,
            method,
            params,
        };
        const body = JSON.stringify(request);
        const auth = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');
        return new Promise((resolve, reject) => {
            const options = {
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
                        const response = JSON.parse(data);
                        if (response.error) {
                            reject(new RpcError(response.error.code, response.error.message));
                        }
                        else {
                            resolve(response.result);
                        }
                    }
                    catch (e) {
                        reject(new Error(`Failed to parse RPC response: ${data}`));
                    }
                });
            });
            req.on('error', (error) => {
                if (error.code === 'ECONNREFUSED') {
                    reject(new Error('Cannot connect to daemon. Is it running?'));
                }
                else {
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
    async getBalance(minconf = 1) {
        return this.call('getbalance', ['', minconf]);
    }
    async getTotalBalance(minconf = 1) {
        return this.call('z_gettotalbalance', [minconf]);
    }
    async getNewAddress() {
        return this.call('getnewaddress');
    }
    async getNewZAddress(type = 'sapling') {
        return this.call('z_getnewaddress', [type]);
    }
    async listTransactions(count = 10, from = 0) {
        return this.call('listtransactions', ['*', count, from]);
    }
    async sendToAddress(address, amount, comment) {
        const params = [address, amount];
        if (comment) {
            params.push(comment);
        }
        return this.call('sendtoaddress', params);
    }
    async zSendMany(fromAddress, amounts, minconf = 1, fee = 0.0001) {
        return this.call('z_sendmany', [fromAddress, amounts, minconf, fee]);
    }
    async getOperationStatus(opids) {
        return this.call('z_getoperationstatus', [opids]);
    }
    async getOperationResult(opids) {
        return this.call('z_getoperationresult', [opids]);
    }
    async setGenerate(generate, threads) {
        const params = [generate];
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
exports.RpcClient = RpcClient;
class RpcError extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = 'RpcError';
    }
    static getReadableMessage(code) {
        const messages = {
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
exports.RpcError = RpcError;
