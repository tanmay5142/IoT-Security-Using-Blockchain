import { useWallet } from '../hooks/useWallet';
import { formatAddress } from '../utils/contract';
import toast from 'react-hot-toast';

const WalletConnect = () => {
  const { address, isConnecting, connect, disconnect, isSepolia, network } = useWallet();

  const handleConnect = async () => {
    if (!window.ethereum) {
      toast.error('MetaMask not detected. Please install it.');
      return;
    }
    await connect();
  };

  if (!address) {
    return (
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors flex items-center gap-2"
      >
        {isConnecting ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Connecting...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Connect Wallet
          </>
        )}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-4">
      {/* Network Status */}
      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
        isSepolia ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'
      }`}>
        {isSepolia ? (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
            Sepolia
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-red-400 rounded-full"></span>
            Wrong Network ({network})
          </span>
        )}
      </div>

      {/* Address */}
      <button
        onClick={disconnect}
        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors flex items-center gap-2"
      >
        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
        {formatAddress(address)}
      </button>
    </div>
  );
};

export default WalletConnect;