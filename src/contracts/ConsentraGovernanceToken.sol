
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ConsentraGovernanceToken
 * @dev ERC20 governance token with voting capabilities
 */
contract ConsentraGovernanceToken is ERC20, ERC20Permit, ERC20Votes, Ownable {
    
    constructor(address initialOwner) 
        ERC20("Consentra Governance Token", "CGT")
        ERC20Permit("Consentra Governance Token")
        Ownable(initialOwner)
    {
        _mint(initialOwner, 1000000 * 10**decimals()); // 1M initial supply
    }
    
    /**
     * @dev Mint new tokens (for future use, airdrops, etc.)
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
    
    // Required overrides
    function _update(address from, address to, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._update(from, to, amount);
    }
    
    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }
}
