/**
 * DeFi Protocol Configurations for Cronos and Crypto.com chains
 */

// Network Configurations
export const NETWORK_CONFIG = {
  cronos: {
    chainId: 25,
    name: 'Cronos Mainnet',
    rpcUrl: process.env.CRONOS_RPC_URL || 'https://evm.cronos.org',
    explorerUrl: 'https://cronoscan.com',
    nativeToken: {
      symbol: 'CRO',
      decimals: 18,
      coingeckoId: 'crypto-com-chain'
    }
  },
  cronosTestnet: {
    chainId: 338,
    name: 'Cronos Testnet',
    rpcUrl: 'https://evm-t3.cronos.org',
    explorerUrl: 'https://explorer.cronos.org/testnet',
    nativeToken: {
      symbol: 'TCRO',
      decimals: 18,
      coingeckoId: 'crypto-com-chain'
    }
  }
} as const;

// Token Addresses on Cronos
export const TOKENS = {
  CRO: {
    symbol: 'CRO',
    address: '0x0000000000000000000000000000000000000000', // Native
    decimals: 18,
    coingeckoId: 'crypto-com-chain'
  },
  WCRO: {
    symbol: 'WCRO',
    address: '0x5C7F8A570d578ED84E63fdFA7b1eE72dEae1AE23',
    decimals: 18,
    coingeckoId: 'crypto-com-chain'
  },
  USDC: {
    symbol: 'USDC',
    address: '0xc21223249CA28397B4B6541dfFaEcC539BfF0c59',
    decimals: 6,
    coingeckoId: 'usd-coin'
  },
  USDT: {
    symbol: 'USDT',
    address: '0x66e428c3f67a68878562e79A0234c1F83c208770',
    decimals: 6,
    coingeckoId: 'tether'
  },
  ETH: {
    symbol: 'ETH',
    address: '0xe44Fd7fCb2b1581822D0c862B68222998a0c299a',
    decimals: 18,
    coingeckoId: 'ethereum'
  },
  WBTC: {
    symbol: 'WBTC',
    address: '0x062E66477Faf219F25D27dCED647BF57C3107d52',
    decimals: 8,
    coingeckoId: 'wrapped-bitcoin'
  },
  VVS: {
    symbol: 'VVS',
    address: '0x2D03bECE6747ADC00E1a131BBA1469C15fD11e03',
    decimals: 18,
    coingeckoId: 'vvs-finance'
  },
  MMF: {
    symbol: 'MMF',
    address: '0x97749c9B61F878a880DfE312d2594AE07AEd7656',
    decimals: 18,
    coingeckoId: 'mad-meerkat-finance'
  },
  TONIC: {
    symbol: 'TONIC',
    address: '0xDD73dEa10ABC2Bff99c60882EC5b2B81Bb1Dc52a',
    decimals: 18,
    coingeckoId: 'tonic'
  }
} as const;

// DEX Configurations
export const DEX_CONFIG = {
  vvs: {
    name: 'VVS Finance',
    router: '0x145863Eb42Cf62847A6Ca784e6416C1682b1b2Ae',
    factory: '0x3B44B2a187a7b38241F177456b013f05e8e470fc',
    masterChef: '0xdC426A9782946d48592BAE541e46E81E5eE84273',
    fee: 0.003, // 0.3%
    subgraphUrl: 'https://graph.vvs.finance/subgraphs/name/vvs-exchange',
    supported: ['swap', 'liquidity', 'farming', 'staking']
  },
  mmFinance: {
    name: 'MM Finance',
    router: '0x145677FC4d9b8F19B5D56d1820c48e0443049a30',
    factory: '0xd590cC180601AEcD6eeADD9B7f2B7611519544f4',
    masterChef: '0x9A7b0cD8a716606D4E5b0E8e3b8b8b8b8b8b8b8b',
    fee: 0.0025, // 0.25%
    supported: ['swap', 'liquidity', 'farming']
  },
  cronaSwap: {
    name: 'CronaSwap',
    router: '0x05c097171B4A8BCE1c9C132694398e22066bd3b6',
    factory: '0x69004509291F4a4021fA13E8C520bb3D18f8E29E',
    fee: 0.0025, // 0.25%
    supported: ['swap', 'liquidity']
  }
} as const;

// Lending Protocol Configurations
export const LENDING_CONFIG = {
  tectonic: {
    name: 'Tectonic Finance',
    comptroller: '0xbE22127d7258740648f217715a770B1FB2986f42',
    markets: {
      CRO: '0x0679A2a57148871481cF9a5c8441B6e88f489665',
      USDC: '0x6aB6d61428fde76768D7b45D8BFeec19c6eF91A8',
      USDT: '0x7a25256B08c448C0aF2c848151C0C256018F2300',
      ETH: '0x80520D695aaf61E4EC5A9A323669A419126E3A88',
      WBTC: '0x191c10Aa4AF7C30e871E70C95dB0E4EB77237530'
    },
    supported: ['supply', 'borrow', 'earn']
  }
} as const;

