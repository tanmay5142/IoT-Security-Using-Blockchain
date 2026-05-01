import "dotenv/config";
import { ethers } from "ethers";
import fs from "fs";

const CONTRACT_ADDRESS = "0xb5fA4066Fe9e7Ea5f1648Ab8f5C18EF9688Fd936";

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const homeMinerWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  // Load artifact ABI
  const artifact = JSON.parse(fs.readFileSync(new URL('../artifacts/contracts/IoTDeviceManager.sol/IoTDeviceManager.json', import.meta.url), 'utf8'));
  const contract = new ethers.Contract(CONTRACT_ADDRESS, artifact.abi, homeMinerWallet);

  // Create and fund device - create wallet with provider directly
  const device1 = new ethers.Wallet(ethers.Wallet.createRandom().privateKey, provider);
  console.log("Device address:", device1.address);

  const fundTx = await homeMinerWallet.sendTransaction({
    to: device1.address,
    value: ethers.utils.parseEther("0.002")
  });
  await fundTx.wait();
  console.log("Funded device with 0.002 ETH");

  // Get signature values
  const domainSep = await contract.domainSeparator();
  const nonce = await contract.nonces(device1.address);
  const typeHash = await contract.ADD_DEVICE_TYPEHASH();

  console.log("domainSeparator:", domainSep);
  console.log("nonce:", nonce.toString());
  console.log("typeHash:", typeHash);

  const deviceTypeBytes = ethers.utils.toUtf8Bytes("Temperature Sensor");
  const deviceTypeHash = ethers.utils.keccak256(deviceTypeBytes);
  console.log("deviceTypeHash:", deviceTypeHash);

  // Build message hash
  const messageHash = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ['bytes32', 'address', 'bytes32', 'uint256'],
      [typeHash, device1.address, deviceTypeHash, nonce]
    )
  );
  console.log("messageHash:", messageHash);

  // Build typed data hash (EIP-712)
  const ethSignedHash = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ['bytes', 'bytes32', 'bytes32'],
      [
        ethers.utils.toUtf8Bytes("\x19\x01"),
        domainSep,
        messageHash
      ]
    )
  );
  console.log("ethSignedHash:", ethSignedHash);

  // Sign the typed data hash
  const signature = await device1.signMessage(ethers.utils.arrayify(ethSignedHash));
  console.log("signature:", signature);

  // Try to add device
  try {
    const deviceContract = new ethers.Contract(CONTRACT_ADDRESS, artifact.abi, device1);
    const tx = await deviceContract.addDevice(device1.address, "Temperature Sensor", signature, { gasLimit: 200000 });
    const receipt = await tx.wait();
    console.log("Success! Tx hash:", receipt.hash);
  } catch (e) {
    console.log("Error:", e.message.split("(")[0]);
    console.log("Revert reason:", e.reason || "none");

    // Try to get the revert reason by simulating
    try {
      const staticContract = new ethers.Contract(CONTRACT_ADDRESS, artifact.abi, device1);
      await staticContract.callStatic("addDevice", device1.address, "Temperature Sensor", signature);
    } catch (callError) {
      console.log("CallStatic error:", callError.message.split("(")[0]);
    }
  }
}

main().catch(console.error);
