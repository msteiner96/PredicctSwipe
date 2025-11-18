#!/usr/bin/env python3
"""
PredictSwipe AI Market Generator
Monitors DeFi activity and creates prediction markets automatically
"""

import os
import time
import json
import requests
from datetime import datetime, timedelta
from typing import List, Dict
from web3 import Web3
from dotenv import load_dotenv

load_dotenv()

# Configuration
BSC_RPC = os.getenv('BSC_MAINNET_RPC', 'https://bsc-dataseed.binance.org/')
BACKEND_API = os.getenv('BACKEND_API_URL', 'http://localhost:3001')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

# Web3 setup
w3 = Web3(Web3.HTTPProvider(BSC_RPC))

class AIMarketGenerator:
    def __init__(self):
        self.generated_markets = []
        self.last_check = datetime.now()

    def fetch_defi_metrics(self) -> Dict:
        """Fetch current DeFi metrics from various sources"""
        metrics = {}

        try:
            # Fetch BNB price from CoinGecko
            response = requests.get(
                'https://api.coingecko.com/api/v3/simple/price',
                params={'ids': 'binancecoin,pancakeswap-token', 'vs_currencies': 'usd', 'include_24hr_change': 'true'}
            )
            if response.status_code == 200:
                metrics['prices'] = response.json()

            # Fetch gas price
            gas_price = w3.eth.gas_price
            metrics['gas_price'] = w3.from_wei(gas_price, 'gwei')

            # Fetch TVL data from DeFiLlama
            tvl_response = requests.get('https://api.llama.fi/v2/historicalChainTvl/bsc')
            if tvl_response.status_code == 200:
                tvl_data = tvl_response.json()
                if tvl_data:
                    metrics['bsc_tvl'] = tvl_data[-1]['tvl'] if tvl_data else 0

        except Exception as e:
            print(f"Error fetching metrics: {e}")

        return metrics

    def generate_market_ideas(self, metrics: Dict) -> List[Dict]:
        """Generate market ideas based on current metrics"""
        ideas = []

        if 'prices' in metrics:
            bnb_data = metrics['prices'].get('binancecoin', {})
            bnb_price = bnb_data.get('usd', 0)
            bnb_change = bnb_data.get('usd_24h_change', 0)

            # Price prediction markets
            if bnb_price > 0:
                target_price = round(bnb_price * 1.1, 0)  # 10% increase
                ideas.append({
                    'question': f'Will $BNB hit ${target_price} in the next 7 days?',
                    'category': 'Price',
                    'duration': 7 * 24 * 3600,  # 7 days in seconds
                    'metadata': json.dumps({
                        'currentPrice': f'${bnb_price:.2f}',
                        'change24h': f'{bnb_change:+.2f}%',
                        'targetPrice': f'${target_price}',
                    })
                })

            # Volatility markets
            if abs(bnb_change) > 5:
                ideas.append({
                    'question': f'Will $BNB price stay above ${bnb_price * 0.95:.0f} this week?',
                    'category': 'Price',
                    'duration': 7 * 24 * 3600,
                    'metadata': json.dumps({
                        'currentPrice': f'${bnb_price:.2f}',
                        'volatility': 'High',
                        'floorPrice': f'${bnb_price * 0.95:.0f}',
                    })
                })

        # Gas price markets
        if 'gas_price' in metrics:
            gas_price = metrics['gas_price']
            ideas.append({
                'question': f'Will BSC gas fees stay under {gas_price * 1.2:.1f} gwei today?',
                'category': 'Network',
                'duration': 24 * 3600,  # 24 hours
                'metadata': json.dumps({
                    'currentGas': f'{gas_price:.2f} gwei',
                    'targetGas': f'{gas_price * 1.2:.1f} gwei',
                })
            })

        # TVL markets
        if 'bsc_tvl' in metrics:
            tvl = metrics['bsc_tvl']
            tvl_billions = tvl / 1_000_000_000
            ideas.append({
                'question': f'Will BSC TVL exceed ${tvl_billions * 1.1:.1f}B this month?',
                'category': 'DeFi',
                'duration': 30 * 24 * 3600,  # 30 days
                'metadata': json.dumps({
                    'currentTVL': f'${tvl_billions:.2f}B',
                    'targetTVL': f'${tvl_billions * 1.1:.1f}B',
                })
            })

        return ideas

    def create_market(self, market_data: Dict) -> bool:
        """Send market creation request to backend API"""
        try:
            response = requests.post(
                f'{BACKEND_API}/api/markets',
                json=market_data,
                headers={'Content-Type': 'application/json'}
            )
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Created market: {market_data['question']}")
                return True
            else:
                print(f"❌ Failed to create market: {response.text}")
                return False
        except Exception as e:
            print(f"Error creating market: {e}")
            return False

    def run(self):
        """Main loop - check metrics and generate markets"""
        print("🤖 AI Market Generator started")
        print(f"📡 Connected to BSC: {w3.is_connected()}")
        print(f"🔗 Backend API: {BACKEND_API}\n")

        while True:
            try:
                print(f"[{datetime.now().strftime('%H:%M:%S')}] Checking DeFi metrics...")

                # Fetch current metrics
                metrics = self.fetch_defi_metrics()
                print(f"📊 Metrics: {json.dumps(metrics, indent=2)}")

                # Generate market ideas
                ideas = self.generate_market_ideas(metrics)
                print(f"💡 Generated {len(ideas)} market ideas")

                # Create markets (limit to prevent spam)
                for idea in ideas[:2]:  # Only create top 2 ideas
                    self.create_market(idea)
                    time.sleep(1)  # Rate limiting

                # Wait before next check (every 1 hour)
                print(f"⏳ Next check in 1 hour...\n")
                time.sleep(3600)

            except KeyboardInterrupt:
                print("\n🛑 Shutting down AI Market Generator")
                break
            except Exception as e:
                print(f"❌ Error in main loop: {e}")
                time.sleep(60)  # Wait 1 minute on error

if __name__ == '__main__':
    generator = AIMarketGenerator()
    generator.run()
