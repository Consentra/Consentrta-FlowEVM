
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title GovernanceLib
 * @dev Core governance logic library - keeps contracts under size limit
 */
library GovernanceLib {
    struct ProposalVote {
        uint256 againstVotes;
        uint256 forVotes;
        uint256 abstainVotes;
        mapping(address => bool) hasVoted;
    }
    
    struct GovernanceParams {
        uint256 votingDelay;
        uint256 votingPeriod;
        uint256 proposalThreshold;
        uint256 quorumNumerator;
    }
    
    error NotVerified();
    error AlreadyVoted();
    
    function validateVerifiedUser(address identityNFT, address user) external view {
        (bool success, bytes memory data) = identityNFT.staticcall(
            abi.encodeWithSignature("isVerified(address)", user)
        );
        if (!success || !abi.decode(data, (bool))) {
            revert NotVerified();
        }
    }
    
    function countVote(
        mapping(uint256 => ProposalVote) storage proposalVotes,
        uint256 proposalId,
        address account,
        uint8 support,
        uint256 weight
    ) external {
        ProposalVote storage votes = proposalVotes[proposalId];
        
        if (votes.hasVoted[account]) {
            revert AlreadyVoted();
        }
        
        votes.hasVoted[account] = true;
        
        if (support == 0) {
            votes.againstVotes += weight;
        } else if (support == 1) {
            votes.forVotes += weight;
        } else if (support == 2) {
            votes.abstainVotes += weight;
        }
    }
    
    function hasVoted(
        mapping(uint256 => ProposalVote) storage proposalVotes,
        uint256 proposalId,
        address account
    ) external view returns (bool) {
        return proposalVotes[proposalId].hasVoted[account];
    }
    
    function getProposalVotes(
        mapping(uint256 => ProposalVote) storage proposalVotes,
        uint256 proposalId
    ) external view returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes) {
        ProposalVote storage votes = proposalVotes[proposalId];
        return (votes.againstVotes, votes.forVotes, votes.abstainVotes);
    }
}
