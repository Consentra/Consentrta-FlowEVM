
import { ethers } from 'ethers';

// Contract addresses
export const CONTRACT_ADDRESSES = {
  AI_ORACLE: '0x02e2898D26d634634826ec4950732eD15e10F904',
  DAO_FACTORY: '0x0000000000000000000000000000000000000001', // Replace with actual address
  SOULBOUND_NFT: '0xC80BB7a8D0368E02611781657CBc97BbF0423671', // Replace with actual address
  PROPOSAL_METADATA_MODULE: '0x0000000000000000000000000000000000000002', // Replace with actual address
  PROPOSAL_REGISTRY: '0x0000000000000000000000000000000000000003' // Replace with actual address
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

// ProposalMetadataModule ABI
export const PROPOSAL_METADATA_MODULE_ABI = [
  {
    "inputs": [
      {"internalType": "uint256", "name": "proposalId", "type": "uint256"},
      {"internalType": "string", "name": "title", "type": "string"},
      {"internalType": "string", "name": "description", "type": "string"},
      {"internalType": "string[]", "name": "tags", "type": "string[]"},
      {"internalType": "uint256", "name": "aiConfidenceScore", "type": "uint256"},
      {"internalType": "address", "name": "creator", "type": "address"},
      {"internalType": "bool", "name": "enableAIVoting", "type": "bool"}
    ],
    "name": "storeProposalMetadata",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "proposalId", "type": "uint256"}],
    "name": "getProposalMetadata",
    "outputs": [
      {"internalType": "string", "name": "title", "type": "string"},
      {"internalType": "string", "name": "description", "type": "string"},
      {"internalType": "string[]", "name": "tags", "type": "string[]"},
      {"internalType": "uint256", "name": "aiConfidenceScore", "type": "uint256"},
      {"internalType": "uint256", "name": "createdAt", "type": "uint256"},
      {"internalType": "address", "name": "creator", "type": "address"},
      {"internalType": "bool", "name": "aiVotingEnabled", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "voter", "type": "address"},
      {"internalType": "uint256", "name": "proposalId", "type": "uint256"},
      {"internalType": "uint256", "name": "support", "type": "uint256"},
      {"internalType": "uint256", "name": "weight", "type": "uint256"},
      {"internalType": "string", "name": "reason", "type": "string"},
      {"internalType": "bool", "name": "automated", "type": "bool"}
    ],
    "name": "recordVote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
    "name": "getUserStats",
    "outputs": [
      {"internalType": "uint256", "name": "voteCount", "type": "uint256"},
      {"internalType": "uint256", "name": "proposalCount", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "userVoteCount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "userProposalCount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "bytes32", "name": "role", "type": "bytes32"},
      {"internalType": "address", "name": "account", "type": "address"}
    ],
    "name": "grantRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "bytes32", "name": "role", "type": "bytes32"},
      {"internalType": "address", "name": "account", "type": "address"}
    ],
    "name": "revokeRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "bytes32", "name": "role", "type": "bytes32"},
      {"internalType": "address", "name": "account", "type": "address"}
    ],
    "name": "hasRole",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "DEFAULT_ADMIN_ROLE",
    "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
    "stateMutability": "view",
    "type": "function"
  }
];

