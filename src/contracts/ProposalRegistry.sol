// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./SoulboundIdentityNFT.sol";

/**
 * @title ProposalRegistry
 * @dev Central registry for all DAO proposals with AI analytics integration
 */
contract ProposalRegistry is Ownable {
    SoulboundIdentityNFT public immutable identityNFT;
    
    struct ProposalMetrics {
        uint256 totalVotes;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 participationRate;
        uint256 aiConfidenceScore;
        uint256 predictedOutcome; // 0 = fail, 1 = pass
        uint256 timestamp;
    }
    
    struct ProposalData {
        address dao;
        uint256 proposalId;
        string title;
        string description;
        string category;
        address creator;
        uint256 createdAt;
        uint256 deadline;
        ProposalMetrics metrics;
        bool isActive;
    }
    
    mapping(bytes32 => ProposalData) public proposals;
    mapping(address => mapping(uint256 => bytes32)) public daoProposalToRegistry;
    mapping(address => uint256) public userProposalCount;
    mapping(string => uint256) public categoryCount;
    
    bytes32[] public allProposals;
    
    event ProposalRegistered(
        bytes32 indexed registryId,
        address indexed dao,
        uint256 indexed proposalId,
        string title,
        address creator
    );
    
    event ProposalMetricsUpdated(
        bytes32 indexed registryId,
        uint256 totalVotes,
        uint256 votesFor,
        uint256 aiConfidenceScore
    );
    
    constructor(SoulboundIdentityNFT _identityNFT) Ownable(msg.sender) {
        identityNFT = _identityNFT;
    }
    
    /**
     * @dev Register a new proposal in the global registry
     */
    function registerProposal(
        address dao,
        uint256 proposalId,
        string memory title,
        string memory description,
        string memory category,
        uint256 deadline,
        uint256 aiConfidenceScore
    ) external returns (bytes32 registryId) {
        require(identityNFT.isVerified(msg.sender), "Caller must be verified");
        
        registryId = keccak256(abi.encodePacked(dao, proposalId, block.timestamp));
        
        proposals[registryId] = ProposalData({
            dao: dao,
            proposalId: proposalId,
            title: title,
            description: description,
            category: category,
            creator: msg.sender,
            createdAt: block.timestamp,
            deadline: deadline,
            metrics: ProposalMetrics({
                totalVotes: 0,
                votesFor: 0,
                votesAgainst: 0,
                participationRate: 0,
                aiConfidenceScore: aiConfidenceScore,
                predictedOutcome: aiConfidenceScore > 70 ? 1 : 0,
                timestamp: block.timestamp
            }),
            isActive: true
        });
        
        daoProposalToRegistry[dao][proposalId] = registryId;
        allProposals.push(registryId);
        userProposalCount[msg.sender]++;
        categoryCount[category]++;
        
        emit ProposalRegistered(registryId, dao, proposalId, title, msg.sender);
        
        return registryId;
    }
    
    /**
     * @dev Update proposal metrics (called by authorized DAOs)
     */
    function updateMetrics(
        bytes32 registryId,
        uint256 totalVotes,
        uint256 votesFor,
        uint256 votesAgainst,
        uint256 participationRate
    ) external {
        ProposalData storage proposal = proposals[registryId];
        require(msg.sender == proposal.dao, "Only the DAO can update metrics");
        
        proposal.metrics.totalVotes = totalVotes;
        proposal.metrics.votesFor = votesFor;
        proposal.metrics.votesAgainst = votesAgainst;
        proposal.metrics.participationRate = participationRate;
        proposal.metrics.timestamp = block.timestamp;
        
        emit ProposalMetricsUpdated(registryId, totalVotes, votesFor, proposal.metrics.aiConfidenceScore);
    }
    
    /**
     * @dev Update AI confidence score and prediction
     */
    function updateAIAnalysis(
        bytes32 registryId,
        uint256 newConfidenceScore,
        uint256 predictedOutcome
    ) external onlyOwner {
        proposals[registryId].metrics.aiConfidenceScore = newConfidenceScore;
        proposals[registryId].metrics.predictedOutcome = predictedOutcome;
    }
    
    /**
     * @dev Mark proposal as completed
     */
    function completeProposal(bytes32 registryId) external {
        ProposalData storage proposal = proposals[registryId];
        require(msg.sender == proposal.dao, "Only the DAO can complete proposal");
        proposal.isActive = false;
    }
    
    /**
     * @dev Get proposal data
     */
    function getProposal(bytes32 registryId) external view returns (ProposalData memory) {
        return proposals[registryId];
    }
    
    /**
     * @dev Get all proposals (paginated)
     */
    function getAllProposals(uint256 offset, uint256 limit) 
        external 
        view 
        returns (ProposalData[] memory) 
    {
        uint256 end = offset + limit;
        if (end > allProposals.length) {
            end = allProposals.length;
        }
        
        ProposalData[] memory result = new ProposalData[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = proposals[allProposals[i]];
        }
        
        return result;
    }
    
    /**
     * @dev Get proposals by category
     */
    function getProposalsByCategory(string memory category) 
        external 
        view 
        returns (ProposalData[] memory) 
    {
        uint256 count = 0;
        
        // First pass: count matching proposals
        for (uint256 i = 0; i < allProposals.length; i++) {
            if (keccak256(bytes(proposals[allProposals[i]].category)) == keccak256(bytes(category))) {
                count++;
            }
        }
        
        // Second pass: populate result array
        ProposalData[] memory result = new ProposalData[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < allProposals.length; i++) {
            if (keccak256(bytes(proposals[allProposals[i]].category)) == keccak256(bytes(category))) {
                result[index] = proposals[allProposals[i]];
                index++;
            }
        }
        
        return result;
    }
    
    /**
     * @dev Get user statistics
     */
    function getUserStats(address user) 
        external 
        view 
        returns (
            uint256 proposalsCreated,
            uint256 totalVotes,
            bool isVerified
        ) 
    {
        return (
            userProposalCount[user],
            0, // This would need to be tracked separately
            identityNFT.isVerified(user)
        );
    }
}
