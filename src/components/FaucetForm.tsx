import React, { useState, useEffect } from 'react';
import { Droplet, Clock, AlertCircle, CheckCircle, Lock, ExternalLink, AlertTriangle, RefreshCw } from 'lucide-react';
import { claimTokens, getContractInfo, getLastClaimTime, isWhitelisted, switchToGravityNetwork } from '../utils/web3';
import { NETWORK_CONFIG } from '../utils/constants';

interface FaucetFormProps {
  account: string | null;
  onConnect: () => void;
  isCorrectNetwork: boolean;
  onSwitchNetwork: () => void;
}

const FaucetForm: React.FC<FaucetFormProps> = ({ 
  account, 
  onConnect, 
  isCorrectNetwork,
  onSwitchNetwork
}) => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [contractInfo, setContractInfo] = useState<any>(null);
  const [lastClaim, setLastClaim] = useState<number | null>(null);
  const [whitelisted, setWhitelisted] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  useEffect(() => {
    const fetchContractInfo = async () => {
      if (!isCorrectNetwork) return;
      
      try {
        const info = await getContractInfo();
        setContractInfo(info);
      } catch (err) {
        console.error('Error fetching contract info:', err);
      }
    };

    fetchContractInfo();
    
    // Refresh contract info every 30 seconds to keep balance updated
    const intervalId = setInterval(() => {
      if (isCorrectNetwork) {
        fetchContractInfo();
      }
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, [isCorrectNetwork]);

  useEffect(() => {
    if (!account || !isCorrectNetwork) return;

    const fetchUserInfo = async () => {
      try {
        const [lastClaimTime, isUserWhitelisted] = await Promise.all([
          getLastClaimTime(account),
          isWhitelisted(account)
        ]);
        
        setLastClaim(lastClaimTime);
        setWhitelisted(isUserWhitelisted);
        
        if (lastClaimTime && contractInfo) {
          const cooldownEnds = lastClaimTime + contractInfo.cooldownPeriod;
          const now = Math.floor(Date.now() / 1000);
          
          if (cooldownEnds > now) {
            setTimeRemaining(cooldownEnds - now);
            
            const timer = setInterval(() => {
              const currentTime = Math.floor(Date.now() / 1000);
              const remaining = cooldownEnds - currentTime;
              
              if (remaining <= 0) {
                setTimeRemaining(null);
                clearInterval(timer);
              } else {
                setTimeRemaining(remaining);
              }
            }, 1000);
            
            return () => clearInterval(timer);
          } else {
            setTimeRemaining(null);
          }
        }
      } catch (err) {
        console.error('Error fetching user info:', err);
      }
    };

    fetchUserInfo();
  }, [account, contractInfo, isCorrectNetwork]);

  useEffect(() => {
    if (account) {
      setRecipient(account);
    }
  }, [account]);

  const handleRecipientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow changing recipient if user is whitelisted
    if (whitelisted || !account) {
      setRecipient(e.target.value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setTxHash(null);
    
    if (!account) {
      onConnect();
      return;
    }
    
    if (!isCorrectNetwork) {
      try {
        await switchToGravityNetwork();
        onSwitchNetwork();
      } catch (err: any) {
        setError('Please switch to the Gravity network to claim tokens');
        return;
      }
    }
    
    if (!recipient || !amount) {
      setError('Please fill in all fields');
      return;
    }
    
    // Check if faucet has enough balance
    if (contractInfo && parseFloat(contractInfo.balance) < parseFloat(amount)) {
      setError(`Faucet doesn't have enough funds. Available: ${contractInfo.balance} ${NETWORK_CONFIG.symbol}`);
      return;
    }
    
    // For non-whitelisted users, force recipient to be their own address
    const actualRecipient = whitelisted ? recipient : account;
    
    try {
      setLoading(true);
      const result = await claimTokens(actualRecipient, amount);
      setTxHash(result.hash);
      setSuccess(`Successfully claimed ${amount} ${NETWORK_CONFIG.symbol} for ${actualRecipient}`);
      setAmount('');
      
      // Update last claim time
      const newLastClaimTime = Math.floor(Date.now() / 1000);
      setLastClaim(newLastClaimTime);
      
      if (contractInfo) {
        setTimeRemaining(contractInfo.cooldownPeriod);
        
        // Update contract info to reflect new balance
        const updatedInfo = await getContractInfo();
        setContractInfo(updatedInfo);
      }
    } catch (err: any) {
      console.error('Error claiming tokens:', err);
      setError(err.message || 'Failed to claim tokens. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeRemaining = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const canClaim = account && isCorrectNetwork && (!timeRemaining || timeRemaining <= 0) && (whitelisted || !contractInfo?.admin);
  const isFaucetEmpty = contractInfo && parseFloat(contractInfo.balance) <= 0;

  return (
    <div className="bg-white rounded-lg shadow-xl p-6 md:p-8 max-w-md w-full">
      <div className="flex items-center justify-center mb-6">
        <Droplet className="h-10 w-10 text-blue-500 mr-2" />
        <h2 className="text-2xl font-bold text-gray-800">Request Test Tokens</h2>
      </div>
      
      {!isCorrectNetwork && account && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6 flex items-start">
          <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-yellow-800">Wrong Network Detected</h3>
            <p className="text-yellow-700 text-sm mt-1">
              You need to be connected to the Gravity network to use this faucet.
            </p>
            <button
              onClick={onSwitchNetwork}
              className="mt-2 px-3 py-1 bg-yellow-500 text-white text-sm font-medium rounded-md hover:bg-yellow-600 transition-colors flex items-center w-fit"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Switch to Gravity
            </button>
          </div>
        </div>
      )}
      
      {contractInfo && isCorrectNetwork && (
        <div className="bg-blue-50 rounded-md p-4 mb-6">
          <h3 className="font-medium text-blue-800 mb-2">Faucet Info</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-gray-600">Faucet Balance:</div>
            <div className="font-medium">
              {parseFloat(contractInfo.balance) > 0 ? (
                <span className="text-green-600">{contractInfo.balance} {NETWORK_CONFIG.symbol}</span>
              ) : (
                <span className="text-red-600">Empty</span>
              )}
            </div>
            
            <div className="text-gray-600">Min Amount:</div>
            <div className="font-medium">{contractInfo.minClaimAmount} {NETWORK_CONFIG.symbol}</div>
            
            <div className="text-gray-600">Max Amount:</div>
            <div className="font-medium">{contractInfo.maxClaimAmount} {NETWORK_CONFIG.symbol}</div>
            
            <div className="text-gray-600">Cooldown Period:</div>
            <div className="font-medium">{Math.floor(contractInfo.cooldownPeriod / 60)} minutes</div>
            
            <div className="text-gray-600">Whitelist Status:</div>
            <div className="font-medium">
              {whitelisted ? (
                <span className="text-green-600 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1" /> Whitelisted
                </span>
              ) : (
                <span className="text-gray-600 flex items-center">
                  <Lock className="h-4 w-4 mr-1" /> Not Whitelisted
                </span>
              )}
            </div>
          </div>
        </div>
      )}
      
      {isFaucetEmpty && isCorrectNetwork && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6 flex items-start">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-red-800">Faucet is Empty</h3>
            <p className="text-red-700 text-sm mt-1">
              The faucet has run out of funds. Please try again later when it has been refilled.
            </p>
          </div>
        </div>
      )}
      
      {!whitelisted && account && isCorrectNetwork && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6 flex items-start">
          <AlertCircle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-yellow-800">Recipient Restricted</h3>
            <p className="text-yellow-700 text-sm mt-1">
              Non-whitelisted users can only claim tokens to their own address.
            </p>
          </div>
        </div>
      )}
      
      {timeRemaining && timeRemaining > 0 && isCorrectNetwork && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6 flex items-start">
          <Clock className="h-5 w-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-yellow-800">Cooldown Period Active</h3>
            <p className="text-yellow-700 text-sm mt-1">
              You need to wait {formatTimeRemaining(timeRemaining)} before requesting again.
            </p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6 flex items-start">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6 flex items-start">
          <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-green-700">{success}</p>
            {txHash && (
              <a 
                href={`${NETWORK_CONFIG.blockExplorer}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center mt-2 text-sm"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View transaction on explorer
              </a>
            )}
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-1">
            Recipient Address
          </label>
          <div className="relative">
            <input
              type="text"
              id="recipient"
              value={recipient}
              onChange={handleRecipientChange}
              placeholder="0x..."
              className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                !whitelisted && account ? 'bg-gray-100' : ''
              }`}
              disabled={loading || (!whitelisted && account)}
            />
            {!whitelisted && account && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-gray-400" />
              </div>
            )}
          </div>
          {!whitelisted && account && (
            <p className="mt-1 text-xs text-gray-500">
              You must be whitelisted to send tokens to a different address.
            </p>
          )}
        </div>
        
        <div className="mb-6">
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
            Amount ({NETWORK_CONFIG.symbol})
          </label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={contractInfo ? `${contractInfo.minClaimAmount} - ${contractInfo.maxClaimAmount}` : "0.0"}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            min={contractInfo?.minClaimAmount || 0}
            max={contractInfo?.maxClaimAmount || 100}
            step="0.000000000000000001"
            disabled={loading}
          />
        </div>
        
        <button
          type="submit"
          disabled={loading || (!canClaim && account) || isFaucetEmpty}
          className={`w-full py-3 px-4 rounded-md font-medium text-white flex items-center justify-center
            ${canClaim && !isFaucetEmpty
              ? 'bg-blue-600 hover:bg-blue-700' 
              : !account
                ? 'bg-blue-600 hover:bg-blue-700'
                : !isCorrectNetwork
                  ? 'bg-yellow-500 hover:bg-yellow-600'
                  : 'bg-gray-400 cursor-not-allowed'}`}
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : !account ? (
            'Connect Wallet'
          ) : !isCorrectNetwork ? (
            'Switch to Gravity Network'
          ) : isFaucetEmpty ? (
            'Faucet Empty'
          ) : timeRemaining && timeRemaining > 0 ? (
            'In Cooldown'
          ) : (
            'Request Tokens'
          )}
        </button>
      </form>
    </div>
  );
};

export default FaucetForm;