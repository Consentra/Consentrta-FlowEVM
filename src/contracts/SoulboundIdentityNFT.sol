
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SoulboundIdentityNFT
 * @dev Non-transferable NFT for identity verification and sybil resistance
 */
contract SoulboundIdentityNFT is ERC721, Ownable {
    uint256 private _nextTokenId = 1;
    
    struct Identity {
        address wallet;
        bytes32 verificationHash;
        uint256 timestamp;
        bool isVerified;
        string metadataURI;
    }
    
    mapping(uint256 => Identity) public identities;
    mapping(address => uint256) public walletToTokenId;
    mapping(bytes32 => bool) public usedVerificationHashes;
    
    event IdentityMinted(address indexed to, uint256 indexed tokenId, bytes32 verificationHash);
    event VerificationStatusUpdated(address indexed user, bool verified);
    event IdentityRevoked(address indexed wallet, uint256 indexed tokenId);
    
    error SoulboundToken();
    error AlreadyVerified();
    error NotVerified();
    error VerificationHashUsed();
    error TokenDoesNotExist();
    
    constructor() ERC721("Consenstra Identity", "CID") Ownable(msg.sender) {}
    
    function mintIdentity(
        address to,
        bytes32 verificationHash,
        string memory metadataURI
    ) external onlyOwner returns (uint256) {
        if (walletToTokenId[to] != 0) revert AlreadyVerified();
        if (usedVerificationHashes[verificationHash]) revert VerificationHashUsed();
        
        uint256 tokenId = _nextTokenId++;
        
        identities[tokenId] = Identity({
            wallet: to,
            verificationHash: verificationHash,
            timestamp: block.timestamp,
            isVerified: true,
            metadataURI: metadataURI
        });
        
        walletToTokenId[to] = tokenId;
        usedVerificationHashes[verificationHash] = true;
        
        _safeMint(to, tokenId);
        
        emit IdentityMinted(to, tokenId, verificationHash);
        return tokenId;
    }
    
    function updateVerificationStatus(address user, bool status) external onlyOwner {
        uint256 tokenId = walletToTokenId[user];
        require(tokenId != 0, "Not found");
        
        identities[tokenId].isVerified = status;
        emit VerificationStatusUpdated(user, status);
    }
    
    function revokeIdentity(address user) external onlyOwner {
        uint256 tokenId = walletToTokenId[user];
        if (tokenId == 0) revert NotVerified();
        
        identities[tokenId].isVerified = false;
        walletToTokenId[user] = 0;
        
        _burn(tokenId);
        
        emit IdentityRevoked(user, tokenId);
    }
    
    function isVerified(address wallet) external view returns (bool) {
        uint256 tokenId = walletToTokenId[wallet];
        return tokenId != 0 && identities[tokenId].isVerified && _ownerOf(tokenId) != address(0);
    }
    
    function getIdentity(address wallet) external view returns (Identity memory) {
        uint256 tokenId = walletToTokenId[wallet];
        require(tokenId != 0, "Not verified");
        return identities[tokenId];
    }
    
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (_ownerOf(tokenId) == address(0)) revert TokenDoesNotExist();
        return identities[tokenId].metadataURI;
    }
    
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        
        if (from != address(0) && to != address(0)) {
            revert SoulboundToken();
        }
        
        return super._update(to, tokenId, auth);
    }
    
    function approve(address, uint256) public pure override {
        revert SoulboundToken();
    }
    
    function setApprovalForAll(address, bool) public pure override {
        revert SoulboundToken();
    }
    
    function getApproved(uint256) public pure override returns (address) {
        return address(0);
    }
    
    function isApprovedForAll(address, address) public pure override returns (bool) {
        return false;
    }
}
