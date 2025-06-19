
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title DAOEventModule
 * @dev Handles event emission and logging for DAO operations
 */
contract DAOEventModule is AccessControl {
    event DAOCreated(
        uint256 indexed daoId,
        address indexed creator,
        address dao,
        address token,
        address timelock,
        string name
    );
    
    event DAOMemberAdded(
        uint256 indexed daoId,
        address indexed member,
        address indexed addedBy
    );
    
    event DAOConfigurationUpdated(
        uint256 indexed daoId,
        string configType,
        bytes32 oldValue,
        bytes32 newValue
    );
    
    event DAODeploymentStarted(
        uint256 indexed daoId,
        address indexed creator,
        string name
    );
    
    event DAODeploymentCompleted(
        uint256 indexed daoId,
        address dao,
        address token,
        address timelock
    );
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
    
    function emitDAOCreated(
        uint256 daoId,
        address creator,
        address dao,
        address token,
        address timelock,
        string memory name
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        emit DAOCreated(daoId, creator, dao, token, timelock, name);
    }
    
    function emitDAOMemberAdded(
        uint256 daoId,
        address member,
        address addedBy
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        emit DAOMemberAdded(daoId, member, addedBy);
    }
    
    function emitDAODeploymentStarted(
        uint256 daoId,
        address creator,
        string memory name
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        emit DAODeploymentStarted(daoId, creator, name);
    }
    
    function emitDAODeploymentCompleted(
        uint256 daoId,
        address dao,
        address token,
        address timelock
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        emit DAODeploymentCompleted(daoId, dao, token, timelock);
    }
}
