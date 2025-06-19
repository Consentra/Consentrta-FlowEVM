
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title DAOStorageModule
 * @dev Handles DAO data storage and management for DAOFactory
 */
contract DAOStorageModule is AccessControl {
    struct DeployedDAO {
        address dao;
        address token;
        address timelock;
        string name;
        address creator;
        uint256 createdAt;
        uint256 memberCount;
        uint256 proposalCount;
    }
    
    mapping(uint256 => DeployedDAO) public deployedDAOs;
    mapping(address => uint256[]) public userDAOs;
    mapping(address => mapping(uint256 => bool)) public isMember;
    
    uint256 public daoCounter;
    
    event DAOMemberJoined(uint256 indexed daoId, address indexed member);
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
    
    function storeDAO(
        uint256 daoId,
        address daoAddr,
        address tokenAddr,
        address timelockAddr,
        string memory name,
        address creator
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        deployedDAOs[daoId] = DeployedDAO({
            dao: daoAddr,
            token: tokenAddr,
            timelock: timelockAddr,
            name: name,
            creator: creator,
            createdAt: block.timestamp,
            memberCount: 0,
            proposalCount: 0
        });
    }
    
    function addMember(address user, uint256 daoId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(!isMember[user][daoId], "Already a member");
        
        isMember[user][daoId] = true;
        userDAOs[user].push(daoId);
        deployedDAOs[daoId].memberCount++;
        
        emit DAOMemberJoined(daoId, user);
    }
    
    function incrementDAOCounter() external onlyRole(DEFAULT_ADMIN_ROLE) returns (uint256) {
        return daoCounter++;
    }
    
    function getUserDAOs(address user) external view returns (uint256[] memory) {
        return userDAOs[user];
    }
    
    function getDAO(uint256 daoId) external view returns (DeployedDAO memory) {
        return deployedDAOs[daoId];
    }
    
    function getAllDAOs(uint256 offset, uint256 limit) 
        external 
        view 
        returns (DeployedDAO[] memory daos) 
    {
        uint256 end = offset + limit;
        if (end > daoCounter) {
            end = daoCounter;
        }
        
        daos = new DeployedDAO[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            daos[i - offset] = deployedDAOs[i];
        }
        
        return daos;
    }
    
    function checkMembership(address user, uint256 daoId) external view returns (bool) {
        return isMember[user][daoId];
    }
}
