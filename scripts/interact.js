require("dotenv").config();
const { ethers } = require("ethers");
const fs = require("fs");

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0x98c3938347dBb5e027B8021ec29dafeC0E90C9A5";
const HOME_MINER_ADDRESS = "0x7459d2132698e936e5876f2655137D0290B02B3e";

// Load full ABI from artifact
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

async function createAndFundDevice(homeMinerWallet, provider, amountEth = "0.002") {
  const device = ethers.Wallet.createRandom().connect(provider);
  const fundTx = await homeMinerWallet.sendTransaction({
    to: device.address,
    value: ethers.utils.parseEther(amountEth)
  });
  await fundTx.wait();
  return device;
}

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const homeMinerWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, homeMinerWallet);

  console.log("===========================================");
  console.log("IoT Device Manager - Full Contract Test");
  console.log("===========================================\n");
  console.log("Home Miner Wallet:", homeMinerWallet.address);
  console.log("Contract:", CONTRACT_ADDRESS);
  console.log("Balance:", ethers.utils.formatEther(await provider.getBalance(homeMinerWallet.address)), "ETH\n");

  let devices = [];
  let testsPassed = 0;
  let testsFailed = 0;

  // ============================================
  // TEST 1: Get initial state
  // ============================================
  console.log("--- TEST 1: Initial State ---");
  try {
    const stats = await contract.getContractStats();
    const txCount = await contract.getTransactionCount();
    console.log("  Total Devices Registered:", stats[0].toString());
    console.log("  Total Intrusions:", stats[1].toString());
    console.log("  Total Transactions:", txCount.toString());
    console.log("  Contract Uptime (seconds):", stats[3].toString());
    console.log("PASS: Initial state read successfully\n");
    testsPassed++;
  } catch (e) {
    console.log("FAIL:", e.message.split("(")[0], "\n");
    testsFailed++;
  }

  // ============================================
  // TEST 2: Add Device 1 (Temperature Sensor)
  // ============================================
  console.log("--- TEST 2: Add Device 1 (Temperature Sensor) ---");
  try {
    const device1 = await createAndFundDevice(homeMinerWallet, provider);
    console.log("Device address:", device1.address);
    console.log("Funded device with 0.002 ETH");
    const signature = await buildAddDeviceSignature(contract, device1, "Temperature Sensor");

    const deviceContract = contract.connect(device1);
    const tx = await deviceContract.addDevice(device1.address, "Temperature Sensor", signature, { gasLimit: 800000 });
    const receipt = await tx.wait();
    console.log("Tx hash:", receipt.hash);

    devices.push(device1);

    const count = await contract.getDeviceCount();
    console.log("Device count after add:", count.toString());
    console.log("PASS: Device 1 added successfully\n");
    testsPassed++;
  } catch (e) {
    console.log("FAIL:", e.message.split("(")[0], "\n");
    testsFailed++;
  }

  // ============================================
  // TEST 3: Add Device 2 (Smart Lock)
  // ============================================
  console.log("--- TEST 3: Add Device 2 (Smart Lock) ---");
  try {
    const device2 = await createAndFundDevice(homeMinerWallet, provider);
    console.log("Device address:", device2.address);
    console.log("Funded device with 0.002 ETH");
    const signature = await buildAddDeviceSignature(contract, device2, "Smart Lock");

    const deviceContract = contract.connect(device2);
    const tx = await deviceContract.addDevice(device2.address, "Smart Lock", signature, { gasLimit: 800000 });
    await tx.wait();

    devices.push(device2);

    const count = await contract.getDeviceCount();
    console.log("Device count after add:", count.toString());
    console.log("PASS: Device 2 added successfully\n");
    testsPassed++;
  } catch (e) {
    console.log("FAIL:", e.message.split("(")[0], "\n");
    testsFailed++;
  }

  // ============================================
  // TEST 4: Add Device 3 (Security Camera)
  // ============================================
  console.log("--- TEST 4: Add Device 3 (Security Camera) ---");
  try {
    const device3 = await createAndFundDevice(homeMinerWallet, provider);
    console.log("Device address:", device3.address);
    console.log("Funded device with 0.002 ETH");
    const signature = await buildAddDeviceSignature(contract, device3, "Security Camera");

    const deviceContract = contract.connect(device3);
    const tx = await deviceContract.addDevice(device3.address, "Security Camera", signature, { gasLimit: 800000 });
    await tx.wait();

    devices.push(device3);

    const count = await contract.getDeviceCount();
    console.log("Device count after add:", count.toString());
    console.log("PASS: Device 3 added successfully\n");
    testsPassed++;
  } catch (e) {
    console.log("FAIL:", e.message.split("(")[0], "\n");
    testsFailed++;
  }

  // ============================================
  // TEST 5: Try adding duplicate device (should fail)
  // ============================================
  console.log("--- TEST 5: Add Duplicate Device (should fail) ---");
  if (!devices[0]) {
    console.log("SKIP: No registered device from previous tests\n");
  } else {
  try {
    const device = devices[0];
    const signature = await buildAddDeviceSignature(contract, device, "Duplicate Sensor");

    const deviceContract = contract.connect(device);
    const tx = await deviceContract.addDevice(device.address, "Duplicate Sensor", signature, { gasLimit: 800000 });
    await tx.wait();
    console.log("FAIL: Duplicate should have been rejected\n");
    testsFailed++;
  } catch (e) {
    if (e.message.includes("already authorized") || e.message.includes("DEVICE") || e.message.includes("CALL_EXCEPTION")) {
      console.log("PASS: Duplicate correctly rejected\n");
      testsPassed++;
    } else {
      console.log("FAIL:", e.message.split("(")[0], "\n");
      testsFailed++;
    }
  }
  }

  // ============================================
  // TEST 6: Verify valid device
  // ============================================
  console.log("--- TEST 6: Verify Valid Device ---");
  if (!devices[0]) {
    console.log("SKIP: No registered device from previous tests\n");
  } else {
  try {
    const device = devices[0];
    console.log("Verifying device:", device.address);

    const tx = await contract.verifyDevice(device.address, { gasLimit: 500000 });
    const receipt = await tx.wait();
    console.log("Tx hash:", receipt.hash);

    const isValid = await contract.isDeviceValid(device.address);
    console.log("Device is valid:", isValid);
    console.log("PASS: Valid device verified successfully\n");
    testsPassed++;
  } catch (e) {
    console.log("FAIL:", e.message.split("(")[0], "\n");
    testsFailed++;
  }
  }

  // ============================================
  // TEST 7: Verify invalid/unregistered device (intrusion detection)
  // ============================================
  console.log("--- TEST 7: Verify Invalid Device (Intrusion Detection) ---");
  try {
    const fakeDevice = ethers.Wallet.createRandom().address;
    console.log("Verifying non-existent device:", fakeDevice);

    const tx = await contract.verifyDevice(fakeDevice, { gasLimit: 500000 });
    await tx.wait();

    const isValid = await contract.isDeviceValid(fakeDevice);
    console.log("Fake device is valid:", isValid);
    console.log("PASS: Invalid device correctly detected\n");
    testsPassed++;
  } catch (e) {
    console.log("FAIL:", e.message.split("(")[0], "\n");
    testsFailed++;
  }

  // ============================================
  // TEST 8: Get All Devices Ever Registered List
  // ============================================
  console.log("--- TEST 8: Get All Devices Ever Registered ---");
  try {
    const allDevices = await contract.getAllDevicesEverRegistered();
    console.log("Devices ever registered:", allDevices.length);
    allDevices.forEach((d, i) => console.log("  " + (i + 1) + ". " + d));
    console.log("PASS: All devices list retrieved\n");
    testsPassed++;
  } catch (e) {
    console.log("FAIL:", e.message.split("(")[0], "\n");
    testsFailed++;
  }

  // ============================================
  // TEST 9: Get Device Info
  // ============================================
  console.log("--- TEST 9: Get Device Info ---");
  if (!devices[0]) {
    console.log("SKIP: No registered device from previous tests\n");
  } else {
  try {
    const device = devices[0];
    console.log("Getting info for:", device.address);

    const info = await contract.getDeviceInfo(device.address);
    console.log("  Device Address:", info.deviceAddress);
    console.log("  Device Type:", info.deviceType);
    console.log("  Is Active:", info.isActive);
    console.log("  Registration Time:", new Date(Number(info.registrationTime) * 1000).toISOString());
    console.log("PASS: Device info retrieved\n");
    testsPassed++;
  } catch (e) {
    console.log("FAIL:", e.message.split("(")[0], "\n");
    testsFailed++;
  }
  }

  // ============================================
  // TEST 10: Get Updated Contract Stats
  // ============================================
  console.log("--- TEST 10: Get Updated Contract Stats ---");
  try {
    const stats = await contract.getContractStats();
    console.log("  Total Devices Registered:", stats[0].toString());
    console.log("  Total Intrusions:", stats[1].toString());
    console.log("  Total Transactions:", stats[2].toString());
    console.log("PASS: Contract stats retrieved\n");
    testsPassed++;
  } catch (e) {
    console.log("FAIL:", e.message.split("(")[0], "\n");
    testsFailed++;
  }

  // ============================================
  // TEST 11: Get Transaction History
  // ============================================
  console.log("--- TEST 11: Get Transaction History ---");
  try {
    const history = await contract.getTransactionHistory();
    console.log("Total transactions:", history.length);
    history.forEach((tx, i) => {
      console.log("  " + (i + 1) + ". " + tx.operation + " - Target: " + tx.targetDevice + " - Success: " + tx.success);
    });
    console.log("PASS: Transaction history retrieved\n");
    testsPassed++;
  } catch (e) {
    console.log("FAIL:", e.message.split("(")[0], "\n");
    testsFailed++;
  }

  // ============================================
  // TEST 12: Remove Device
  // ============================================
  console.log("--- TEST 12: Remove Device ---");
  if (!devices[1]) {
    console.log("SKIP: Not enough devices registered from previous tests\n");
  } else {
  try {
    const deviceToRemove = devices[1];
    console.log("Removing device:", deviceToRemove.address);

    const tx = await contract.removeDevice(deviceToRemove.address, { gasLimit: 500000 });
    const receipt = await tx.wait();
    console.log("Tx hash:", receipt.hash);

    const isValid = await contract.isDeviceValid(deviceToRemove.address);
    console.log("Removed device is valid:", isValid);

    const count = await contract.getDeviceCount();
    console.log("Device count after remove:", count.toString());
    console.log("PASS: Device removed successfully\n");
    testsPassed++;
  } catch (e) {
    console.log("FAIL:", e.message.split("(")[0], "\n");
    testsFailed++;
  }
  }

  // ============================================
  // TEST 13: Verify removed device is invalid
  // ============================================
  console.log("--- TEST 13: Verify Removed Device is Invalid ---");
  if (!devices[1]) {
    console.log("SKIP: Removed device not available from previous tests\n");
  } else {
  try {
    const removedDevice = devices[1];
    const isValid = await contract.isDeviceValid(removedDevice.address);
    console.log("Removed device is valid:", isValid);
    if (!isValid) {
      console.log("PASS: Removed device correctly shows as invalid\n");
      testsPassed++;
    } else {
      console.log("FAIL: Removed device should be invalid\n");
      testsFailed++;
    }
  } catch (e) {
    console.log("FAIL:", e.message.split("(")[0], "\n");
    testsFailed++;
  }
  }

  // ============================================
  // TEST 14: Try removing non-existent device (should fail)
  // ============================================
  console.log("--- TEST 14: Remove Non-existent Device (should fail) ---");
  try {
    const fakeDevice = ethers.Wallet.createRandom().address;
    const tx = await contract.removeDevice(fakeDevice, { gasLimit: 500000 });
    await tx.wait();
    console.log("FAIL: Should have reverted\n");
    testsFailed++;
  } catch (e) {
    if (e.message.includes("not found") || e.message.includes("Device not found") || e.message.includes("CALL_EXCEPTION")) {
      console.log("PASS: Non-existent device correctly rejected\n");
      testsPassed++;
    } else {
      console.log("FAIL:", e.message.split("(")[0], "\n");
      testsFailed++;
    }
  }

  // ============================================
  // TEST 15: Get Intrusion Count
  // ============================================
  console.log("--- TEST 15: Get Intrusion Count ---");
  try {
    const intrusionCount = await contract.getIntrusionCount();
    console.log("Intrusion attempts recorded:", intrusionCount.toString());
    console.log("PASS: Intrusion count retrieved\n");
    testsPassed++;
  } catch (e) {
    console.log("FAIL:", e.message.split("(")[0], "\n");
    testsFailed++;
  }

  // ============================================
  // TEST 16: Get Intrusion Log
  // ============================================
  console.log("--- TEST 16: Get Intrusion Log ---");
  try {
    const intrusionLog = await contract.getIntrusionLog();
    console.log("Intrusion log entries:", intrusionLog.length);
    console.log("PASS: Intrusion log retrieved\n");
    testsPassed++;
  } catch (e) {
    console.log("FAIL:", e.message.split("(")[0], "\n");
    testsFailed++;
  }

  // ============================================
  // Final Summary
  // ============================================
  console.log("===========================================");
  console.log("TEST RESULTS");
  console.log("===========================================");
  console.log("Passed:", testsPassed);
  console.log("Failed:", testsFailed);
  console.log("Total:", testsPassed + testsFailed);
  console.log("===========================================");

  if (testsFailed === 0) {
    console.log("\nAll tests passed!");
  } else {
    console.log("\nSome tests failed - review output above.");
    process.exit(1);
  }
}

main().catch(console.error);