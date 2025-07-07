
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "./libraries/DAOLib.sol";
import "./MinimalGovernor.sol";
import "./SoulboundIdentityNFT.sol";
import "./ConsentraGovernanceToken.sol";

/**
 * @title MinimalDAO
 * @dev Lightweight upgradeable DAO contract
 */
contract MinimalDAO is Initializable, AccessControlUpgradeable {
    using DAOLib for mapping(address => DAOLib.MemberInfo);
    
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    MinimalGovernor public governor;
    ConsentraGovernanceToken public token;
    SoulboundIdentityNFT public identityNFT;
    
    mapping(address => DAOLib.MemberInfo) private _members;
    DAOLib.DAOConfig public config;
    
    uint256 public memberCount;
    uint256 public proposalCount;
    
    event MemberAdded(address indexed member, address indexed addedBy);
    event MemberRemoved(address indexed member, address indexed removedBy);
    event ProposalCreated(uint256 indexed proposalId, address indexed proposer);
    
    modifier onlyVerified() {
        require(identityNFT.isVerified(msg.sender), "Not verified");
        _;
    }
    
    modifier onlyMember() {
        require(DAOLib.isMember(_members, msg.sender), "Not a member");
        _;
    }
    
    function initialize(
        string memory name,
        address _governor,
        address _token,
        address _identityNFT,
        address creator
    ) external initializer {
        __AccessControl_init();
        
        governor = MinimalGovernor(_governor);
        token = ConsentraGovernanceToken(_token);
        identityNFT = SoulboundIdentityNFT(_identityNFT);
        
        config = DAOLib.DAOConfig({
            name: name,
            votingDelay: 1,
            votingPeriod: 50400,
            quorumPercentage: 4,
            creator: creator,
            createdAt: block.timestamp
        });
        
        _grantRole(DEFAULT_ADMIN_ROLE, creator);
        _grantRole(ADMIN_ROLE, creator);
        
        // Add creator as first member
        DAOLib.addMember(_members, creator);
        memberCount = 1;
        
        emit MemberAdded(creator, creator);
    }
    
    function joinDAO() external onlyVerified {
        DAOLib.addMember(_members, msg.sender);
        memberCount++;
        emit MemberAdded(msg.sender, msg.sender);
    }
    
    function addMember(address member) external onlyRole(ADMIN_ROLE) {
        require(identityNFT.isVerified(member), "Member not verified");
        DAOLib.addMember(_members, member);
        memberCount++;
        emit MemberAdded(member, msg.sender);
    }
    
    function removeMember(address member) external onlyRole(ADMIN_ROLE) {
        DAOLib.removeMember(_members, member);
        memberCount--;
        emit MemberRemoved(member, msg.sender);
    }
    
    function createProposal(string memory description) 
        external 
        onlyMember 
        returns (uint256) 
    {
        uint256 proposalId = governor.propose(description);
        proposalCount++;
        emit ProposalCreated(proposalId, msg.sender);
        return proposalId;
    }
    
    function vote(uint256 proposalId, uint8 support) 
        external 
        onlyMember 
        returns (uint256) 
    {
        return governor.castVote(proposalId, support);
    }
    
    function voteWithReason(
        uint256 proposalId, 
        uint8 support, 
        string calldata reason
    ) external onlyMember returns (uint256) {
        return governor.castVoteWithReason(proposalId, support, reason);
    }
    
    function isMember(address account) external view returns (bool) {
        return DAOLib.isMember(_members, account);
    }
    
    function getMemberInfo(address account) 
        external 
        view 
        returns (DAOLib.MemberInfo memory) 
    {
        return _members[account];
    }
    
    function getConfig() external view returns (DAOLib.DAOConfig memory) {
        return config;
    }
}
