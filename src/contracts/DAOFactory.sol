
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/governance/TimelockController.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ConsentraDAO.sol";
import "./ConsentraGovernanceToken.sol";
import "./SoulboundIdentityNFT.sol";

/**
 * @title DAOFactory
 * @dev Factory contract for creating new DAOs with automated setup
 */
contract DAOFactory is Ownable {
    using Clones for address;
    
    address public immutable daoImplementation;
    address public immutable tokenImplementation;
    SoulboundIdentityNFT public immutable identityNFT;
    
    struct DAOConfig {
        string name;
        string tokenName;
        string tokenSymbol;
        uint256 initialSupply;
        uint256 votingDelay;
        uint256 votingPeriod;
        uint256 proposalThreshold;
        uint256 quorumPercentage;
        uint256 timelockDelay;
    }
    
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
    
    event DAOCreated(
        uint256 indexed daoId,
        address indexed creator,
        address dao,
        address token,
        address timelock,
        string name
    );
    
    event DAOMemberJoined(uint256 indexed daoId, address indexed member);
    
    constructor(
        address _daoImplementation,
        address _tokenImplementation,
        SoulboundIdentityNFT _identityNFT
    ) Ownable(msg.sender) {
        daoImplementation = _daoImplementation;
        tokenImplementation = _tokenImplementation;
        identityNFT = _identityNFT;
    }
    
    /**
     * @dev Create a new DAO with specified configuration
     */
    function createDAO(
        DAOConfig memory config,
        address[] memory initialMembers,
        uint256[] memory initialAllocations
    ) external returns (uint256 daoId) {
        require(identityNFT.isVerified(msg.sender), "Creator must be verified");
        require(initialMembers.length == initialAllocations.length, "Arrays length mismatch");
        
        daoId = daoCounter++;
        
        // Deploy contracts
        address tokenClone = _deployToken();
        address timelockAddr = _deployTimelock(config.timelockDelay);
        address daoClone = _deployDAO();
        
        // Set up roles and permissions
        _setupRoles(timelockAddr, daoClone);
        
        // Distribute tokens and setup members
        _distributeTokens(tokenClone, initialMembers, initialAllocations, daoId);
        
        // Store DAO information
        _storeDAOInfo(daoId, daoClone, tokenClone, timelockAddr, config.name);
        
        emit DAOCreated(
            daoId,
            msg.sender,
            daoClone,
            tokenClone,
            timelockAddr,
            config.name
        );
        
        return daoId;
    }
    
    /**
     * @dev Deploy governance token clone
     */
    function _deployToken() private returns (address) {
        return tokenImplementation.clone();
    }
    
    /**
     * @dev Deploy timelock controller
     */
    function _deployTimelock(uint256 delay) private returns (address) {
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
    
    /**
     * @dev Deploy DAO clone
     */
    function _deployDAO() private returns (address) {
        return daoImplementation.clone();
    }
    
    /**
     * @dev Setup roles for timelock and DAO
     */
    function _setupRoles(address timelockAddr, address daoAddr) private {
        TimelockController timelock = TimelockController(payable(timelockAddr));
        
        timelock.grantRole(timelock.PROPOSER_ROLE(), daoAddr);
        timelock.grantRole(timelock.EXECUTOR_ROLE(), daoAddr);
        timelock.renounceRole(timelock.DEFAULT_ADMIN_ROLE(), address(this));
    }
    
    /**
     * @dev Distribute initial tokens to members
     */
    function _distributeTokens(
        address tokenAddr,
        address[] memory members,
        uint256[] memory allocations,
        uint256 daoId
    ) private {
        ConsentraGovernanceToken token = ConsentraGovernanceToken(tokenAddr);
        
        for (uint256 i = 0; i < members.length; i++) {
            require(identityNFT.isVerified(members[i]), "All members must be verified");
            token.mint(members[i], allocations[i]);
            isMember[members[i]][daoId] = true;
            userDAOs[members[i]].push(daoId);
        }
    }
    
    /**
     * @dev Store DAO information
     */
    function _storeDAOInfo(
        uint256 daoId,
        address daoAddr,
        address tokenAddr,
        address timelockAddr,
        string memory name
    ) private {
        deployedDAOs[daoId] = DeployedDAO({
            dao: daoAddr,
            token: tokenAddr,
            timelock: timelockAddr,
            name: name,
            creator: msg.sender,
            createdAt: block.timestamp,
            memberCount: 0, // Will be updated in _distributeTokens
            proposalCount: 0
        });
    }
    
    /**
     * @dev Join an existing DAO (requires token transfer from existing members)
     */
    function joinDAO(uint256 daoId) external {
        require(identityNFT.isVerified(msg.sender), "Must be verified to join DAO");
        require(!isMember[msg.sender][daoId], "Already a member");
        
        isMember[msg.sender][daoId] = true;
        userDAOs[msg.sender].push(daoId);
        deployedDAOs[daoId].memberCount++;
        
        emit DAOMemberJoined(daoId, msg.sender);
    }
    
    /**
     * @dev Get DAOs for a user
     */
    function getUserDAOs(address user) external view returns (uint256[] memory) {
        return userDAOs[user];
    }
    
    /**
     * @dev Get DAO information
     */
    function getDAO(uint256 daoId) external view returns (DeployedDAO memory) {
        return deployedDAOs[daoId];
    }
    
    /**
     * @dev Get all DAOs (paginated)
     */
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
    
    /**
     * @dev Check if user is member of DAO
     */
    function checkMembership(address user, uint256 daoId) external view returns (bool) {
        return isMember[user][daoId];
    }
}
