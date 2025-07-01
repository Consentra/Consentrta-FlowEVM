
import { ethers } from 'ethers';

// Contract addresses
export const CONTRACT_ADDRESSES = {
  AI_ORACLE: '0x02e2898D26d634634826ec4950732eD15e10F904',
  DAO_FACTORY: '0x0000000000000000000000000000000000000001', // Replace with actual address
  SOULBOUND_NFT: '0xC80BB7a8D0368E02611781657CBc97BbF0423671'
};

// AIOracle ABI
export const AI_ORACLE_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "oracle",
        "type": "address"
      }
    ],
    "name": "addOracle",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "proposalId",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "summary",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "complexityScore",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "AnalysisSubmitted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "proposalId",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "confidenceScore",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "predictedOutcome",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "PredictionSubmitted",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "oracle",
        "type": "address"
      }
    ],
    "name": "removeOracle",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "proposalId",
        "type": "bytes32"
      },
      {
        "internalType": "string",
        "name": "summary",
        "type": "string"
      },
      {
        "internalType": "string[]",
        "name": "tags",
        "type": "string[]"
      },
      {
        "internalType": "uint256",
        "name": "complexityScore",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "riskScore",
        "type": "uint256"
      }
    ],
    "name": "submitAnalysis",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "proposalId",
        "type": "bytes32"
      },
      {
        "internalType": "uint256",
        "name": "confidenceScore",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "predictedOutcome",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "reasoning",
        "type": "string"
      }
    ],
    "name": "submitPrediction",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "name": "analyses",
    "outputs": [
      {
        "internalType": "string",
        "name": "summary",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "complexityScore",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "riskScore",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "authorizedOracles",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "proposalId",
        "type": "bytes32"
      }
    ],
    "name": "getAnalysis",
    "outputs": [
      {
        "components": [
          {
            "internalType": "string",
            "name": "summary",
            "type": "string"
          },
          {
            "internalType": "string[]",
            "name": "tags",
            "type": "string[]"
          },
          {
            "internalType": "uint256",
            "name": "complexityScore",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "riskScore",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          }
        ],
        "internalType": "struct AIOracle.AIAnalysis",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32[]",
        "name": "proposalIds",
        "type": "bytes32[]"
      }
    ],
    "name": "getBatchPredictions",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "confidenceScore",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "predictedOutcome",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "reasoning",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isValid",
            "type": "bool"
          }
        ],
        "internalType": "struct AIOracle.AIPrediction[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "proposalId",
        "type": "bytes32"
      }
    ],
    "name": "getPrediction",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "confidenceScore",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "predictedOutcome",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "reasoning",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isValid",
            "type": "bool"
          }
        ],
        "internalType": "struct AIOracle.AIPrediction",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "name": "predictions",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "confidenceScore",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "predictedOutcome",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "reasoning",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isValid",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Helper functions
export const getContractInstance = (address: string, abi: any[], signerOrProvider: ethers.Signer | ethers.Provider) => {
  return new ethers.Contract(address, abi, signerOrProvider);
};

export const proposalIdToBytes32 = (proposalId: string): string => {
  // Convert proposal ID to bytes32 format
  return ethers.keccak256(ethers.toUtf8Bytes(proposalId));
};
