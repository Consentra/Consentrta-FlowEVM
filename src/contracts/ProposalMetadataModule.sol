
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title ProposalMetadataModule
 * @dev Handles proposal metadata storage and management for ConsentraDAO
 */
contract ProposalMetadataModule is AccessControl {
    struct ProposalMetadata {
        string title;
        string description;
        string[] tags;
        uint256 aiConfidenceScore;
        uint256 createdAt;
        address creator;
        bool aiVotingEnabled;
    }
    
    mapping(uint256 => ProposalMetadata) public proposalMetadata;
    mapping(address => uint256) public userVoteCount;
    mapping(address => uint256) public userProposalCount;
    
    event ProposalCreatedWithMetadata(
        uint256 indexed proposalId,
        address indexed creator,
        string title,
        string description,
        uint256 aiConfidenceScore
    );
    
    event VoteCastWithReason(
        address indexed voter,
        uint256 indexed proposalId,
        uint8 support,
        uint256 weight,
        string reason,
        bool automated
    );
    
    error InvalidConfidenceScore();
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
    
    function storeProposalMetadata(
        uint256 proposalId,
        string memory title,
        string memory description,
        string[] memory tags,
        uint256 aiConfidenceScore,
        address creator,
        bool enableAIVoting
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (aiConfidenceScore > 100) {
            revert InvalidConfidenceScore();
        }
        
        proposalMetadata[proposalId] = ProposalMetadata({
            title: title,
            description: description,
            tags: tags,
            aiConfidenceScore: aiConfidenceScore,
            createdAt: block.timestamp,
            creator: creator,
            aiVotingEnabled: enableAIVoting
        });
        
        userProposalCount[creator]++;
        
        emit ProposalCreatedWithMetadata(
            proposalId,
            creator,
            title,
            description,
            aiConfidenceScore
        );
    }
    
    function recordVote(
        address voter,
        uint256 proposalId,
        uint8 support,
        uint256 weight,
        string memory reason,
        bool automated
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (!automated) {
            userVoteCount[voter]++;
        }
        
        emit VoteCastWithReason(voter, proposalId, support, weight, reason, automated);
    }
    
    function getProposalMetadata(uint256 proposalId) 
        external 
        view 
        returns (ProposalMetadata memory) 
    {
        return proposalMetadata[proposalId];
    }
    
    function getUserStats(address user) 
        external 
        view 
        returns (uint256 voteCount, uint256 proposalCount) 
    {
        return (userVoteCount[user], userProposalCount[user]);
    }
}
