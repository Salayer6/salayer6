import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom/client';

// FIX: Add ethereum to the window object type for MetaMask compatibility
declare global {
    interface Window {
        ethereum?: any;
    }
}

const chains = [
    { id: 1, name: 'Ethereum', symbol: 'ETH', apiUrl: 'https://api.etherscan.io/api', explorerUrl: 'https://etherscan.io', chainIdHex: '0x1', apiKeyName: 'ethereum' },
    { id: 42161, name: 'Arbitrum', symbol: 'ARBETH', apiUrl: 'https://api-arbitrum.etherscan.io/api', explorerUrl: 'https://arbiscan.io', chainIdHex: '0xa4b1', apiKeyName: 'arbitrum' },
    { id: 10, name: 'Optimism', symbol: 'OPETH', apiUrl: 'https://api-optimism.etherscan.io/api', explorerUrl: 'https://optimistic.etherscan.io', chainIdHex: '0xa', apiKeyName: 'optimism' },
    { id: 8453, name: 'Base', symbol: 'BASEETH', apiUrl: 'https://api-base.etherscan.io/api', explorerUrl: 'https://basescan.org', chainIdHex: '0x2105', apiKeyName: 'base' },
];

// --- HELPERS ---
const isMobileDevice = () => {
    // Standard check for most mobile devices
    if (/Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        return true;
    }
    // Special check for iPad on iOS 13+ which reports as a Mac
    if (/Macintosh/i.test(navigator.userAgent) && 'ontouchend' in document) {
        return true;
    }
    return false;
};


// --- COMPONENTS ---

const NetworkSelector = ({ selectedChain, onChainChange }) => (
    <div className="network-selector-wrapper">
        <select
            className="network-selector"
            value={selectedChain.id}
            onChange={(e) => {
                const newChain = chains.find(c => c.id === parseInt(e.target.value));
                if (newChain) {
                    onChainChange(newChain);
                }
            }}
            aria-label="Select blockchain network"
        >
            {chains.map(chain => (
                <option key={chain.id} value={chain.id}>
                    {chain.name}
                </option>
            ))}
        </select>
    </div>
);


const DashboardHeader = ({ walletAddress, onLogout, selectedChain, onChainChange }) => (
    <header className="dashboard-header">
        <div className="logo">CryptoDash</div>
        <div className="wallet-network-group">
            <div className="wallet-info">
                <a href={`${selectedChain.explorerUrl}/address/${walletAddress}`} target="_blank" rel="noopener noreferrer" aria-label="View address on explorer">
                    <span>{`${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`}</span>
                </a>
            </div>
            <NetworkSelector selectedChain={selectedChain} onChainChange={onChainChange} />
        </div>
        <button onClick={onLogout} className="disconnect-btn" aria-label="Disconnect wallet">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.11 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
            </svg>
            <span className="disconnect-btn-text">Disconnect</span>
        </button>
    </header>
);

const BalanceCard = ({ balance, symbol, error }) => (
    <div className="card balance-card">
        <h3>Balance ({symbol.replace('ETH', '')})</h3>
        {error ? (
            <p className="component-error-message">{error}</p>
        ) : (
            <p>{balance !== null ? `${parseFloat(balance).toFixed(6)} ${symbol.replace('ETH', '')}` : '...'}</p>
        )}
    </div>
);

