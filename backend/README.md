# PredictSwipe Backend - Market Automation Service

## Overview

The backend service includes an automated market management system that runs every 10 minutes to:

1. **Generate New Markets** - Uses Claude API to create themed prediction market questions
2. **Resolve Expired Markets** - Uses Claude API to intelligently resolve markets that have ended

## Features

### 🤖 AI-Powered Market Generation
- Generates themed questions across multiple categories: Crypto, DeFi, Sports, Politics, Memes, Gaming, Technology, Entertainment
- Creates realistic, time-bound, YES/NO questions
- Automatically rotates through themes to maintain diversity
- Includes relevant metadata for each market

### 🎯 Intelligent Market Resolution
- Analyzes expired markets using Claude AI
- Provides confidence scores for each resolution decision
- Flags low-confidence markets for manual review
- Only auto-resolves markets above the confidence threshold
- Includes detailed reasoning for each decision

### ⏰ Automated Scheduling
- Runs every 10 minutes using cron jobs
- Configurable generation and resolution settings
- Manual trigger endpoints for testing

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Required: Claude API Key
ANTHROPIC_API_KEY=your_actual_anthropic_api_key_here

# Required: Blockchain Configuration
PRIVATE_KEY=your_private_key_here
RPC_URL=http://127.0.0.1:8545
PREDICT_MARKET_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
ORACLE_RESOLVER_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0

# Optional: Automation Configuration
ENABLE_AUTOMATION=true
ENABLE_MARKET_GENERATION=true
ENABLE_MARKET_RESOLUTION=true
MARKETS_PER_RUN=3
MIN_CONFIDENCE_TO_RESOLVE=70
```

### 3. Start the Service

```bash
npm run dev  # Development mode with nodemon
# or
npm start    # Production mode
```

## Configuration Options

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | - | **Required** - Your Claude API key |
| `PRIVATE_KEY` | - | **Required** - Wallet private key for transactions |
| `RPC_URL` | `http://127.0.0.1:8545` | Blockchain RPC endpoint |
| `ENABLE_AUTOMATION` | `true` | Enable/disable the automation service |
| `ENABLE_MARKET_GENERATION` | `true` | Enable/disable market generation |
| `ENABLE_MARKET_RESOLUTION` | `true` | Enable/disable market resolution |
| `MARKETS_PER_RUN` | `3` | Number of markets to generate per run |
| `MIN_CONFIDENCE_TO_RESOLVE` | `70` | Minimum confidence % to auto-resolve (0-100) |
| `PREDICT_MARKET_ADDRESS` | `0xe7f1...` | PredictMarket contract address |
| `ORACLE_RESOLVER_ADDRESS` | `0x9fE4...` | OracleResolver contract address |

## API Endpoints

### Get Automation Stats
```bash
GET /api/automation/stats
```

Returns current automation statistics:
```json
{
  "success": true,
  "stats": {
    "totalRuns": 42,
    "marketsCreated": 126,
    "marketsResolved": 38,
    "errors": 2,
    "lastRunTime": "2025-01-12T10:30:00.000Z",
    "isRunning": false,
    "nextRunTime": "10:40 AM"
  }
}
```

### Manually Trigger Automation
```bash
POST /api/automation/run
```

