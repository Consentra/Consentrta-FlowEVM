// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./DAOStorageModule.sol";
import "./DAODeploymentModule.sol";
import "./DAOConfigModule.sol";
import "./DAOEventModule.sol";

/**
 * @title StorageModuleDeployer
 * @dev Lightweight deployer for DAOStorageModule
 */
contract StorageModuleDeployer {
    event StorageModuleDeployed(address indexed module);
    
    function deploy() external returns (address) {
        DAOStorageModule module = new DAOStorageModule();
        emit StorageModuleDeployed(address(module));
        return address(module);
    }
}

/**
 * @title DeploymentModuleDeployer
 * @dev Lightweight deployer for DAODeploymentModule
 */
contract DeploymentModuleDeployer {
    event DeploymentModuleDeployed(address indexed module);
    
    function deploy(
        address _daoImplementation,
        address _tokenImplementation
    ) external returns (address) {
        DAODeploymentModule module = new DAODeploymentModule(_daoImplementation, _tokenImplementation);
        emit DeploymentModuleDeployed(address(module));
        return address(module);
    }
}

/**
 * @title ConfigModuleDeployer
 * @dev Lightweight deployer for DAOConfigModule
 */
contract ConfigModuleDeployer {
    event ConfigModuleDeployed(address indexed module);
    
    function deploy() external returns (address) {
        DAOConfigModule module = new DAOConfigModule();
        emit ConfigModuleDeployed(address(module));
        return address(module);
    }
}

/**
 * @title EventModuleDeployer
 * @dev Lightweight deployer for DAOEventModule
 */
contract EventModuleDeployer {
    event EventModuleDeployed(address indexed module);
    
    function deploy() external returns (address) {
        DAOEventModule module = new DAOEventModule();
        emit EventModuleDeployed(address(module));
        return address(module);
    }
}
