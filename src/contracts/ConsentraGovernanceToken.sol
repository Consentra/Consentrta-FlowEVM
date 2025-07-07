
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20VotesUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title ConsentraGovernanceToken
 * @dev ERC20 governance token with voting capabilities - upgradeable version
 */
contract ConsentraGovernanceToken is 
    Initializable,
    ERC20Upgradeable, 
    ERC20PermitUpgradeable, 
    ERC20VotesUpgradeable, 
    OwnableUpgradeable 
{
    
    function initialize(
        string memory name,
        string memory symbol,
        address initialOwner,
        uint256 initialSupply
    ) external initializer {
        __ERC20_init(name, symbol);
        __ERC20Permit_init(name);
        __ERC20Votes_init();
        __Ownable_init(initialOwner);
        
        _mint(initialOwner, initialSupply * 10**decimals());
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
        override(ERC20Upgradeable, ERC20VotesUpgradeable)
    {
        super._update(from, to, amount);
    }
    
    function nonces(address owner)
        public
        view
        override(ERC20PermitUpgradeable, NoncesUpgradeable)
        returns (uint256)
    {
        return super.nonces(owner);
    }
}
