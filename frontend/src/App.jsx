import { Toaster } from 'react-hot-toast';
import WalletConnect from './components/WalletConnect';
import Dashboard from './components/Dashboard';
import AddDevice from './components/AddDevice';
import RemoveDevice from './components/RemoveDevice';
import VerifyDevice from './components/VerifyDevice';
import DeviceList from './components/DeviceList';

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1f2937',
            color: '#fff',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold">IoT Device Manager</h1>
              <p className="text-xs text-gray-400">Blockchain Security Dashboard</p>
            </div>
          </div>
          <WalletConnect />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Dashboard Stats */}
        <Dashboard />

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <AddDevice />
          <RemoveDevice />
          <VerifyDevice />
        </div>

        {/* Device List */}
        <DeviceList />
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-sm">
          IoT Device Manager on Sepolia Testnet
        </div>
      </footer>
    </div>
  );
}

export default App;