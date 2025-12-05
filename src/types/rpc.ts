// JunoCash RPC Response Types

export interface RpcResponse<T> {
  result: T;
  error: RpcError | null;
  id: string;
}

export interface RpcError {
  code: number;
  message: string;
}

// getinfo response
export interface NodeInfo {
  version: number;
  protocolversion: number;
  walletversion: number;
  balance: number;
  blocks: number;
  timeoffset: number;
  connections: number;
  proxy: string;
  difficulty: number;
  testnet: boolean;
  keypoololdest: number;
  keypoolsize: number;
  paytxfee: number;
  relayfee: number;
  errors: string;
}

// getblockchaininfo response
export interface BlockchainInfo {
  chain: string;
  blocks: number;
  headers: number;
  bestblockhash: string;
  difficulty: number;
  verificationprogress: number;
  chainwork: string;
  pruned: boolean;
  size_on_disk: number;
  commitments: number;
  initialblockdownload?: boolean;
}

// getnetworkinfo response
export interface NetworkInfo {
  version: number;
  subversion: string;
  protocolversion: number;
  localservices: string;
  timeoffset: number;
  connections: number;
  networks: NetworkType[];
  relayfee: number;
  localaddresses: LocalAddress[];
  warnings: string;
}

export interface NetworkType {
  name: string;
  limited: boolean;
  reachable: boolean;
  proxy: string;
}

export interface LocalAddress {
  address: string;
  port: number;
  score: number;
}

// getpeerinfo response
export interface PeerInfo {
  id: number;
  addr: string;
  addrlocal: string;
  services: string;
  lastsend: number;
  lastrecv: number;
  bytessent: number;
  bytesrecv: number;
  conntime: number;
  pingtime: number;
  version: number;
  subver: string;
  inbound: boolean;
  startingheight: number;
  banscore: number;
  synced_headers: number;
  synced_blocks: number;
}

// getmininginfo response
export interface MiningInfo {
  blocks: number;
  currentblocksize: number;
  currentblocktx: number;
  difficulty: number;
  errors: string;
  genproclimit: number;
  localsolps: number;
  networksolps: number;
  networkhashps: number;
  pooledtx: number;
  testnet: boolean;
  chain: string;
  generate: boolean;
}

// getmemoryinfo response
export interface MemoryInfo {
  locked: {
    used: number;
    free: number;
    total: number;
    locked: number;
    chunks_used: number;
    chunks_free: number;
  };
}

// z_gettotalbalance response
export interface TotalBalance {
  transparent: string;
  private: string;
  total: string;
}

// listtransactions response
export interface Transaction {
  account: string;
  address: string;
  category: 'send' | 'receive' | 'generate' | 'immature' | 'orphan';
  amount: number;
  vout: number;
  fee?: number;
  confirmations: number;
  blockhash?: string;
  blockindex?: number;
  blocktime?: number;
  txid: string;
  time: number;
  timereceived: number;
  comment?: string;
  to?: string;
}

// z_getoperationstatus response
export interface OperationStatus {
  id: string;
  status: 'queued' | 'executing' | 'success' | 'failed' | 'cancelled';
  creation_time: number;
  method: string;
  params: any;
  result?: {
    txid: string;
  };
  error?: {
    code: number;
    message: string;
  };
  execution_secs?: number;
}

// Daemon config
export interface DaemonConfig {
  network: 'mainnet' | 'testnet' | 'regtest';
  threads: number;
  dataDir?: string;
  rpcUser: string;
  rpcPassword: string;
  rpcPort?: number;
}

// Daemon status
export interface DaemonStatus {
  running: boolean;
  pid?: number;
  network?: string;
  uptime?: number;
}