const TransactionsList = ({ transactions, chain, error }) => (
    <div className="card transactions-card">
        <h3>Recent Transactions</h3>
        {error ? (
            <p className="component-error-message">{error}</p>
        ) : (
            <div className="transaction-list">
                {transactions.length > 0 ? (
                    transactions.map(tx => (
                        <div key={tx.hash} className="transaction-item">
                            <div className="tx-hash">
                                <span>Hash:</span>
                                <a href={`${chain.explorerUrl}/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer">
                                    {`${tx.hash.substring(0, 10)}...`}
                                </a>
                            </div>
                            <div className="tx-details">
                                <span>From: {`${tx.from.substring(0, 8)}...`}</span>
                                <span>To: {`${tx.to ? tx.to.substring(0, 8) : 'Contract Creation'}...`}</span>
                            </div>
                            <div className="tx-value">
                                {(parseFloat(tx.value) / 1e18).toFixed(4)} {chain.symbol.replace('ETH', '')}
                            </div>
                        </div>
                    ))
                ) : (
                    <p>No recent transactions found.</p>
                )}
            </div>
        )}
    </div>
);

// --- SKELETON LOADER COMPONENTS ---
const SkeletonBlock = ({ className = '' }) => <div className={`skeleton ${className}`}></div>;

const BalanceCardSkeleton = () => (
    <div className="card balance-card">
        <SkeletonBlock className="skeleton-h3" />
        <SkeletonBlock className="skeleton-p" />
    </div>
);

const TransactionsListSkeleton = () => (
    <div className="card transactions-card">
        <SkeletonBlock className="skeleton-h3" />
        <div className="transaction-list">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="transaction-item-skeleton">
                    <div className="skeleton-group">
                        <SkeletonBlock className="skeleton-text" />
                        <SkeletonBlock className="skeleton-text-short" />
                    </div>
                     <div className="skeleton-group" style={{alignItems: 'center'}}>
                        <SkeletonBlock className="skeleton-text" />
                        <SkeletonBlock className="skeleton-text-short" />
                    </div>
                    <SkeletonBlock className="skeleton-text" />
                </div>
            ))}
        </div>
    </div>
);

const LoginScreen = ({ onLogin }) => {
    const [apiKeys, setApiKeys] = useState({
        ethereum: '',
        arbitrum: '',
        optimism: '',
        base: ''
    });

    const handleInputChange = (chainName, value) => {
        setApiKeys(prev => ({ ...prev, [chainName]: value }));
    };

    const handleConnect = async () => {
        if (!apiKeys.ethereum) {
            alert('Please enter your Etherscan API key for Ethereum.');
            return;
        }
        if (typeof window.ethereum !== 'undefined') {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                if (accounts.length > 0) {
                    onLogin(accounts[0], apiKeys);
                }
            } catch (error) {
                console.error("User rejected the connection request:", error);
            }
        } else {
            if (isMobileDevice()) {
                // On mobile/tablet, user is likely in a standard browser.
                // Guide them to open the dApp in their wallet's browser via deep link.
                alert("Wallet not detected. Please open this page in the MetaMask app's browser. Tapping 'OK' will attempt to redirect you.");
                const dappUrl = window.location.href.replace(/https?:\/\//, '');
                const metamaskDeepLink = `https://metamask.app.link/dapp/${dappUrl}`;
                window.location.href = metamaskDeepLink;
            } else {
                // On desktop, the user needs to install a wallet extension.
                alert('MetaMask extension not detected. Please install MetaMask to use this app.');
            }
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h1>CryptoDash</h1>
                <p>Connect your wallet and enter your API keys to view your dashboard.</p>
                {chains.map(chain => (
                    <div className="form-group" key={chain.id}>
                        <label htmlFor={`apiKey-${chain.apiKeyName}`}>
                            {chain.name} API Key {chain.name === 'Ethereum' ? '' : '(Optional)'}
                        </label>
                        <input
                            id={`apiKey-${chain.apiKeyName}`}
                            type="password"
                            value={apiKeys[chain.apiKeyName]}
                            onChange={(e) => handleInputChange(chain.apiKeyName, e.target.value)}
                            placeholder={`Your ${chain.name} API Key`}
                        />
                    </div>
                ))}
                <button onClick={handleConnect}>Connect with MetaMask</button>
            </div>
        </div>
    );
};

const Dashboard = ({ walletAddress, apiKeys, onLogout }) => {
    const [selectedChain, setSelectedChain] = useState(chains[0]);
    const [balance, setBalance] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [componentErrors, setComponentErrors] = useState({ balance: '', transactions: '' });

    const switchNetwork = useCallback(async (chain) => {
        if (!window.ethereum) return false;
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: chain.chainIdHex }],
            });
            return true;
        } catch (switchError) {
            console.error("Could not switch network:", switchError);
            alert(`Could not switch to ${chain.name}. Please make sure the network is added to your MetaMask wallet.`);
            return false;
        }
    }, []);

    const handleNetworkChange = useCallback(async (newChain) => {
        const success = await switchNetwork(newChain);
        if (success) {
            setSelectedChain(newChain);
        }
    }, [switchNetwork]);

    const fetchData = useCallback(async (address, chain, keys) => {
        setLoading(true);
        setComponentErrors({ balance: '', transactions: '' });
        setBalance(null);
        setTransactions([]);
        
        let newErrors = { balance: '', transactions: '' };

        // 1. Fetch Balance using MetaMask RPC (more reliable)
        try {
            const hexBalance = await window.ethereum.request({
                method: 'eth_getBalance',
                params: [address, 'latest'],
            });
            const weiBalance = parseInt(hexBalance, 16);
            setBalance(weiBalance / 1e18);
        } catch (error) {
            console.error("Failed to fetch balance via RPC:", error);
            newErrors.balance = 'Could not fetch balance from wallet.';
        }

        // 2. Fetch Transactions using Etherscan API via Proxy
        const chainApiKey = keys[chain.apiKeyName];
        if (!chainApiKey) {
             newErrors.transactions = `Please provide an API Key for ${chain.name} to see transactions.`;
        } else {
            try {
                const PROXY_URL = 'https://corsproxy.io/?';
                const txUrl = `${chain.apiUrl}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=${chainApiKey}`;
                const proxiedTxUrl = `${PROXY_URL}${encodeURIComponent(txUrl)}`;

                const response = await fetch(proxiedTxUrl);
                if (!response.ok) {
                    throw new Error(`Network response was not ok: ${response.statusText}`);
                }
                
                const data = await response.json();
                if (data.status === '1') {
                    setTransactions(data.result || []);
                } else if (data.message?.includes('No transactions found')) {
                    setTransactions([]);
                } else {
                    if (data.result?.includes('Invalid API Key') || data.message?.includes('Invalid API Key')) {
                        newErrors.transactions = `Invalid API Key for ${chain.name}. Please check your key.`;
                    } else {
                        newErrors.transactions = data.result || data.message || `API error fetching ${chain.name} transactions.`;
                    }
                }
            } catch (error) {
                console.error("Transactions fetch failed:", error);
                newErrors.transactions = 'Network error. Could not fetch transactions.';
            }
        }
        
        setComponentErrors(newErrors);
        setLoading(false);

    }, []);

    useEffect(() => {
        if (walletAddress) {
            fetchData(walletAddress, selectedChain, apiKeys);
        }
    }, [walletAddress, selectedChain, apiKeys, fetchData]);
    
    useEffect(() => {
        const handleChainChanged = (chainId) => {
            const newChain = chains.find(c => c.chainIdHex.toLowerCase() === chainId.toLowerCase());
            if (newChain && newChain.id !== selectedChain.id) {
                setSelectedChain(newChain);
            }
        };
        
        if (window.ethereum) {
            window.ethereum.on('chainChanged', handleChainChanged);
        }

        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('chainChanged', handleChainChanged);
            }
        };
    }, [selectedChain.id]);

    return (
        <div className="dashboard-container">
            <DashboardHeader
                walletAddress={walletAddress}
                onLogout={onLogout}
                selectedChain={selectedChain}
                onChainChange={handleNetworkChange}
            />
            <main>
                {loading ? (
                    <>
                        <BalanceCardSkeleton />
                        <TransactionsListSkeleton />
                    </>
                ) : (
                    <>
                        <BalanceCard balance={balance} symbol={selectedChain.symbol} error={componentErrors.balance} />
                        <TransactionsList transactions={transactions} chain={selectedChain} error={componentErrors.transactions} />
                    </>
                )}
            </main>
        </div>
    );
};

const App = () => {
    const [walletAddress, setWalletAddress] = useState('');
    const [apiKeys, setApiKeys] = useState(null);
    
    useEffect(() => {
        const storedAddress = localStorage.getItem('walletAddress');
        const storedApiKeys = localStorage.getItem('apiKeys');
        if (storedAddress && storedApiKeys) {
            setWalletAddress(storedAddress);
            setApiKeys(JSON.parse(storedApiKeys));
        }
    }, []);

    const handleLogin = (address, keys) => {
        setWalletAddress(address);
        setApiKeys(keys);
        localStorage.setItem('walletAddress', address);
        localStorage.setItem('apiKeys', JSON.stringify(keys));
    };

    const handleLogout = () => {
        setWalletAddress('');
        setApiKeys(null);
        localStorage.removeItem('walletAddress');
        localStorage.removeItem('apiKeys');
    };

    return (
        <>
            {walletAddress && apiKeys ? (
                <Dashboard walletAddress={walletAddress} apiKeys={apiKeys} onLogout={handleLogout} />
            ) : (
                <LoginScreen onLogin={handleLogin} />
            )}
        </>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);