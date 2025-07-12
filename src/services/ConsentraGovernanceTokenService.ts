
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '@/utils/contractAddresses';
import { CONSENSTRA_GOVERNANCE_TOKEN_ABI } from '@/utils/contractABIs';

export class ConsentraGovernanceTokenService {
  private contract: ethers.Contract | null = null;
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;

  async connect(provider: ethers.BrowserProvider): Promise<void> {
    this.provider = provider;
    this.signer = await provider.getSigner();
    this.contract = new ethers.Contract(
      CONTRACT_ADDRESSES.CONSENSTRA_GOVERNANCE_TOKEN,
      CONSENSTRA_GOVERNANCE_TOKEN_ABI,
      this.signer
    );
  }

  async getTokenName(): Promise<string> {
    if (!this.contract) throw new Error('Contract not initialized');
    return await this.contract.name();
  }

  async getTokenSymbol(): Promise<string> {
    if (!this.contract) throw new Error('Contract not initialized');
    return await this.contract.symbol();
  }

  async getTotalSupply(): Promise<string> {
    if (!this.contract) throw new Error('Contract not initialized');
    const supply = await this.contract.totalSupply();
    return ethers.formatEther(supply);
  }

  async getBalance(address: string): Promise<string> {
    if (!this.contract) throw new Error('Contract not initialized');
    const balance = await this.contract.balanceOf(address);
    return ethers.formatEther(balance);
  }

  async getVotingPower(address: string): Promise<string> {
    if (!this.contract) throw new Error('Contract not initialized');
    const votes = await this.contract.getVotes(address);
    return ethers.formatEther(votes);
  }

  async transfer(to: string, amount: string): Promise<string> {
    if (!this.contract) throw new Error('Contract not initialized');
    const tx = await this.contract.transfer(to, ethers.parseEther(amount));
    await tx.wait();
    return tx.hash;
  }

  async delegate(delegatee: string): Promise<string> {
    if (!this.contract) throw new Error('Contract not initialized');
    const tx = await this.contract.delegate(delegatee);
    await tx.wait();
    return tx.hash;
  }

  async mint(to: string, amount: string): Promise<string> {
    if (!this.contract) throw new Error('Contract not initialized');
    const tx = await this.contract.mint(to, ethers.parseEther(amount));
    await tx.wait();
    return tx.hash;
  }

  async approve(spender: string, amount: string): Promise<string> {
    if (!this.contract) throw new Error('Contract not initialized');
    const tx = await this.contract.approve(spender, ethers.parseEther(amount));
    await tx.wait();
    return tx.hash;
  }

  async getAllowance(owner: string, spender: string): Promise<string> {
    if (!this.contract) throw new Error('Contract not initialized');
    const allowance = await this.contract.allowance(owner, spender);
    return ethers.formatEther(allowance);
  }
}

export const consenstraGovernanceTokenService = new ConsentraGovernanceTokenService();
