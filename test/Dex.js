const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

describe("Checking dex contract", () => {
  let dex, link, weth;

  beforeEach(async () => {
    const Dex = await ethers.getContractFactory("Dex");
    dex = await Dex.deploy();
    await dex.deployed();

    const Link = await ethers.getContractFactory("Link");
    link = await Link.deploy();
    await link.deployed();

    const Weth = await ethers.getContractFactory("Weth");
    weth = await Weth.deploy();
    await weth.deployed();

    await dex.addToken(ethers.utils.formatBytes32String("LINK"), link.address);
    await dex.addToken(ethers.utils.formatBytes32String("WETH"), weth.address);
  });

  it("Should create a correct order", async () => {
    const signer = ethers.provider.getSigner(0);
    const address = await signer.getAddress();

    // deposit on exchange
    await link.approve(dex.address, 1000);
    await weth.approve(dex.address, 100);
    await dex.deposit(1000, ethers.utils.formatBytes32String("LINK"));
    await dex.deposit(100, ethers.utils.formatBytes32String("WETH"));

    await dex.createOrder(0, ethers.utils.formatBytes32String("LINK"), 5, 1);
    const orderbook = await dex.getOrderbook(
      ethers.utils.formatBytes32String("LINK"),
      0
    );
    expect(orderbook[0].side).to.be.equal(0);
    expect(orderbook[0].ticker).to.be.equal(
      ethers.utils.formatBytes32String("LINK")
    );
    expect(orderbook[0].trader).to.be.equal(address);
    expect(orderbook[0].price).to.be.equal(1);
    expect(orderbook[0].amount).to.be.equal(5);
  });

  it("Should sort the orderbook", async () => {
    const signer = ethers.provider.getSigner(0);
    const address = await signer.getAddress();

    // deposit on exchange
    await link.approve(dex.address, 1000);
    await weth.approve(dex.address, 100);
    await dex.deposit(1000, ethers.utils.formatBytes32String("LINK"));
    await dex.deposit(10, ethers.utils.formatBytes32String("WETH"));

    // checking buy orders
    await dex.createOrder(0, ethers.utils.formatBytes32String("LINK"), 3, 1);
    await dex.createOrder(0, ethers.utils.formatBytes32String("LINK"), 2, 2);
    await dex.createOrder(0, ethers.utils.formatBytes32String("LINK"), 1, 4);
    await dex.createOrder(0, ethers.utils.formatBytes32String("LINK"), 1, 8);
    await dex.createOrder(0, ethers.utils.formatBytes32String("LINK"), 2, 3);
    const orderbookBuy = await dex.getOrderbook(
      ethers.utils.formatBytes32String("LINK"),
      0
    );

    for (let i = 0; i < orderbookBuy.length - 1; i++) {
      expect(orderbookBuy[i].price).gt(orderbookBuy[i + 1].price);
    }

    // checking sell orders
    await dex.createOrder(1, ethers.utils.formatBytes32String("LINK"), 1, 20);
    await dex.createOrder(1, ethers.utils.formatBytes32String("LINK"), 1, 15);
    await dex.createOrder(1, ethers.utils.formatBytes32String("LINK"), 1, 13);
    await dex.createOrder(1, ethers.utils.formatBytes32String("LINK"), 1, 10);
    await dex.createOrder(1, ethers.utils.formatBytes32String("LINK"), 1, 12);
    const orderbookSell = await dex.getOrderbook(
      ethers.utils.formatBytes32String("LINK"),
      1
    );
    for (let i = 0; i < orderbookSell.length - 1; i++) {
      expect(orderbookSell[i].price).lt(orderbookSell[i + 1].price);
    }
  });
});
