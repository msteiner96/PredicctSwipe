const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SwipeToken", function () {
  let swipeToken;
  let owner, minter, user1, user2;

  beforeEach(async function () {
    [owner, minter, user1, user2] = await ethers.getSigners();

    const SwipeToken = await ethers.getContractFactory("SwipeToken");
    swipeToken = await SwipeToken.deploy();
    await swipeToken.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set correct name and symbol", async function () {
      expect(await swipeToken.name()).to.equal("SwipeToken");
      expect(await swipeToken.symbol()).to.equal("SWIPE");
    });

    it("Should mint initial supply to deployer", async function () {
      const expectedSupply = ethers.parseEther("100000000"); // 100M
      expect(await swipeToken.balanceOf(owner.address)).to.equal(expectedSupply);
    });

    it("Should set max supply", async function () {
      const maxSupply = ethers.parseEther("1000000000"); // 1B
      expect(await swipeToken.MAX_SUPPLY()).to.equal(maxSupply);
    });

    it("Should set owner correctly", async function () {
      expect(await swipeToken.owner()).to.equal(owner.address);
    });
  });

  describe("Minting", function () {
    beforeEach(async function () {
      await swipeToken.addMinter(minter.address);
    });

    it("Should allow authorized minter to mint", async function () {
      const mintAmount = ethers.parseEther("1000");
      await swipeToken.connect(minter).mint(user1.address, mintAmount);

      expect(await swipeToken.balanceOf(user1.address)).to.equal(mintAmount);
    });

    it("Should allow owner to mint", async function () {
      const mintAmount = ethers.parseEther("2000");
      await swipeToken.mint(user1.address, mintAmount);

      expect(await swipeToken.balanceOf(user1.address)).to.equal(mintAmount);
    });

    it("Should fail if not authorized", async function () {
      const mintAmount = ethers.parseEther("1000");

      await expect(
        swipeToken.connect(user1).mint(user2.address, mintAmount)
      ).to.be.revertedWith("Not authorized to mint");
    });

    it("Should fail if exceeds max supply", async function () {
      const tooMuch = ethers.parseEther("900000001"); // More than remaining

      await expect(
        swipeToken.mint(user1.address, tooMuch)
      ).to.be.revertedWith("Max supply exceeded");
    });

    it("Should update total supply", async function () {
      const mintAmount = ethers.parseEther("5000");
      const initialSupply = await swipeToken.totalSupply();

      await swipeToken.connect(minter).mint(user1.address, mintAmount);

      expect(await swipeToken.totalSupply()).to.equal(initialSupply + mintAmount);
    });
  });

  describe("Minter Management", function () {
    it("Should add minter", async function () {
      await swipeToken.addMinter(minter.address);
      expect(await swipeToken.minters(minter.address)).to.equal(true);
    });

    it("Should emit MinterAdded event", async function () {
      await expect(swipeToken.addMinter(minter.address))
        .to.emit(swipeToken, "MinterAdded")
        .withArgs(minter.address);
    });

    it("Should remove minter", async function () {
      await swipeToken.addMinter(minter.address);
      await swipeToken.removeMinter(minter.address);

      expect(await swipeToken.minters(minter.address)).to.equal(false);
    });

    it("Should emit MinterRemoved event", async function () {
      await swipeToken.addMinter(minter.address);

      await expect(swipeToken.removeMinter(minter.address))
        .to.emit(swipeToken, "MinterRemoved")
        .withArgs(minter.address);
    });

    it("Should fail if non-owner tries to add minter", async function () {
      await expect(
        swipeToken.connect(user1).addMinter(minter.address)
      ).to.be.revertedWithCustomError(swipeToken, "OwnableUnauthorizedAccount");
    });

    it("Should fail if non-owner tries to remove minter", async function () {
      await swipeToken.addMinter(minter.address);

      await expect(
        swipeToken.connect(user1).removeMinter(minter.address)
      ).to.be.revertedWithCustomError(swipeToken, "OwnableUnauthorizedAccount");
    });
  });

  describe("Burning", function () {
    it("Should allow token holder to burn", async function () {
      const burnAmount = ethers.parseEther("1000");

      await swipeToken.transfer(user1.address, burnAmount);
      const balanceBefore = await swipeToken.balanceOf(user1.address);

      await swipeToken.connect(user1).burn(burnAmount);

      expect(await swipeToken.balanceOf(user1.address)).to.equal(balanceBefore - burnAmount);
    });

    it("Should decrease total supply when burning", async function () {
      const burnAmount = ethers.parseEther("5000");
      const supplyBefore = await swipeToken.totalSupply();

      await swipeToken.burn(burnAmount);

      expect(await swipeToken.totalSupply()).to.equal(supplyBefore - burnAmount);
    });

    it("Should fail burning more than balance", async function () {
      await expect(
        swipeToken.connect(user1).burn(ethers.parseEther("1"))
      ).to.be.revertedWithCustomError(swipeToken, "ERC20InsufficientBalance");
    });
  });

  describe("Transfers", function () {
    it("Should transfer tokens", async function () {
      const transferAmount = ethers.parseEther("1000");

      await swipeToken.transfer(user1.address, transferAmount);

      expect(await swipeToken.balanceOf(user1.address)).to.equal(transferAmount);
    });

    it("Should fail transfer with insufficient balance", async function () {
      await expect(
        swipeToken.connect(user1).transfer(user2.address, ethers.parseEther("1"))
      ).to.be.revertedWithCustomError(swipeToken, "ERC20InsufficientBalance");
    });
  });
});
