import { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { getProvider, getContract, getExplorerLink } from '../utils/contract';
import toast from 'react-hot-toast';
import { ethers } from 'ethers';

const RemoveDevice = () => {
  const { address, isConnected } = useWallet();
  const [deviceAddress, setDeviceAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRemoveDevice = async (e) => {
    e.preventDefault();

    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!ethers.utils.isAddress(deviceAddress)) {
      toast.error('Invalid device address');
      return;
    }

    setIsLoading(true);

    try {
      const provider = getProvider();
      const signer = await provider.getSigner();
      const contract = getContract(signer);

      const tx = await contract.removeDevice(deviceAddress);
      toast.loading('Transaction pending...', { id: 'remove' });

      await tx.wait();

      toast.success('Device removed successfully!', { id: 'remove' });
      toast.success(
        <a href={getExplorerLink(tx.hash)} target="_blank" rel="noopener noreferrer" className="underline">
          View on Etherscan
        </a>,
        { duration: 10000 }
      );

      setDeviceAddress('');
    } catch (err) {
      toast.error(err.message || 'Failed to remove device', { id: 'remove' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-red-900 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold">Remove Device</h3>
          <p className="text-xs text-gray-400">Unregister an IoT device</p>
        </div>
      </div>

      <form onSubmit={handleRemoveDevice} className="space-y-4">
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

        <button
          type="submit"
          disabled={isLoading || !isConnected}
          className="w-full py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
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
            'Remove Device'
          )}
        </button>
      </form>
    </div>
  );
};

export default RemoveDevice;