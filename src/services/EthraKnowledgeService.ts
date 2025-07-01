
import { apiClient } from '@/utils/api';

interface GovernanceKnowledge {
  concepts: Record<string, string>;
  mechanisms: Record<string, any>;
  bestPractices: string[];
  commonPatterns: Record<string, any>;
}

interface PlatformData {
  proposals: any[];
  daos: any[];
  users: any[];
  votes: any[];
  ecosystemStats: any;
}

export class EthraKnowledgeService {
  private static instance: EthraKnowledgeService;
  private knowledgeBase: GovernanceKnowledge;
  private platformCache: PlatformData | null = null;
  private lastCacheUpdate = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    this.knowledgeBase = this.initializeKnowledgeBase();
  }

  static getInstance(): EthraKnowledgeService {
    if (!EthraKnowledgeService.instance) {
      EthraKnowledgeService.instance = new EthraKnowledgeService();
    }
    return EthraKnowledgeService.instance;
  }

  private initializeKnowledgeBase(): GovernanceKnowledge {
    return {
      concepts: {
        'dao': 'A Decentralized Autonomous Organization (DAO) is a blockchain-based organization governed by smart contracts and token holders rather than traditional management structures.',
        'governance': 'DAO governance refers to the processes and mechanisms by which decisions are made in decentralized organizations, typically involving proposal creation, voting, and execution.',
        'proposal': 'A governance proposal is a formal suggestion for changes or actions within a DAO, which token holders can vote on to approve or reject.',
        'voting power': 'Voting power in DAOs is typically determined by token holdings, though some systems use delegation, quadratic voting, or other mechanisms to distribute influence.',
        'quorum': 'The minimum number of votes required for a proposal to be considered valid, preventing decisions from being made by a small minority.',
        'timelock': 'A security mechanism that delays the execution of approved proposals, giving the community time to react to potentially harmful decisions.',
        'treasury': 'The collective funds controlled by a DAO, used to fund operations, development, and community initiatives.',
        'soulbound nft': 'Non-transferable NFTs tied to identity verification, preventing sybil attacks and ensuring one-person-one-vote in governance.',
        'ai voting': 'Automated voting systems that use artificial intelligence to vote on proposals based on user preferences and analysis.',
        'delegation': 'The process of entrusting voting power to another party, allowing for more informed decision-making by experts.'
      },
      mechanisms: {
        votingTypes: {
          'simple majority': 'Requires more than 50% of votes to pass',
          'supermajority': 'Requires a higher threshold (e.g., 66.7%) for critical decisions',
          'quadratic voting': 'Voting power increases with the square root of tokens, reducing whale dominance',
          'conviction voting': 'Longer commitment to a vote increases its weight over time'
        },
        proposalTypes: {
          'treasury': 'Proposals for spending DAO funds on specific initiatives or expenses',
          'governance': 'Changes to voting parameters, governance rules, or DAO structure',
          'technical': 'Protocol upgrades, smart contract changes, or technical improvements',
          'community': 'Community initiatives, partnerships, or social proposals'
        },
        executionMethods: {
          'automatic': 'Smart contracts execute approved proposals automatically',
          'multisig': 'Requires multiple signatures from trusted parties to execute',
          'timelock': 'Delayed execution allowing time for community review'
        }
      },
      bestPractices: [
        'Ensure clear proposal guidelines and templates',
        'Implement appropriate quorum thresholds',
        'Use timelocks for critical changes',
        'Provide detailed proposal documentation',
        'Enable community discussion before voting',
        'Consider voting power distribution and whale protection',
        'Implement identity verification to prevent sybil attacks',
        'Regular governance parameter reviews',
        'Transparent treasury management',
        'Active voter participation incentives'
      ],
      commonPatterns: {
        proposalLifecycle: [
          'Draft creation and community feedback',
          'Formal proposal submission',
          'Voting period with quorum requirements',
          'Execution (if approved) or archive (if rejected)',
          'Post-execution monitoring and evaluation'
        ],
        governanceAttacks: {
          'governance capture': 'When a small group gains disproportionate control',
          'voter apathy': 'Low participation leading to minority rule',
          'flashloan attacks': 'Temporary token acquisition for voting manipulation',
          'sybil attacks': 'Creating multiple identities to gain voting power'
        }
      }
    };
  }

  async getPlatformData(): Promise<PlatformData> {
    const now = Date.now();
    
    if (this.platformCache && (now - this.lastCacheUpdate) < this.CACHE_DURATION) {
      return this.platformCache;
    }

    try {
      console.log('Fetching fresh platform data for Ethra...');
      
      const [proposalsResponse, daosResponse, ecosystemResponse] = await Promise.allSettled([
        apiClient.getProposals({ limit: 50 }),
        apiClient.getDAOs({ limit: 20 }),
        apiClient.getEcosystemStats()
      ]);

      const proposals = proposalsResponse.status === 'fulfilled' && proposalsResponse.value.success 
        ? proposalsResponse.value.data : [];
      
      const daos = daosResponse.status === 'fulfilled' && daosResponse.value.success 
        ? daosResponse.value.data : [];
      
      const ecosystemStats = ecosystemResponse.status === 'fulfilled' && ecosystemResponse.value.success 
        ? ecosystemResponse.value.data : null;

      // Get votes data separately
      const votesResponse = await apiClient.getVotes({ limit: 100 });
      const votes = votesResponse.success ? votesResponse.data : [];

      // Extract user data from proposals, votes, and DAOs
      const users = [...new Set([
        ...proposals.map(p => p.creator_id || p.creator).filter(Boolean),
        ...votes.map(v => v.user_id).filter(Boolean),
        ...daos.map(d => d.creator_id).filter(Boolean)
      ])];

      this.platformCache = {
        proposals,
        daos,
        users: users.map(address => ({ address, verified: true })), // Mock verified status
        votes,
        ecosystemStats
      };
      
      this.lastCacheUpdate = now;
      console.log('Platform data refreshed:', {
        proposals: proposals.length,
        daos: daos.length,
        votes: votes.length,
        users: users.length
      });
      
      return this.platformCache;
      
    } catch (error) {
      console.error('Failed to fetch platform data:', error);
      
      // Return cached data if available, or empty data
      return this.platformCache || {
        proposals: [],
        daos: [],
        users: [],
        votes: [],
        ecosystemStats: null
      };
    }
  }

  analyzeUserQuery(query: string): {
    intent: string;
    entities: string[];
    dataNeeded: string[];
    complexity: 'simple' | 'medium' | 'complex';
  } {
    const lowerQuery = query.toLowerCase();
    
    // Intent detection
    let intent = 'general';
    if (lowerQuery.includes('proposal') || lowerQuery.includes('vote')) intent = 'proposal_analysis';
    else if (lowerQuery.includes('dao') || lowerQuery.includes('organization')) intent = 'dao_analysis';
    else if (lowerQuery.includes('treasury') || lowerQuery.includes('fund')) intent = 'treasury_analysis';
    else if (lowerQuery.includes('governance') || lowerQuery.includes('voting')) intent = 'governance_explanation';
    else if (lowerQuery.includes('how') || lowerQuery.includes('what') || lowerQuery.includes('explain')) intent = 'educational';
    else if (lowerQuery.includes('compare') || lowerQuery.includes('vs')) intent = 'comparison';
    else if (lowerQuery.includes('trend') || lowerQuery.includes('statistic')) intent = 'analytics';

    // Entity extraction
    const entities: string[] = [];
    Object.keys(this.knowledgeBase.concepts).forEach(concept => {
      if (lowerQuery.includes(concept)) entities.push(concept);
    });

    // Data requirements
    const dataNeeded: string[] = [];
    if (intent.includes('proposal')) dataNeeded.push('proposals', 'votes');
    if (intent.includes('dao')) dataNeeded.push('daos', 'users');
    if (intent.includes('treasury')) dataNeeded.push('daos', 'proposals');
    if (intent.includes('analytics')) dataNeeded.push('ecosystemStats', 'proposals', 'votes');

    // Complexity assessment
    let complexity: 'simple' | 'medium' | 'complex' = 'simple';
    if (entities.length > 2 || dataNeeded.length > 2) complexity = 'medium';
    if (intent === 'comparison' || intent === 'analytics' || lowerQuery.length > 100) complexity = 'complex';

    return { intent, entities, dataNeeded, complexity };
  }

  async generateResponse(query: string, conversationHistory: any[] = []): Promise<string> {
    try {
      const analysis = this.analyzeUserQuery(query);
      const platformData = await this.getPlatformData();
      
      console.log('Query analysis:', analysis);
      
      // Build context-aware response
      let response = '';
      
      switch (analysis.intent) {
        case 'proposal_analysis':
          response = await this.generateProposalAnalysis(query, platformData, analysis);
          break;
        case 'dao_analysis':
          response = await this.generateDAOAnalysis(query, platformData, analysis);
          break;
        case 'treasury_analysis':
          response = await this.generateTreasuryAnalysis(query, platformData, analysis);
          break;
        case 'governance_explanation':
          response = this.generateGovernanceExplanation(query, analysis);
          break;
        case 'educational':
          response = this.generateEducationalResponse(query, analysis);
          break;
        case 'comparison':
          response = await this.generateComparison(query, platformData, analysis);
          break;
        case 'analytics':
          response = await this.generateAnalytics(query, platformData, analysis);
          break;
        default:
          response = this.generateGeneralResponse(query, platformData, analysis);
      }
      
      return response;
      
    } catch (error) {
      console.error('Error generating Ethra response:', error);
      return "I apologize, but I'm having trouble accessing the latest platform data right now. Please try asking your question again, or contact support if the issue persists.";
    }
  }

  private async generateProposalAnalysis(query: string, data: PlatformData, analysis: any): Promise<string> {
    const { proposals, votes } = data;
    
    if (proposals.length === 0) {
      return "I don't see any active proposals in the system currently. This could mean the platform is in a quiet period, or there might be connectivity issues with our data sources.";
    }

    const activeProposals = proposals.filter(p => p.status === 'active');
    const recentProposals = proposals.slice(0, 5);
    const totalVotes = votes.length;
    const avgVoteCount = proposals.length > 0 ? totalVotes / proposals.length : 0;

    let response = `Based on current platform data, I can see ${proposals.length} total proposals with ${activeProposals.length} currently active for voting.\n\n`;
    
    if (recentProposals.length > 0) {
      response += "Recent proposal activity:\n";
      recentProposals.forEach((proposal, index) => {
        const proposalVotes = votes.filter(v => v.proposal_id === proposal.id);
        response += `• "${proposal.title}" - ${proposal.status} (${proposalVotes.length} votes)\n`;
      });
    }
    
    response += `\nPlatform voting statistics:\n`;
    response += `• Average votes per proposal: ${avgVoteCount.toFixed(1)}\n`;
    response += `• Total community votes cast: ${totalVotes}\n`;
    
    if (query.toLowerCase().includes('trend')) {
      const successRate = proposals.filter(p => p.status === 'passed').length / proposals.length * 100;
      response += `• Proposal success rate: ${successRate.toFixed(1)}%\n`;
    }
    
    return response;
  }

  private async generateDAOAnalysis(query: string, data: PlatformData, analysis: any): Promise<string> {
    const { daos, users } = data;
    
    if (daos.length === 0) {
      return "I don't see any DAOs in the system currently. This might indicate the platform is new or there are data connectivity issues.";
    }

    const totalMembers = daos.reduce((sum, dao) => sum + (dao.member_count || 0), 0);
    const avgMemberCount = daos.length > 0 ? totalMembers / daos.length : 0;
    const totalTreasury = daos.reduce((sum, dao) => sum + parseFloat(dao.treasury_value || '0'), 0);

    let response = `Current DAO ecosystem overview:\n\n`;
    response += `• Active DAOs: ${daos.length}\n`;
    response += `• Total community members: ${totalMembers.toLocaleString()}\n`;
    response += `• Average DAO size: ${Math.round(avgMemberCount)} members\n`;
    response += `• Combined treasury value: $${totalTreasury.toLocaleString()}\n\n`;

    if (daos.length > 0) {
      response += "Largest DAOs by membership:\n";
      const sortedDAOs = [...daos].sort((a, b) => (b.member_count || 0) - (a.member_count || 0)).slice(0, 3);
      sortedDAOs.forEach((dao, index) => {
        response += `${index + 1}. ${dao.name}: ${dao.member_count || 0} members\n`;
      });
    }

    return response;
  }

  private async generateTreasuryAnalysis(query: string, data: PlatformData, analysis: any): Promise<string> {
    const { daos, proposals } = data;
    
    const treasuryProposals = proposals.filter(p => 
      p.category?.toLowerCase().includes('treasury') || 
      p.title?.toLowerCase().includes('treasury') ||
      p.title?.toLowerCase().includes('funding')
    );
    
    const totalTreasury = daos.reduce((sum, dao) => sum + parseFloat(dao.treasury_value || '0'), 0);
    
    let response = `Treasury Analysis:\n\n`;
    response += `• Total ecosystem treasury: $${totalTreasury.toLocaleString()}\n`;
    response += `• Treasury-related proposals: ${treasuryProposals.length}\n`;
    
    if (treasuryProposals.length > 0) {
      const approvedTreasuryProposals = treasuryProposals.filter(p => p.status === 'passed');
      response += `• Approved funding proposals: ${approvedTreasuryProposals.length}\n`;
      
      response += `\nRecent treasury proposals:\n`;
      treasuryProposals.slice(0, 3).forEach(proposal => {
        response += `• "${proposal.title}" - ${proposal.status}\n`;
      });
    }
    
    return response;
  }

  private generateGovernanceExplanation(query: string, analysis: any): string {
    const concepts = analysis.entities.map(entity => 
      this.knowledgeBase.concepts[entity]
    ).filter(Boolean);
    
    if (concepts.length === 0) {
      return "Governance in DAOs involves democratic decision-making through token-based voting, proposal systems, and community participation. Key elements include proposal creation, voting periods, quorum requirements, and execution mechanisms.";
    }
    
    let response = "Here's what you need to know about DAO governance:\n\n";
    analysis.entities.forEach(entity => {
      if (this.knowledgeBase.concepts[entity]) {
        response += `**${entity.charAt(0).toUpperCase() + entity.slice(1)}**: ${this.knowledgeBase.concepts[entity]}\n\n`;
      }
    });
    
    return response;
  }

  private generateEducationalResponse(query: string, analysis: any): string {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('voting mechanism')) {
      return this.explainVotingMechanisms();
    } else if (lowerQuery.includes('proposal process')) {
      return this.explainProposalProcess();
    } else if (lowerQuery.includes('best practice')) {
      return this.explainBestPractices();
    }
    
    // Default educational response
    return "DAO governance involves several key concepts: token-based voting, proposal systems, treasury management, and community coordination. Would you like me to explain any specific aspect in detail?";
  }

  private explainVotingMechanisms(): string {
    let response = "DAO Voting Mechanisms:\n\n";
    
    Object.entries(this.knowledgeBase.mechanisms.votingTypes).forEach(([type, description]) => {
      response += `**${type.charAt(0).toUpperCase() + type.slice(1)}**: ${description}\n\n`;
    });
    
    response += "The choice of voting mechanism depends on the DAO's goals, community size, and governance philosophy.";
    return response;
  }

  private explainProposalProcess(): string {
    let response = "Typical DAO Proposal Lifecycle:\n\n";
    
    this.knowledgeBase.commonPatterns.proposalLifecycle.forEach((step, index) => {
      response += `${index + 1}. ${step}\n`;
    });
    
    response += "\nThis process ensures community input and democratic decision-making while maintaining security and transparency.";
    return response;
  }

  private explainBestPractices(): string {
    let response = "DAO Governance Best Practices:\n\n";
    
    this.knowledgeBase.bestPractices.forEach((practice, index) => {
      response += `• ${practice}\n`;
    });
    
    return response;
  }

  private async generateComparison(query: string, data: PlatformData, analysis: any): Promise<string> {
    // Implementation for comparison queries
    return "Comparison analysis is being enhanced. Please specify what aspects you'd like to compare.";
  }

  private async generateAnalytics(query: string, data: PlatformData, analysis: any): Promise<string> {
    const { proposals, daos, votes, ecosystemStats } = data;
    
    let response = "Platform Analytics:\n\n";
    
    if (ecosystemStats) {
      response += `Current ecosystem metrics:\n`;
      Object.entries(ecosystemStats).forEach(([key, value]) => {
        response += `• ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}: ${value}\n`;
      });
    }
    
    response += `\nActivity Summary:\n`;
    response += `• Total proposals: ${proposals.length}\n`;
    response += `• Active DAOs: ${daos.length}\n`;
    response += `• Community votes: ${votes.length}\n`;
    
    return response;
  }

  private generateGeneralResponse(query: string, data: PlatformData, analysis: any): string {
    return `I'm here to help with DAO governance questions. I have access to current platform data including ${data.proposals.length} proposals and ${data.daos.length} DAOs. What specific aspect of governance would you like to explore?`;
  }
}
