
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/governance/TimelockController.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./ConsentraGovernanceToken.sol";

/**
 * @title DAODeploymentModule
 * @dev Handles DAO contract deployment for DAOFactory
 */
contract DAODeploymentModule is AccessControl {
    using Clones for address;
    
    address public immutable daoImplementation;
    address public immutable tokenImplementation;
    
    constructor(
        address _daoImplementation,
        address _tokenImplementation
    ) {
        daoImplementation = _daoImplementation;
        tokenImplementation = _tokenImplementation;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
    
    function deployToken() external onlyRole(DEFAULT_ADMIN_ROLE) returns (address) {
        return tokenImplementation.clone();
    }
    
    function deployTimelock(uint256 delay) external onlyRole(DEFAULT_ADMIN_ROLE) returns (address) {
        address[] memory proposers = new address[](1);
        address[] memory executors = new address[](1);
        proposers[0] = address(0); // Will be set to DAO address
        executors[0] = address(0); // Will be set to DAO address
        
        TimelockController timelock = new TimelockController(
            delay,
            proposers,
            executors,
            address(0)
        );
        
        return address(timelock);
    }
    
    function deployDAO() external onlyRole(DEFAULT_ADMIN_ROLE) returns (address) {
        return daoImplementation.clone();
    }
    
    function setupRoles(address timelockAddr, address daoAddr) external onlyRole(DEFAULT_ADMIN_ROLE) {
        TimelockController timelock = TimelockController(payable(timelockAddr));
        
        timelock.grantRole(timelock.PROPOSER_ROLE(), daoAddr);
        timelock.grantRole(timelock.EXECUTOR_ROLE(), daoAddr);
        timelock.renounceRole(timelock.DEFAULT_ADMIN_ROLE(), address(this));
    }
    
    function distributeTokens(
        address tokenAddr,
        address[] memory members,
        uint256[] memory allocations
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        ConsentraGovernanceToken token = ConsentraGovernanceToken(tokenAddr);
        
        for (uint256 i = 0; i < members.length; i++) {
            token.mint(members[i], allocations[i]);
        }
    }
}
