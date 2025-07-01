
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./SoulboundIdentityNFT.sol";
import "./AIVotingModule.sol";
import "./ProposalMetadataModule.sol";

/**
 * @title DAOIntegrationModule
 * @dev Handles AI voting and metadata integration for ConsentraDAO
 */
contract DAOIntegrationModule is AccessControl, ReentrancyGuard {
    bytes32 public constant AI_OPERATOR_ROLE = keccak256("AI_OPERATOR_ROLE");
    
    SoulboundIdentityNFT public immutable identityNFT;
    AIVotingModule public immutable aiVotingModule;
    ProposalMetadataModule public immutable proposalMetadataModule;
    
    error NotVerifiedIdentity();
    error ProposalNotFound();
    
    modifier onlyVerified() {
        if (!identityNFT.isVerified(msg.sender)) {
            revert NotVerifiedIdentity();
        }
        _;
    }
    
    constructor(
        SoulboundIdentityNFT _identityNFT,
        AIVotingModule _aiVotingModule,
        ProposalMetadataModule _proposalMetadataModule
    ) {
        identityNFT = _identityNFT;
        aiVotingModule = _aiVotingModule;
        proposalMetadataModule = _proposalMetadataModule;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(AI_OPERATOR_ROLE, msg.sender);
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
        proposalMetadataModule.storeProposalMetadata(
            proposalId,
            title,
            description,
            tags,
            aiConfidenceScore,
            creator,
            enableAIVoting
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
        proposalMetadataModule.recordVote(
            voter,
            proposalId,
            support,
            weight,
            reason,
            automated
        );
    }
    
    function executeAIVote(
        uint256 proposalId,
        address voter,
        string memory category,
        address daoContract
    ) external onlyRole(AI_OPERATOR_ROLE) nonReentrant returns (uint8, string memory) {
        return aiVotingModule.executeAIVote(
            proposalId,
            voter,
            category,
            daoContract
        );
    }
    
    function getProposalMetadata(uint256 proposalId) 
        external 
        view 
        returns (ProposalMetadataModule.ProposalMetadata memory) 
    {
        return proposalMetadataModule.getProposalMetadata(proposalId);
    }
    
    function getUserStats(address user) 
        external 
        view 
        returns (uint256 voteCount, uint256 proposalCount, bool isVerified) 
    {
        (uint256 votes, uint256 proposals) = proposalMetadataModule.getUserStats(user);
        return (votes, proposals, identityNFT.isVerified(user));
    }
}
