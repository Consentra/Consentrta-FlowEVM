
import { ethers } from 'ethers';
import { PROPOSAL_REGISTRY_ABI } from './contractABIs';
import { CONTRACT_ADDRESSES } from './contractAddresses';

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

// Export all ABIs for easy access
export { 
  PROPOSAL_REGISTRY_ABI, 
  MINIMAL_GOVERNOR_ABI, 
  SOULBOUND_IDENTITY_NFT_ABI,
  DAO_LIB_ABI,
  GOVERNANCE_LIB_ABI,
  AI_ORACLE_ABI,
  MINIMAL_DAO_ABI
} from './contractABIs';