// Bridge Configurations
export const BRIDGE_CONFIG = {
  layerzero: {
    name: 'LayerZero V2',
    endpoint: '0x1a44076050125825900e736c8155caa82A76D755',
    supported: ['message', 'token']
  },
  cbridge: {
    name: 'Celer cBridge',
    router: '0x88DCa4366c0C0317521fD3ba89E951781D940a48',
    supported: ['token']
  },
  lifi: {
    name: 'LI.FI',
    apiUrl: 'https://li.quest/v1',
    apiKey: process.env.LIFI_API_KEY,
    supported: ['route', 'status']
  }
} as const;

// Oracle Configurations
export const ORACLE_CONFIG = {
  chainlink: {
    name: 'Chainlink',
    feeds: {
      'BTC/USD': '0x2b09d47d550061f995A3b5C6F0Fd58005215D7c8',
      'ETH/USD': '0x51597f405303C4377E36123cBc172b13269EA163',
      'CRO/USD': '0x3c145F9c7d8BE5B8f84f8b5F3E2F3E3E3E3E3E3E' // Verify actual address
    }
  },
  pyth: {
    name: 'Pyth Network',
    wormholeChainId: 25, // Cronos
    priceFeedIds: {
      BTC: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
      ETH: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0abe',
      CRO: '0x3f5290b972a761f8109a9c0909a70d16a9c55a0c2a8b1d1a0c0c0c0c0c0c0c0c'
    }
  },
  dexScreener: {
    name: 'DEX Screener',
    apiUrl: 'https://api.dexscreener.com/latest/dex',
    rateLimit: 300 // requests per minute
  },
  coingecko: {
    name: 'CoinGecko',
    apiUrl: 'https://api.coingecko.com/api/v3',
    apiKey: process.env.COINGECKO_API_KEY,
    rateLimit: 10 // requests per minute (free tier)
  }
} as const;

// Strategy Default Parameters
export const STRATEGY_DEFAULTS = {
  arbitrage: {
    minProfitPercent: 0.5, // Minimum 0.5% profit after fees
    maxSlippage: 0.3, // 0.3% max slippage
    checkInterval: 30000, // Check every 30 seconds
    gasPriceMultiplier: 1.2 // Pay 20% above base gas
  },
  liquidity: {
    rebalanceThreshold: 0.1, // Rebalance when price moves 10% from center
    autoCompound: true,
    compoundInterval: 86400000, // Compound daily
    maxImpermanentLoss: 0.05 // Stop if IL > 5%
  },
  yield: {
    minAPY: 5, // Minimum 5% APY
    healthFactorThreshold: 1.5, // Maintain HF > 1.5
    autoCompound: true,
    diversification: {
      maxPerProtocol: 0.5, // Max 50% in one protocol
      maxPerAsset: 0.3 // Max 30% in one asset
    }
  },
  rebalancing: {
    threshold: 0.05, // Rebalance when allocation deviates 5%
    checkInterval: 3600000, // Check hourly
    gasOptimization: {
      batchThreshold: 100, // Batch if gas < $100
      timeDelay: 300000 // Wait 5 min for better gas
    }
  }
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  beefy: {
    baseUrl: 'https://api.beefy.finance',
    endpoints: {
      vaults: '/vaults',
      apy: '/apy',
      breakdown: '/apy/breakdown'
    }
  },
  defillama: {
    baseUrl: 'https://api.llama.fi',
    endpoints: {
      protocols: '/protocols',
      tvl: '/tvl',
      yields: '/yields'
    }
  },
  oneInch: {
    baseUrl: 'https://api.1inch.io/swap/v6.0',
    chainId: 25, // Cronos
    endpoints: {
      swap: '/swap',
      rate: '/rate'
    }
  }
} as const;

// Error Messages
export const DEFI_ERRORS = {
  INSUFFICIENT_LIQUIDITY: 'Insufficient liquidity for trade',
  SLIPPAGE_TOO_HIGH: 'Slippage exceeds maximum tolerance',
  PRICE_DEVIATION: 'Price deviation too high',
  GAS_PRICE_HIGH: 'Gas price exceeds maximum',
  HEALTH_FACTOR_LOW: 'Health factor below threshold',
  BRIDGE_FAILED: 'Bridge transaction failed',
  ORACLE_STALE: 'Oracle price is stale',
  CONTRACT_ERROR: 'Smart contract execution failed'
} as const;

// Type Exports
export type NetworkName = keyof typeof NETWORK_CONFIG;
export type TokenSymbol = keyof typeof TOKENS;
export type DexName = keyof typeof DEX_CONFIG;
export type LendingProtocol = keyof typeof LENDING_CONFIG;
export type BridgeName = keyof typeof BRIDGE_CONFIG;
export type OracleName = keyof typeof ORACLE_CONFIG;

export interface TokenConfig {
  symbol: string;
  address: string;
  decimals: number;
  coingeckoId: string;
}

export interface DexConfig {
  name: string;
  router: string;
  factory: string;
  masterChef?: string;
  fee: number;
  subgraphUrl?: string;
  supported: string[];
}

export interface StrategyConfig {
  type: string;
  parameters: Record<string, unknown>;
  allocatedTokens?: Array<{
    token: string;
    amount: string;
    chain: string;
  }>;
}
