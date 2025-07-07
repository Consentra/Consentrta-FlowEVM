
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IMinimalGovernor
 * @dev Minimal governance interface for compatibility
 */
interface IMinimalGovernor {
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
    
    event ProposalCreated(
        uint256 proposalId,
        address proposer,
        string description
    );
    
    event VoteCast(
        address indexed voter,
        uint256 proposalId,
        uint8 support,
        uint256 weight,
        string reason
    );
    
    function propose(string memory description) external returns (uint256);
    function castVote(uint256 proposalId, uint8 support) external returns (uint256);
    function castVoteWithReason(uint256 proposalId, uint8 support, string calldata reason) external returns (uint256);
    function state(uint256 proposalId) external view returns (ProposalState);
    function hasVoted(uint256 proposalId, address account) external view returns (bool);
}
