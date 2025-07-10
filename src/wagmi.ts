import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { 
  mainnet, 
  polygon, 
  optimism, 
  arbitrum, 
  base,
  sepolia 
} from 'wagmi/chains';

// Define our custom Hyperion testnet
export const hyperionTestnet = {
  id: 133717,
  name: 'Hyperion Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Metis',
    symbol: 'METIS',
  },
  rpcUrls: {
    default: {
      http: ['https://hyperion-testnet.metisdevops.link'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Hyperion Explorer',
      url: 'https://hyperion-testnet-explorer.metisdevops.link',
    },
  },
  testnet: true,
} as const;

// Define Flow EVM testnet
export const flowEvmTestnet = {
  id: 545,
  name: 'Flow EVM Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Flow',
    symbol: 'FLOW',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet.evm.nodes.onflow.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Flow EVM Explorer',
      url: 'https://evm-testnet.flowscan.io',
    },
  },
  testnet: true,
} as const;

// Define Metis Sepolia testnet
export const metisSepoliaTestnet = {
  id: 59902,
  name: 'Metis Sepolia Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Metis',
    symbol: 'tMetis',
  },
  rpcUrls: {
    default: {
      http: ['https://sepolia.metisdevops.link/'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Metis Sepolia Explorer',
      url: 'https://sepolia-explorer.metisdevops.link/',
    },
  },
  testnet: true,
} as const;

export const config = getDefaultConfig({
  appName: 'Consentra DAO',
  projectId: 'YOUR_PROJECT_ID', // Get this from WalletConnect Cloud
  chains: [
    hyperionTestnet,
    flowEvmTestnet,
    metisSepoliaTestnet,
    mainnet,
    polygon,
    optimism,
    arbitrum,
    base,
    ...(process.env.NODE_ENV === 'development' ? [sepolia] : []),
  ],
  ssr: false,
});
