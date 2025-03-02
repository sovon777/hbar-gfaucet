import React from 'react';
import FaucetForm from '../components/FaucetForm';

interface FaucetPageProps {
  account: string | null;
  onConnect: () => void;
  isCorrectNetwork: boolean;
  onSwitchNetwork: () => void;
}

const FaucetPage: React.FC<FaucetPageProps> = ({ 
  account, 
  onConnect, 
  isCorrectNetwork,
  onSwitchNetwork
}) => {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Gravity Faucet
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
           $G token HBAR, RETROACTIVE
          </p>
        </div>
        
        <div className="flex justify-center">
          <FaucetForm 
            account={account} 
            onConnect={onConnect} 
            isCorrectNetwork={isCorrectNetwork}
            onSwitchNetwork={onSwitchNetwork}
          />
        </div>
      </div>
    </div>
  );
};

export default FaucetPage;