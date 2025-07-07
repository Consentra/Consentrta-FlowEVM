// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20VotesUpgradeable.sol";
import "./libraries/GovernanceLib.sol";
import "./interfaces/IMinimalGovernor.sol";
import "./SoulboundIdentityNFT.sol";

/**
 * @title MinimalGovernor
 * @dev Ultra-lightweight upgradeable governance contract
 */
contract MinimalGovernor is 
    Initializable, 
    AccessControlUpgradeable, 
    IMinimalGovernor 
{
    using GovernanceLib for mapping(uint256 => GovernanceLib.ProposalVote);
    
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");
    
    ERC20VotesUpgradeable public token;
    SoulboundIdentityNFT public identityNFT;
    
    mapping(uint256 => GovernanceLib.ProposalVote) private _proposalVotes;
    mapping(uint256 => string) public proposalDescriptions;
    mapping(uint256 => address) public proposalProposers;
    mapping(uint256 => uint256) public proposalSnapshots;
    mapping(uint256 => uint256) public proposalDeadlines;
    
    GovernanceLib.GovernanceParams public params;
    
    uint256 private _proposalCounter;
    
    modifier onlyVerified() {
        GovernanceLib.validateVerifiedUser(address(identityNFT), msg.sender);
        _;
    }
    
    function initialize(
        ERC20VotesUpgradeable _token,
        SoulboundIdentityNFT _identityNFT
    ) external initializer {
        __AccessControl_init();
        
        token = _token;
        identityNFT = _identityNFT;
        
        params = GovernanceLib.GovernanceParams({
            votingDelay: 1,
            votingPeriod: 50400, // ~1 week
            proposalThreshold: 0,
            quorumNumerator: 4
        });
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PROPOSER_ROLE, msg.sender);
    }
    
    function propose(string memory description) 
        external 
        override 
        onlyVerified 
        returns (uint256) 
    {
        uint256 proposalId = ++_proposalCounter;
        uint256 snapshot = block.number + params.votingDelay;
        uint256 deadline = snapshot + params.votingPeriod;
        
        proposalDescriptions[proposalId] = description;
        proposalProposers[proposalId] = msg.sender;
        proposalSnapshots[proposalId] = snapshot;
        proposalDeadlines[proposalId] = deadline;
        
        emit ProposalCreated(proposalId, msg.sender, description);
        return proposalId;
    }
    
    function castVote(uint256 proposalId, uint8 support) 
        external 
        override 
        onlyVerified 
        returns (uint256) 
    {
        return _castVote(proposalId, msg.sender, support, "");
    }
    
    function castVoteWithReason(
        uint256 proposalId, 
        uint8 support, 
        string calldata reason
    ) external override onlyVerified returns (uint256) {
        return _castVote(proposalId, msg.sender, support, reason);
    }
    
    function _castVote(
        uint256 proposalId,
        address account,
        uint8 support,
        string memory reason
    ) internal returns (uint256) {
        require(state(proposalId) == ProposalState.Active, "Voting not active");
        
        uint256 weight = token.getPastVotes(account, proposalSnapshots[proposalId]);
        
        GovernanceLib.countVote(_proposalVotes, proposalId, account, support, weight);
        
        emit VoteCast(account, proposalId, support, weight, reason);
        return weight;
    }
    
    function state(uint256 proposalId) public view override returns (ProposalState) {
        if (proposalSnapshots[proposalId] == 0) {
            return ProposalState.Pending;
        }
        
        if (block.number <= proposalSnapshots[proposalId]) {
            return ProposalState.Pending;
        }
        
        if (block.number <= proposalDeadlines[proposalId]) {
            return ProposalState.Active;
        }
        
        (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes) = 
            GovernanceLib.getProposalVotes(_proposalVotes, proposalId);
        
        uint256 totalSupply = token.getPastTotalSupply(proposalSnapshots[proposalId]);
        uint256 quorum = (params.quorumNumerator * totalSupply) / 100;
        
        if (forVotes + abstainVotes < quorum || forVotes <= againstVotes) {
            return ProposalState.Defeated;
        }
        
        return ProposalState.Succeeded;
    }
    
    function hasVoted(uint256 proposalId, address account) 
        external 
        view 
        override 
        returns (bool) 
    {
        return GovernanceLib.hasVoted(_proposalVotes, proposalId, account);
    }
    
    function proposalVotes(uint256 proposalId) 
        external 
        view 
        returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes) 
    {
        return GovernanceLib.getProposalVotes(_proposalVotes, proposalId);
    }
    
    // Admin functions
    function updateParams(GovernanceLib.GovernanceParams calldata newParams) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        params = newParams;
    }
}
