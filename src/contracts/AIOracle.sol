
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AIOracle
 * @dev Oracle contract for AI predictions and analysis results
 */
contract AIOracle is Ownable {
    
    struct AIPrediction {
        uint256 confidenceScore; // 0-100
        uint256 predictedOutcome; // 0 = fail, 1 = pass
        string reasoning;
        uint256 timestamp;
        bool isValid;
    }
    
    struct AIAnalysis {
        string summary;
        string[] tags;
        uint256 complexityScore; // 0-100
        uint256 riskScore; // 0-100
        uint256 timestamp;
    }
    
    mapping(bytes32 => AIPrediction) public predictions;
    mapping(bytes32 => AIAnalysis) public analyses;
    mapping(address => bool) public authorizedOracles;
    
    event PredictionSubmitted(
        bytes32 indexed proposalId,
        uint256 confidenceScore,
        uint256 predictedOutcome,
        uint256 timestamp
    );
    
    event AnalysisSubmitted(
        bytes32 indexed proposalId,
        string summary,
        uint256 complexityScore,
        uint256 timestamp
    );
    
    constructor() Ownable(msg.sender) {
        authorizedOracles[msg.sender] = true;
    }
    
    modifier onlyAuthorizedOracle() {
        require(authorizedOracles[msg.sender], "Not authorized oracle");
        _;
    }
    
    /**
     * @dev Submit AI prediction for a proposal
     */
    function submitPrediction(
        bytes32 proposalId,
        uint256 confidenceScore,
        uint256 predictedOutcome,
        string memory reasoning
    ) external onlyAuthorizedOracle {
        require(confidenceScore <= 100, "Invalid confidence score");
        require(predictedOutcome <= 1, "Invalid outcome");
        
        predictions[proposalId] = AIPrediction({
            confidenceScore: confidenceScore,
            predictedOutcome: predictedOutcome,
            reasoning: reasoning,
            timestamp: block.timestamp,
            isValid: true
        });
        
        emit PredictionSubmitted(
            proposalId,
            confidenceScore,
            predictedOutcome,
            block.timestamp
        );
    }
    
    /**
     * @dev Submit AI analysis for a proposal
     */
    function submitAnalysis(
        bytes32 proposalId,
        string memory summary,
        string[] memory tags,
        uint256 complexityScore,
        uint256 riskScore
    ) external onlyAuthorizedOracle {
        require(complexityScore <= 100, "Invalid complexity score");
        require(riskScore <= 100, "Invalid risk score");
        
        analyses[proposalId] = AIAnalysis({
            summary: summary,
            tags: tags,
            complexityScore: complexityScore,
            riskScore: riskScore,
            timestamp: block.timestamp
        });
        
        emit AnalysisSubmitted(
            proposalId,
            summary,
            complexityScore,
            block.timestamp
        );
    }
    
    /**
     * @dev Get AI prediction for a proposal
     */
    function getPrediction(bytes32 proposalId) 
        external 
        view 
        returns (AIPrediction memory) 
    {
        return predictions[proposalId];
    }
    
    /**
     * @dev Get AI analysis for a proposal
     */
    function getAnalysis(bytes32 proposalId) 
        external 
        view 
        returns (AIAnalysis memory) 
    {
        return analyses[proposalId];
    }
    
    /**
     * @dev Add authorized oracle
     */
    function addOracle(address oracle) external onlyOwner {
        authorizedOracles[oracle] = true;
    }
    
    /**
     * @dev Remove authorized oracle
     */
    function removeOracle(address oracle) external onlyOwner {
        authorizedOracles[oracle] = false;
    }
    
    /**
     * @dev Batch get predictions for multiple proposals
     */
    function getBatchPredictions(bytes32[] memory proposalIds) 
        external 
        view 
        returns (AIPrediction[] memory) 
    {
        AIPrediction[] memory results = new AIPrediction[](proposalIds.length);
        
        for (uint256 i = 0; i < proposalIds.length; i++) {
            results[i] = predictions[proposalIds[i]];
        }
        
        return results;
    }
}
