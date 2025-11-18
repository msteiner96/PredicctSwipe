const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("OracleResolver", function () {
  let predictMarket;
  let oracleResolver;
  let owner, oracle1, oracle2, oracle3, treasury, user1;

  beforeEach(async function () {
    [owner, oracle1, oracle2, oracle3, treasury, user1] = await ethers.getSigners();

    // Deploy PredictMarket
    const PredictMarket = await ethers.getContractFactory("PredictMarket");
    predictMarket = await PredictMarket.deploy(owner.address, treasury.address);
    await predictMarket.waitForDeployment();

    // Deploy OracleResolver
    const OracleResolver = await ethers.getContractFactory("OracleResolver");
    oracleResolver = await OracleResolver.deploy(await predictMarket.getAddress());
    await oracleResolver.waitForDeployment();

    // Update oracle in PredictMarket
    await predictMarket.updateOracleResolver(await oracleResolver.getAddress());

    // Create a test market
    await predictMarket.createMarket(
      "Will BNB hit $700?",
      "Price",
      7 * 24 * 60 * 60,
      "{}"
    );

    // Place some bets
    await predictMarket.connect(user1).placeBet(0, true, { value: ethers.parseEther("1") });

    // Fast forward past market end
    await time.increase(8 * 24 * 60 * 60);
  });

  describe("Deployment", function () {
    it("Should set correct predict market address", async function () {
      expect(await oracleResolver.predictMarket()).to.equal(await predictMarket.getAddress());
    });

    it("Should authorize owner as resolver", async function () {
      expect(await oracleResolver.authorizedResolvers(owner.address)).to.equal(true);
    });

    it("Should set default required votes to 1", async function () {
      expect(await oracleResolver.requiredVotes()).to.equal(1);
    });
  });

  describe("Authorization", function () {
    it("Should authorize new resolver", async function () {
      await oracleResolver.authorizeResolver(oracle1.address);
      expect(await oracleResolver.authorizedResolvers(oracle1.address)).to.equal(true);
    });

    it("Should emit ResolverAuthorized event", async function () {
      await expect(oracleResolver.authorizeResolver(oracle1.address))
        .to.emit(oracleResolver, "ResolverAuthorized")
        .withArgs(oracle1.address);
    });

    it("Should revoke resolver", async function () {
      await oracleResolver.authorizeResolver(oracle1.address);
      await oracleResolver.revokeResolver(oracle1.address);

      expect(await oracleResolver.authorizedResolvers(oracle1.address)).to.equal(false);
    });

    it("Should emit ResolverRevoked event", async function () {
      await oracleResolver.authorizeResolver(oracle1.address);

      await expect(oracleResolver.revokeResolver(oracle1.address))
        .to.emit(oracleResolver, "ResolverRevoked")
        .withArgs(oracle1.address);
    });

    it("Should fail if non-owner tries to authorize", async function () {
      await expect(
        oracleResolver.connect(user1).authorizeResolver(oracle1.address)
      ).to.be.revertedWithCustomError(oracleResolver, "OwnableUnauthorizedAccount");
    });
  });

  describe("Resolution", function () {
    beforeEach(async function () {
      await oracleResolver.authorizeResolver(oracle1.address);
    });

    it("Should submit resolution successfully", async function () {
      const proofUrl = "https://proof.example.com/data";

      await expect(
        oracleResolver.connect(oracle1).submitResolution(0, true, proofUrl)
      ).to.emit(oracleResolver, "VoteCast")
        .withArgs(0, oracle1.address, true);
    });

    it("Should resolve market with single vote", async function () {
      await oracleResolver.connect(oracle1).submitResolution(0, true, "https://proof.com");

      const market = await predictMarket.getMarket(0);
      expect(market.resolved).to.equal(true);
      expect(market.outcome).to.equal(true);
    });

    it("Should fail if not authorized", async function () {
      await expect(
        oracleResolver.connect(user1).submitResolution(0, true, "proof")
      ).to.be.revertedWith("Not authorized");
    });

    it("Should fail voting twice", async function () {
      await oracleResolver.connect(oracle1).submitResolution(0, true, "proof");

      // Try to create and vote on another market
      await predictMarket.createMarket("Q2?", "Price", 7 * 24 * 60 * 60, "{}");
      await time.increase(8 * 24 * 60 * 60);

      // This should work for market 1
      await oracleResolver.connect(oracle1).submitResolution(1, false, "proof2");

      // But should fail for market 0 again
      await expect(
        oracleResolver.connect(oracle1).submitResolution(0, false, "proof3")
      ).to.be.revertedWith("Already voted");
    });

    it("Should store resolution data", async function () {
      const proofUrl = "https://proof.example.com";
      await oracleResolver.connect(oracle1).submitResolution(0, true, proofUrl);

      const resolution = await oracleResolver.getResolution(0);
      expect(resolution.marketId).to.equal(0);
      expect(resolution.outcome).to.equal(true);
      expect(resolution.resolver).to.equal(oracle1.address);
      expect(resolution.proofUrl).to.equal(proofUrl);
    });

    it("Should emit MarketResolved event", async function () {
      await expect(
        oracleResolver.connect(oracle1).submitResolution(0, true, "proof")
      ).to.emit(oracleResolver, "MarketResolved");
    });
  });

  describe("Multi-Oracle Consensus", function () {
    beforeEach(async function () {
      await oracleResolver.authorizeResolver(oracle1.address);
      await oracleResolver.authorizeResolver(oracle2.address);
      await oracleResolver.authorizeResolver(oracle3.address);
      await oracleResolver.updateRequiredVotes(2); // Require 2 votes
    });

    it("Should not resolve with single vote when 2 required", async function () {
      await oracleResolver.connect(oracle1).submitResolution(0, true, "proof1");

      const market = await predictMarket.getMarket(0);
      expect(market.resolved).to.equal(false);
    });

    it("Should resolve when required votes reached", async function () {
      await oracleResolver.connect(oracle1).submitResolution(0, true, "proof1");
      await oracleResolver.connect(oracle2).submitResolution(0, true, "proof2");

      const market = await predictMarket.getMarket(0);
      expect(market.resolved).to.equal(true);
      expect(market.outcome).to.equal(true);
    });

    it("Should resolve with majority outcome", async function () {
      await oracleResolver.updateRequiredVotes(3); // Need all 3 votes
      await oracleResolver.connect(oracle1).submitResolution(0, true, "proof1");
      await oracleResolver.connect(oracle2).submitResolution(0, false, "proof2");
      await oracleResolver.connect(oracle3).submitResolution(0, true, "proof3");

      const market = await predictMarket.getMarket(0);
      expect(market.outcome).to.equal(true); // 2 YES vs 1 NO
    });

    it("Should track vote counts", async function () {
      await oracleResolver.connect(oracle1).submitResolution(0, true, "proof1");
      await oracleResolver.connect(oracle2).submitResolution(0, false, "proof2");

      const votes = await oracleResolver.getVotes(0);
      expect(votes.yes).to.equal(1);
      expect(votes.no).to.equal(1);
    });
  });

  describe("Emergency Resolution", function () {
    it("Should allow owner to emergency resolve", async function () {
      await oracleResolver.emergencyResolve(0, true, "emergency_proof");

      const market = await predictMarket.getMarket(0);
      expect(market.resolved).to.equal(true);
      expect(market.outcome).to.equal(true);
    });

    it("Should fail if non-owner tries emergency resolve", async function () {
      await expect(
        oracleResolver.connect(user1).emergencyResolve(0, true, "proof")
      ).to.be.revertedWithCustomError(oracleResolver, "OwnableUnauthorizedAccount");
    });

    it("Should emit MarketResolved on emergency resolve", async function () {
      await expect(
        oracleResolver.emergencyResolve(0, false, "emergency")
      ).to.emit(oracleResolver, "MarketResolved");
    });
  });

  describe("Configuration", function () {
    it("Should update required votes", async function () {
      await oracleResolver.updateRequiredVotes(3);
      expect(await oracleResolver.requiredVotes()).to.equal(3);
    });

    it("Should fail with 0 required votes", async function () {
      await expect(
        oracleResolver.updateRequiredVotes(0)
      ).to.be.revertedWith("Must require at least 1 vote");
    });

    it("Should fail if non-owner updates required votes", async function () {
      await expect(
        oracleResolver.connect(user1).updateRequiredVotes(2)
      ).to.be.revertedWithCustomError(oracleResolver, "OwnableUnauthorizedAccount");
    });
  });
});
