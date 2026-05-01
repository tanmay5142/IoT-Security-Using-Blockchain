import hre from "hardhat";

async function main() {
  const Contract = await hre.ethers.getContractFactory("IoTDeviceManager");
  const deployer = new hre.ethers.Wallet(process.env.PRIVATE_KEY, hre.ethers.provider);
  console.log("Deploying from:", deployer.address);
  const contract = await Contract.connect(deployer).deploy(deployer.address);
  await contract.deployed();
  console.log("Contract deployed to:", contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});