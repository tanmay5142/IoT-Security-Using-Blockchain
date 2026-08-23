# IoT Device Security on Blockchain

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Solidity](https://img.shields.io/badge/solidity-%5E0.8.0-lightgrey)
![Hardhat](https://img.shields.io/badge/hardhat-2.0-red)
![React](https://img.shields.io/badge/react-18.0-61dafb)

## 📋 Overview

A decentralized application (DApp) leveraging Ethereum smart contracts to establish a trusted registry for IoT device management. This system enables organizations to register, verify, and manage IoT devices on-chain with immutable audit trails and cryptographic authentication.

## 🔒 Problem Statement

The proliferation of IoT devices in enterprise environments creates significant security challenges:

- **Device Spoofing**: Counterfeit devices can infiltrate networks without detection
- **Centralized Vulnerability**: Traditional device registries depend on centralized authorities susceptible to compromise
- **Audit Trail Gaps**: Device history and ownership changes are difficult to verify
- **Manufacturer Dependency**: Organizations lack independent verification of device authenticity
- **Compliance Gaps**: Regulatory requirements for immutable device records remain unmet

## ✅ Solution

This DApp implements blockchain-based device authentication through:

- **Immutable Registry**: Device records stored on Ethereum smart contracts ensure permanent, tamper-proof documentation
- **Decentralized Authority**: Eliminates single points of failure by distributing trust across the network
- **Cryptographic Verification**: Device ownership verified through wallet signatures and smart contract logic
- **Real-time Transparency**: On-chain events provide transparent audit trails for all device state changes
- **Seamless Integration**: MetaMask wallet integration enables familiar user authentication flows

## ⚙️ Features

- ✅ **Device Registration**: Register new IoT devices with metadata on-chain
- ✅ **Authenticity Verification**: Cryptographic verification of device ownership and identity
- ✅ **Secure Removal**: Deactivate or remove compromised devices with transaction records
- ✅ **Immutable Records**: Device history and state changes permanently recorded on blockchain
- ✅ **MetaMask Integration**: Web3 wallet authentication and transaction signing
- ✅ **Real-time Dashboard**: Interactive frontend for device management and monitoring
- ✅ **Event Logging**: Smart contract events provide transparent audit trails
- ✅ **Contract Verification**: Full contract source code transparency for auditing

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Smart Contracts** | Solidity ^0.8.0 |
| **Contract Development** | Hardhat, OpenZeppelin |
| **Blockchain Interaction** | Ethers.js |
| **Frontend Framework** | React 18, Vite |
| **Styling** | Tailwind CSS |
| **State Management** | React Context API |
| **Wallet Integration** | MetaMask (Web3Modal) |
| **Testnet** | Ethereum Sepolia |
| **Testing** | Hardhat Test, Chai, Ethers.js |

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   React Frontend                         │
│         (Device Dashboard & Management UI)               │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
         ┌───────────────────────┐
         │   MetaMask Wallet     │
         │  (User Authentication)│
         └────────────┬──────────┘
                      │
                      ↓
         ┌─────────────────────────────┐
         │   Ethers.js (Web3.js)       │
         │   (Blockchain Interaction)  │
         └────────────┬────────────────┘
                      │
                      ↓
    ┌─────────────────────────────────────┐
    │  Smart Contract (IoTDeviceManager)  │
    │  - Device Registration              │
    │  - Verification Logic               │
    │  - State Management                 │
    └─────────────────────────────────────┘
                      │
                      ↓
    ┌─────────────────────────────────────┐
    │    Ethereum Sepolia Testnet         │
    │  (Immutable Decentralized Storage)  │
    └─────────────────────────────────────┘
```

## 📁 Project Structure

```
iot-blockchain-security/
├── contracts/
│   ├── IoTDeviceManager.sol       # Main smart contract for device management
│   └── interfaces/
│       └── IIoTDeviceManager.sol  # Contract interface
├── scripts/
│   ├── deploy.js                  # Contract deployment script
│   ├── register-device.js         # Device registration helper
│   └── verify-device.js           # Device verification helper
├── test/
│   └── IoTDeviceManager.test.js   # Smart contract unit tests
├── frontend/
│   ├── src/
│   │   ├── components/            # React components
│   │   ├── pages/                 # Application pages
│   │   ├── hooks/                 # Custom React hooks
│   │   ├── contracts/             # Contract ABIs
│   │   ├── utils/                 # Helper functions
│   │   ├── App.jsx                # Main application component
│   │   └── index.css              # Global styles
│   ├── public/                    # Static assets
│   ├── package.json
│   └── vite.config.js             # Vite configuration
├── hardhat.config.js              # Hardhat configuration
├── package.json                   # Project dependencies
├── README.md                      # This file
└── .env.example                   # Environment variables template
```

## 🚀 Installation & Setup

### Prerequisites

- Node.js v16+ and npm v8+
- MetaMask browser extension
- Git

### Step 1: Clone Repository

```bash
git clone https://github.com/tanmay5142/IoT-Security-Using-Blockchain.git
cd IoT-Security-Using-Blockchain
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment Variables

```bash
cp .env.example .env.local
```

Update `.env.local` with:

```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
PRIVATE_KEY=your_private_key_here
CONTRACT_ADDRESS=deployed_contract_address
```

### Step 4: Deploy Smart Contract

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

Save the deployed contract address to `.env.local`:

```env
CONTRACT_ADDRESS=0x...
```

### Step 5: Install Frontend Dependencies

```bash
cd frontend
npm install
```

## 🎯 How to Run

### Run Tests

```bash
npx hardhat test
```

### Deploy to Sepolia Testnet

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### Start Development Server

```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Register a Device

```bash
npx hardhat run scripts/register-device.js --network sepolia
```

### Check Devices
npm run check-devices

## 📜 Smart Contract Details

### IoTDeviceManager.sol

The primary smart contract manages the complete device lifecycle:

**Key Functions:**

- `registerDevice(string memory _deviceId, string memory _metadata)` - Register a new IoT device with metadata
- `verifyDevice(string memory _deviceId) returns (bool)` - Verify device authenticity
- `removeDevice(string memory _deviceId)` - Deactivate a device
- `getDeviceDetails(string memory _deviceId) returns (Device)` - Retrieve device information
- `getAllDevices() returns (Device[])` - List all registered devices

**State Variables:**

- `devices`: Mapping of device IDs to Device structs
- `deviceOwners`: Tracking device-to-owner relationships
- `deviceCount`: Total registered devices

**Events:**

- `DeviceRegistered`: Emitted when device is registered
- `DeviceVerified`: Emitted when device authenticity is confirmed
- `DeviceRemoved`: Emitted when device is deactivated

## 📸 Screenshots

### Device Dashboard


### Device Registration Modal


### Device Details View


### Transaction History


## 🔮 Future Improvements

- [ ] Multi-signature contract upgrades using OpenZeppelin Proxies
- [ ] Role-based access control (RBAC) for different stakeholder types
- [ ] Off-chain data storage (IPFS) for device metadata with on-chain hashes
- [ ] Integration with Chainlink oracles for real-world device data
- [ ] Automated device health monitoring and alert system
- [ ] NFT-based device certificates for enhanced authenticity verification
- [ ] Cross-chain interoperability using bridge protocols
- [ ] Gas optimization through batch operations
- [ ] Advanced analytics dashboard with device metrics
- [ ] Mobile application for device management on-the-go

## 📖 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Submit a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Tanmay**

- GitHub: [@tanmay5142](https://github.com/tanmay5142)
- Email: tanmayanand5142@gmail.com

---

**Last Updated**: May 2026  
**Version**: 1.0.0
