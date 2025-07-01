
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./SoulboundIdentityNFT.sol";
import "./DAOStorageModule.sol";
import "./DAODeploymentModule.sol";
import "./DAOConfigModule.sol";
import "./DAOEventModule.sol";

/**
 * @title DAOFactory
 * @dev Factory contract for creating new DAOs with automated setup - now modularized
 */
contract DAOFactory is Ownable {
    SoulboundIdentityNFT public immutable identityNFT;
    DAOStorageModule public immutable storageModule;
    DAODeploymentModule public immutable deploymentModule;
    DAOConfigModule public immutable configModule;
    DAOEventModule public immutable eventModule;
    
    struct DeploymentAddresses {
        address tokenClone;
        address timelockAddr;
        address daoClone;
    }
    
    constructor(
        address _daoImplementation,
        address _tokenImplementation,
        SoulboundIdentityNFT _identityNFT,
        address _storageModule,
        address _deploymentModule,
        address _configModule,
        address _eventModule
    ) Ownable(msg.sender) {
        identityNFT = _identityNFT;
        
        // Use pre-deployed modules
        storageModule = DAOStorageModule(_storageModule);
        deploymentModule = DAODeploymentModule(_deploymentModule);
        configModule = DAOConfigModule(_configModule);
        eventModule = DAOEventModule(_eventModule);
        
        // Grant admin roles to this factory
        storageModule.grantRole(storageModule.DEFAULT_ADMIN_ROLE(), address(this));
        deploymentModule.grantRole(deploymentModule.DEFAULT_ADMIN_ROLE(), address(this));
        configModule.grantRole(configModule.DEFAULT_ADMIN_ROLE(), address(this));
        eventModule.grantRole(eventModule.DEFAULT_ADMIN_ROLE(), address(this));
    }
    
    function createDAO(
        DAOConfigModule.DAOConfig memory config,
        address[] memory initialMembers,
        uint256[] memory initialAllocations
    ) external returns (uint256 daoId) {
        require(identityNFT.isVerified(msg.sender), "Creator must be verified");
        
        // Validate configuration and members
        _validateDAOCreation(config, initialMembers, initialAllocations);
        
        daoId = storageModule.incrementDAOCounter();
        
        // Emit deployment started event
        eventModule.emitDAODeploymentStarted(daoId, msg.sender, config.name);
        
        // Deploy contracts and setup
        DeploymentAddresses memory addresses = _deployDAOContracts(config);
        
        // Store DAO info and add members
        _finalizeDAOCreation(daoId, addresses, config, initialMembers, initialAllocations);
        
        return daoId;
    }
    
    function _validateDAOCreation(
        DAOConfigModule.DAOConfig memory config,
        address[] memory initialMembers,
        uint256[] memory initialAllocations
    ) private view {
        // Validate configuration
        (bool configValid, string memory configReason) = configModule.validateConfig(config);
        require(configValid, configReason);
        
        // Validate members
        (bool membersValid, string memory membersReason) = configModule.validateMembers(
            initialMembers, 
            initialAllocations
        );
        require(membersValid, membersReason);
        
        // Verify all members
        for (uint256 i = 0; i < initialMembers.length; i++) {
            require(identityNFT.isVerified(initialMembers[i]), "All members must be verified");
        }
    }
    
    function _deployDAOContracts(
        DAOConfigModule.DAOConfig memory config
    ) private returns (DeploymentAddresses memory addresses) {
        // Deploy contracts
        addresses.tokenClone = deploymentModule.deployToken();
        addresses.timelockAddr = deploymentModule.deployTimelock(config.timelockDelay);
        addresses.daoClone = deploymentModule.deployDAO();
        
        // Setup roles
        deploymentModule.setupRoles(addresses.timelockAddr, addresses.daoClone);
        
        return addresses;
    }
    
    function _finalizeDAOCreation(
        uint256 daoId,
        DeploymentAddresses memory addresses,
        DAOConfigModule.DAOConfig memory config,
        address[] memory initialMembers,
        uint256[] memory initialAllocations
    ) private {
        // Distribute tokens
        deploymentModule.distributeTokens(addresses.tokenClone, initialMembers, initialAllocations);
        
        // Store DAO info
        storageModule.storeDAO(
            daoId, 
            addresses.daoClone, 
            addresses.tokenClone, 
            addresses.timelockAddr, 
            config.name, 
            msg.sender
        );
        
        // Add members
        for (uint256 i = 0; i < initialMembers.length; i++) {
            storageModule.addMember(initialMembers[i], daoId);
            eventModule.emitDAOMemberAdded(daoId, initialMembers[i], msg.sender);
        }
        
        // Emit completion events
        eventModule.emitDAODeploymentCompleted(daoId, addresses.daoClone, addresses.tokenClone, addresses.timelockAddr);
        eventModule.emitDAOCreated(daoId, msg.sender, addresses.daoClone, addresses.tokenClone, addresses.timelockAddr, config.name);
    }
    
    function joinDAO(uint256 daoId) external {
        require(identityNFT.isVerified(msg.sender), "Must be verified to join DAO");
        storageModule.addMember(msg.sender, daoId);
        eventModule.emitDAOMemberAdded(daoId, msg.sender, msg.sender);
    }
    
    // Delegate view functions to storage module
    function getUserDAOs(address user) external view returns (uint256[] memory) {
        return storageModule.getUserDAOs(user);
    }
    
    function getDAO(uint256 daoId) external view returns (DAOStorageModule.DeployedDAO memory) {
        return storageModule.getDAO(daoId);
    }
    
    function getAllDAOs(uint256 offset, uint256 limit) 
        external 
        view 
        returns (DAOStorageModule.DeployedDAO[] memory) 
    {
        return storageModule.getAllDAOs(offset, limit);
    }
    
    function checkMembership(address user, uint256 daoId) external view returns (bool) {
        return storageModule.checkMembership(user, daoId);
    }
    
    function daoCounter() external view returns (uint256) {
        return storageModule.daoCounter();
    }
}
