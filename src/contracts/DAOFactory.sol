
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./MinimalDAO.sol";
import "./MinimalGovernor.sol";
import "./ConsentraGovernanceToken.sol";
import "./SoulboundIdentityNFT.sol";

/**
 * @title DAOFactory
 * @dev Factory for creating minimal DAOs with cloning pattern
 */
contract DAOFactory is Ownable {
    using Clones for address;
    
    address public immutable daoImplementation;
    address public immutable governorImplementation;
    address public immutable tokenImplementation;
    SoulboundIdentityNFT public immutable identityNFT;
    
    mapping(uint256 => address) public daos;
    mapping(address => uint256[]) public userDAOs;
    uint256 public daoCounter;
    
    event DAOCreated(
        uint256 indexed daoId,
        address indexed dao,
        address indexed creator,
        string name
    );
    
    constructor(
        address _daoImplementation,
        address _governorImplementation,
        address _tokenImplementation,
        SoulboundIdentityNFT _identityNFT
    ) Ownable(msg.sender) {
        daoImplementation = _daoImplementation;
        governorImplementation = _governorImplementation;
        tokenImplementation = _tokenImplementation;
        identityNFT = _identityNFT;
    }
    
    function createDAO(
        string memory name,
        uint256 initialSupply
    ) external returns (uint256 daoId) {
        require(identityNFT.isVerified(msg.sender), "Creator must be verified");
        
        daoId = ++daoCounter;
        
        // Clone contracts
        address daoClone = daoImplementation.clone();
        address governorClone = governorImplementation.clone();
        address tokenClone = tokenImplementation.clone();
        
        // Initialize token
        ConsentraGovernanceToken(tokenClone).initialize(
            string(abi.encodePacked(name, " Token")),
            string(abi.encodePacked("DAO", daoId)),
            msg.sender,
            initialSupply
        );
        
        // Initialize governor - removed the name parameter
        MinimalGovernor(governorClone).initialize(
            ERC20VotesUpgradeable(tokenClone),
            identityNFT
        );
        
        // Initialize DAO
        MinimalDAO(daoClone).initialize(
            name,
            governorClone,
            tokenClone,
            address(identityNFT),
            msg.sender
        );
        
        // Store DAO
        daos[daoId] = daoClone;
        userDAOs[msg.sender].push(daoId);
        
        emit DAOCreated(daoId, daoClone, msg.sender, name);
        return daoId;
    }
    
    function getDAO(uint256 daoId) external view returns (address) {
        return daos[daoId];
    }
    
    function getUserDAOs(address user) external view returns (uint256[] memory) {
        return userDAOs[user];
    }
}
