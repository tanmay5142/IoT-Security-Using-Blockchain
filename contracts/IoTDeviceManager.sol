// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
/**
 * @title IoTDeviceManager
 * @dev Manages IoT device registration, verification, and intrusion detection
 * on a private Ethereum blockchain for enhanced IoT security
 */
contract IoTDeviceManager {
    using ECDSA for bytes32;
    bytes32 public domainSeparator;
    
    // ============ STATE VARIABLES ============
    
    /// @dev Mapping of authorized IoT device addresses
    mapping(address => bool) public authorizedDevices;
    
    /// @dev Mapping of device details (address => deviceInfo)
    mapping(address => DeviceInfo) public deviceRegistry;
    
    /// @dev Array to track all registered devices
    address[] public allDevicesEverRegistered;
    
    /// @dev Mapping to track intrusion attempts
    mapping(address => uint256) public intrusionAttempts;
    
    /// @dev Array to track all intrusion attempts
    address[] public intrusionLog;
    mapping(address => bool) public hasIntruded;
    
    /// @dev Home Miner address (controller node)
    address public homeMiner;
    
    /// @dev Contract deployment timestamp
    uint256 public deploymentTime;
    
    /// @dev Total transactions processed
    uint256 public totalTransactions;
    uint256 public activeDeviceCount;
    mapping(address => uint256) public nonces;
    bytes32 constant public ADD_DEVICE_TYPEHASH = keccak256(
      "AddDevice(address device,string deviceType,uint256 nonce)"
    );
    
    // ============ STRUCTS ============
    
    /// @dev Structure to store device information
    struct DeviceInfo {
        address deviceAddress;
        uint256 registrationTime;
        uint256 lastVerificationTime;
        bool isActive;
        string deviceType;
    }
    
    /// @dev Structure to store transaction log
    struct Transaction {
        address initiator;
        string operation;
        address targetDevice;
        uint256 timestamp;
        bool success;
        string reason;
    }
    
    // ============ ARRAYS ============
    
    /// @dev Transaction history
    Transaction[] public transactionHistory;
    
    // ============ EVENTS ============
    
    /// @dev Event emitted when a device is successfully added
    event DeviceAdded(address indexed deviceAddress, uint256 timestamp);
    
    /// @dev Event emitted when a device is successfully removed
    event DeviceRemoved(address indexed deviceAddress, uint256 timestamp);
    
    /// @dev Event emitted when a device is verified
    event DeviceVerified(address indexed deviceAddress, bool isValid, uint256 timestamp);
    
    /// @dev Event emitted when an intrusion is detected
    event IntrusionDetected(address indexed attacker, string reason, uint256 timestamp);
    
    /// @dev Event emitted for general transaction logging
    event TransactionLogged(
        address indexed initiator,
        string operation,
        address indexed targetDevice,
        bool success,
        uint256 timestamp
    );
    
    // ============ MODIFIERS ============
    
    /// @dev Ensures only Home Miner can execute sensitive operations
    modifier onlyHomeMiner() {
        require(msg.sender == homeMiner, "Only Home Miner can perform this action");
        _;
    }
    
    /// @dev Ensures device is authorized
    modifier deviceAuthorized(address _device) {
        require(authorizedDevices[_device], "Device not authorized");
        _;
    }
    
    // ============ CONSTRUCTOR ============
    
    /**
     * @dev Initialize contract with Home Miner address
     * @param _homeMiner Address of the Home Miner node
     */
    constructor(address _homeMiner) {
        homeMiner = _homeMiner;
        deploymentTime = block.timestamp;
        totalTransactions = 0;
        activeDeviceCount = 0;
        domainSeparator = keccak256(abi.encode(
              keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
              keccak256("IoTDeviceManager"),
              keccak256("1"),
              block.chainid,
              address(this)
          ));
    }
    
    // ============ CORE FUNCTIONS ============
    
    /**
     * @dev Add a new IoT device to the network
     * Verifies the request is signed by the device itself or Home Miner
     * @param _deviceAddress Address of the IoT device to add
     * @param _deviceType Type/name of the device
     * @return success Boolean indicating if operation succeeded
     */
    function addDevice(
        address _deviceAddress,
        string memory _deviceType,
        bytes calldata signature
    ) public returns (bool) {
        require(_deviceAddress != address(0), "Invalid device address");
        require(!authorizedDevices[_deviceAddress], "Device already authorized");
        require(bytes(_deviceType).length > 0, "Device type cannot be empty");
        require(msg.sender == _deviceAddress, "only device can submit");

        // message hash
          bytes32 messageHash = keccak256(abi.encode(
              ADD_DEVICE_TYPEHASH,
              _deviceAddress,
              keccak256(bytes(_deviceType)),
              nonces[_deviceAddress]
          ));

          bytes32 ethSignedHash = keccak256(abi.encodePacked(
              "\x19\x01",
              domainSeparator,
              messageHash
          ));

          // Verify signature using OpenZeppelin
          address signer = ethSignedHash.recover(signature);

          require(
              signer == _deviceAddress,
              "Invalid signature"
          );
          nonces[_deviceAddress]++;
        // Register device
        authorizedDevices[_deviceAddress] = true;
        deviceRegistry[_deviceAddress] = DeviceInfo({
            deviceAddress: _deviceAddress,
            registrationTime: block.timestamp,
            lastVerificationTime: block.timestamp,
            isActive: true,
            deviceType: _deviceType
        });
        
        allDevicesEverRegistered.push(_deviceAddress);
        activeDeviceCount++;
        
        // Log transaction
        _logTransaction(msg.sender, "ADD_DEVICE", _deviceAddress, true, "Device successfully added");
        
        emit DeviceAdded(_deviceAddress, block.timestamp);
        emit TransactionLogged(msg.sender, "ADD_DEVICE", _deviceAddress, true, block.timestamp);
        
        return true;
    }
    
    /**
     * @dev Remove an IoT device from the network
     * @param _deviceAddress Address of the device to remove
     * @return success Boolean indicating if operation succeeded
     */
    function removeDevice(address _deviceAddress) public onlyHomeMiner returns (bool) {
        require(_deviceAddress != address(0), "Invalid device address");
        require(authorizedDevices[_deviceAddress], "Device not found in registry");
        
        // Deactivate device
        authorizedDevices[_deviceAddress] = false;
        deviceRegistry[_deviceAddress].isActive = false;

        activeDeviceCount--; //DECREMENT
        
        // Log transaction
        _logTransaction(msg.sender, "REMOVE_DEVICE", _deviceAddress, true, "Device successfully removed");
        
        emit DeviceRemoved(_deviceAddress, block.timestamp);
        emit TransactionLogged(msg.sender, "REMOVE_DEVICE", _deviceAddress, true, block.timestamp);
        
        return true;
    }
    
    /**
     * @dev Verify if a device is authorized and active
     * @param _deviceAddress Address of the device to verify
     * @return isValid Boolean indicating if device is authorized
     */
    function verifyDevice(address _deviceAddress) public returns (bool) {
        require(msg.sender == homeMiner || msg.sender == _deviceAddress,
          "Unauthorized");
        
        bool isValid = authorizedDevices[_deviceAddress] && deviceRegistry[_deviceAddress].isActive;
        
        if (isValid) {
            // Update verification time only for valid devices
            deviceRegistry[_deviceAddress].lastVerificationTime = block.timestamp;
            _logTransaction(msg.sender, "VERIFY_DEVICE", _deviceAddress, true, "Device verified as valid");
        } else {
            // only record intrusion if not the device itself checking
            if (msg.sender != _deviceAddress) {
                _recordIntrusion(msg.sender, "Unauthorized attempt");
            }
            _logTransaction(msg.sender, "VERIFY_DEVICE", _deviceAddress, false, "Device verification failed");
        }
        
        emit DeviceVerified(_deviceAddress, isValid, block.timestamp);
        emit TransactionLogged(msg.sender, "VERIFY_DEVICE", _deviceAddress, isValid, block.timestamp);
        
        return isValid;
    }

    /**
    * @dev Check if a device is valid (read-only, no gas cost)
    * @param _deviceAddress Address of the device to check
    * @return isValid Boolean indicating if device is authorized
    */
    function isDeviceValid(address _deviceAddress) public view returns (bool) {
        return authorizedDevices[_deviceAddress] &&
    deviceRegistry[_deviceAddress].isActive;
    }
    
    /**
     * @dev Record an intrusion attempt
     * @param _attacker Address of the device attempting intrusion
     * @param _reason Reason for marking as intrusion
     */
    function _recordIntrusion(address _attacker, string memory _reason) internal {
        intrusionAttempts[_attacker]++;
        if (!hasIntruded[_attacker]) {
            hasIntruded[_attacker] = true;
            intrusionLog.push(_attacker);
        }
        
        emit IntrusionDetected(_attacker, _reason, block.timestamp);
        _logTransaction(_attacker, "INTRUSION_ATTEMPT", _attacker, false, _reason);
    }
    
    /**
     * @dev Log a transaction in the history
     * @param _initiator Address that initiated the transaction
     * @param _operation Type of operation performed
     * @param _targetDevice Device involved in the operation
     * @param _success Whether the operation succeeded
     * @param _reason Reason or additional info about the transaction
     */
    function _logTransaction(
        address _initiator,
        string memory _operation,
        address _targetDevice,
        bool _success,
        string memory _reason
    ) internal {
        transactionHistory.push(Transaction({
            initiator: _initiator,
            operation: _operation,
            targetDevice: _targetDevice,
            timestamp: block.timestamp,
            success: _success,
            reason: _reason
        }));
        totalTransactions++;
    }
    
    // ============ QUERY FUNCTIONS ============
    
    /**
     * @dev Get total number of authorized devices
     * @return count Number of active authorized devices
     */
    function getDeviceCount() public view returns (uint256) {
        return activeDeviceCount; //RETURNS ACTIVE COUNT
    }
    
    /**
     * @dev Get list of all registered devices
     * @return devices Array of registered device addresses
     */
    function getAllDevicesEverRegistered() public view returns (address[] memory) {
        return allDevicesEverRegistered;
    }
    
    /**
     * @dev Get device information
     * @param _deviceAddress Address of the device
     * @return info Device information struct
     */
    function getDeviceInfo(address _deviceAddress) 
        public 
        view 
        returns (DeviceInfo memory) 
    {
        return deviceRegistry[_deviceAddress];
    }
    
    /**
     * @dev Get total number of intrusion attempts
     * @return count Number of intrusion attempts recorded
     */
    function getIntrusionCount() public view returns (uint256) {
        return intrusionLog.length;
    }
    
    /**
     * @dev Get intrusion log
     * @return intruders Array of addresses that attempted intrusion
     */
    function getIntrusionLog() public view returns (address[] memory) {
        return intrusionLog;
    }
    
    /**
     * @dev Get number of intrusion attempts by a device
     * @param _deviceAddress Address to check
     * @return count Number of intrusion attempts
     */
    function getIntrusionAttempts(address _deviceAddress) public view returns (uint256) {
        return intrusionAttempts[_deviceAddress];
    }
    
    /**
     * @dev Get total number of transactions
     * @return count Total transactions processed
     */
    function getTransactionCount() public view returns (uint256) {
        return transactionHistory.length;
    }
    
    /**
     * @dev Get transaction history
     * @return history Array of all transactions
     */
    function getTransactionHistory() public view returns (Transaction[] memory) {
        return transactionHistory;
    }
    
    /**
     * @dev Get recent transactions
     * @param _limit Number of recent transactions to return
     * @return recent Array of recent transactions
     */
    function getRecentTransactions(uint256 _limit) 
        public 
        view 
        returns (Transaction[] memory) 
    {
        require(_limit > 0, "Limit must be greater than 0");
        uint256 count = _limit < transactionHistory.length ? _limit : transactionHistory.length;
        
        Transaction[] memory recent = new Transaction[](count);
        uint256 startIndex = transactionHistory.length - count;
        
        for (uint256 i = 0; i < count; i++) {
            recent[i] = transactionHistory[startIndex + i];
        }
        
        return recent;
    }

    event HomeMinerChanged(address indexed oldMiner, address indexed newMiner);
    function changeHomeMiner(address _newHomeMiner) public onlyHomeMiner {
      require(_newHomeMiner != address(0), "Invalid Home Miner address");
      emit HomeMinerChanged(homeMiner, _newHomeMiner);
      homeMiner = _newHomeMiner;
    }

    
    /**
     * @dev Get contract statistics
     * @return stats Array containing [totalDevices, totalIntrusions, totalTransactions, uptime]
     */
    function getContractStats() public view returns (uint256[] memory) {
        uint256[] memory stats = new uint256[](4);
        stats[0] = allDevicesEverRegistered.length;
        stats[1] = intrusionLog.length;
        stats[2] = totalTransactions;
        stats[3] = block.timestamp - deploymentTime;
        return stats;
    }
}
