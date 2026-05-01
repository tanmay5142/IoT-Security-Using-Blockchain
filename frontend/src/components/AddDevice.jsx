import { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { getProvider, getContract, getExplorerLink } from '../utils/contract';
import toast from 'react-hot-toast';
import { ethers } from 'ethers';

const AddDevice = () => {
  const { address, isConnected } = useWallet();
  const [deviceAddress, setDeviceAddress] = useState('');
  const [deviceType, setDeviceType] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAddDevice = async (e) => {
    e.preventDefault();

    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!ethers.utils.isAddress(deviceAddress)) {
      toast.error('Invalid device address');
      return;
    }

    if (!deviceType.trim()) {
      toast.error('Device type is required');
      return;
    }

    setIsLoading(true);

    try {
      const provider = getProvider();
      const signer = await provider.getSigner();
      const contract = getContract(signer);

      const nonce = await contract.nonces(deviceAddress);
      const domainSeparator = await contract.domainSeparator();

      const addDeviceTypeHash = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes('AddDevice(address device,string deviceType,uint256 nonce)')
      );

      const messageHash = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
          ['bytes32', 'address', 'bytes32', 'uint256'],
          [addDeviceTypeHash, deviceAddress, ethers.utils.keccak256(ethers.utils.toUtf8Bytes(deviceType)), nonce]
        )
      );

      const ethSignedHash = ethers.utils.solidityKeccak256(
        ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
        ['\x19', '\x01', domainSeparator, messageHash]
      );

      const signature = await signer.signMessage(ethers.utils.arrayify(ethSignedHash));

      const tx = await contract.addDevice(deviceAddress, deviceType, signature);
      toast.loading('Transaction pending...');

      await tx.wait();

      toast.success('Device added successfully!');
      toast.success(
        <a href={getExplorerLink(tx.hash)} target="_blank" rel="noopener noreferrer" className="underline">
          View on Etherscan
        </a>,
        { duration: 10000 }
      );

      setDeviceAddress('');
      setDeviceType('');
    } catch (err) {
      toast.error(err.message || 'Failed to add device');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-green-900 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold">Add Device</h3>
          <p className="text-xs text-gray-400">Register a new IoT device</p>
        </div>
      </div>

      <form onSubmit={handleAddDevice} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Device Address</label>
          <input
            type="text"
            value={deviceAddress}
            onChange={(e) => setDeviceAddress(e.target.value)}
            placeholder="0x..."
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Device Type</label>
          <input
            type="text"
            value={deviceType}
            onChange={(e) => setDeviceType(e.target.value)}
            placeholder="e.g., Temperature Sensor"
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !isConnected}
          className="w-full py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Processing...
            </>
          ) : (
            'Add Device'
          )}
        </button>
      </form>
    </div>
  );
};

export default AddDevice;