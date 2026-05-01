require("dotenv").config();
const { ethers } = require("ethers");
const fs = require("fs");

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;

// ============================================
// EDIT THIS VALUE BEFORE RUNNING
// ============================================
const DEVICE_TO_REMOVE = "0x68f52d29915318346A84110f6AD05D96350c1944";  // Device address to remove
// ============================================

const artifact = JSON.parse(fs.readFileSync('./artifacts/contracts/IoTDeviceManager.sol/IoTDeviceManager.json', 'utf8'));
const abi = artifact.abi;

async function main() {
  // Validate configuration
  if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === "0x...") {
    console.log("ERROR: Set CONTRACT_ADDRESS in .env file");
    process.exit(1);
  }

  if (!PRIVATE_KEY || PRIVATE_KEY === "0x...") {
    console.log("ERROR: Set PRIVATE_KEY in .env file (Home Miner wallet)");
    process.exit(1);
  }

  if (!DEVICE_TO_REMOVE || DEVICE_TO_REMOVE === "0x...") {
    console.log("ERROR: Edit scripts/removeSpecificDevice.js and set DEVICE_TO_REMOVE");
    process.exit(1);
  }

  const provider = new ethers.providers.JsonRpcProvider(SEPOLIA_RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);

  console.log("===========================================");
  console.log("REMOVE SPECIFIC DEVICE");
  console.log("===========================================");
  console.log("Contract:", CONTRACT_ADDRESS);
  console.log("Wallet:", wallet.address);
  console.log("");
  console.log("Device to remove:", DEVICE_TO_REMOVE);

  // Check device info before removal
  const deviceInfo = await contract.getDeviceInfo(DEVICE_TO_REMOVE);
  console.log("Device Type:", deviceInfo.deviceType);
  console.log("Currently Active:", deviceInfo.isActive);
  console.log("Registered At:", new Date(Number(deviceInfo.registrationTime) * 1000).toISOString());

  // Check current validity
  const isValidBefore = await contract.isDeviceValid(DEVICE_TO_REMOVE);
  console.log("\nDevice is currently valid:", isValidBefore);

  if (!isValidBefore) {
    console.log("\nDevice is not registered or already removed.");
    return;
  }

  // Get device count before removal
  const countBefore = await contract.getDeviceCount();
  console.log("Active devices before removal:", countBefore.toString());

  // Remove device
  console.log("\nCalling removeDevice()...");
  const tx = await contract.removeDevice(DEVICE_TO_REMOVE, { gasLimit: 500000 });
  const receipt = await tx.wait();

  console.log("\n===========================================");
  console.log("SUCCESS!");
  console.log("===========================================");
  console.log("Transaction Hash:", receipt.hash);
  console.log("Device Removed:", DEVICE_TO_REMOVE);

  // Verify removal
  const isValidAfter = await contract.isDeviceValid(DEVICE_TO_REMOVE);
  console.log("Device is now valid:", isValidAfter);

  const countAfter = await contract.getDeviceCount();
  console.log("Active devices after removal:", countAfter.toString());
}

main().catch((e) => {
  console.log("\nERROR:", e.message.split("(")[0]);
  process.exit(1);
});