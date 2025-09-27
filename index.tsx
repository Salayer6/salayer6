import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom/client';

// FIX: Add ethereum to the window object type for MetaMask compatibility
declare global {
    interface Window {
        ethereum?: any;
    }
}

const chains = [
    { id: 1, name: 'Ethereum', symbol: 'ETH', apiUrl: 'https://api.etherscan.io/api', explorerUrl: 'https://etherscan.io' },
    { id: 42161, name: 'Arbitrum', symbol: 'ARBETH', apiUrl: 'https://api-arbitrum.etherscan.io/api', explorerUrl: 'https://arbiscan.io' },
    { id: 10, name: 'Optimism', symbol: 'OPETH', apiUrl: 'https://api-optimism.etherscan.io/api', explorerUrl: 'https://optimistic.etherscan.io' },
    { id: 8453, name: 'Base', symbol: 'BASEETH', apiUrl: 'https://api-base.etherscan.io/api', explorerUrl: 'https://basescan.org' },
];

// --- COMPONENTS ---

const NetworkSelector = ({ selectedChain, setSelectedChain }) => (
    <div className="network-selector-wrapper">
        <select
            className="network-selector"
            value={selectedChain.id}
            onChange={(e) => {
                const newChain = chains.find(c => c.id === parseInt(e.target.value));
                if (newChain) {
                    setSelectedChain(newChain);
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


const DashboardHeader = ({ walletAddress, onLogout, selectedChain, setSelectedChain }) => (
    <header className="dashboard-header">
        <div className="logo">CryptoDash</div>
        <div className="header-controls">
            <div className="wallet-info">
                 <a href={`${selectedChain.explorerUrl}/address/${walletAddress}`} target="_blank" rel="noopener noreferrer">
                    <span>{`${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`}</span>
                </a>
            </div>
            <NetworkSelector selectedChain={selectedChain} setSelectedChain={setSelectedChain} />
            <button onClick={onLogout} className="disconnect-btn">Disconnect</button>
        </div>
    </header>
);

const BalanceCard = ({ balance, symbol, error }) => (
    <div className="card balance-card">
        <h3>Balance ({symbol})</h3>
        {error ? (
            <p className="component-error-message">{error}</p>
        ) : (
            <p>{balance !== null ? `${parseFloat(balance).toFixed(6)} ${symbol}` : '...'}</p>
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
                                <span>To: {`${tx.to.substring(0, 8)}...`}</span>
                            </div>
                            <div className="tx-value">
                                {(parseFloat(tx.value) / 1e18).toFixed(4)} {chain.symbol}
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
    const [apiKey, setApiKey] = useState('');

    const handleConnect = async () => {
        if (!apiKey) {
            alert('Please enter your Etherscan API key.');
            return;
        }
        if (typeof window.ethereum !== 'undefined') {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                if (accounts.length > 0) {
                    onLogin(accounts[0], apiKey);
                }
            } catch (error) {
                console.error("User rejected the connection request:", error);
                alert("You rejected the connection request. Please try again.");
            }
        } else {
            alert('Please install MetaMask to use this app.');
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h1>CryptoDash</h1>
                <p>Connect your wallet and enter your API key to view your dashboard.</p>
                <div className="form-group">
                    <label htmlFor="apiKey">Etherscan API Key</label>
                    <input
                        id="apiKey"
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Your Etherscan API Key"
                    />
                </div>
                <button onClick={handleConnect}>Connect with MetaMask</button>
            </div>
        </div>
    );
};

const Dashboard = ({ walletAddress, apiKey, onLogout }) => {
    const [selectedChain, setSelectedChain] = useState(chains[0]);
    const [balance, setBalance] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [globalError, setGlobalError] = useState('');
    const [componentErrors, setComponentErrors] = useState({ balance: '', transactions: '' });

    const fetchData = useCallback(async (address, chain, key) => {
        setLoading(true);
        setGlobalError('');
        setComponentErrors({ balance: '', transactions: '' });
        setBalance(null);
        setTransactions([]);

        if (!key) {
            setGlobalError('API Key is missing. Please log out and reconnect.');
            setLoading(false);
            return;
        }

        try {
            const balanceUrl = `${chain.apiUrl}?module=account&action=balance&address=${address}&tag=latest&apikey=${key}`;
            const txUrl = `${chain.apiUrl}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=${key}`;

            const [balanceResult, txResult] = await Promise.allSettled([
                fetch(balanceUrl),
                fetch(txUrl)
            ]);
            
            let newErrors = { balance: '', transactions: '' };

            // Process Balance
            if (balanceResult.status === 'fulfilled' && balanceResult.value.ok) {
                const data = await balanceResult.value.json();
                if (data.status === '1') {
                    setBalance(data.result / 1e18);
                } else {
                    newErrors.balance = data.result || data.message || 'API error fetching balance';
                }
            } else {
                newErrors.balance = 'Network error. Could not fetch balance.';
            }

            // Process Transactions
            if (txResult.status === 'fulfilled' && txResult.value.ok) {
                const data = await txResult.value.json();
                if (data.status === '1') {
                    setTransactions(data.result || []);
                } else if (data.message?.includes('No transactions found')) {
                    setTransactions([]);
                } else {
                    newErrors.transactions = data.result || data.message || 'API error fetching transactions';
                }
            } else {
                newErrors.transactions = 'Network error. Could not fetch transactions.';
            }
            
            // Set global error for critical issues, otherwise set component-level errors
            if (newErrors.balance.includes('Invalid API Key') || newErrors.transactions.includes('Invalid API Key')) {
                setGlobalError('Invalid API Key provided. Please log out and enter a valid key.');
            } else {
                setComponentErrors(newErrors);
                if (newErrors.balance) console.error("API Error (Balance):", newErrors.balance);
                if (newErrors.transactions) console.error("API Error (Transactions):", newErrors.transactions);
            }

        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (walletAddress && apiKey) {
            fetchData(walletAddress, selectedChain, apiKey);
        }
    }, [walletAddress, selectedChain, apiKey, fetchData]);

    return (
        <div className="dashboard-container">
            <DashboardHeader
                walletAddress={walletAddress}
                onLogout={onLogout}
                selectedChain={selectedChain}
                setSelectedChain={setSelectedChain}
            />
            <main>
                {loading ? (
                    <>
                        <BalanceCardSkeleton />
                        <TransactionsListSkeleton />
                    </>
                ) : globalError ? (
                    <p className="error-message">Error: {globalError}</p>
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
    const [apiKey, setApiKey] = useState('');
    
    useEffect(() => {
        const storedAddress = localStorage.getItem('walletAddress');
        const storedApiKey = localStorage.getItem('apiKey');
        if (storedAddress && storedApiKey) {
            setWalletAddress(storedAddress);
            setApiKey(storedApiKey);
        }
    }, []);


    const handleLogin = (address, key) => {
        setWalletAddress(address);
        setApiKey(key);
        localStorage.setItem('walletAddress', address);
        localStorage.setItem('apiKey', key);
    };

    const handleLogout = () => {
        setWalletAddress('');
        setApiKey('');
        localStorage.removeItem('walletAddress');
        localStorage.removeItem('apiKey');
    };

    return (
        <>
            {walletAddress && apiKey ? (
                <Dashboard walletAddress={walletAddress} apiKey={apiKey} onLogout={handleLogout} />
            ) : (
                <LoginScreen onLogin={handleLogin} />
            )}
        </>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);