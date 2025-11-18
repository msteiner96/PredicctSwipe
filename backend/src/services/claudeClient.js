import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Claude API client for market generation and resolution
 */
class ClaudeClient {
  constructor() {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not found in environment variables');
    }

    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    this.model = 'claude-sonnet-4-20250514'; // Latest Claude model
  }

  /**
   * Generate themed prediction market questions
   * @param {string} theme - Theme for questions (Sports, Crypto, Meme, Politics, etc)
   * @param {number} count - Number of questions to generate
   * @returns {Promise<Array>} Array of market objects
   */
  async generateMarketQuestions(theme = 'Crypto', count = 5) {
    const prompt = `You are a prediction market question generator. Generate ${count} engaging, specific, and time-bound prediction market questions for the theme: "${theme}".

Requirements for each question:
- Must be a YES/NO question
- Must have a clear resolution date/timeframe (e.g., "by end of month", "within 24 hours", "before March 2025")
- Must be specific and measurable
- Must be interesting and engaging for users
- Should be based on realistic, verifiable outcomes
- Timeframes shouldnt be shorter than 1 hour or longer than 1 month.

For each question, provide:
1. question: The prediction market question (YES/NO format)
2. category: One of [Price, DeFi, Network, Events, Security, Sports, Politics, Meme, Gaming]
3. duration: Duration in seconds (e.g., 3600 for 1 hour, 86400 for 1 day, 604800 for 1 week)
4. metadata: JSON object with relevant context (current values, targets, sources, etc.)

Return ONLY a valid JSON array of market objects. No other text or explanation.

Example format:
[
  {
    "question": "Will Bitcoin reach $120,000 before end of March 2025?",
    "category": "Price",
    "duration": 2592000,
    "metadata": {
      "asset": "BTC",
      "target": "$120,000",
      "currentPrice": "$105,000",
      "timeframe": "End of March 2025"
    }
  }
]`;

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const content = response.content[0].text;

      // Extract JSON from response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Failed to parse JSON from Claude response');
      }

      const markets = JSON.parse(jsonMatch[0]);

      console.log(`✅ Generated ${markets.length} ${theme} market questions`);
      return markets;

    } catch (error) {
      console.error('Error generating market questions:', error.message);
      throw error;
    }
  }

  /**
   * Resolve a prediction market using AI reasoning
   * @param {Object} market - Market object with question, category, metadata
   * @returns {Promise<Object>} Resolution result with outcome and reasoning
   */
  async resolveMarket(market) {
    const currentDate = new Date().toISOString();

    const prompt = `You are an AI oracle for resolving prediction markets. Analyze the following market and determine if the outcome should be YES or NO.

Market Details:
- Question: ${market.question}
- Category: ${market.category}
- Created: ${new Date(Number(market.createdAt) * 1000).toISOString()}
- End Time: ${new Date(Number(market.endTime) * 1000).toISOString()}
- Current Time: ${currentDate}
- Metadata: ${market.metadata || 'None'}

Instructions:
1. Analyze the question carefully
2. Consider the timeframe that has passed
3. Use your knowledge cutoff (January 2025) to determine the outcome
4. For price predictions: Use realistic price movements based on historical volatility
5. For events: Consider probability and typical patterns
6. Be conservative - if unsure, explain why manual review is needed

Respond with ONLY a valid JSON object in this exact format:
{
  "outcome": true or false or null,
  "confidence": 0-100,
  "reasoning": "Detailed explanation of the decision",
  "requiresManualReview": true or false,
  "dataSource": "Description of what data you used or would need"
}

If outcome is null, set requiresManualReview to true and explain why in reasoning.`;

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const content = response.content[0].text;

      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse JSON from Claude response');
      }

      const resolution = JSON.parse(jsonMatch[0]);

      console.log(`🤖 Market #${market.id} Resolution:`);
      console.log(`   Outcome: ${resolution.outcome === null ? 'MANUAL REVIEW' : resolution.outcome ? 'YES ✅' : 'NO ❌'}`);
      console.log(`   Confidence: ${resolution.confidence}%`);
      console.log(`   Reasoning: ${resolution.reasoning.substring(0, 100)}...`);

      return resolution;

    } catch (error) {
      console.error('Error resolving market:', error.message);
      throw error;
    }
  }

  /**
   * Batch resolve multiple markets
   * @param {Array} markets - Array of market objects
   * @returns {Promise<Array>} Array of resolution results
   */
  async resolveMarkets(markets) {
    const results = [];

    for (const market of markets) {
      try {
        const resolution = await this.resolveMarket(market);
        results.push({
          marketId: market.id,
          ...resolution
        });

        // Rate limiting - wait 1 second between requests
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Failed to resolve market #${market.id}:`, error.message);
        results.push({
          marketId: market.id,
          outcome: null,
          requiresManualReview: true,
          reasoning: `Error: ${error.message}`
        });
      }
    }

    return results;
  }
}

export default new ClaudeClient();
