
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./SoulboundIdentityNFT.sol";
import "./AIOracle.sol";

/**
 * @title AIVotingModule
 * @dev Handles AI-powered voting functionality for ConsentraDAO
 */
contract AIVotingModule is AccessControl, ReentrancyGuard {
    bytes32 public constant AI_OPERATOR_ROLE = keccak256("AI_OPERATOR_ROLE");
    
    SoulboundIdentityNFT public immutable identityNFT;
    AIOracle public immutable aiOracle;
    
    struct AIVotingConfig {
        bool enabled;
        uint256 minConfidenceThreshold; // 0-100
        uint256 votingDelay; // in seconds
    }
    
    mapping(address => AIVotingConfig) public userAIConfigs;
    mapping(address => mapping(string => uint8)) public categoryPreferences; // user => category => preference
    mapping(uint256 => mapping(address => bool)) public aiVotesCast;
    mapping(uint256 => mapping(address => uint256)) public scheduledAIVotes;
    
    event AIVotingConfigUpdated(
        address indexed user,
        bool enabled,
        uint256 minConfidenceThreshold
    );
    
    event AIVoteScheduled(
        uint256 indexed proposalId,
        address indexed voter,
        uint256 executeAt
    );
    
    event AIVoteExecuted(
        uint256 indexed proposalId,
        address indexed voter,
        uint8 support,
        string reason
    );
    
    error NotVerifiedIdentity();
    error InvalidConfidenceScore();
    error AIVotingNotEnabled();
    error AIVoteAlreadyCast();
    error InvalidVotingDelay();
    error InvalidCategoryPreference();
    
    modifier onlyVerified() {
        if (!identityNFT.isVerified(msg.sender)) {
            revert NotVerifiedIdentity();
        }
        _;
    }
    
    constructor(
        SoulboundIdentityNFT _identityNFT,
        AIOracle _aiOracle
    ) {
        identityNFT = _identityNFT;
        aiOracle = _aiOracle;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(AI_OPERATOR_ROLE, msg.sender);
    }
    
    function configureAIVoting(
        bool enabled,
        uint256 minConfidenceThreshold,
        uint256 votingDelay
    ) external onlyVerified {
        if (minConfidenceThreshold > 100) {
            revert InvalidConfidenceScore();
        }
        if (votingDelay > 7 days) {
            revert InvalidVotingDelay();
        }
        
        userAIConfigs[msg.sender] = AIVotingConfig({
            enabled: enabled,
            minConfidenceThreshold: minConfidenceThreshold,
            votingDelay: votingDelay
        });
        
        emit AIVotingConfigUpdated(msg.sender, enabled, minConfidenceThreshold);
    }
    
    function setCategoryPreference(
        string memory category,
        uint8 preference
    ) external onlyVerified {
        if (preference > 2) {
            revert InvalidCategoryPreference();
        }
        categoryPreferences[msg.sender][category] = preference;
    }
    
    function scheduleAIVote(
        uint256 proposalId,
        address voter,
        string memory category
    ) external onlyRole(AI_OPERATOR_ROLE) {
        if (!identityNFT.isVerified(voter)) {
            revert NotVerifiedIdentity();
        }
        
        AIVotingConfig memory config = userAIConfigs[voter];
        if (!config.enabled) {
            revert AIVotingNotEnabled();
        }
        
        if (aiVotesCast[proposalId][voter]) {
            revert AIVoteAlreadyCast();
        }
        
        uint256 executeAt = block.timestamp + config.votingDelay;
        scheduledAIVotes[proposalId][voter] = executeAt;
        
        emit AIVoteScheduled(proposalId, voter, executeAt);
    }
    
    function executeAIVote(
        uint256 proposalId,
        address voter,
        string memory category,
        address daoContract
    ) external onlyRole(AI_OPERATOR_ROLE) nonReentrant returns (uint8, string memory) {
        uint256 scheduledTime = scheduledAIVotes[proposalId][voter];
        require(scheduledTime > 0 && block.timestamp >= scheduledTime, "Vote not ready for execution");
        
        if (aiVotesCast[proposalId][voter]) {
            revert AIVoteAlreadyCast();
        }
        
        AIVotingConfig memory config = userAIConfigs[voter];
        if (!config.enabled) {
            revert AIVotingNotEnabled();
        }
        
        // Get AI prediction
        bytes32 proposalHash = keccak256(abi.encodePacked(proposalId));
        AIOracle.AIPrediction memory prediction = aiOracle.getPrediction(proposalHash);
        
        if (prediction.confidenceScore < config.minConfidenceThreshold) {
            // Clear scheduled vote if confidence too low
            delete scheduledAIVotes[proposalId][voter];
            revert InvalidConfidenceScore();
        }
        
        // Determine vote based on category preference and AI prediction
        uint8 vote = categoryPreferences[voter][category];
        
        // AI override logic with higher confidence threshold
        if (vote == 1 && prediction.predictedOutcome == 0 && prediction.confidenceScore > 85) {
            vote = 0; // Vote against
        } else if (vote == 0 && prediction.predictedOutcome == 1 && prediction.confidenceScore > 85) {
            vote = 1; // Vote for
        }
        
        // Create reason string
        string memory reason = string(abi.encodePacked(
            "AI-powered vote: ",
            category,
            " preference with ",
            uint2str(prediction.confidenceScore),
            "% confidence - ",
            prediction.reasoning
        ));
        
        aiVotesCast[proposalId][voter] = true;
        
        // Clear scheduled vote
        delete scheduledAIVotes[proposalId][voter];
        
        emit AIVoteExecuted(proposalId, voter, vote, reason);
        
        return (vote, reason);
    }
    
    function getUserAIConfig(address user) 
        external 
        view 
        returns (bool enabled, uint256 minConfidenceThreshold, uint256 votingDelay) 
    {
        AIVotingConfig memory config = userAIConfigs[user];
        return (config.enabled, config.minConfidenceThreshold, config.votingDelay);
    }
    
    function getCategoryPreference(address user, string memory category) 
        external 
        view 
        returns (uint8) 
    {
        return categoryPreferences[user][category];
    }
    
    function getScheduledAIVote(uint256 proposalId, address voter) 
        external 
        view 
        returns (uint256) 
    {
        return scheduledAIVotes[proposalId][voter];
    }
    
    function uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) return "0";
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }
}
