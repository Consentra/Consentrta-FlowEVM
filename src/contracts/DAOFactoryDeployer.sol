
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./DAOFactory.sol";
import "./DAOStorageModule.sol";
import "./DAODeploymentModule.sol";
import "./DAOConfigModule.sol";
import "./DAOEventModule.sol";
import "./SoulboundIdentityNFT.sol";

/**
 * @title DAOFactoryDeployer
 * @dev Helper contract to deploy DAOFactory with all its modules
 */
contract DAOFactoryDeployer {
    event DAOFactoryDeployed(
        address indexed factory,
        address storageModule,
        address deploymentModule,
        address configModule,
        address eventModule
    );
    
    function deployDAOFactory(
        address _daoImplementation,
        address _tokenImplementation,
        SoulboundIdentityNFT _identityNFT
    ) external returns (DAOFactory factory) {
        // Deploy modules
        DAOStorageModule storageModule = new DAOStorageModule();
        DAODeploymentModule deploymentModule = new DAODeploymentModule(_daoImplementation, _tokenImplementation);
        DAOConfigModule configModule = new DAOConfigModule();
        DAOEventModule eventModule = new DAOEventModule();
        
        // Deploy factory with module addresses
        factory = new DAOFactory(
            _daoImplementation,
            _tokenImplementation,
            _identityNFT,
            address(storageModule),
            address(deploymentModule),
            address(configModule),
            address(eventModule)
        );
        
        // Transfer ownership of modules to factory
        storageModule.transferOwnership(address(factory));
        deploymentModule.transferOwnership(address(factory));
        configModule.transferOwnership(address(factory));
        eventModule.transferOwnership(address(factory));
        
        emit DAOFactoryDeployed(
            address(factory),
            address(storageModule),
            address(deploymentModule),
            address(configModule),
            address(eventModule)
        );
        
        return factory;
    }
}
