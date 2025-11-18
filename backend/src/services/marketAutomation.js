import cron from 'node-cron';
import claudeClient from './claudeClient.js';
import blockchainService from './blockchainService.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Market Automation Service
 * Runs every 10 minutes to:
 * 1. Generate new themed markets using Claude API
 * 2. Resolve expired markets using Claude API
 */
class MarketAutomation {
  constructor() {
    this.isRunning = false;
    this.lastRunTime = null;
    this.stats = {
      totalRuns: 0,
      marketsCreated: 0,
      marketsResolved: 0,
      errors: 0,
    };

    // Themes to rotate through for market generation
    this.themes = [
            'Gaming',
      'Entertainment',

      'Meme',

      'Technology',

            'Crypto',
      'DeFi',
            'Politics',
      'Sports',
    ];
    this.currentThemeIndex = 0;

    // Configuration
    this.config = {
      // How many markets to generate per run
      marketsPerRun: parseInt(process.env.MARKETS_PER_RUN) || 3,
      // Minimum confidence level to auto-resolve (0-100)
      minConfidenceToResolve: parseInt(process.env.MIN_CONFIDENCE_TO_RESOLVE) || 70,
      // Enable/disable market generation
      enableGeneration: process.env.ENABLE_MARKET_GENERATION !== 'false',
      // Enable/disable market resolution
      enableResolution: process.env.ENABLE_MARKET_RESOLUTION !== 'false',
    };
  }

  /**
   * Start the automation service with cron schedule
   */
  start() {
    console.log('\n🤖 Market Automation Service Starting...\n');
    console.log('Configuration:');
    console.log(`   - Run interval: Every 10 minutes`);
    console.log(`   - Markets per run: ${this.config.marketsPerRun}`);
    console.log(`   - Min confidence to auto-resolve: ${this.config.minConfidenceToResolve}%`);
    console.log(`   - Generation enabled: ${this.config.enableGeneration}`);
    console.log(`   - Resolution enabled: ${this.config.enableResolution}`);
    console.log('');

    // Schedule to run every 10 minutes
    // Format: '*/10 * * * *' = every 10 minutes
    this.cronJob = cron.schedule('*/10 * * * *', async () => {
      await this.run();
    });

    console.log('✅ Cron job scheduled: Every 10 minutes');
    console.log('💡 Running initial check now...\n');

    // Run immediately on startup
    this.run();
  }

