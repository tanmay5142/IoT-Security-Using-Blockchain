import { useEffect, useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { getProvider, getContract } from '../utils/contract';

const Dashboard = () => {
  const { address } = useWallet();
  const [stats, setStats] = useState({
    totalDevices: 0,
    activeDevices: 0,
    totalIntrusions: 0,
    totalTransactions: 0,
    uptime: 0,
  });
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    if (!address) return;
    setLoading(true);
    try {
      const provider = getProvider();
      const signer = await provider.getSigner();
      const contract = getContract(signer);
      const rawStats = await contract.getContractStats();
      const activeCount = await contract.getDeviceCount();

      setStats({
        totalDevices: rawStats[0]?.toString() || 0,
        activeDevices: activeCount?.toString() || 0,
        totalIntrusions: rawStats[1]?.toString() || 0,
        totalTransactions: rawStats[2]?.toString() || 0,
        uptime: rawStats[3]?.toString() || 0,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [address]);

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    if (days > 0) return `${days}d ${hours}h`;
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  const statCards = [
    { label: 'Total Devices', value: stats.totalDevices, icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z' },
    { label: 'Active Devices', value: stats.activeDevices, icon: 'M5 13l4 4L19 7' },
    { label: 'Intrusions', value: stats.totalIntrusions, icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
    { label: 'Transactions', value: stats.totalTransactions, icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
    { label: 'Uptime', value: formatUptime(stats.uptime), icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
      {statCards.map((card, index) => (
        <div key={index} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">{card.label}</span>
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} />
            </svg>
          </div>
          <p className="text-2xl font-bold">
            {loading ? (
              <span className="animate-pulse">...</span>
            ) : (
              card.value
            )}
          </p>
        </div>
      ))}
    </div>
  );
};

export default Dashboard;