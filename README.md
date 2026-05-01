What happens when you run interact.js:

  1. Creates 3 random Ethereum wallets (simulating IoT devices)
  2. Funds each with 0.002 ETH from your Home Miner wallet
  3. Each device signs a message using EIP-712
  4. Each device calls addDevice() on the contract to register itself

  These are not real IoT hardware - just Ethereum accounts used to test the smart
  contract's device registration flow.

  npx hardhat run scripts/interact.js --config hardhat.config.cjs
WARNING: You are currently using Node.js v18.20.8, which is not supported by Hardhat. This can lead to unexpected behavior. See https://v2.hardhat.org/nodejs-versions


◇ injected env (4) from .env // tip: ⌘ custom filepath { path: '/custom/path/.env' }
◇ injected env (0) from .env // tip: ⌘ enable debugging { debug: true }
◇ injected env (0) from .env // tip: ◈ encrypted .env [www.dotenvx.com]
===========================================
IoT Device Manager - Full Contract Test
===========================================

Home Miner Wallet: 0x7459d2132698e936e5876f2655137D0290B02B3e
Contract: 0x98c3938347dBb5e027B8021ec29dafeC0E90C9A5
Balance: 3.649140173919283907 ETH

--- TEST 1: Initial State ---
  Total Devices Registered: 0
  Total Intrusions: 0
  Total Transactions: 0
  Contract Uptime (seconds): 1512
PASS: Initial state read successfully

--- TEST 2: Add Device 1 (Temperature Sensor) ---
Device address: 0xE02fbeF9fBa2c0A047770C316684D9997764876f
Funded device with 0.002 ETH
Tx hash: undefined
Device count after add: 1
PASS: Device 1 added successfully

--- TEST 3: Add Device 2 (Smart Lock) ---
Device address: 0x68f52d29915318346A84110f6AD05D96350c1944
Funded device with 0.002 ETH
Device count after add: 2
PASS: Device 2 added successfully

--- TEST 4: Add Device 3 (Security Camera) ---
Device address: 0x65501bDC450e9dB711a5fdD2Cfc2412a29f4c683
Funded device with 0.002 ETH
Device count after add: 3
PASS: Device 3 added successfully

--- TEST 5: Add Duplicate Device (should fail) ---
PASS: Duplicate correctly rejected

--- TEST 6: Verify Valid Device ---
Verifying device: 0xE02fbeF9fBa2c0A047770C316684D9997764876f
Tx hash: undefined
Device is valid: true
PASS: Valid device verified successfully

--- TEST 7: Verify Invalid Device (Intrusion Detection) ---
Verifying non-existent device: 0x489DD669eF6CC90b9438F84df8333Bc0AFA5c34e
Fake device is valid: false
PASS: Invalid device correctly detected

--- TEST 8: Get All Devices Ever Registered ---
Devices ever registered: 3
  1. 0xE02fbeF9fBa2c0A047770C316684D9997764876f
  2. 0x68f52d29915318346A84110f6AD05D96350c1944
  3. 0x65501bDC450e9dB711a5fdD2Cfc2412a29f4c683
PASS: All devices list retrieved

--- TEST 9: Get Device Info ---
Getting info for: 0xE02fbeF9fBa2c0A047770C316684D9997764876f
  Device Address: 0xE02fbeF9fBa2c0A047770C316684D9997764876f
  Device Type: Temperature Sensor
  Is Active: true
  Registration Time: 2026-04-30T12:24:12.000Z
PASS: Device info retrieved

--- TEST 10: Get Updated Contract Stats ---
  Total Devices Registered: 3
  Total Intrusions: 1
  Total Transactions: 6
PASS: Contract stats retrieved

--- TEST 11: Get Transaction History ---
Total transactions: 6
  1. ADD_DEVICE - Target: 0xE02fbeF9fBa2c0A047770C316684D9997764876f - Success: true
  2. ADD_DEVICE - Target: 0x68f52d29915318346A84110f6AD05D96350c1944 - Success: true
  3. ADD_DEVICE - Target: 0x65501bDC450e9dB711a5fdD2Cfc2412a29f4c683 - Success: true
  4. VERIFY_DEVICE - Target: 0xE02fbeF9fBa2c0A047770C316684D9997764876f - Success: true
  5. INTRUSION_ATTEMPT - Target: 0x7459d2132698e936e5876f2655137D0290B02B3e - Success: false
  6. VERIFY_DEVICE - Target: 0x489DD669eF6CC90b9438F84df8333Bc0AFA5c34e - Success: false
PASS: Transaction history retrieved

--- TEST 12: Remove Device ---
Removing device: 0x68f52d29915318346A84110f6AD05D96350c1944
Tx hash: undefined
Removed device is valid: false
Device count after remove: 2
PASS: Device removed successfully

--- TEST 13: Verify Removed Device is Invalid ---
Removed device is valid: false
PASS: Removed device correctly shows as invalid

--- TEST 14: Remove Non-existent Device (should fail) ---
PASS: Non-existent device correctly rejected

--- TEST 15: Get Intrusion Count ---
Intrusion attempts recorded: 1
PASS: Intrusion count retrieved

--- TEST 16: Get Intrusion Log ---
Intrusion log entries: 1
PASS: Intrusion log retrieved

===========================================
TEST RESULTS
===========================================
Passed: 16
Failed: 0
Total: 16
===========================================

All tests passed!





Usage

  To remove a device:
  # Edit DEVICE_TO_REMOVE in removeSpecificDevice.js, then:
  npx hardhat run scripts/removeSpecificDevice.js --config hardhat.config.cjs

  To add a device:
  # Edit DEVICE_ADDRESS, DEVICE_TYPE, and DEVICE_PRIVATE_KEY in addSpecificDevice.js,
  then:
  npx hardhat run scripts/addSpecificDevice.js --config hardhat.config.cjs

  ---
  Edit before running:

  removeSpecificDevice.js - Line 11:
  const DEVICE_TO_REMOVE = "0x68f52d29915318346A84110f6AD05D96350c1944";

  addSpecificDevice.js - Lines 10-12:
  const DEVICE_ADDRESS = "0x...";         // Device address
  const DEVICE_TYPE = "Temperature Sensor";  // Device type
  const DEVICE_PRIVATE_KEY = "0x...";     // Device's private key

  ---
  Important Notes

  Remove: Only Home Miner can remove devices (your wallet in .env)

  Add: The device must sign its registration itself using EIP-712. You need the actual
   IoT device's private key to register a real device. If you're just testing, you can
   generate a random wallet for simulation purposes.