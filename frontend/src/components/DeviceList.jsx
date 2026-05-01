import { useEffect, useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { getProvider, getContract, formatAddress, formatTimestamp } from '../utils/contract';
import toast from 'react-hot-toast';

const DeviceList = () => {
  const { address, isConnected } = useWallet();
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDevices = async () => {
    if (!isConnected) return;

    setIsLoading(true);
    try {
      const provider = getProvider();
      const signer = await provider.getSigner();
      const contract = getContract(signer);

      const allDevices = await contract.getAllDevicesEverRegistered();

      const deviceInfos = await Promise.all(
        allDevices.map(async (addr) => {
          const info = await contract.getDeviceInfo(addr);
          const isActive = await contract.isDeviceValid(addr);
          return {
            address: addr,
            deviceType: info.deviceType,
            registrationTime: info.registrationTime.toString(),
            lastVerification: info.lastVerificationTime.toString(),
            isActive,
          };
        })
      );

      setDevices(deviceInfos);
    } catch (err) {
      toast.error(err.message || 'Failed to fetch devices');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 15000);
    return () => clearInterval(interval);
  }, [isConnected, address]);

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-900 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold">Registered Devices</h3>
            <p className="text-xs text-gray-400">{devices.length} device(s) total</p>
          </div>
        </div>

        <button
          onClick={fetchDevices}
          disabled={isLoading || !isConnected}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 rounded-lg text-sm transition-colors flex items-center gap-2"
        >
          <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {!isConnected ? (
        <div className="text-center py-12 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p>Connect your wallet to view devices</p>
        </div>
      ) : isLoading && devices.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <svg className="animate-spin w-8 h-8 mx-auto mb-3" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p>Loading devices...</p>
        </div>
      ) : devices.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>No devices registered yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-400">Device Address</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-400">Type</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-400">Registered</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-400">Last Verified</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((device, index) => (
                <tr key={index} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                  <td className="py-3 px-2 font-mono text-sm">{formatAddress(device.address)}</td>
                  <td className="py-3 px-2 text-sm">{device.deviceType || 'N/A'}</td>
                  <td className="py-3 px-2 text-sm text-gray-400">{formatTimestamp(device.registrationTime)}</td>
                  <td className="py-3 px-2 text-sm text-gray-400">{formatTimestamp(device.lastVerification)}</td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      device.isActive ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'
                    }`}>
                      {device.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DeviceList;