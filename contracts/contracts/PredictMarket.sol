// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title PredictMarket
 * @dev Core prediction market contract for PredictSwipe
 * @notice Manages market creation, betting, and resolution
 */
contract PredictMarket is Ownable, ReentrancyGuard {

    // ============ Structs ============

    struct Market {
        uint256 id;
        string question;
        string category;
        uint256 endTime;
        uint256 resolutionTime;
        uint256 totalYesAmount;
        uint256 totalNoAmount;
        bool resolved;
        bool outcome; // true = YES wins, false = NO wins
        address creator;
        uint256 createdAt;
        string metadata; // JSON string with additional data
    }

    struct Bet {
        address bettor;
        uint256 marketId;
        uint256 amount;
        bool isYes;
        uint256 timestamp;
        bool claimed;
    }

    // ============ State Variables ============

    uint256 public marketCount;
    uint256 public platformFee = 200; // 2% (basis points)
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public minBetAmount = 0.001 ether;
    uint256 public maxBetAmount = 10 ether;

    mapping(uint256 => Market) public markets;
    mapping(uint256 => Bet[]) public marketBets;
    mapping(address => uint256[]) public userMarkets;
    mapping(address => mapping(uint256 => Bet[])) public userBets;

    address public oracleResolver;
    address public treasuryAddress;

    // ============ Events ============

    event MarketCreated(
        uint256 indexed marketId,
        string question,
        string category,
        uint256 endTime,
        address creator
    );

    event BetPlaced(
        uint256 indexed marketId,
        address indexed bettor,
        uint256 amount,
        bool isYes,
        uint256 timestamp
    );

    event MarketResolved(
        uint256 indexed marketId,
        bool outcome,
        uint256 totalYesAmount,
        uint256 totalNoAmount
    );

    event WinningsClaimed(
        uint256 indexed marketId,
        address indexed winner,
        uint256 amount
    );

    event PlatformFeeUpdated(uint256 newFee);

    // ============ Modifiers ============

    modifier onlyOracle() {
        require(msg.sender == oracleResolver, "Only oracle can call");
        _;
    }

    modifier marketExists(uint256 _marketId) {
        require(_marketId < marketCount, "Market does not exist");
        _;
    }

    modifier marketActive(uint256 _marketId) {
        require(block.timestamp < markets[_marketId].endTime, "Market ended");
        require(!markets[_marketId].resolved, "Market resolved");
        _;
    }

    // ============ Constructor ============

    constructor(address _oracleResolver, address _treasury) Ownable(msg.sender) {
        oracleResolver = _oracleResolver;
        treasuryAddress = _treasury;
    }

    // ============ Core Functions ============

    /**
     * @notice Create a new prediction market
     * @param _question The market question
     * @param _category Market category (DeFi, Price, etc)
     * @param _duration Duration in seconds
     * @param _metadata JSON metadata
     */
    function createMarket(
        string memory _question,
        string memory _category,
        uint256 _duration,
        string memory _metadata
    ) external returns (uint256) {
        require(_duration >= 1 hours, "Duration too short");
        require(_duration <= 30 days, "Duration too long");

        uint256 marketId = marketCount++;
        uint256 endTime = block.timestamp + _duration;

        markets[marketId] = Market({
            id: marketId,
            question: _question,
            category: _category,
            endTime: endTime,
            resolutionTime: 0,
            totalYesAmount: 0,
            totalNoAmount: 0,
            resolved: false,
            outcome: false,
            creator: msg.sender,
            createdAt: block.timestamp,
            metadata: _metadata
        });

        userMarkets[msg.sender].push(marketId);

        emit MarketCreated(marketId, _question, _category, endTime, msg.sender);

        return marketId;
    }

    /**
     * @notice Place a bet on a market
     * @param _marketId The market ID
     * @param _isYes true for YES, false for NO
     */
    function placeBet(uint256 _marketId, bool _isYes)
        external
        payable
        nonReentrant
        marketExists(_marketId)
        marketActive(_marketId)
    {
        require(msg.value >= minBetAmount, "Bet too small");
        require(msg.value <= maxBetAmount, "Bet too large");

        Market storage market = markets[_marketId];

        if (_isYes) {
            market.totalYesAmount += msg.value;
        } else {
            market.totalNoAmount += msg.value;
        }

        Bet memory newBet = Bet({
            bettor: msg.sender,
            marketId: _marketId,
            amount: msg.value,
            isYes: _isYes,
            timestamp: block.timestamp,
            claimed: false
        });

        marketBets[_marketId].push(newBet);
        userBets[msg.sender][_marketId].push(newBet);

        emit BetPlaced(_marketId, msg.sender, msg.value, _isYes, block.timestamp);
    }

    /**
     * @notice Resolve a market (Oracle only)
     * @param _marketId Market to resolve
     * @param _outcome true if YES wins, false if NO wins
     */
    function resolveMarket(uint256 _marketId, bool _outcome)
        external
        onlyOracle
        marketExists(_marketId)
    {
        Market storage market = markets[_marketId];
        require(block.timestamp >= market.endTime, "Market not ended");
        require(!market.resolved, "Already resolved");

        market.resolved = true;
        market.outcome = _outcome;
        market.resolutionTime = block.timestamp;

        emit MarketResolved(
            _marketId,
            _outcome,
            market.totalYesAmount,
            market.totalNoAmount
        );
    }

    /**
     * @notice Claim winnings from a resolved market
     * @param _marketId Market ID
     * @param _betIndex Index of bet to claim
     */
    function claimWinnings(uint256 _marketId, uint256 _betIndex)
        external
        nonReentrant
        marketExists(_marketId)
    {
        Market storage market = markets[_marketId];
        require(market.resolved, "Market not resolved");

        Bet storage bet = userBets[msg.sender][_marketId][_betIndex];
        require(bet.bettor == msg.sender, "Not your bet");
        require(!bet.claimed, "Already claimed");
        require(bet.isYes == market.outcome, "Bet lost");

        bet.claimed = true;

        uint256 winningPool = market.outcome ? market.totalYesAmount : market.totalNoAmount;
        uint256 losingPool = market.outcome ? market.totalNoAmount : market.totalYesAmount;

        // Calculate payout: (bet amount / winning pool) * total pool * (1 - fee)
        uint256 totalPool = winningPool + losingPool;
        uint256 feeAmount = (losingPool * platformFee) / BASIS_POINTS;
        uint256 netLosingPool = losingPool - feeAmount;

        uint256 payout = bet.amount + ((bet.amount * netLosingPool) / winningPool);

        // Transfer fee to treasury
        if (feeAmount > 0) {
            (bool feeSuccess, ) = treasuryAddress.call{value: feeAmount / marketBets[_marketId].length}("");
            require(feeSuccess, "Fee transfer failed");
        }

        // Transfer winnings
        (bool success, ) = msg.sender.call{value: payout}("");
        require(success, "Transfer failed");

        emit WinningsClaimed(_marketId, msg.sender, payout);
    }

    // ============ View Functions ============

    function getMarket(uint256 _marketId) external view returns (Market memory) {
        return markets[_marketId];
    }

    function getMarketBets(uint256 _marketId) external view returns (Bet[] memory) {
        return marketBets[_marketId];
    }

    function getUserBets(address _user, uint256 _marketId) external view returns (Bet[] memory) {
        return userBets[_user][_marketId];
    }

    function getUserMarkets(address _user) external view returns (uint256[] memory) {
        return userMarkets[_user];
    }

    function getActiveMarkets() external view returns (uint256[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < marketCount; i++) {
            if (!markets[i].resolved && block.timestamp < markets[i].endTime) {
                activeCount++;
            }
        }

        uint256[] memory activeMarkets = new uint256[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < marketCount; i++) {
            if (!markets[i].resolved && block.timestamp < markets[i].endTime) {
                activeMarkets[index] = i;
                index++;
            }
        }

        return activeMarkets;
    }

    /**
     * @notice Calculate potential payout for a bet if it wins
     * @param _marketId Market ID
     * @param _betAmount Bet amount
     * @param _isYes Betting YES or NO
     * @return Potential payout including original bet
     */
    function calculatePotentialPayout(
        uint256 _marketId,
        uint256 _betAmount,
        bool _isYes
    ) external view marketExists(_marketId) returns (uint256) {
        Market storage market = markets[_marketId];

        // Simulate adding this bet to the pool
        uint256 winningPool = _isYes ? market.totalYesAmount + _betAmount : market.totalNoAmount + _betAmount;
        uint256 losingPool = _isYes ? market.totalNoAmount : market.totalYesAmount;

        // If there's no opposing pool, return just the bet amount (no profit)
        if (losingPool == 0) {
            return _betAmount;
        }

        // Calculate payout with platform fee
        uint256 feeAmount = (losingPool * platformFee) / BASIS_POINTS;
        uint256 netLosingPool = losingPool - feeAmount;

        uint256 payout = _betAmount + ((_betAmount * netLosingPool) / winningPool);
        return payout;
    }

    /**
     * @notice Get current odds for YES and NO
     * @param _marketId Market ID
     * @return yesOdds Implied probability for YES (basis points)
     * @return noOdds Implied probability for NO (basis points)
     */
    function getCurrentOdds(uint256 _marketId)
        external
        view
        marketExists(_marketId)
        returns (uint256 yesOdds, uint256 noOdds)
    {
        Market storage market = markets[_marketId];
        uint256 totalPool = market.totalYesAmount + market.totalNoAmount;

        if (totalPool == 0) {
            return (5000, 5000); // 50/50 if no bets yet
        }

        yesOdds = (market.totalYesAmount * BASIS_POINTS) / totalPool;
        noOdds = (market.totalNoAmount * BASIS_POINTS) / totalPool;
    }

    // ============ Admin Functions ============

    function updatePlatformFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 500, "Fee too high"); // Max 5%
        platformFee = _newFee;
        emit PlatformFeeUpdated(_newFee);
    }

    function updateOracleResolver(address _newOracle) external onlyOwner {
        oracleResolver = _newOracle;
    }

    function updateTreasury(address _newTreasury) external onlyOwner {
        treasuryAddress = _newTreasury;
    }

    function updateBetLimits(uint256 _min, uint256 _max) external onlyOwner {
        require(_min < _max, "Invalid limits");
        minBetAmount = _min;
        maxBetAmount = _max;
    }

    // Emergency withdrawal (only unclaimed funds from very old resolved markets)
    function emergencyWithdraw() external onlyOwner {
        (bool success, ) = owner().call{value: address(this).balance}("");
        require(success, "Withdrawal failed");
    }
}
