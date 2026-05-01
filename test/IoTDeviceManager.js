const { expect } = require("chai");
const hre = require("hardhat");

const { ethers } = hre;

describe("IoTDeviceManager", function () {
  async function signAddDevice(contract, deviceWallet, deviceType) {
    const nonce = await contract.nonces(deviceWallet.address);
    const domainSeparator = await contract.domainSeparator();
    const addDeviceTypeHash = await contract.ADD_DEVICE_TYPEHASH();

    const messageHash = ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(
        ["bytes32", "address", "bytes32", "uint256"],
        [
          addDeviceTypeHash,
          deviceWallet.address,
          ethers.utils.keccak256(ethers.utils.toUtf8Bytes(deviceType)),
          nonce,
        ],
      ),
    );

    const digest = ethers.utils.keccak256(
      ethers.utils.solidityPack(
        ["bytes", "bytes32", "bytes32"],
        [ethers.utils.toUtf8Bytes("\x19\x01"), domainSeparator, messageHash],
      ),
    );

    return ethers.utils.joinSignature(deviceWallet._signingKey().signDigest(digest));
  }

  it("registers and verifies devices, then exposes correct query data", async function () {
    const [homeMiner] = await ethers.getSigners();
    const contract = await ethers.deployContract("IoTDeviceManager", [homeMiner.address]);

    const provider = ethers.provider;
    const device1 = ethers.Wallet.createRandom().connect(provider);
    const device2 = ethers.Wallet.createRandom().connect(provider);

    await homeMiner.sendTransaction({
      to: device1.address,
      value: ethers.utils.parseEther("1"),
    });
    await homeMiner.sendTransaction({
      to: device2.address,
      value: ethers.utils.parseEther("1"),
    });

    const sig1 = await signAddDevice(contract, device1, "Temperature Sensor");
    const sig2 = await signAddDevice(contract, device2, "Smart Lock");

    await contract.connect(device1).addDevice(device1.address, "Temperature Sensor", sig1);
    await contract.connect(device2).addDevice(device2.address, "Smart Lock", sig2);

    expect((await contract.getDeviceCount()).toString()).to.equal("2");
    expect(await contract.isDeviceValid(device1.address)).to.equal(true);
    expect(await contract.isDeviceValid(device2.address)).to.equal(true);

    await contract.verifyDevice(device1.address);
    const info = await contract.getDeviceInfo(device1.address);
    expect(info.deviceAddress).to.equal(device1.address);
    expect(info.deviceType).to.equal("Temperature Sensor");
    expect(info.isActive).to.equal(true);

    const devices = await contract.getAllDevicesEverRegistered();
    expect(devices).to.deep.equal([device1.address, device2.address]);
    expect((await contract.getTransactionCount()).toNumber()).to.be.greaterThan(0);
    expect((await contract.getContractStats())[0].toString()).to.equal("2");
  });

  it("tracks intrusion attempts and supports transaction history queries", async function () {
    const [homeMiner] = await ethers.getSigners();
    const contract = await ethers.deployContract("IoTDeviceManager", [homeMiner.address]);

    const unknownDevice = ethers.Wallet.createRandom().address;
    await contract.verifyDevice(unknownDevice);

    expect((await contract.getIntrusionCount()).toString()).to.equal("1");
    expect((await contract.getIntrusionAttempts(homeMiner.address)).toString()).to.equal("1");
    expect((await contract.getIntrusionLog())[0]).to.equal(homeMiner.address);

    const history = await contract.getTransactionHistory();
    expect(history.length).to.be.greaterThan(0);
    const recent = await contract.getRecentTransactions(1);
    expect(recent.length).to.equal(1);
    expect((await contract.getTransactionCount()).toString()).to.equal(String(history.length));
  });

  it("removes devices and allows changing home miner", async function () {
    const [homeMiner, newHomeMinerSigner] = await ethers.getSigners();
    const contract = await ethers.deployContract("IoTDeviceManager", [homeMiner.address]);

    const provider = ethers.provider;
    const device = ethers.Wallet.createRandom().connect(provider);
    await homeMiner.sendTransaction({
      to: device.address,
      value: ethers.utils.parseEther("1"),
    });

    const sig = await signAddDevice(contract, device, "Security Camera");
    await contract.connect(device).addDevice(device.address, "Security Camera", sig);
    expect((await contract.getDeviceCount()).toString()).to.equal("1");

    await contract.removeDevice(device.address);
    expect((await contract.getDeviceCount()).toString()).to.equal("0");
    expect(await contract.isDeviceValid(device.address)).to.equal(false);

    await contract.changeHomeMiner(newHomeMinerSigner.address);
    expect(await contract.homeMiner()).to.equal(newHomeMinerSigner.address);
  });
});
