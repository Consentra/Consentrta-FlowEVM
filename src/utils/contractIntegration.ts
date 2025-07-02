import { ethers } from 'ethers';
import {
  CONSENSTRA_DAO_ABI,
  AI_ORACLE_ABI,
  SOULBOUND_IDENTITY_ABI,
  DAO_FACTORY_ABI,
  DAO_INTEGRATION_MODULE_ABI,
  DAO_STORAGE_MODULE_ABI
} from './contractABIs';

// Utility function to get contract instance
export const getContractInstance = (address: string, abi: any, signerOrProvider: ethers.Signer | ethers.Provider): ethers.Contract => {
  return new ethers.Contract(address, abi, signerOrProvider);
};

// Utility function to convert vote string to number
export const voteToNumber = (vote: string): number => {
  if (vote === 'for') return 1;
  if (vote === 'against') return 0;
  return 2; // abstain
};

// Utility function to convert proposal ID to bytes32
export const proposalIdToBytes32 = (proposalId: string): string => {
  return ethers.keccak256(ethers.toUtf8Bytes(proposalId));
};

// Utility function to validate Ethereum address
export const isValidAddress = (address: string): boolean => {
  try {
    ethers.getAddress(address);
    return true;
  } catch (error) {
    return false;
  }
};

// Contract addresses
export const CONTRACT_ADDRESSES = {
  DAO_INTEGRATION_MODULE: '0xf6B3226088Bacc42CB43F52cB489ae94ff2732c1',
  DAO_STORAGE_MODULE: '0x442FB791D2701B06D20c8E5E69f0560E1E14C6Fd',
  CONSENSTRA_DAO: "0x0000000000000000000000000000000000000000",
  AI_ORACLE: "0x0000000000000000000000000000000000000000",
  SOULBOUND_IDENTITY: "0x0000000000000000000000000000000000000000",
  DAO_FACTORY: "0x0000000000000000000000000000000000000000",
};

export {
  CONSENSTRA_DAO_ABI,
  AI_ORACLE_ABI,
  SOULBOUND_IDENTITY_ABI,
  DAO_FACTORY_ABI,
  DAO_INTEGRATION_MODULE_ABI,
  DAO_STORAGE_MODULE_ABI
} from './contractABIs';
