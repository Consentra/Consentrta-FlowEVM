
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/governance/TimelockController.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./CoreGovernanceModule.sol";
import "./DAOIntegrationModule.sol";
import "./SoulboundIdentityNFT.sol";
import "./AIVotingModule.sol";
import "./ProposalMetadataModule.sol";

/**
 * @title ConsentraDAO
 * @dev Enhanced DAO governance contract with sybil resistance and AI-powered voting
 */
contract ConsentraDAO is Pausable {
    bytes32 public constant AI_OPERATOR_ROLE = keccak256("AI_OPERATOR_ROLE");
    bytes32 public constant PROPOSAL_CREATOR_ROLE = keccak256("PROPOSAL_CREATOR_ROLE");
    
    // Define ProposalState enum locally to avoid import issues
    enum ProposalState {
        Pending,
        Active,
        Canceled,
        Defeated,
        Succeeded,
        Queued,
        Expired,
        Executed
    }
    
    CoreGovernanceModule public immutable coreGovernance;
    DAOIntegrationModule public immutable integrationModule;
    
    error NotVerifiedIdentity();
    error ProposalNotFound();
    
    modifier onlyVerified() {
        if (!coreGovernance.identityNFT().isVerified(msg.sender)) {
            revert NotVerifiedIdentity();
        }
        _;
    }
    
    modifier validProposal(uint256 proposalId) {
        if (uint8(coreGovernance.state(proposalId)) == uint8(ProposalState.Pending)) {
            revert ProposalNotFound();
        }
        _;
    }
    
    constructor(
        IVotes _token,
        TimelockController _timelock,
        SoulboundIdentityNFT _identityNFT,
        AIVotingModule _aiVotingModule,
        ProposalMetadataModule _proposalMetadataModule
    ) {
        coreGovernance = new CoreGovernanceModule(
            _token,
            _timelock,
            _identityNFT,
            "ConsentraDAO"
        );
        
        integrationModule = new DAOIntegrationModule(
            _identityNFT,
            _aiVotingModule,
            _proposalMetadataModule
        );
        
        // Grant necessary roles
        coreGovernance.grantRole(coreGovernance.DEFAULT_ADMIN_ROLE(), address(integrationModule));
        integrationModule.grantRole(integrationModule.DEFAULT_ADMIN_ROLE(), address(this));
        integrationModule.grantRole(integrationModule.AI_OPERATOR_ROLE(), address(this));
    }
    
    function proposeWithMetadata(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description,
        string memory title,
        string[] memory tags,
        uint256 aiConfidenceScore,
        bool enableAIVoting
    ) public onlyVerified returns (uint256) {
        uint256 proposalId = coreGovernance.propose(targets, values, calldatas, description);
        
        integrationModule.storeProposalMetadata(
            proposalId,
            title,
            description,
            tags,
            aiConfidenceScore,
            msg.sender,
            enableAIVoting
        );
        
        return proposalId;
    }
    
    function castVoteWithReasonAndAutomation(
        uint256 proposalId,
        uint8 support,
        string calldata reason,
        bool automated
    ) public onlyVerified returns (uint256) {
        uint256 weight = coreGovernance.castVoteWithReason(proposalId, support, reason);
        
        integrationModule.recordVote(
            msg.sender,
            proposalId,
            support,
            weight,
            reason,
            automated
        );
        
        return weight;
    }
    
    function executeAIVote(
        uint256 proposalId,
        address voter,
        string memory category
    ) external validProposal(proposalId) {
        require(integrationModule.hasRole(integrationModule.AI_OPERATOR_ROLE(), msg.sender), "Not AI operator");
        
        (uint8 vote, string memory reason) = integrationModule.executeAIVote(
            proposalId,
            voter,
            category,
            address(coreGovernance)
        );
        
        // Cast vote through core governance
        coreGovernance.castVoteWithReason(proposalId, vote, reason);
        
        integrationModule.recordVote(
            voter,
            proposalId,
            vote,
            coreGovernance.getVotes(voter, block.number - 1),
            reason,
            true
        );
    }
    
    function getProposalMetadata(uint256 proposalId) 
        external 
        view 
        returns (ProposalMetadataModule.ProposalMetadata memory) 
    {
        return integrationModule.getProposalMetadata(proposalId);
    }
    
    function getUserStats(address user) 
        external 
        view 
        returns (uint256 voteCount, uint256 proposalCount, bool isVerified) 
    {
        return integrationModule.getUserStats(user);
    }
    
    function pause() external {
        require(coreGovernance.hasRole(coreGovernance.DEFAULT_ADMIN_ROLE(), msg.sender), "Not admin");
        _pause();
    }
    
    function unpause() external {
        require(coreGovernance.hasRole(coreGovernance.DEFAULT_ADMIN_ROLE(), msg.sender), "Not admin");
        _unpause();
    }
    
    // Delegate functions to core governance
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public returns (uint256) {
        return coreGovernance.propose(targets, values, calldatas, description);
    }
    
    function castVote(uint256 proposalId, uint8 support) public returns (uint256) {
        return coreGovernance.castVote(proposalId, support);
    }
    
    function castVoteWithReason(
        uint256 proposalId,
        uint8 support,
        string calldata reason
    ) public returns (uint256) {
        return coreGovernance.castVoteWithReason(proposalId, support, reason);
    }
    
    function state(uint256 proposalId) public view returns (CoreGovernanceModule.ProposalState) {
        return coreGovernance.state(proposalId);
    }
    
    function getVotes(address account, uint256 blockNumber) public view returns (uint256) {
        return coreGovernance.getVotes(account, blockNumber);
    }
}
