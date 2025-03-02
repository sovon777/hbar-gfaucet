import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Droplet, Settings, LogOut, AlertTriangle, RefreshCw } from 'lucide-react';
import { ADMIN_ADDRESS } from '../utils/constants';

interface HeaderProps {
  account: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  isCorrectNetwork: boolean;
  onSwitchNetwork: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  account, 
  onConnect, 
  onDisconnect, 
  isCorrectNetwork,
  onSwitchNetwork
}) => {
  const location = useLocation();
  const isAdmin = account?.toLowerCase() === ADMIN_ADDRESS.toLowerCase();

  return (
    <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center mb-4 md:mb-0">
          <Droplet className="h-8 w-8 mr-2" />
          <Link to="/" className="text-2xl font-bold">Gravity Faucet</Link>
        </div>
        
        <nav className="flex items-center space-x-4">
          <Link 
            to="/" 
            className={`px-3 py-2 rounded-md ${location.pathname === '/' ? 'bg-white/20' : 'hover:bg-white/10'}`}
          >
            Faucet
          </Link>
          
          {isAdmin && (
            <Link 
              to="/admin" 
              className={`px-3 py-2 rounded-md flex items-center ${location.pathname === '/admin' ? 'bg-white/20' : 'hover:bg-white/10'}`}
            >
              <Settings className="h-4 w-4 mr-1" />
              Admin
            </Link>
          )}
          
          {account ? (
            <div className="flex items-center space-x-2">
              {!isCorrectNetwork && (
                <button
                  onClick={onSwitchNetwork}
                  className="px-3 py-2 bg-yellow-500 text-white font-medium rounded-md hover:bg-yellow-600 transition-colors flex items-center"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Switch to Gravity
                </button>
              )}
              
              <div className="px-3 py-2 bg-white/10 rounded-md text-sm flex items-center">
                {!isCorrectNetwork && (
                  <AlertTriangle className="h-4 w-4 mr-1 text-yellow-300" />
                )}
                {`${account.substring(0, 6)}...${account.substring(account.length - 4)}`}
              </div>
              
              <button
                onClick={onDisconnect}
                className="p-2 bg-white/10 rounded-md hover:bg-white/20 transition-colors"
                title="Disconnect wallet"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button 
              onClick={onConnect}
              className="px-4 py-2 bg-white text-blue-600 font-medium rounded-md hover:bg-gray-100 transition-colors"
            >
              Connect Wallet
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;