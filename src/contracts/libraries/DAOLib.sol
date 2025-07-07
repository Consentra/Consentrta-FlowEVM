
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title DAOLib
 * @dev DAO management utilities library
 */
library DAOLib {
    struct DAOConfig {
        string name;
        uint256 votingDelay;
        uint256 votingPeriod;
        uint256 quorumPercentage;
        address creator;
        uint256 createdAt;
    }
    
    struct MemberInfo {
        bool isActive;
        uint256 joinedAt;
        uint256 votingPower;
    }
    
    error InvalidConfig();
    error AlreadyMember();
    error NotMember();
    
    function validateConfig(DAOConfig memory config) external pure {
        if (bytes(config.name).length == 0) revert InvalidConfig();
        if (config.votingDelay == 0) revert InvalidConfig();
        if (config.votingPeriod == 0) revert InvalidConfig();
        if (config.quorumPercentage > 100) revert InvalidConfig();
    }
    
    function addMember(
        mapping(address => MemberInfo) storage members,
        address member
    ) external {
        if (members[member].isActive) revert AlreadyMember();
        
        members[member] = MemberInfo({
            isActive: true,
            joinedAt: block.timestamp,
            votingPower: 1
        });
    }
    
    function removeMember(
        mapping(address => MemberInfo) storage members,
        address member
    ) external {
        if (!members[member].isActive) revert NotMember();
        members[member].isActive = false;
    }
    
    function isMember(
        mapping(address => MemberInfo) storage members,
        address account
    ) external view returns (bool) {
        return members[account].isActive;
    }
}
