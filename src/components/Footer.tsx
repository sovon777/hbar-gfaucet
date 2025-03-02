import React from 'react';
import { ExternalLink, Github } from 'lucide-react';
import { CONTRACT_ADDRESS, NETWORK_CONFIG } from '../utils/constants';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h3 className="text-xl font-bold mb-2">Gravity Faucet</h3>
            <p className="text-gray-400">Get test {NETWORK_CONFIG.symbol} tokens for development and testing</p>
          </div>
          
          <div className="flex flex-col space-y-2">
            <a 
              href={`${NETWORK_CONFIG.blockExplorer}/address/${CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center hover:text-blue-400 transition-colors"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              View Contract on Explorer
            </a>
            
            <div className="flex items-center text-gray-400">
              <span className="mr-2">Network:</span>
              <span className="bg-blue-600 px-2 py-1 rounded text-xs">{NETWORK_CONFIG.name}</span>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-4 border-t border-gray-700 text-center text-gray-400 text-sm">
          <p>© {new Date().getFullYear()} Gravity Faucet. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;