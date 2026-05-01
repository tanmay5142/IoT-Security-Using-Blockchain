const hre = require("hardhat");
const { ethers } = require("ethers");

async function main() {
  require("dotenv").config();
  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error("Set CONTRACT_ADDRESS in .env");
  }
  const provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  const contract = await hre.ethers.getContractAt("IoTDeviceManager", contractAddress, wallet);
  const devices = await contract.getAllDevicesEverRegistered();
  console.log(devices);

  for (const addr of devices) {
    const info = await contract.getDeviceInfo(addr);
    console.log(addr, info.deviceType, info.isActive ? "active" : "removed");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});