import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Header from './components/Header';
import Footer from './components/Footer';
import FaucetPage from './pages/FaucetPage';
import AdminPage from './pages/AdminPage';
import { connectWallet, disconnectWallet, checkNetwork, switchToGravityNetwork } from './utils/web3';
import { ADMIN_ADDRESS } from './utils/constants';

function App() {
  const [account, setAccount] = useState<string | null>(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState<boolean>(false);

  useEffect(() => {
    // Check if wallet was previously connected
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            
            // Check if on the correct network
            const networkCheck = await checkNetwork();
            setIsCorrectNetwork(networkCheck);
          }
        } catch (error) {
          console.error('Error checking connection:', error);
        }
      }
    };

    checkConnection();

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          checkNetwork().then(setIsCorrectNetwork);
        } else {
          setAccount(null);
          setIsCorrectNetwork(false);
        }
      });
      
      // Listen for chain changes
      window.ethereum.on('chainChanged', () => {
        checkNetwork().then(setIsCorrectNetwork);
      });
    }
  }, []);

  const handleConnect = async () => {
    try {
      const connectedAccount = await connectWallet();
      setAccount(connectedAccount);
      setIsCorrectNetwork(true);
      toast.success('Wallet connected successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to connect wallet');
      console.error('Connection error:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectWallet();
      setAccount(null);
      setIsCorrectNetwork(false);
      toast.success('Wallet disconnected successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to disconnect wallet');
      console.error('Disconnection error:', error);
    }
  };

  const handleSwitchNetwork = async () => {
    try {
      await switchToGravityNetwork();
      setIsCorrectNetwork(true);
      toast.success('Successfully switched to Gravity network!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to switch network');
      console.error('Network switch error:', error);
    }
  };

  const isAdmin = account?.toLowerCase() === ADMIN_ADDRESS.toLowerCase();

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header 
          account={account} 
          onConnect={handleConnect} 
          onDisconnect={handleDisconnect}
          isCorrectNetwork={isCorrectNetwork}
          onSwitchNetwork={handleSwitchNetwork}
        />
        
        <main className="flex-grow">
          <Routes>
            <Route 
              path="/" 
              element={
                <FaucetPage 
                  account={account} 
                  onConnect={handleConnect} 
                  isCorrectNetwork={isCorrectNetwork}
                  onSwitchNetwork={handleSwitchNetwork}
                />
              } 
            />
            <Route 
              path="/admin" 
              element={
                isAdmin ? 
                <AdminPage 
                  account={account} 
                  isCorrectNetwork={isCorrectNetwork}
                  onSwitchNetwork={handleSwitchNetwork}
                /> : 
                <Navigate to="/" replace />
              } 
            />
          </Routes>
        </main>
        
        <Footer />
        
        <ToastContainer
          position="bottom-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </div>
    </Router>
  );
}

export default App;