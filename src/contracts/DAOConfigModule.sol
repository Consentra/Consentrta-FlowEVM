
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title DAOConfigModule
 * @dev Handles DAO configuration validation and management
 */
contract DAOConfigModule is AccessControl {
    struct DAOConfig {
        string name;
        string tokenName;
        string tokenSymbol;
        uint256 initialSupply;
        uint256 votingDelay;
        uint256 votingPeriod;
        uint256 proposalThreshold;
        uint256 quorumPercentage;
        uint256 timelockDelay;
    }
    
    uint256 public constant MIN_VOTING_DELAY = 1 days;
    uint256 public constant MAX_VOTING_DELAY = 7 days;
    uint256 public constant MIN_VOTING_PERIOD = 3 days;
    uint256 public constant MAX_VOTING_PERIOD = 30 days;
    uint256 public constant MIN_TIMELOCK_DELAY = 2 days;
    uint256 public constant MAX_TIMELOCK_DELAY = 30 days;
    uint256 public constant MIN_QUORUM = 1;
    uint256 public constant MAX_QUORUM = 100;
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
    
    function validateConfig(DAOConfig memory config) 
        external 
        pure 
        returns (bool valid, string memory reason) 
    {
        if (bytes(config.name).length == 0) {
            return (false, "Name cannot be empty");
        }
        
        if (bytes(config.tokenName).length == 0) {
            return (false, "Token name cannot be empty");
        }
        
        if (bytes(config.tokenSymbol).length == 0) {
            return (false, "Token symbol cannot be empty");
        }
        
        if (config.initialSupply == 0) {
            return (false, "Initial supply must be greater than 0");
        }
        
        if (config.votingDelay < MIN_VOTING_DELAY || config.votingDelay > MAX_VOTING_DELAY) {
            return (false, "Invalid voting delay");
        }
        
        if (config.votingPeriod < MIN_VOTING_PERIOD || config.votingPeriod > MAX_VOTING_PERIOD) {
            return (false, "Invalid voting period");
        }
        
        if (config.timelockDelay < MIN_TIMELOCK_DELAY || config.timelockDelay > MAX_TIMELOCK_DELAY) {
            return (false, "Invalid timelock delay");
        }
        
        if (config.quorumPercentage < MIN_QUORUM || config.quorumPercentage > MAX_QUORUM) {
            return (false, "Invalid quorum percentage");
        }
        
        return (true, "");
    }
    
    function validateMembers(
        address[] memory members,
        uint256[] memory allocations
    ) external pure returns (bool valid, string memory reason) {
        if (members.length == 0) {
            return (false, "Must have at least one member");
        }
        
        if (members.length != allocations.length) {
            return (false, "Members and allocations length mismatch");
        }
        
        if (members.length > 100) {
            return (false, "Too many initial members");
        }
        
        uint256 totalAllocation = 0;
        for (uint256 i = 0; i < allocations.length; i++) {
            if (allocations[i] == 0) {
                return (false, "Allocation cannot be zero");
            }
            totalAllocation += allocations[i];
        }
        
        // Check for duplicate members
        for (uint256 i = 0; i < members.length; i++) {
            if (members[i] == address(0)) {
                return (false, "Invalid member address");
            }
            for (uint256 j = i + 1; j < members.length; j++) {
                if (members[i] == members[j]) {
                    return (false, "Duplicate member address");
                }
            }
        }
        
        return (true, "");
    }
}
