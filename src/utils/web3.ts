import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI, NETWORK_CONFIG } from './constants';

export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed. Please install it to use this app.');
  }

  try {
    // Request account access
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    // Check if connected to the correct network
    await switchToGravityNetwork();
    
    return accounts[0];
  } catch (error) {
    console.error('Error connecting to wallet:', error);
    throw error;
  }
}

export async function disconnectWallet() {
  // Note: There is no direct method to disconnect in MetaMask via JavaScript
  // This is a workaround to clear the local connection state
  localStorage.removeItem('walletConnected');
  
  // Return true to indicate the UI should update
  return true;
}

export async function switchToGravityNetwork() {
  if (!window.ethereum) return;

  try {
    // Try to switch to the Gravity Network
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${NETWORK_CONFIG.chainId.toString(16)}` }],
    });
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${NETWORK_CONFIG.chainId.toString(16)}`,
              chainName: NETWORK_CONFIG.name,
              nativeCurrency: {
                name: NETWORK_CONFIG.symbol,
                symbol: NETWORK_CONFIG.symbol,
                decimals: 18,
              },
              rpcUrls: [NETWORK_CONFIG.rpcUrl],
              blockExplorerUrls: [NETWORK_CONFIG.blockExplorer],
            },
          ],
        });
      } catch (addError) {
        console.error('Error adding Gravity network:', addError);
        throw addError;
      }
    } else {
      console.error('Error switching to Gravity network:', switchError);
      throw switchError;
    }
  }
}

export async function checkNetwork() {
  if (!window.ethereum) return false;
  
  try {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    return chainId === `0x${NETWORK_CONFIG.chainId.toString(16)}`;
  } catch (error) {
    console.error('Error checking network:', error);
    return false;
  }
}

export function getContract(provider: ethers.Provider | ethers.Signer) {
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}

export async function getContractInfo() {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const contract = getContract(provider);

  try {
    // Get contract balance first
    const balance = await provider.getBalance(CONTRACT_ADDRESS);
    
    // Try to get contract data with proper error handling
    let minClaimAmount, maxClaimAmount, cooldownPeriod, admin;
    
    try {
      minClaimAmount = await contract.minClaimAmount();
    } catch (error) {
      console.warn("Could not fetch minClaimAmount:", error);
      minClaimAmount = ethers.parseEther("0.1"); // Default fallback
    }
    
    try {
      maxClaimAmount = await contract.maxClaimAmount();
    } catch (error) {
      console.warn("Could not fetch maxClaimAmount:", error);
      maxClaimAmount = ethers.parseEther("1.0"); // Default fallback
    }
    
    try {
      cooldownPeriod = await contract.cooldownPeriod();
    } catch (error) {
      console.warn("Could not fetch cooldownPeriod:", error);
      cooldownPeriod = 3600; // Default fallback: 1 hour
    }
    
    try {
      admin = await contract.admin();
    } catch (error) {
      console.warn("Could not fetch admin:", error);
      admin = NETWORK_CONFIG.adminAddress || CONTRACT_ADDRESS; // Default fallback
    }

    return {
      balance: ethers.formatEther(balance),
      minClaimAmount: ethers.formatEther(minClaimAmount),
      maxClaimAmount: ethers.formatEther(maxClaimAmount),
      cooldownPeriod: Number(cooldownPeriod),
      admin: admin
    };
  } catch (error) {
    console.error('Error fetching contract info:', error);
    // Return default values if we can't fetch from contract
    return {
      balance: "0.0",
      minClaimAmount: "0.1",
      maxClaimAmount: "1.0",
      cooldownPeriod: 3600, // 1 hour
      admin: NETWORK_CONFIG.adminAddress || CONTRACT_ADDRESS
    };
  }
}

export async function getLastClaimTime(address: string) {
  if (!window.ethereum || !address) return null;

  const provider = new ethers.BrowserProvider(window.ethereum);
  const contract = getContract(provider);

  try {
    const lastClaimTime = await contract.lastClaimTime(address);
    return Number(lastClaimTime);
  } catch (error) {
    console.error('Error fetching last claim time:', error);
    return null;
  }
}

export async function isWhitelisted(address: string) {
  if (!window.ethereum || !address) return false;

  const provider = new ethers.BrowserProvider(window.ethereum);
  const contract = getContract(provider);

  try {
    return await contract.whitelist(address);
  } catch (error) {
    console.error('Error checking whitelist status:', error);
    return false;
  }
}

export async function claimTokens(recipient: string, amount: string) {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  // Check if on the correct network and switch if needed
  const isCorrectNetwork = await checkNetwork();
  if (!isCorrectNetwork) {
    await switchToGravityNetwork();
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = getContract(signer);

  try {
    const amountInWei = ethers.parseEther(amount);
    const tx = await contract.claim(recipient, amountInWei);
    const receipt = await tx.wait();
    return {
      hash: tx.hash,
      receipt: receipt
    };
  } catch (error) {
    console.error('Error claiming tokens:', error);
    throw error;
  }
}

// Admin functions
export async function addToWhitelist(addresses: string[]) {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  // Check if on the correct network and switch if needed
  const isCorrectNetwork = await checkNetwork();
  if (!isCorrectNetwork) {
    await switchToGravityNetwork();
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = getContract(signer);

  try {
    const tx = await contract.addToWhitelist(addresses);
    return await tx.wait();
  } catch (error) {
    console.error('Error adding to whitelist:', error);
    throw error;
  }
}

export async function removeFromWhitelist(addresses: string[]) {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  // Check if on the correct network and switch if needed
  const isCorrectNetwork = await checkNetwork();
  if (!isCorrectNetwork) {
    await switchToGravityNetwork();
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = getContract(signer);

  try {
    const tx = await contract.removeFromWhitelist(addresses);
    return await tx.wait();
  } catch (error) {
    console.error('Error removing from whitelist:', error);
    throw error;
  }
}

export async function setClaimAmounts(minAmount: string, maxAmount: string) {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  // Check if on the correct network and switch if needed
  const isCorrectNetwork = await checkNetwork();
  if (!isCorrectNetwork) {
    await switchToGravityNetwork();
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = getContract(signer);

  try {
    const minAmountInWei = ethers.parseEther(minAmount);
    const maxAmountInWei = ethers.parseEther(maxAmount);
    const tx = await contract.setClaimAmounts(minAmountInWei, maxAmountInWei);
    return await tx.wait();
  } catch (error) {
    console.error('Error setting claim amounts:', error);
    throw error;
  }
}

export async function setCooldownPeriod(periodInSeconds: number) {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  // Check if on the correct network and switch if needed
  const isCorrectNetwork = await checkNetwork();
  if (!isCorrectNetwork) {
    await switchToGravityNetwork();
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = getContract(signer);

  try {
    const tx = await contract.setCooldownPeriod(periodInSeconds);
    return await tx.wait();
  } catch (error) {
    console.error('Error setting cooldown period:', error);
    throw error;
  }
}

export async function withdrawFunds(amount: string) {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  // Check if on the correct network and switch if needed
  const isCorrectNetwork = await checkNetwork();
  if (!isCorrectNetwork) {
    await switchToGravityNetwork();
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = getContract(signer);

  try {
    const amountInWei = ethers.parseEther(amount);
    const tx = await contract.withdraw(amountInWei);
    return await tx.wait();
  } catch (error) {
    console.error('Error withdrawing funds:', error);
    throw error;
  }
}

// Add type definitions for window.ethereum
declare global {
  interface Window {
    ethereum: any;
  }
}