// ProposalRegistry ABI
export const PROPOSAL_REGISTRY_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "dao", "type": "address"},
      {"internalType": "string", "name": "proposalId", "type": "string"},
      {"internalType": "string", "name": "title", "type": "string"},
      {"internalType": "string", "name": "description", "type": "string"},
      {"internalType": "string", "name": "category", "type": "string"},
      {"internalType": "uint256", "name": "deadline", "type": "uint256"},
      {"internalType": "uint256", "name": "aiConfidenceScore", "type": "uint256"}
    ],
    "name": "registerProposal",
    "outputs": [{"internalType": "bytes32", "name": "registryId", "type": "bytes32"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bytes32", "name": "registryId", "type": "bytes32"}],
    "name": "getProposal",
    "outputs": [
      {"internalType": "address", "name": "dao", "type": "address"},
      {"internalType": "uint256", "name": "proposalId", "type": "uint256"},
      {"internalType": "string", "name": "title", "type": "string"},
      {"internalType": "string", "name": "description", "type": "string"},
      {"internalType": "string", "name": "category", "type": "string"},
      {"internalType": "address", "name": "creator", "type": "address"},
      {"internalType": "uint256", "name": "createdAt", "type": "uint256"},
      {"internalType": "uint256", "name": "deadline", "type": "uint256"},
      {"internalType": "bool", "name": "isActive", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "offset", "type": "uint256"},
      {"internalType": "uint256", "name": "limit", "type": "uint256"}
    ],
    "name": "getAllProposals",
    "outputs": [{"internalType": "tuple[]", "name": "", "type": "tuple[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "string", "name": "category", "type": "string"}],
    "name": "getProposalsByCategory",
    "outputs": [{"internalType": "tuple[]", "name": "", "type": "tuple[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "bytes32", "name": "registryId", "type": "bytes32"},
      {"internalType": "uint256", "name": "totalVotes", "type": "uint256"},
      {"internalType": "uint256", "name": "votesFor", "type": "uint256"},
      {"internalType": "uint256", "name": "votesAgainst", "type": "uint256"},
      {"internalType": "uint256", "name": "participationRate", "type": "uint256"}
    ],
    "name": "updateMetrics",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "bytes32", "name": "registryId", "type": "bytes32"},
      {"internalType": "uint256", "name": "newConfidenceScore", "type": "uint256"},
      {"internalType": "uint256", "name": "predictedOutcome", "type": "uint256"}
    ],
    "name": "updateAIAnalysis",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "userAddress", "type": "address"}],
    "name": "getUserStats",
    "outputs": [
      {"internalType": "uint256", "name": "proposalsCreated", "type": "uint256"},
      {"internalType": "uint256", "name": "totalVotes", "type": "uint256"},
      {"internalType": "bool", "name": "isVerified", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bytes32", "name": "registryId", "type": "bytes32"}],
    "name": "completeProposal",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// ConsentraDAO ABI (for voting functions)
export const CONSENSTRA_DAO_ABI = [
  {
    "inputs": [
      {"internalType": "uint256", "name": "proposalId", "type": "uint256"},
      {"internalType": "address", "name": "voter", "type": "address"}
    ],
    "name": "hasVoted",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "proposalId", "type": "uint256"},
      {"internalType": "address", "name": "voter", "type": "address"},
      {"internalType": "string", "name": "category", "type": "string"}
    ],
    "name": "scheduleAIVote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "proposalId", "type": "uint256"},
      {"internalType": "address", "name": "voter", "type": "address"},
      {"internalType": "string", "name": "category", "type": "string"}
    ],
    "name": "executeAIVote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "proposalId", "type": "uint256"},
      {"internalType": "uint8", "name": "support", "type": "uint8"},
      {"internalType": "string", "name": "reason", "type": "string"},
      {"internalType": "bool", "name": "automated", "type": "bool"}
    ],
    "name": "castVoteWithReasonAndAutomation",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "proposalId", "type": "uint256"},
      {"internalType": "uint8", "name": "support", "type": "uint8"},
      {"internalType": "string", "name": "reason", "type": "string"}
    ],
    "name": "castVoteWithReason",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "proposalId", "type": "uint256"},
      {"internalType": "uint8", "name": "support", "type": "uint8"}
    ],
    "name": "castVote",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "bool", "name": "enabled", "type": "bool"},
      {"internalType": "uint256", "name": "minConfidenceThreshold", "type": "uint256"},
      {"internalType": "uint256", "name": "votingDelay", "type": "uint256"}
    ],
    "name": "configureAIVoting",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "category", "type": "string"},
      {"internalType": "uint8", "name": "stance", "type": "uint8"}
    ],
    "name": "setCategoryPreference",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
    "name": "getUserAIConfig",
    "outputs": [
      {"internalType": "bool", "name": "enabled", "type": "bool"},
      {"internalType": "uint256", "name": "minConfidenceThreshold", "type": "uint256"},
      {"internalType": "uint256", "name": "votingDelay", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Utility functions
export const voteToNumber = (vote: 'for' | 'against' | 'abstain'): number => {
  switch (vote) {
    case 'for': return 1;
    case 'against': return 0;
    case 'abstain': return 2;
    default: return 2;
  }
};

// Helper functions
export const getContractInstance = (address: string, abi: any[], signerOrProvider: ethers.Signer | ethers.Provider) => {
  return new ethers.Contract(address, abi, signerOrProvider);
};

export const proposalIdToBytes32 = (proposalId: string): string => {
  // Convert proposal ID to bytes32 format
  return ethers.keccak256(ethers.toUtf8Bytes(proposalId));
};
