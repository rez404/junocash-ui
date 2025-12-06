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
exports.DaemonManager = void 0;
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
class DaemonManager {
    constructor(binPath) {
        this.process = null;
        this.config = null;
        this.startTime = null;
        this.binPath = binPath;
    }
    getDaemonPath() {
        const platform = process.platform;
        const executable = platform === 'win32' ? 'junocashd.exe' : 'junocashd';
        return path.join(this.binPath, executable);
    }
    getDefaultDataDir() {
        const home = os.homedir();
        switch (process.platform) {
            case 'darwin':
                return path.join(home, 'Library', 'Application Support', 'JunoCash');
            case 'win32':
                return path.join(process.env.APPDATA || home, 'JunoCash');
            default:
                return path.join(home, '.junocash');
        }
    }
    ensureDataDir(dataDir) {
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        // Create export directory for wallet exports
        const exportDir = path.join(dataDir, 'export');
        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir, { recursive: true });
        }
        // Create config file if it doesn't exist
        const configPath = path.join(dataDir, 'junocash.conf');
        if (!fs.existsSync(configPath) && this.config) {
            const configContent = [
                `rpcuser=${this.config.rpcUser}`,
                `rpcpassword=${this.config.rpcPassword}`,
                'server=1',
                'rpcallowip=127.0.0.1',
            ].join('\n');
            fs.writeFileSync(configPath, configContent);
        }
    }
    getExportDir() {
        const dataDir = this.config?.dataDir || this.getDefaultDataDir();
        return path.join(dataDir, 'export');
    }
    async start(config) {
        // Check if process is already running
        if (this.process && !this.process.killed) {
            console.log('Daemon process already exists, cleaning up...');
            await this.stop();
            // Wait a bit for clean shutdown
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        this.config = config;
        const daemonPath = this.getDaemonPath();
        if (!fs.existsSync(daemonPath)) {
            throw new Error(`Daemon binary not found at: ${daemonPath}`);
        }
        const dataDir = config.dataDir || this.getDefaultDataDir();
        this.ensureDataDir(dataDir);
        const exportDir = path.join(dataDir, 'export');
        const args = [
            `-datadir=${dataDir}`,
            `-exportdir=${exportDir}`,
            `-rpcuser=${config.rpcUser}`,
            `-rpcpassword=${config.rpcPassword}`,
            `-par=${config.threads}`,
            '-server=1',
            '-walletrequirebackup=false',
            '-allowdeprecated=getnewaddress',
            '-allowdeprecated=z_getnewaddress',
            '-allowdeprecated=z_listaddresses',
        ];
        if (config.network === 'testnet') {
            args.push('-testnet');
        }
        else if (config.network === 'regtest') {
            args.push('-regtest');
        }
        if (config.rpcPort) {
            args.push(`-rpcport=${config.rpcPort}`);
        }
        return new Promise((resolve, reject) => {
            console.log(`Starting daemon: ${daemonPath}`);
            console.log(`Arguments: ${args.join(' ')}`);
            this.process = (0, child_process_1.spawn)(daemonPath, args, {
                detached: false,
                stdio: ['ignore', 'pipe', 'pipe'],
            });
            this.startTime = Date.now();
            let startupError = '';
            this.process.stderr?.on('data', (data) => {
                const output = data.toString();
                console.error(`Daemon stderr: ${output}`);
                startupError += output;
            });
            this.process.stdout?.on('data', (data) => {
                console.log(`Daemon stdout: ${data.toString()}`);
            });
            this.process.on('error', (error) => {
                console.error('Daemon process error:', error);
                this.process = null;
                this.startTime = null;
                reject(new Error(`Failed to start daemon: ${error.message}`));
            });
            this.process.on('exit', (code, signal) => {
                console.log(`Daemon exited with code ${code}, signal ${signal}`);
                if (code !== 0 && this.process) {
                    this.process = null;
                    this.startTime = null;
                    reject(new Error(`Daemon exited unexpectedly: ${startupError || `code ${code}`}`));
                }
            });
            // Wait for RPC to become available
            this.waitForRpc(config)
                .then(() => {
                console.log('Daemon RPC is ready');
                resolve();
            })
                .catch((error) => {
                this.stop().catch(() => { });
                reject(error);
            });
        });
    }
    async waitForRpc(config, maxRetries = 60, delayMs = 1000) {
        const port = config.rpcPort || (config.network === 'mainnet' ? 8232 : 18232);
        for (let i = 0; i < maxRetries; i++) {
            try {
                const response = await this.testRpcConnection(config.rpcUser, config.rpcPassword, port);
                if (response) {
                    return;
                }
            }
            catch (error) {
                // Continue waiting
            }
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
        throw new Error('Daemon RPC did not become available within timeout');
    }
    testRpcConnection(user, password, port) {
        return new Promise((resolve) => {
            const http = require('http');
            const auth = Buffer.from(`${user}:${password}`).toString('base64');
            const req = http.request({
                hostname: '127.0.0.1',
                port,
                path: '/',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Basic ${auth}`,
                },
                timeout: 5000,
            }, (res) => {
                resolve(res.statusCode === 200 || res.statusCode === 403);
            });
            req.on('error', () => resolve(false));
            req.on('timeout', () => {
                req.destroy();
                resolve(false);
            });
            req.write(JSON.stringify({
                jsonrpc: '1.0',
                id: 'test',
                method: 'getinfo',
                params: [],
            }));
            req.end();
        });
    }
    async stop() {
        if (!this.process) {
            return;
        }
        return new Promise((resolve) => {
            const proc = this.process;
            // Set up timeout for force kill
            const timeout = setTimeout(() => {
                console.log('Force killing daemon...');
                proc.kill('SIGKILL');
                this.process = null;
                this.startTime = null;
                resolve();
            }, 30000);
            proc.on('exit', () => {
                clearTimeout(timeout);
                this.process = null;
                this.startTime = null;
                resolve();
            });
            // Try graceful shutdown first
            console.log('Sending SIGTERM to daemon...');
            proc.kill('SIGTERM');
        });
    }
    getStatus() {
        if (!this.process || this.process.killed) {
            return { running: false };
        }
        return {
            running: true,
            pid: this.process.pid,
            network: this.config?.network,
            uptime: this.startTime ? Math.floor((Date.now() - this.startTime) / 1000) : 0,
        };
    }
    isRunning() {
        return this.process !== null && !this.process.killed;
    }
    // Get system CPU info for thread selection
    static getSystemInfo() {
        return {
            cpuCount: os.cpus().length,
            totalMemory: os.totalmem(),
        };
    }
}
exports.DaemonManager = DaemonManager;
