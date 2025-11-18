const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("PredictMarket", function () {
  let predictMarket;
  let oracleResolver;
  let swipeToken;
  let owner, oracle, treasury, user1, user2;

  beforeEach(async function () {
    [owner, oracle, treasury, user1, user2] = await ethers.getSigners();

    // Deploy SwipeToken
    const SwipeToken = await ethers.getContractFactory("SwipeToken");
    swipeToken = await SwipeToken.deploy();
    await swipeToken.waitForDeployment();

    // Deploy PredictMarket
    const PredictMarket = await ethers.getContractFactory("PredictMarket");
    predictMarket = await PredictMarket.deploy(oracle.address, treasury.address);
    await predictMarket.waitForDeployment();

    // Deploy OracleResolver
    const OracleResolver = await ethers.getContractFactory("OracleResolver");
    oracleResolver = await OracleResolver.deploy(await predictMarket.getAddress());
    await oracleResolver.waitForDeployment();

    // Update oracle in PredictMarket
    await predictMarket.updateOracleResolver(await oracleResolver.getAddress());

    // Authorize oracle as resolver
    await oracleResolver.authorizeResolver(oracle.address);
  });

  describe("Market Creation", function () {
    it("Should create a market successfully", async function () {
      const question = "Will BNB hit $700?";
      const category = "Price";
      const duration = 7 * 24 * 60 * 60; // 7 days
      const metadata = JSON.stringify({ currentPrice: "$650" });

      const tx = await predictMarket.createMarket(question, category, duration, metadata);
      await tx.wait();

      const market = await predictMarket.getMarket(0);
      expect(market.question).to.equal(question);
      expect(market.category).to.equal(category);
      expect(market.creator).to.equal(owner.address);
      expect(market.resolved).to.equal(false);
    });

    it("Should fail with duration too short", async function () {
      await expect(
        predictMarket.createMarket("Test?", "Price", 1800, "{}") // 30 minutes
      ).to.be.revertedWith("Duration too short");
    });

    it("Should fail with duration too long", async function () {
      await expect(
        predictMarket.createMarket("Test?", "Price", 31 * 24 * 60 * 60, "{}") // 31 days
      ).to.be.revertedWith("Duration too long");
    });

    it("Should increment market count", async function () {
      await predictMarket.createMarket("Q1?", "Price", 7 * 24 * 60 * 60, "{}");
      await predictMarket.createMarket("Q2?", "DeFi", 7 * 24 * 60 * 60, "{}");

      expect(await predictMarket.marketCount()).to.equal(2);
    });
  });

  describe("Betting", function () {
    let marketId;

    beforeEach(async function () {
      const tx = await predictMarket.createMarket(
        "Will BNB hit $700?",
        "Price",
        7 * 24 * 60 * 60,
        "{}"
      );
      await tx.wait();
      marketId = 0;
    });

    it("Should place a YES bet", async function () {
      const betAmount = ethers.parseEther("0.1");

      await expect(
        predictMarket.connect(user1).placeBet(marketId, true, { value: betAmount })
      ).to.emit(predictMarket, "BetPlaced")
        .withArgs(marketId, user1.address, betAmount, true, await time.latest() + 1);

      const market = await predictMarket.getMarket(marketId);
      expect(market.totalYesAmount).to.equal(betAmount);
    });

    it("Should place a NO bet", async function () {
      const betAmount = ethers.parseEther("0.2");

      await predictMarket.connect(user1).placeBet(marketId, false, { value: betAmount });

      const market = await predictMarket.getMarket(marketId);
      expect(market.totalNoAmount).to.equal(betAmount);
    });

    it("Should fail with bet too small", async function () {
      const tooSmall = ethers.parseEther("0.0001"); // Less than minBetAmount

      await expect(
        predictMarket.connect(user1).placeBet(marketId, true, { value: tooSmall })
      ).to.be.revertedWith("Bet too small");
    });

    it("Should fail with bet too large", async function () {
      const tooLarge = ethers.parseEther("11"); // More than maxBetAmount (10 ETH)

      await expect(
        predictMarket.connect(user1).placeBet(marketId, true, { value: tooLarge })
      ).to.be.revertedWith("Bet too large");
    });

    it("Should track user bets", async function () {
      const betAmount = ethers.parseEther("0.5");

      await predictMarket.connect(user1).placeBet(marketId, true, { value: betAmount });

      const userBets = await predictMarket.getUserBets(user1.address, marketId);
      expect(userBets.length).to.equal(1);
      expect(userBets[0].amount).to.equal(betAmount);
      expect(userBets[0].isYes).to.equal(true);
    });

    it("Should allow multiple bets from same user", async function () {
      await predictMarket.connect(user1).placeBet(marketId, true, { value: ethers.parseEther("0.1") });
      await predictMarket.connect(user1).placeBet(marketId, false, { value: ethers.parseEther("0.2") });

      const userBets = await predictMarket.getUserBets(user1.address, marketId);
      expect(userBets.length).to.equal(2);
    });

    it("Should fail betting on ended market", async function () {
      // Fast forward time past market end
      await time.increase(8 * 24 * 60 * 60); // 8 days

      await expect(
        predictMarket.connect(user1).placeBet(marketId, true, { value: ethers.parseEther("0.1") })
      ).to.be.revertedWith("Market ended");
    });
  });

  describe("Market Resolution", function () {
    let marketId;

    beforeEach(async function () {
      await predictMarket.createMarket("Will BNB hit $700?", "Price", 7 * 24 * 60 * 60, "{}");
      marketId = 0;

      // Place some bets
      await predictMarket.connect(user1).placeBet(marketId, true, { value: ethers.parseEther("1") });
      await predictMarket.connect(user2).placeBet(marketId, false, { value: ethers.parseEther("0.5") });

      // Fast forward past market end
      await time.increase(8 * 24 * 60 * 60);
    });

    it("Should resolve market as YES", async function () {
      await oracleResolver.connect(oracle).submitResolution(marketId, true, "https://proof.com");

      const market = await predictMarket.getMarket(marketId);
      expect(market.resolved).to.equal(true);
      expect(market.outcome).to.equal(true);
    });

    it("Should resolve market as NO", async function () {
      await oracleResolver.connect(oracle).submitResolution(marketId, false, "https://proof.com");

      const market = await predictMarket.getMarket(marketId);
      expect(market.resolved).to.equal(true);
      expect(market.outcome).to.equal(false);
    });

    it("Should fail if market not ended", async function () {
      // Create new market
      await predictMarket.createMarket("New market?", "Price", 7 * 24 * 60 * 60, "{}");

      await expect(
        oracleResolver.connect(oracle).submitResolution(1, true, "https://proof.com")
      ).to.be.revertedWith("Market not ended");
    });

    it("Should fail resolving twice", async function () {
      await oracleResolver.connect(oracle).submitResolution(marketId, true, "https://proof.com");

      await expect(
        oracleResolver.connect(oracle).submitResolution(marketId, false, "https://proof.com")
      ).to.be.revertedWith("Already voted");
    });

    it("Should emit MarketResolved event", async function () {
      await expect(
        oracleResolver.connect(oracle).submitResolution(marketId, true, "https://proof.com")
      ).to.emit(oracleResolver, "MarketResolved");
    });
  });

  describe("Claiming Winnings", function () {
    let marketId;

    beforeEach(async function () {
      await predictMarket.createMarket("Will BNB hit $700?", "Price", 7 * 24 * 60 * 60, "{}");
      marketId = 0;

      // Place bets
      await predictMarket.connect(user1).placeBet(marketId, true, { value: ethers.parseEther("1") });
      await predictMarket.connect(user2).placeBet(marketId, false, { value: ethers.parseEther("0.5") });

      // End and resolve market
      await time.increase(8 * 24 * 60 * 60);
      await oracleResolver.connect(oracle).submitResolution(marketId, true, "https://proof.com");
    });

    it("Should allow winner to claim winnings", async function () {
      const balanceBefore = await ethers.provider.getBalance(user1.address);

      const tx = await predictMarket.connect(user1).claimWinnings(marketId, 0);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(user1.address);

      // Should receive more than initial bet
      expect(balanceAfter + gasUsed).to.be.gt(balanceBefore);
    });

    it("Should fail if bet lost", async function () {
      await expect(
        predictMarket.connect(user2).claimWinnings(marketId, 0)
      ).to.be.revertedWith("Bet lost");
    });

    it("Should fail claiming twice", async function () {
      await predictMarket.connect(user1).claimWinnings(marketId, 0);

      await expect(
        predictMarket.connect(user1).claimWinnings(marketId, 0)
      ).to.be.revertedWith("Already claimed");
    });

    it("Should fail if market not resolved", async function () {
      // Create and bet on new market
      await predictMarket.createMarket("New?", "Price", 7 * 24 * 60 * 60, "{}");
      await predictMarket.connect(user1).placeBet(1, true, { value: ethers.parseEther("0.1") });

      await expect(
        predictMarket.connect(user1).claimWinnings(1, 0)
      ).to.be.revertedWith("Market not resolved");
    });

    it("Should emit WinningsClaimed event", async function () {
      await expect(
        predictMarket.connect(user1).claimWinnings(marketId, 0)
      ).to.emit(predictMarket, "WinningsClaimed");
    });
  });

  describe("Admin Functions", function () {
    it("Should update platform fee", async function () {
      await predictMarket.updatePlatformFee(300); // 3%
      expect(await predictMarket.platformFee()).to.equal(300);
    });

    it("Should fail with fee too high", async function () {
      await expect(
        predictMarket.updatePlatformFee(600) // 6%
      ).to.be.revertedWith("Fee too high");
    });

    it("Should update oracle resolver", async function () {
      await predictMarket.updateOracleResolver(user1.address);
      expect(await predictMarket.oracleResolver()).to.equal(user1.address);
    });

    it("Should update treasury", async function () {
      await predictMarket.updateTreasury(user1.address);
      expect(await predictMarket.treasuryAddress()).to.equal(user1.address);
    });

    it("Should update bet limits", async function () {
      const newMin = ethers.parseEther("0.01");
      const newMax = ethers.parseEther("20");

      await predictMarket.updateBetLimits(newMin, newMax);

      expect(await predictMarket.minBetAmount()).to.equal(newMin);
      expect(await predictMarket.maxBetAmount()).to.equal(newMax);
    });

    it("Should fail with invalid bet limits", async function () {
      await expect(
        predictMarket.updateBetLimits(ethers.parseEther("10"), ethers.parseEther("5"))
      ).to.be.revertedWith("Invalid limits");
    });

    it("Should fail non-owner calling admin functions", async function () {
      await expect(
        predictMarket.connect(user1).updatePlatformFee(300)
      ).to.be.revertedWithCustomError(predictMarket, "OwnableUnauthorizedAccount");
    });
  });

  describe("View Functions", function () {
    it("Should return active markets", async function () {
      await predictMarket.createMarket("Q1?", "Price", 7 * 24 * 60 * 60, "{}");
      await predictMarket.createMarket("Q2?", "DeFi", 7 * 24 * 60 * 60, "{}");
      await predictMarket.createMarket("Q3?", "Price", 7 * 24 * 60 * 60, "{}");

      const activeMarkets = await predictMarket.getActiveMarkets();
      expect(activeMarkets.length).to.equal(3);
    });

    it("Should filter out resolved markets from active list", async function () {
      await predictMarket.createMarket("Q1?", "Price", 7 * 24 * 60 * 60, "{}");

      // Fast forward to end first market
      await time.increase(8 * 24 * 60 * 60);
      await oracleResolver.connect(oracle).submitResolution(0, true, "proof");

      // Create second market (still active)
      await predictMarket.createMarket("Q2?", "DeFi", 7 * 24 * 60 * 60, "{}");

      const activeMarkets = await predictMarket.getActiveMarkets();
      expect(activeMarkets.length).to.equal(1);
    });

    it("Should get user markets", async function () {
      await predictMarket.connect(user1).createMarket("Q1?", "Price", 7 * 24 * 60 * 60, "{}");
      await predictMarket.connect(user1).createMarket("Q2?", "DeFi", 7 * 24 * 60 * 60, "{}");

      const userMarkets = await predictMarket.getUserMarkets(user1.address);
      expect(userMarkets.length).to.equal(2);
    });
  });
});
