import { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { getProvider, getContract, getExplorerLink, formatAddress } from '../utils/contract';
import toast from 'react-hot-toast';
import { ethers } from 'ethers';

const VerifyDevice = () => {
  const { address, isConnected } = useWallet();
  const [deviceAddress, setDeviceAddress] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleVerifyDevice = async (e) => {
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
    setVerificationResult(null);

    try {
      const provider = getProvider();
      const signer = await provider.getSigner();
      const contract = getContract(signer);

      const isValid = await contract.isDeviceValid(deviceAddress);
      setVerificationResult(isValid);

      if (isValid) {
        toast.success('Device is valid and authorized');
      } else {
        toast.error('Device is not authorized');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to verify device');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold">Verify Device</h3>
          <p className="text-xs text-gray-400">Check device authorization</p>
        </div>
      </div>

      <form onSubmit={handleVerifyDevice} className="space-y-4">
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
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Verifying...
            </>
          ) : (
            'Verify Device'
          )}
        </button>
      </form>

      {verificationResult !== null && (
        <div className={`mt-4 p-3 rounded-lg ${verificationResult ? 'bg-green-900/50 border border-green-700' : 'bg-red-900/50 border border-red-700'}`}>
          <div className="flex items-center gap-2">
            {verificationResult ? (
              <>
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-green-400 font-medium">Device Verified</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-red-400 font-medium">Not Authorized</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifyDevice;