import { ethers } from 'ethers';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Blockchain service for interacting with PredictMarket contract
 */
class BlockchainService {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Setup provider
      const rpcUrl = process.env.RPC_URL || 'http://127.0.0.1:8545';
      this.provider = new ethers.JsonRpcProvider(rpcUrl);

      // Setup wallet
      if (!process.env.PRIVATE_KEY) {
        throw new Error('PRIVATE_KEY not found in environment variables');
      }
      this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);

      // Load contract ABIs and addresses
      const predictMarketPath = path.join(__dirname, '../../../contracts/artifacts/contracts/PredictMarket.sol/PredictMarket.json');
      const oracleResolverPath = path.join(__dirname, '../../../contracts/artifacts/contracts/OracleResolver.sol/OracleResolver.json');

      if (!fs.existsSync(predictMarketPath) || !fs.existsSync(oracleResolverPath)) {
        throw new Error('Contract artifacts not found. Please compile contracts first.');
      }

      const predictMarketArtifact = JSON.parse(fs.readFileSync(predictMarketPath, 'utf8'));
      const oracleResolverArtifact = JSON.parse(fs.readFileSync(oracleResolverPath, 'utf8'));

      // Contract addresses (must be set in .env file)
      const predictMarketAddress = process.env.PREDICT_MARKET_ADDRESS;
      const oracleResolverAddress = process.env.ORACLE_RESOLVER_ADDRESS;

      if (!predictMarketAddress || !oracleResolverAddress) {
        throw new Error('PREDICT_MARKET_ADDRESS and ORACLE_RESOLVER_ADDRESS must be set in .env file');
      }

      // Initialize contracts
      this.predictMarket = new ethers.Contract(
        predictMarketAddress,
        predictMarketArtifact.abi,
        this.wallet
      );

      this.oracleResolver = new ethers.Contract(
        oracleResolverAddress,
        oracleResolverArtifact.abi,
        this.wallet
      );

      this.initialized = true;
      console.log('✅ Blockchain service initialized');
      console.log(`   Provider: ${rpcUrl}`);
      console.log(`   Wallet: ${this.wallet.address}`);
      console.log(`   PredictMarket: ${predictMarketAddress}`);
      console.log(`   OracleResolver: ${oracleResolverAddress}`);

    } catch (error) {
      console.error('Failed to initialize blockchain service:', error.message);
      throw error;
    }
  }

  /**
   * Create a new market on the blockchain
   * @param {Object} market - Market object with question, category, duration, metadata
   * @returns {Promise<string>} Transaction hash
   */
  async createMarket(market) {
    await this.initialize();

    try {
      console.log(`📝 Creating market: ${market.question}`);

      const tx = await this.predictMarket.createMarket(
        market.question,
        market.category,
        market.duration,
        JSON.stringify(market.metadata || {})
      );

      console.log(`   Transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();

      console.log(`   ✅ Market created in block ${receipt.blockNumber}`);

      return tx.hash;

    } catch (error) {
      console.error('Failed to create market:', error.message);
      throw error;
    }
  }

  /**
   * Create multiple markets in batch
   * @param {Array} markets - Array of market objects
   * @returns {Promise<Array>} Array of transaction hashes
   */
  async createMarkets(markets) {
    const results = [];

    for (const market of markets) {
      try {
        const txHash = await this.createMarket(market);
        results.push({ success: true, market: market.question, txHash });

        // Wait a bit between transactions to avoid nonce issues
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`Failed to create market "${market.question}":`, error.message);
        results.push({ success: false, market: market.question, error: error.message });
      }
    }

    return results;
  }

  /**
   * Get all active markets
   * @returns {Promise<Array>} Array of active market IDs
   */
  async getActiveMarkets() {
    await this.initialize();

    try {
      const activeMarketIds = await this.predictMarket.getActiveMarkets();
      return activeMarketIds;
    } catch (error) {
      console.error('Failed to get active markets:', error.message);
      throw error;
    }
  }

  /**
   * Get market details by ID
   * @param {number} marketId - Market ID
   * @returns {Promise<Object>} Market object
   */
  async getMarket(marketId) {
    await this.initialize();

    try {
      const market = await this.predictMarket.getMarket(marketId);

      return {
        id: marketId,
        question: market.question,
        category: market.category,
        createdAt: market.createdAt,
        endTime: market.endTime,
        resolutionTime: market.resolutionTime,
        totalYesAmount: market.totalYesAmount,
        totalNoAmount: market.totalNoAmount,
        resolved: market.resolved,
        outcome: market.outcome,
        creator: market.creator,
        totalBets: market.totalBets,
        metadata: market.metadata,
      };

    } catch (error) {
      console.error(`Failed to get market #${marketId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get markets that need resolution (expired but not resolved)
   * @returns {Promise<Array>} Array of market objects
   */
  async getMarketsNeedingResolution() {
    await this.initialize();

    try {
      const activeMarketIds = await this.getActiveMarkets();
      const now = Math.floor(Date.now() / 1000);
      const marketsNeedingResolution = [];

      for (const marketId of activeMarketIds) {
        const market = await this.getMarket(marketId);

        // Check if market has ended but not resolved
        if (Number(market.endTime) <= now && !market.resolved) {
          marketsNeedingResolution.push(market);
        }
      }

      return marketsNeedingResolution;

    } catch (error) {
      console.error('Failed to get markets needing resolution:', error.message);
      throw error;
    }
  }

  /**
   * Resolve a market
   * @param {number} marketId - Market ID
   * @param {boolean} outcome - Resolution outcome (true = YES, false = NO)
   * @returns {Promise<string>} Transaction hash
   */
  async resolveMarket(marketId, outcome) {
    await this.initialize();

    try {
      console.log(`🎯 Resolving market #${marketId} with outcome: ${outcome ? 'YES ✅' : 'NO ❌'}`);

      const tx = await this.oracleResolver.resolveMarket(marketId, outcome);

      console.log(`   Transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();

      console.log(`   ✅ Market resolved in block ${receipt.blockNumber}`);

      return tx.hash;

    } catch (error) {
      console.error(`Failed to resolve market #${marketId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get total market count
   * @returns {Promise<number>} Total number of markets
   */
  async getMarketCount() {
    await this.initialize();

    try {
      const count = await this.predictMarket.marketCount();
      return Number(count);
    } catch (error) {
      console.error('Failed to get market count:', error.message);
      throw error;
    }
  }
}

export default new BlockchainService();
