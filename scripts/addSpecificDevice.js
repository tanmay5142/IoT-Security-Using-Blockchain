require("dotenv").config();
const { ethers } = require("ethers");
const fs = require("fs");

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;

// ============================================
// EDIT THESE VALUES BEFORE RUNNING
// ============================================
const DEVICE_ADDRESS = "0x...";  // IoT device Ethereum address to add
const DEVICE_TYPE = "Temperature Sensor";  // Type/name of device
const DEVICE_PRIVATE_KEY = "0x...";  // Private key of the device (needed for signing)
// ============================================

const artifact = JSON.parse(fs.readFileSync('./artifacts/contracts/IoTDeviceManager.sol/IoTDeviceManager.json', 'utf8'));
const abi = artifact.abi;

async function buildAddDeviceSignature(contract, deviceWallet, deviceType) {
  const domainSep = await contract.domainSeparator();
  const nonce = await contract.nonces(deviceWallet.address);
  const typeHash = await contract.ADD_DEVICE_TYPEHASH();

  const messageHash = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ["bytes32", "address", "bytes32", "uint256"],
      [typeHash, deviceWallet.address, ethers.utils.keccak256(ethers.utils.toUtf8Bytes(deviceType)), nonce]
    )
  );

  const digest = ethers.utils.keccak256(
    ethers.utils.solidityPack(
      ["bytes", "bytes32", "bytes32"],
      [ethers.utils.toUtf8Bytes("\x19\x01"), domainSep, messageHash]
    )
  );

  return ethers.utils.joinSignature(deviceWallet._signingKey().signDigest(digest));
}

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

  if (!DEVICE_ADDRESS || DEVICE_ADDRESS === "0x...") {
    console.log("ERROR: Edit scripts/addSpecificDevice.js and set DEVICE_ADDRESS");
    process.exit(1);
  }

  if (!DEVICE_PRIVATE_KEY || DEVICE_PRIVATE_KEY === "0x...") {
    console.log("ERROR: Edit scripts/addSpecificDevice.js and set DEVICE_PRIVATE_KEY");
    console.log("NOTE: The device must sign its own registration. You need the device's private key.");
    process.exit(1);
  }

  const provider = new ethers.providers.JsonRpcProvider(SEPOLIA_RPC_URL);
  const homeMinerWallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const deviceWallet = new ethers.Wallet(DEVICE_PRIVATE_KEY, provider);

  // Verify device address matches private key
  if (deviceWallet.address.toLowerCase() !== DEVICE_ADDRESS.toLowerCase()) {
    console.log("ERROR: DEVICE_ADDRESS does not match DEVICE_PRIVATE_KEY");
    console.log("Address from key:", deviceWallet.address);
    console.log("Expected address:", DEVICE_ADDRESS);
    process.exit(1);
  }

  const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, homeMinerWallet);

  console.log("===========================================");
  console.log("ADD SPECIFIC DEVICE");
  console.log("===========================================");
  console.log("Contract:", CONTRACT_ADDRESS);
  console.log("Home Miner:", homeMinerWallet.address);
  console.log("");
  console.log("Device Address:", DEVICE_ADDRESS);
  console.log("Device Type:", DEVICE_TYPE);
  console.log("Device Wallet:", deviceWallet.address);

  // Check device balance
  const deviceBalance = await provider.getBalance(DEVICE_ADDRESS);
  console.log("Device Balance:", ethers.utils.formatEther(deviceBalance), "ETH");

  // Fund device if needed
  if (deviceBalance.lt(ethers.utils.parseEther("0.001"))) {
    console.log("\nFunding device with 0.002 ETH...");
    const fundTx = await homeMinerWallet.sendTransaction({
      to: DEVICE_ADDRESS,
      value: ethers.utils.parseEther("0.002")
    });
    await fundTx.wait();
    console.log("Device funded.");
  }

  // Check if device already registered
  const isAlreadyRegistered = await contract.isDeviceValid(DEVICE_ADDRESS);
  if (isAlreadyRegistered) {
    console.log("\nERROR: Device is already registered and active!");
    process.exit(1);
  }

  // Build signature and add device
  console.log("\nBuilding EIP-712 signature...");
  const signature = await buildAddDeviceSignature(contract, deviceWallet, DEVICE_TYPE);

  console.log("Sending addDevice transaction...");
  const deviceContract = contract.connect(deviceWallet);
  const tx = await deviceContract.addDevice(DEVICE_ADDRESS, DEVICE_TYPE, signature, { gasLimit: 800000 });
  const receipt = await tx.wait();

  console.log("\n===========================================");
  console.log("SUCCESS!");
  console.log("===========================================");
  console.log("Transaction Hash:", receipt.hash);
  console.log("Device Added:", DEVICE_ADDRESS);
  console.log("Device Type:", DEVICE_TYPE);

  // Verify
  const isValid = await contract.isDeviceValid(DEVICE_ADDRESS);
  console.log("Device is valid:", isValid);

  const deviceCount = await contract.getDeviceCount();
  console.log("Total active devices:", deviceCount.toString());
}

main().catch((e) => {
  console.log("\nERROR:", e.message.split("(")[0]);
  process.exit(1);
});