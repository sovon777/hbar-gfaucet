import React from 'react';
import AdminPanel from '../components/AdminPanel';

interface AdminPageProps {
  account: string | null;
  isCorrectNetwork: boolean;
  onSwitchNetwork: () => void;
}

const AdminPage: React.FC<AdminPageProps> = ({ 
  account,
  isCorrectNetwork,
  onSwitchNetwork
}) => {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Admin Dashboard
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Manage faucet settings, whitelist, and funds
          </p>
        </div>
        
        <div className="flex justify-center">
          <AdminPanel 
            account={account} 
            isCorrectNetwork={isCorrectNetwork}
            onSwitchNetwork={onSwitchNetwork}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminPage;