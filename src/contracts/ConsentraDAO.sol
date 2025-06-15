
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./SoulboundIdentityNFT.sol";
import "./AIVotingModule.sol";
import "./ProposalMetadataModule.sol";

/**
 * @title ConsentraDAO
 * @dev Enhanced DAO governance contract with sybil resistance and AI-powered voting
 */
contract ConsentraDAO is 
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl,
    AccessControl,
    ReentrancyGuard,
    Pausable
{
    bytes32 public constant AI_OPERATOR_ROLE = keccak256("AI_OPERATOR_ROLE");
    bytes32 public constant PROPOSAL_CREATOR_ROLE = keccak256("PROPOSAL_CREATOR_ROLE");
    
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
    
    modifier validProposal(uint256 proposalId) {
        if (state(proposalId) == ProposalState.Pending) {
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
    )
        Governor("ConsentraDAO")
        GovernorSettings(1, 50400, 0)
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(4)
        GovernorTimelockControl(_timelock)
    {
        identityNFT = _identityNFT;
        aiVotingModule = _aiVotingModule;
        proposalMetadataModule = _proposalMetadataModule;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(AI_OPERATOR_ROLE, msg.sender);
        _grantRole(PROPOSAL_CREATOR_ROLE, msg.sender);
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
        uint256 proposalId = propose(targets, values, calldatas, description);
        
        proposalMetadataModule.storeProposalMetadata(
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
        uint256 weight = castVoteWithReason(proposalId, support, reason);
        
        proposalMetadataModule.recordVote(
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
    ) external onlyRole(AI_OPERATOR_ROLE) validProposal(proposalId) nonReentrant {
        (uint8 vote, string memory reason) = aiVotingModule.executeAIVote(
            proposalId,
            voter,
            category,
            address(this)
        );
        
        _castVote(proposalId, voter, vote, reason, "");
        
        proposalMetadataModule.recordVote(
            voter,
            proposalId,
            vote,
            getVotes(voter, block.number - 1),
            reason,
            true
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
    
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
    
    function _castVote(
        uint256 proposalId,
        address account,
        uint8 support,
        string memory reason,
        bytes memory params
    ) internal override whenNotPaused returns (uint256) {
        if (!identityNFT.isVerified(account)) {
            revert NotVerifiedIdentity();
        }
        
        return super._castVote(proposalId, account, support, reason, params);
    }
    
    function _executeOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) {
        super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);
    }
    
    function _queueOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint48) {
        return super._queueOperations(proposalId, targets, values, calldatas, descriptionHash);
    }
    
    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }
    
    function _executor()
        internal
        view
        override(Governor, GovernorTimelockControl)
        returns (address)
    {
        return super._executor();
    }
    
    function state(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }
    
    function proposalNeedsQueuing(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (bool)
    {
        return super.proposalNeedsQueuing(proposalId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(Governor, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // Required overrides
    function votingDelay()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.votingDelay();
    }
    
    function votingPeriod()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.votingPeriod();
    }
    
    function quorum(uint256 blockNumber)
        public
        view
        override(Governor, GovernorVotesQuorumFraction)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }
    
    function proposalThreshold()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
    }
}
