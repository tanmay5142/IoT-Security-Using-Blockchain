import { ethers } from 'ethers';
import { CONTRACT_ADDRESS } from './config';
import abi from './abi.json';

export const getContract = (signerOrProvider) => {
  return new ethers.Contract(CONTRACT_ADDRESS, abi, signerOrProvider);
};

export const getProvider = () => {
  return new ethers.providers.Web3Provider(window.ethereum);
};

export const getSigner = async () => {
  const provider = getProvider();
  await provider.send('eth_requestAccounts', []);
  return provider.getSigner();
};

export const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  return new Date(timestamp * 1000).toLocaleString();
};

export const getExplorerLink = (txHash) => {
  return `https://sepolia.etherscan.io/tx/${txHash}`;
};