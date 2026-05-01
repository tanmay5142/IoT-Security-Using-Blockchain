import "dotenv/config";
import { ethers } from "ethers";

const CONTRACT_ADDRESS = "0xb5fA4066Fe9e7Ea5f1648Ab8f5C18EF9688Fd936";

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  // Get the artifact ABI
  const fs = await import("fs");
  const artifact = JSON.parse(fs.readFileSync(new URL('../artifacts/contracts/IoTDeviceManager.sol/IoTDeviceManager.json', import.meta.url), 'utf8'));

  const contract = new ethers.Contract(CONTRACT_ADDRESS, artifact.abi, wallet);

  console.log("Testing contract at:", CONTRACT_ADDRESS);
  console.log("Wallet:", wallet.address);

  try {
    const ds = await contract.domainSeparator();
    console.log("domainSeparator:", ds);
  } catch (e) {
    console.log("domainSeparator error:", e.message.split("(")[0]);
  }

  try {
    const typeHash = await contract.ADD_DEVICE_TYPEHASH();
    console.log("ADD_DEVICE_TYPEHASH:", typeHash);
  } catch (e) {
    console.log("ADD_DEVICE_TYPEHASH error:", e.message.split("(")[0]);
  }

  try {
    const nonce = await contract.nonces(wallet.address);
    console.log("nonce:", nonce.toString());
  } catch (e) {
    console.log("nonce error:", e.message.split("(")[0]);
  }
}

main();
