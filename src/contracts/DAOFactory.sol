
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
    
    constructor(
        address _daoImplementation,
        address _tokenImplementation,
        SoulboundIdentityNFT _identityNFT
    ) Ownable(msg.sender) {
        identityNFT = _identityNFT;
        
        // Deploy modules
        storageModule = new DAOStorageModule();
        deploymentModule = new DAODeploymentModule(_daoImplementation, _tokenImplementation);
        configModule = new DAOConfigModule();
        eventModule = new DAOEventModule();
        
        // Grant admin roles
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
        
        daoId = storageModule.incrementDAOCounter();
        
        // Emit deployment started event
        eventModule.emitDAODeploymentStarted(daoId, msg.sender, config.name);
        
        // Deploy contracts
        address tokenClone = deploymentModule.deployToken();
        address timelockAddr = deploymentModule.deployTimelock(config.timelockDelay);
        address daoClone = deploymentModule.deployDAO();
        
        // Setup roles
        deploymentModule.setupRoles(timelockAddr, daoClone);
        
        // Distribute tokens
        deploymentModule.distributeTokens(tokenClone, initialMembers, initialAllocations);
        
        // Store DAO info
        storageModule.storeDAO(daoId, daoClone, tokenClone, timelockAddr, config.name, msg.sender);
        
        // Add members
        for (uint256 i = 0; i < initialMembers.length; i++) {
            storageModule.addMember(initialMembers[i], daoId);
            eventModule.emitDAOMemberAdded(daoId, initialMembers[i], msg.sender);
        }
        
        // Emit completion events
        eventModule.emitDAODeploymentCompleted(daoId, daoClone, tokenClone, timelockAddr);
        eventModule.emitDAOCreated(daoId, msg.sender, daoClone, tokenClone, timelockAddr, config.name);
        
        return daoId;
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
