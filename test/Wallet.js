const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

describe("Checking wallet contract", () => {
  let wallet, link;

  beforeEach(async () => {
    const Wallet = await ethers.getContractFactory("Wallet");
    wallet = await Wallet.deploy();
    await wallet.deployed();

    const Link = await ethers.getContractFactory("Link");
    link = await Link.deploy();
    await link.deployed();
  });

  it("Should allow to add tokens with correct details", async () => {
    const signer = ethers.provider.getSigner(0);
    const address = await signer.getAddress();

    const tx = await wallet.addToken(
      ethers.utils.formatBytes32String("LINK"),
      "0x45743661201502702Cd6a28AD12BD0f826B61eB3"
    );
    await tx.wait();

    const tokenArrayElement = await wallet.tokenList(0);
    const formattedArrayElement =
      ethers.utils.parseBytes32String(tokenArrayElement);
    expect(formattedArrayElement).to.be.equal("LINK");
    const tokenMapping = await wallet.tokenMapping(
      ethers.utils.formatBytes32String("LINK")
    );
    expect(tokenMapping.tokenAddress).to.be.equal(
      "0x45743661201502702Cd6a28AD12BD0f826B61eB3"
    );
    expect(ethers.utils.parseBytes32String(tokenMapping.ticker)).to.be.equal(
      "LINK"
    );
  });

  it("Should not allow to add new tokens to non owner", async () => {
    const signerNew = ethers.provider.getSigner(1);
    let ex;
    try {
      await wallet
        .connect(signerNew)
        .addToken(
          ethers.utils.formatBytes32String("USDT"),
          "0x5490e522Ef2ECC95944Bec11BA693C680060F720"
        );
    } catch (_ex) {
      ex = _ex;
    }
    assert(ex, "Adding token from random address");
  });

  it("Should handle deposits and withdrawals correctly", async () => {
    const signer = ethers.provider.getSigner(0);
    const address = await signer.getAddress();

    // adding ticker
    const tx = await wallet.addToken(
      ethers.utils.formatBytes32String("LINK"),
      link.address
    );
    await tx.wait();

    await link.approve(wallet.address, 1000);
    await wallet.deposit(1000, ethers.utils.formatBytes32String("LINK"));

    const balance = await wallet.balances(
      address,
      ethers.utils.formatBytes32String("LINK")
    );
    expect(balance).to.be.equal(1000);
    expect(await link.balanceOf(address)).to.be.equal(0);

    await wallet.withdraw(1000, ethers.utils.formatBytes32String("LINK"));

    const balanceAfter = await wallet.balances(
      address,
      ethers.utils.formatBytes32String("LINK")
    );

    expect(balanceAfter).to.be.equal(0);
    expect(await link.balanceOf(address)).to.be.equal(1000);
  });

  it("Should handle revert incorrect withdrawals", async () => {
    const signer = ethers.provider.getSigner(0);
    const address = await signer.getAddress();

    // adding ticker
    const tx = await wallet.addToken(
      ethers.utils.formatBytes32String("LINK"),
      link.address
    );
    await tx.wait();

    await link.approve(wallet.address, 1000);
    await wallet.deposit(1000, ethers.utils.formatBytes32String("LINK"));
    let ex;
    try {
      await wallet.withdraw(2000, ethers.utils.formatBytes32String("LINK"));
    } catch (_ex) {
      ex = _ex;
    }
    assert(ex, "Withdrawing more than balance");
  });
});
