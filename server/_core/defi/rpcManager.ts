/**
 * RPC Connection Manager for blockchain interactions
 * Handles connections to Cronos and other EVM-compatible chains
 */

import { ethers, Contract, Provider } from 'ethers';
import { NETWORK_CONFIG, TOKENS } from './config';
import type { NetworkName, TokenConfig } from './config';

// Minimal ABI for common token operations
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)'
];

// WCRO ABI for wrap/unwrap
const WCRO_ABI = [
  ...ERC20_ABI,
  'function deposit() payable',
  'function withdraw(uint256 amount)',
  'event Deposit(address indexed dst, uint256 wad)',
  'event Withdrawal(address indexed src, uint256 wad)'
];

interface ProviderCache {
  provider: Provider;
  lastUsed: number;
}

export class RPCManager {
  private static instance: RPCManager;
  private providers: Map<NetworkName, ProviderCache> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): RPCManager {
    if (!RPCManager.instance) {
      RPCManager.instance = new RPCManager();
    }
    return RPCManager.instance;
  }

  /**
   * Get or create a provider for the specified network
   */
  getProvider(network: NetworkName = 'cronos'): Provider {
    const cached = this.providers.get(network);
    const now = Date.now();

    if (cached && (now - cached.lastUsed) < this.CACHE_TTL) {
      cached.lastUsed = now;
      return cached.provider;
    }

    const config = NETWORK_CONFIG[network];
    const provider = new ethers.JsonRpcProvider(config.rpcUrl, config.chainId, {
      staticNetwork: true
    });

    this.providers.set(network, {
      provider,
      lastUsed: now
    });

    console.log(`[RPC] Connected to ${config.name} (${config.chainId})`);
    return provider;
  }

  /**
   * Get a signer for transaction signing (requires private key)
   */
  getSigner(network: NetworkName = 'cronos', privateKey?: string) {
    if (!privateKey) {
      throw new Error('Private key required for signer');
    }

    const provider = this.getProvider(network);
    return new ethers.Wallet(privateKey, provider);
  }

  /**
   * Get token contract instance
   */
  getTokenContract(tokenAddress: string, network: NetworkName = 'cronos') {
    const provider = this.getProvider(network);
    return new Contract(tokenAddress, ERC20_ABI, provider);
  }

  /**
   * Get WCRO contract for wrap/unwrap operations
   */
  getWCROContract(network: NetworkName = 'cronos') {
    const wcroAddress = TOKENS.WCRO.address;
    const provider = this.getProvider(network);
    return new Contract(wcroAddress, WCRO_ABI, provider);
  }

  /**
   * Get token balance for an address
   */
  async getTokenBalance(
    tokenAddress: string,
    owner: string,
    network: NetworkName = 'cronos'
  ): Promise<bigint> {
    try {
      const contract = this.getTokenContract(tokenAddress, network);
      const balance = await contract.balanceOf(owner);
      return BigInt(balance.toString());
    } catch (error) {
      console.error(`[RPC] Failed to get token balance:`, error);
      return 0n;
    }
  }

  /**
   * Get native token balance
   */
  async getNativeBalance(address: string, network: NetworkName = 'cronos'): Promise<bigint> {
    try {
      const provider = this.getProvider(network);
      return await provider.getBalance(address);
    } catch (error) {
      console.error(`[RPC] Failed to get native balance:`, error);
      return 0n;
    }
  }

  /**
   * Get current block number
   */
  async getBlockNumber(network: NetworkName = 'cronos'): Promise<number> {
    const provider = this.getProvider(network);
    return await provider.getBlockNumber();
  }

  /**
   * Get current gas price
   */
  async getGasPrice(network: NetworkName = 'cronos'): Promise<bigint> {
    const provider = this.getProvider(network);
    return await provider.getFeeData().then(fee => fee.gasPrice || 0n);
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(
    to: string,
    data: string,
    value: bigint = 0n,
    from?: string,
    network: NetworkName = 'cronos'
  ): Promise<bigint> {
    const provider = this.getProvider(network);
    try {
      const estimate = await provider.estimateGas({
        to,
        data,
        value,
        from
      });
      return estimate;
    } catch (error) {
      console.error(`[RPC] Gas estimation failed:`, error);
      throw error;
    }
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(txHash: string, network: NetworkName = 'cronos', confirmations = 1) {
    const provider = this.getProvider(network);
    return await provider.waitForTransaction(txHash, confirmations);
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash: string, network: NetworkName = 'cronos') {
    const provider = this.getProvider(network);
    return await provider.getTransactionReceipt(txHash);
  }

  /**
   * Health check for RPC connection
   */
  async healthCheck(network: NetworkName = 'cronos'): Promise<boolean> {
    try {
      const provider = this.getProvider(network);
      const blockNumber = await provider.getBlockNumber();
      return blockNumber > 0;
    } catch {
      return false;
    }
  }

  /**
   * Get all network health statuses
   */
  async getAllNetworkHealth(): Promise<Record<NetworkName, boolean>> {
    const health: Record<NetworkName, boolean> = {} as Record<NetworkName, boolean>;
    
    for (const network of Object.keys(NETWORK_CONFIG) as NetworkName[]) {
      health[network] = await this.healthCheck(network);
    }

    return health;
  }
}

// Singleton export
export const rpcManager = RPCManager.getInstance();

// Utility functions for common operations
export async function getTokenBalanceFormatted(
  tokenAddress: string,
  owner: string,
  network: NetworkName = 'cronos'
): Promise<string> {
  const balance = await rpcManager.getTokenBalance(tokenAddress, owner, network);
  const contract = rpcManager.getTokenContract(tokenAddress, network);
  const decimals = await contract.decimals();
  return ethers.formatUnits(balance, decimals);
}

export async function getNativeBalanceFormatted(
  address: string,
  network: NetworkName = 'cronos'
): Promise<string> {
  const balance = await rpcManager.getNativeBalance(address, network);
  return ethers.formatEther(balance);
}