Triggers an immediate automation run (doesn't wait for the next scheduled run):
```json
{
  "success": true,
  "message": "Automation run triggered"
}
```

## How It Works

### Market Generation Flow

1. **Theme Selection**: Rotates through predefined themes (Crypto, Sports, Politics, etc.)
2. **Claude API Call**: Generates 3-5 themed questions with metadata
3. **Blockchain Creation**: Creates markets on the smart contract
4. **Logging**: Records success/failure for each market

Example Generated Market:
```json
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
```

### Market Resolution Flow

1. **Fetch Expired Markets**: Queries blockchain for markets past their end time
2. **AI Analysis**: Claude analyzes each market and provides:
   - Outcome (YES/NO/null)
   - Confidence score (0-100)
   - Reasoning
   - Manual review flag
3. **Confidence Check**: Only auto-resolves if confidence >= threshold
4. **Blockchain Resolution**: Calls OracleResolver contract to resolve
5. **Logging**: Records resolution details

Example Resolution:
```json
{
  "marketId": 42,
  "outcome": true,
  "confidence": 85,
  "reasoning": "Based on historical data and current market trends...",
  "requiresManualReview": false,
  "dataSource": "Historical price data and market analysis"
}
```

## Service Architecture

```
backend/src/services/
├── claudeClient.js         # Claude API integration
├── blockchainService.js    # Smart contract interaction
└── marketAutomation.js     # Main automation orchestrator
```

### Claude Client (`claudeClient.js`)
- Handles all Claude API communication
- Generates themed market questions
- Analyzes markets for resolution
- Batch processing support

### Blockchain Service (`blockchainService.js`)
- Manages Web3/ethers.js connections
- Creates markets on-chain
- Resolves markets via OracleResolver
- Fetches market data

### Market Automation (`marketAutomation.js`)
- Orchestrates the entire automation flow
- Manages cron scheduling
- Tracks statistics
- Handles errors and retries

## Monitoring & Debugging

### View Logs

The service outputs detailed logs for every operation:

```
🤖 Market Automation Service Starting...

Configuration:
   - Run interval: Every 10 minutes
   - Markets per run: 3
   - Min confidence to auto-resolve: 70%
   - Generation enabled: true
   - Resolution enabled: true

✅ Cron job scheduled: Every 10 minutes
💡 Running initial check now...

======================================================================
🚀 Market Automation Run #1
   Time: 2025-01-12T10:30:00.000Z
======================================================================

🎯 Step 1: Checking for markets needing resolution...

   Found 2 markets needing resolution

📊 Market #5: Will ETH break $4,000 before February?
   Category: Price
   Ended: 1/12/2025, 10:00:00 AM
   🤖 Market #5 Resolution:
      Outcome: YES ✅
      Confidence: 85%
      Reasoning: Based on current market conditions...
   ✅ Auto-resolving with 85% confidence
   🎉 Successfully resolved!

📝 Step 2: Generating new markets...

   Theme: Crypto
   Generating 3 markets...

   ✅ Generated 3 market questions

📝 Creating market: Will Bitcoin reach $120,000 before end of March 2025?
   Transaction sent: 0xabc...
   ✅ Market created in block 12345

======================================================================
📈 Automation Summary
======================================================================
Total Runs:         1
Markets Created:    3
Markets Resolved:   1
Errors:             0
Last Run:           2025-01-12T10:30:00.000Z
Next Run:           ~10:40 AM
======================================================================
```

### Check Stats via API

```bash
curl http://localhost:3001/api/automation/stats
```

### Manual Testing

Trigger a manual run without waiting:
```bash
curl -X POST http://localhost:3001/api/automation/run
```

## Troubleshooting

### Issue: "ANTHROPIC_API_KEY not found"
**Solution**: Make sure your `.env` file contains a valid API key:
```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
```

### Issue: "Contract artifacts not found"
**Solution**: Compile the smart contracts first:
```bash
cd ../contracts
npx hardhat compile
```

### Issue: "Failed to initialize blockchain service"
**Solution**:
1. Check your local blockchain is running (Hardhat node)
2. Verify contract addresses in `.env`
3. Ensure PRIVATE_KEY is valid and funded

### Issue: Markets not auto-resolving
**Solution**:
1. Check confidence threshold (`MIN_CONFIDENCE_TO_RESOLVE`)
2. Review logs - market might be flagged for manual review
3. Verify OracleResolver has proper permissions

## Production Deployment

### Recommendations

1. **API Key Security**: Use secrets management (AWS Secrets Manager, HashiCorp Vault)
2. **Error Handling**: Set up alerts for failed runs (Sentry, Datadog)
3. **Rate Limiting**: Be mindful of Claude API rate limits
4. **Monitoring**: Use APM tools to track performance
5. **Database**: Consider storing automation logs in a database
6. **Redundancy**: Run multiple instances with leader election

### Scaling

For high-volume production:
- Adjust `MARKETS_PER_RUN` based on demand
- Consider shorter intervals (e.g., every 5 minutes)
- Implement queue-based processing for better control
- Add retry logic with exponential backoff
- Cache market data to reduce blockchain calls

## License

MIT
