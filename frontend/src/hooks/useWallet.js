import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { getProvider, getSigner, getContract } from '../utils/contract';
import { SEPOLIA_CHAIN_ID } from '../utils/config';

export const useWallet = () => {
  const [address, setAddress] = useState(null);
  const [network, setNetwork] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const checkConnection = useCallback(async () => {
    try {
      const provider = getProvider();
      const accounts = await provider.listAccounts();
      if (accounts.length > 0) {
        setAddress(accounts[0].address);
        const network = await provider.getNetwork();
        setNetwork(network.chainId.toString());
      }
    } catch (err) {
      console.error('Check connection error:', err);
    }
  }, []);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const signer = await getSigner();
      const address = await signer.getAddress();
      setAddress(address);
      const network = await signer.provider.getNetwork();
      setNetwork(network.chainId.toString());
    } catch (err) {
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setNetwork(null);
  }, []);

  const isSepolia = network === SEPOLIA_CHAIN_ID;

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAddress(accounts[0]);
        } else {
          setAddress(null);
        }
      });

      window.ethereum.on('chainChanged', (chainId) => {
        setNetwork(parseInt(chainId, 16).toString());
      });
    }

    checkConnection();
  }, [checkConnection]);

  return {
    address,
    network,
    isConnecting,
    error,
    connect,
    disconnect,
    isSepolia,
    isConnected: !!address,
  };
};

export const useContract = () => {
  const [contract, setContract] = useState(null);
  const [signer, setSigner] = useState(null);

  useEffect(() => {
    const initContract = async () => {
      try {
        const signer = await getSigner();
        const contract = getContract(signer);
        setContract(contract);
        setSigner(signer);
      } catch (err) {
        console.error('Contract init error:', err);
      }
    };

    if (window.ethereum) {
      initContract();
    }
  }, []);

  return { contract, signer };
};

export const useContractFunctions = (contract) => {
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState(null);

  const addDevice = async (deviceAddress, deviceType) => {
    setIsLoading(true);
    setTxHash(null);
    try {
      const nonce = await contract.nonces(deviceAddress);
      const domainSeparator = await contract.domainSeparator();
      const messageHash = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
          ['bytes32', 'address', 'bytes32', 'uint256'],
          [
            ethers.utils.keccak256(ethers.utils.toUtf8Bytes('AddDevice(address device,string deviceType,uint256 nonce)')),
            deviceAddress,
            ethers.utils.keccak256(ethers.utils.toUtf8Bytes(deviceType)),
            nonce
          ]
        )
      );
      const ethSignedHash = ethers.utils.solidityKeccak256(
        ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
        ['\x19', '\x01', domainSeparator, messageHash]
      );

      const provider = getProvider();
      const signature = await provider.getSigner().signMessage(ethers.utils.arrayify(ethSignedHash));

      const tx = await contract.addDevice(deviceAddress, deviceType, signature);
      setTxHash(tx.hash);
      await tx.wait();
      return { success: true, txHash: tx.hash };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const removeDevice = async (deviceAddress) => {
    setIsLoading(true);
    setTxHash(null);
    try {
      const tx = await contract.removeDevice(deviceAddress);
      setTxHash(tx.hash);
      await tx.wait();
      return { success: true, txHash: tx.hash };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const verifyDevice = async (deviceAddress) => {
    setIsLoading(true);
    setTxHash(null);
    try {
      const tx = await contract.verifyDevice(deviceAddress);
      setTxHash(tx.hash);
      await tx.wait();
      const isValid = await contract.isDeviceValid(deviceAddress);
      return { success: true, isValid, txHash: tx.hash };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const getAllDevices = async () => {
    try {
      const addresses = await contract.getAllDevicesEverRegistered();
      const devices = await Promise.all(
        addresses.map(async (addr) => {
          const info = await contract.getDeviceInfo(addr);
          return {
            address: addr,
            ...info,
          };
        })
      );
      return devices;
    } catch (err) {
      console.error('Get devices error:', err);
      return [];
    }
  };

  const getContractStats = async () => {
    try {
      return await contract.getContractStats();
    } catch (err) {
      console.error('Get stats error:', err);
      return [];
    }
  };

  return {
    isLoading,
    txHash,
    addDevice,
    removeDevice,
    verifyDevice,
    getAllDevices,
    getContractStats,
  };
};