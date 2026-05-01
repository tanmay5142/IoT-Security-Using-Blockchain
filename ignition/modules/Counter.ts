import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("IoTDeviceManagerModule", (m) => {
  const homeMiner = "0x7459d2132698e936e5876f2655137D0290B02B3e";
  const iotManager = m.contract("IoTDeviceManager", [homeMiner]);

  return { iotManager };
});
