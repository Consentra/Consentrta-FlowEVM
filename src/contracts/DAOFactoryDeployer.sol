
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./SoulboundIdentityNFT.sol";

interface IAccessControlModule {
    function DEFAULT_ADMIN_ROLE() external view returns (bytes32);
    function grantRole(bytes32 role, address account) external;
    function revokeRole(bytes32 role, address account) external;
}

/**
 * @title DAOFactoryDeployer
 * @dev Lightweight helper contract for role setup - modules should be deployed separately
 */
contract DAOFactoryDeployer {
    event DAOFactoryDeployed(
        address indexed factory,
        address storageModule,
        address deploymentModule,
        address configModule,
        address eventModule
    );
    
    // Setup roles after manual factory deployment
    function setupRoles(
        address _factory,
        address _storageModule,
        address _deploymentModule,
        address _configModule,
        address _eventModule
    ) external {
        IAccessControlModule storageModule = IAccessControlModule(_storageModule);
        IAccessControlModule deploymentModule = IAccessControlModule(_deploymentModule);
        IAccessControlModule configModule = IAccessControlModule(_configModule);
        IAccessControlModule eventModule = IAccessControlModule(_eventModule);
        
        bytes32 adminRole = storageModule.DEFAULT_ADMIN_ROLE();
        
        // Grant admin roles to factory
        storageModule.grantRole(adminRole, _factory);
        deploymentModule.grantRole(adminRole, _factory);
        configModule.grantRole(adminRole, _factory);
        eventModule.grantRole(adminRole, _factory);
        
        // Revoke admin roles from this deployer
        storageModule.revokeRole(adminRole, address(this));
        deploymentModule.revokeRole(adminRole, address(this));
        configModule.revokeRole(adminRole, address(this));
        eventModule.revokeRole(adminRole, address(this));
        
        emit DAOFactoryDeployed(
            _factory,
            _storageModule,
            _deploymentModule,
            _configModule,
            _eventModule
        );
    }
}