  /**
   * Stop the automation service
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      console.log('🛑 Market automation service stopped');
    }
  }

  /**
   * Main execution function
   */
  async run() {
    if (this.isRunning) {
      console.log('⏸️  Skipping run - previous job still running');
      return;
    }

    this.isRunning = true;
    this.stats.totalRuns++;
    this.lastRunTime = new Date();

    console.log('\n' + '='.repeat(70));
    console.log(`🚀 Market Automation Run #${this.stats.totalRuns}`);
    console.log(`   Time: ${this.lastRunTime.toISOString()}`);
    console.log('='.repeat(70) + '\n');

    try {
      // Step 1: Resolve expired markets
      if (this.config.enableResolution) {
        await this.resolveExpiredMarkets();
      }

      // Step 2: Generate new markets
      if (this.config.enableGeneration) {
        await this.generateNewMarkets();
      }

      // Step 3: Print summary
      this.printSummary();

    } catch (error) {
      console.error('❌ Error in automation run:', error.message);
      this.stats.errors++;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Resolve expired markets using Claude API
   */
  async resolveExpiredMarkets() {
    console.log('🎯 Step 1: Checking for markets needing resolution...\n');

    try {
      const markets = await blockchainService.getMarketsNeedingResolution();

      if (markets.length === 0) {
        console.log('   ℹ️  No markets need resolution at this time\n');
        return;
      }

      console.log(`   Found ${markets.length} markets needing resolution\n`);

      for (const market of markets) {
        try {
          console.log(`\n📊 Market #${market.id}: ${market.question}`);
          console.log(`   Category: ${market.category}`);
          console.log(`   Ended: ${new Date(Number(market.endTime) * 1000).toLocaleString()}`);

          // Get AI resolution
          const resolution = await claudeClient.resolveMarket(market);

          // Check if we should auto-resolve or flag for manual review
          if (resolution.requiresManualReview || resolution.outcome === null) {
            console.log(`   ⚠️  Flagged for manual review`);
            console.log(`   Reason: ${resolution.reasoning.substring(0, 150)}...\n`);
            continue;
          }

          if (resolution.confidence < this.config.minConfidenceToResolve) {
            console.log(`   ⚠️  Confidence too low (${resolution.confidence}% < ${this.config.minConfidenceToResolve}%)`);
            console.log(`   Flagged for manual review\n`);
            continue;
          }

          // Auto-resolve with high confidence
          console.log(`   ✅ Auto-resolving with ${resolution.confidence}% confidence`);

          await blockchainService.resolveMarket(market.id, resolution.outcome);

          this.stats.marketsResolved++;
          console.log(`   🎉 Successfully resolved!\n`);

          // Rate limiting between resolutions
          await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error) {
          console.error(`   ❌ Failed to resolve market #${market.id}:`, error.message);
          this.stats.errors++;
        }
      }

    } catch (error) {
      console.error('Error in market resolution:', error.message);
      throw error;
    }
  }

  /**
   * Generate new markets using Claude API
   */
  async generateNewMarkets() {
    console.log('\n📝 Step 2: Generating new markets...\n');

    try {
      // Get current theme and rotate
      const theme = this.themes[this.currentThemeIndex];
      this.currentThemeIndex = (this.currentThemeIndex + 1) % this.themes.length;

      console.log(`   Theme: ${theme}`);
      console.log(`   Generating ${this.config.marketsPerRun} markets...\n`);

      // Generate markets using Claude
      const markets = await claudeClient.generateMarketQuestions(theme, this.config.marketsPerRun);

      if (markets.length === 0) {
        console.log('   ⚠️  No markets generated\n');
        return;
      }

      console.log(`   ✅ Generated ${markets.length} market questions\n`);

      // Create markets on blockchain
      const results = await blockchainService.createMarkets(markets);

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      console.log(`\n   📊 Creation Results:`);
      console.log(`      ✅ Successful: ${successful}`);
      console.log(`      ❌ Failed: ${failed}\n`);

      this.stats.marketsCreated += successful;
      this.stats.errors += failed;

    } catch (error) {
      console.error('Error in market generation:', error.message);
      throw error;
    }
  }

  /**
   * Print automation summary
   */
  printSummary() {
    console.log('\n' + '='.repeat(70));
    console.log('📈 Automation Summary');
    console.log('='.repeat(70));
    console.log(`Total Runs:         ${this.stats.totalRuns}`);
    console.log(`Markets Created:    ${this.stats.marketsCreated}`);
    console.log(`Markets Resolved:   ${this.stats.marketsResolved}`);
    console.log(`Errors:             ${this.stats.errors}`);
    console.log(`Last Run:           ${this.lastRunTime?.toISOString() || 'Never'}`);
    console.log(`Next Run:           ~${this.getNextRunTime()}`);
    console.log('='.repeat(70) + '\n');
  }

  /**
   * Get estimated next run time
   */
  getNextRunTime() {
    if (!this.lastRunTime) return 'Unknown';
    const next = new Date(this.lastRunTime.getTime() + 10 * 60 * 1000);
    return next.toLocaleTimeString();
  }

  /**
   * Get current stats
   */
  getStats() {
    return {
      ...this.stats,
      lastRunTime: this.lastRunTime,
      isRunning: this.isRunning,
      nextRunTime: this.getNextRunTime(),
    };
  }
}

export default new MarketAutomation();
