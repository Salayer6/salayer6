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
    { id: 42161, name: 'Arbitrum', symbol: 'ARBETH', apiUrl: 'https://api.arbiscan.io/api', explorerUrl: 'https://arbiscan.io' },
    { id: 10, name: 'Optimism', symbol: 'OPETH', apiUrl: 'https://api-optimistic.etherscan.io/api', explorerUrl: 'https://optimistic.etherscan.io' },
    { id: 8453, name: 'Base', symbol: 'BASEETH', apiUrl: 'https://api.basescan.org/api', explorerUrl: 'https://basescan.org' },
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
                <span>{`${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`}</span>
            </div>
            <NetworkSelector selectedChain={selectedChain} setSelectedChain={setSelectedChain} />
            <button onClick={onLogout} className="disconnect-btn">Disconnect</button>
        </div>
    </header>
);

const BalanceCard = ({ balance, symbol }) => (
    <div className="card balance-card">
        <h3>Balance ({symbol})</h3>
        <p>{balance !== null ? `${parseFloat(balance).toFixed(6)} ${symbol}` : 'Loading...'}</p>
    </div>
);

const TransactionsList = ({ transactions, chain }) => (
    <div className="card transactions-card">
        <h3>Recent Transactions</h3>
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
    </div>
);

const LoginScreen = ({ onLogin }) => {
    const handleConnect = async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                if (accounts.length > 0) {
                    onLogin(accounts[0]);
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
                <p>Connect your wallet to view your dashboard.</p>
                <button onClick={handleConnect}>Connect with MetaMask</button>
            </div>
        </div>
    );
};

const Dashboard = ({ walletAddress, onLogout }) => {
    const [selectedChain, setSelectedChain] = useState(chains[0]);
    const [balance, setBalance] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchData = useCallback(async (address, chain) => {
        setLoading(true);
        setError('');
        setBalance(null);
        setTransactions([]);

        try {
            const balanceUrl = `${chain.apiUrl}?module=account&action=balance&address=${address}&tag=latest`;
            const txUrl = `${chain.apiUrl}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc`;
            
            const [balanceResponse, txResponse] = await Promise.all([
                fetch(balanceUrl),
                fetch(txUrl)
            ]);

            if (!balanceResponse.ok || !txResponse.ok) {
                throw new Error('Network response was not ok');
            }

            const balanceData = await balanceResponse.json();
            const txData = await txResponse.json();

            if (balanceData.status === '1' && txData.status === '1') {
                setBalance(balanceData.result / 1e18);
                setTransactions(txData.result);
            } else {
                let errorMessage = '';
                if(balanceData.message !== 'OK') errorMessage += `Balance: ${balanceData.result || balanceData.message}. `;
                if(txData.message !== 'OK') errorMessage += `Transactions: ${txData.result || txData.message}.`;
                throw new Error(errorMessage.trim() || 'Failed to fetch data from API. Public endpoints may be rate-limited.');
            }

        } catch (e) {
            console.error("Error fetching data:", e);
            setError(e.message.includes('rate limit') ? 'API rate limit reached. Please wait a moment and try again.' : `Failed to fetch data: ${e.message}`);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (walletAddress) {
            fetchData(walletAddress, selectedChain);
        }
    }, [walletAddress, selectedChain, fetchData]);

    return (
        <div className="dashboard-container">
            <DashboardHeader
                walletAddress={walletAddress}
                onLogout={onLogout}
                selectedChain={selectedChain}
                setSelectedChain={setSelectedChain}
            />
            <main>
                {loading && <p className="loading-message">Loading dashboard...</p>}
                {error && <p className="error-message">Error: {error}</p>}
                {!loading && !error && (
                    <>
                        <BalanceCard balance={balance} symbol={selectedChain.symbol} />
                        <TransactionsList transactions={transactions} chain={selectedChain} />
                    </>
                )}
            </main>
        </div>
    );
};


const App = () => {
    const [walletAddress, setWalletAddress] = useState('');
    
    useEffect(() => {
        const storedAddress = localStorage.getItem('walletAddress');
        if (storedAddress) {
            setWalletAddress(storedAddress);
        }
    }, []);


    const handleLogin = (address) => {
        setWalletAddress(address);
        localStorage.setItem('walletAddress', address);
    };

    const handleLogout = () => {
        setWalletAddress('');
        localStorage.removeItem('walletAddress');
    };

    return (
        <>
            {walletAddress ? (
                <Dashboard walletAddress={walletAddress} onLogout={handleLogout} />
            ) : (
                <LoginScreen onLogin={handleLogin} />
            )}
        </>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
