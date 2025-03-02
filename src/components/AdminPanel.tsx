import React, { useState, useEffect } from 'react';
import { Settings, Users, Clock, DollarSign, LogOut, AlertTriangle, RefreshCw } from 'lucide-react';
import { 
  getContractInfo, 
  addToWhitelist, 
  removeFromWhitelist, 
  setClaimAmounts, 
  setCooldownPeriod, 
  withdrawFunds,
  switchToGravityNetwork
} from '../utils/web3';
import { ADMIN_ADDRESS, NETWORK_CONFIG } from '../utils/constants';

interface AdminPanelProps {
  account: string | null;
  isCorrectNetwork: boolean;
  onSwitchNetwork: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  account,
  isCorrectNetwork,
  onSwitchNetwork
}) => {
  const [activeTab, setActiveTab] = useState('whitelist');
  const [contractInfo, setContractInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Whitelist form
  const [whitelistAddresses, setWhitelistAddresses] = useState('');
  const [removeAddresses, setRemoveAddresses] = useState('');
  
  // Claim settings form
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  
  // Cooldown form
  const [cooldownHours, setCooldownHours] = useState(0);
  const [cooldownMinutes, setCooldownMinutes] = useState(0);
  
  // Withdraw form
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const isAdmin = account?.toLowerCase() === ADMIN_ADDRESS.toLowerCase();

  useEffect(() => {
    const fetchContractInfo = async () => {
      if (!isCorrectNetwork) return;
      
      try {
        const info = await getContractInfo();
        setContractInfo(info);
        
        // Set initial form values
        setMinAmount(info.minClaimAmount);
        setMaxAmount(info.maxClaimAmount);
        
        const cooldownInSeconds = Number(info.cooldownPeriod);
        setCooldownHours(Math.floor(cooldownInSeconds / 3600));
        setCooldownMinutes(Math.floor((cooldownInSeconds % 3600) / 60));
      } catch (err) {
        console.error('Error fetching contract info:', err);
      }
    };

    if (isAdmin && isCorrectNetwork) {
      fetchContractInfo();
    }
  }, [isAdmin, account, isCorrectNetwork]);

  const resetMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleNetworkSwitch = async () => {
    resetMessages();
    try {
      await switchToGravityNetwork();
      onSwitchNetwork();
    } catch (err: any) {
      setError(err.message || 'Failed to switch network');
    }
  };

  const handleAddToWhitelist = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    
    if (!isCorrectNetwork) {
      setError('Please switch to the Gravity network first');
      return;
    }
    
    if (!whitelistAddresses.trim()) {
      setError('Please enter at least one address');
      return;
    }
    
    try {
      setLoading(true);
      const addresses = whitelistAddresses
        .split('\n')
        .map(addr => addr.trim())
        .filter(addr => addr.length > 0);
      
      await addToWhitelist(addresses);
      setSuccess(`Successfully added ${addresses.length} address(es) to whitelist`);
      setWhitelistAddresses('');
    } catch (err: any) {
      console.error('Error adding to whitelist:', err);
      setError(err.message || 'Failed to add addresses to whitelist');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWhitelist = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    
    if (!isCorrectNetwork) {
      setError('Please switch to the Gravity network first');
      return;
    }
    
    if (!removeAddresses.trim()) {
      setError('Please enter at least one address');
      return;
    }
    
    try {
      setLoading(true);
      const addresses = removeAddresses
        .split('\n')
        .map(addr => addr.trim())
        .filter(addr => addr.length > 0);
      
      await removeFromWhitelist(addresses);
      setSuccess(`Successfully removed ${addresses.length} address(es) from whitelist`);
      setRemoveAddresses('');
    } catch (err: any) {
      console.error('Error removing from whitelist:', err);
      setError(err.message || 'Failed to remove addresses from whitelist');
    } finally {
      setLoading(false);
    }
  };

  const handleSetClaimAmounts = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    
    if (!isCorrectNetwork) {
      setError('Please switch to the Gravity network first');
      return;
    }
    
    if (!minAmount || !maxAmount) {
      setError('Please fill in all fields');
      return;
    }
    
    if (parseFloat(minAmount) > parseFloat(maxAmount)) {
      setError('Minimum amount cannot be greater than maximum amount');
      return;
    }
    
    try {
      setLoading(true);
      await setClaimAmounts(minAmount, maxAmount);
      setSuccess('Successfully updated claim amounts');
      
      // Update contract info
      const info = await getContractInfo();
      setContractInfo(info);
    } catch (err: any) {
      console.error('Error setting claim amounts:', err);
      setError(err.message || 'Failed to update claim amounts');
    } finally {
      setLoading(false);
    }
  };

  const handleSetCooldownPeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    
    if (!isCorrectNetwork) {
      setError('Please switch to the Gravity network first');
      return;
    }
    
    try {
      setLoading(true);
      const cooldownInSeconds = (cooldownHours * 3600) + (cooldownMinutes * 60);
      await setCooldownPeriod(cooldownInSeconds);
      setSuccess('Successfully updated cooldown period');
      
      // Update contract info
      const info = await getContractInfo();
      setContractInfo(info);
    } catch (err: any) {
      console.error('Error setting cooldown period:', err);
      setError(err.message || 'Failed to update cooldown period');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    
    if (!isCorrectNetwork) {
      setError('Please switch to the Gravity network first');
      return;
    }
    
    if (!withdrawAmount) {
      setError('Please enter an amount to withdraw');
      return;
    }
    
    try {
      setLoading(true);
      await withdrawFunds(withdrawAmount);
      setSuccess(`Successfully withdrew ${withdrawAmount} ${NETWORK_CONFIG.symbol}`);
      setWithdrawAmount('');
    } catch (err: any) {
      console.error('Error withdrawing funds:', err);
      setError(err.message || 'Failed to withdraw funds');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-4xl w-full">
        <div className="text-center">
          <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Admin Access Required</h2>
          <p className="text-gray-600 mb-4">
            You need to connect with the admin wallet to access this page.
          </p>
          <p className="text-sm text-gray-500">
            Admin address: {ADMIN_ADDRESS}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-xl p-6 max-w-4xl w-full">
      <div className="flex items-center justify-between mb-6 border-b pb-4">
        <div className="flex items-center">
          <Settings className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-2xl font-bold text-gray-800">Admin Panel</h2>
        </div>
        {contractInfo && isCorrectNetwork ? (
          <div className="text-sm text-gray-600">
            Contract Balance: <span className="font-medium">{contractInfo.balance} {NETWORK_CONFIG.symbol}</span>
          </div>
        ) : !isCorrectNetwork ? (
          <div className="text-sm text-yellow-600 flex items-center">
            <AlertTriangle className="h-4 w-4 mr-1" />
            Wrong Network
          </div>
        ) : null}
      </div>
      
      {!isCorrectNetwork && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6 flex items-start">
          <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-yellow-800">Wrong Network Detected</h3>
            <p className="text-yellow-700 text-sm mt-1">
              You need to be connected to the Gravity network to manage the faucet.
            </p>
            <button
              onClick={handleNetworkSwitch}
              className="mt-2 px-3 py-1 bg-yellow-500 text-white text-sm font-medium rounded-md hover:bg-yellow-600 transition-colors flex items-center w-fit"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Switch to Gravity
            </button>
          </div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
          <p className="text-green-700">{success}</p>
        </div>
      )}
      
      <div className="flex border-b mb-6">
        <button
          onClick={() => { setActiveTab('whitelist'); resetMessages(); }}
          className={`px-4 py-2 font-medium ${
            activeTab === 'whitelist' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-600 hover:text-blue-600'
          }`}
        >
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            Whitelist
          </div>
        </button>
        
        <button
          onClick={() => { setActiveTab('claim-settings'); resetMessages(); }}
          className={`px-4 py-2 font-medium ${
            activeTab === 'claim-settings' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-600 hover:text-blue-600'
          }`}
        >
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 mr-1" />
            Claim Settings
          </div>
        </button>
        
        <button
          onClick={() => { setActiveTab('cooldown'); resetMessages(); }}
          className={`px-4 py-2 font-medium ${
            activeTab === 'cooldown' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-600 hover:text-blue-600'
          }`}
        >
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            Cooldown
          </div>
        </button>
        
        <button
          onClick={() => { setActiveTab('withdraw'); resetMessages(); }}
          className={`px-4 py-2 font-medium ${
            activeTab === 'withdraw' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-600 hover:text-blue-600'
          }`}
        >
          <div className="flex items-center">
            <LogOut className="h-4 w-4 mr-1" />
            Withdraw
          </div>
        </button>
      </div>
      
      {activeTab === 'whitelist' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-4">Add to Whitelist</h3>
            <form onSubmit={handleAddToWhitelist}>
              <div className="mb-4">
                <label htmlFor="whitelist-addresses" className="block text-sm font-medium text-gray-700 mb-1">
                  Addresses (one per line)
                </label>
                <textarea
                  id="whitelist-addresses"
                  value={whitelistAddresses}
                  onChange={(e) => setWhitelistAddresses(e.target.value)}
                  placeholder="0x..."
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading || !isCorrectNetwork}
                />
              </div>
              
              <button
                type="submit"
                disabled={loading || !isCorrectNetwork}
                className={`w-full py-2 px-4 ${
                  isCorrectNetwork 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-gray-400 cursor-not-allowed'
                } text-white font-medium rounded-md`}
              >
                {loading ? 'Processing...' : 'Add to Whitelist'}
              </button>
            </form>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-4">Remove from Whitelist</h3>
            <form onSubmit={handleRemoveFromWhitelist}>
              <div className="mb-4">
                <label htmlFor="remove-addresses" className="block text-sm font-medium text-gray-700 mb-1">
                  Addresses (one per line)
                </label>
                <textarea
                  id="remove-addresses"
                  value={removeAddresses}
                  onChange={(e) => setRemoveAddresses(e.target.value)}
                  placeholder="0x..."
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading || !isCorrectNetwork}
                />
              </div>
              
              <button
                type="submit"
                disabled={loading || !isCorrectNetwork}
                className={`w-full py-2 px-4 ${
                  isCorrectNetwork 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-gray-400 cursor-not-allowed'
                } text-white font-medium rounded-md`}
              >
                {loading ? 'Processing...' : 'Remove from Whitelist'}
              </button>
            </form>
          </div>
        </div>
      )}
      
      {activeTab === 'claim-settings' && (
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-4">Claim Amount Settings</h3>
          <form onSubmit={handleSetClaimAmounts}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="min-amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Claim Amount ({NETWORK_CONFIG.symbol})
                </label>
                <input
                  type="number"
                  id="min-amount"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  placeholder="0.0"
                  step="0.000000000000000001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading || !isCorrectNetwork}
                />
              </div>
              <div>
                <label htmlFor="max-amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Claim Amount ({NETWORK_CONFIG.symbol})
                </label>
                <input
                  type="number"
                  id="max-amount"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  placeholder="0.0"
                  step="0.000000000000000001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading || !isCorrectNetwork}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !isCorrectNetwork}
              className={`w-full py-2 px-4 ${
                isCorrectNetwork 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-gray-400 cursor-not-allowed'
              } text-white font-medium rounded-md`}
            >
              {loading ? 'Processing...' : 'Update Claim Amounts'}
            </button>
          </form>
        </div>
      )}
      
      {activeTab === 'cooldown' && (
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-4">Cooldown Period Settings</h3>
          <form onSubmit={handleSetCooldownPeriod}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="cooldown-hours" className="block text-sm font-medium text-gray-700 mb-1">
                  Hours
                </label>
                <input
                  type="number"
                  id="cooldown-hours"
                  value={cooldownHours}
                  onChange={(e) => setCooldownHours(parseInt(e.target.value) || 0)}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading || !isCorrectNetwork}
                />
              </div>
              <div>
                <label htmlFor="cooldown-minutes" className="block text-sm font-medium text-gray-700 mb-1">
                  Minutes
                </label>
                <input
                  type="number"
                  id="cooldown-minutes"
                  value={cooldownMinutes}
                  onChange={(e) => setCooldownMinutes(parseInt(e.target.value) || 0)}
                  min="0"
                  max="59"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading || !isCorrectNetwork}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !isCorrectNetwork}
              className={`w-full py-2 px-4 ${
                isCorrectNetwork 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-gray-400 cursor-not-allowed'
              } text-white font-medium rounded-md`}
            >
              {loading ? 'Processing...' : 'Update Cooldown Period'}
            </button>
          </form>
        </div>
      )}
      
      {activeTab === 'withdraw' && (
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-4">Withdraw Funds</h3>
          <form onSubmit={handleWithdraw}>
            <div className="mb-4">
              <label htmlFor="withdraw-amount" className="block text-sm font-medium text-gray-700 mb-1">
                Amount ({NETWORK_CONFIG.symbol})
              </label>
              <input
                type="number"
                id="withdraw-amount"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="0.0"
                step="0.000000000000000001"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                disabled={loading || !isCorrectNetwork}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !isCorrectNetwork}
              className={`w-full py-2 px-4 ${
                isCorrectNetwork 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-gray-400 cursor-not-allowed'
              } text-white font-medium rounded-md`}
            >
              {loading ? 'Processing...' : 'Withdraw Funds'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;