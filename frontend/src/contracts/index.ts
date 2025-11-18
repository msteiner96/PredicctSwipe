export const CONTRACTS = {
  PREDICT_MARKET: (process.env.NEXT_PUBLIC_PREDICT_MARKET || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512') as `0x${string}`,
  SWIPE_TOKEN: (process.env.NEXT_PUBLIC_SWIPE_TOKEN || '0x5FbDB2315678afecb367f032d93F642f64180aa3') as `0x${string}`,
  ORACLE_RESOLVER: (process.env.NEXT_PUBLIC_ORACLE_RESOLVER || '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0') as `0x${string}`,
};

export { PREDICT_MARKET_ABI } from './PredictMarket';
export { SWIPE_TOKEN_ABI } from './SwipeToken';
export { ORACLE_RESOLVER_ABI } from './OracleResolver';
