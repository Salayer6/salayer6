import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom/client';

// FIX: Add ethereum to the window object type for MetaMask compatibility
declare global {
    interface Window {
        ethereum?: any;
    }
}

// --- I18N SETUP ---
const translations = {
    en: {
        // Login Screen
        loginTitle: 'CryptoDash',
        loginSubtitle: 'Connect your wallet and enter API keys to view your dashboard.',
        apiKeyExplanation: 'API Keys from block explorers (like Etherscan) are needed to fetch your transaction history. The Ethereum key is required, others are optional.',
        getApiKeyHere: 'Get your keys here.',
        getApiKeyFrom: 'Get from',
        apiKeyOptional: '(Optional)',
        connectButton: 'Connect with MetaMask',
        ethereumApiKeyRequired: 'Please enter your Etherscan API key for Ethereum.',
        mobileWalletRedirect: "It looks like you're on a mobile device. We'll try to redirect you to the MetaMask app. If you don't have it installed, you'll need to download it and set up your wallet first. Once ready, come back here and tap 'Connect'.",
        metamaskNotDetected: 'MetaMask extension not detected. Please install MetaMask to use this app.',
        // Dashboard
        headerLogo: 'CryptoDash',
        disconnect: 'Disconnect',
        viewOnExplorer: 'View address on explorer',
        selectNetwork: 'Select blockchain network',
        balanceTitle: 'Balance',
        transactionsTitle: 'Recent Transactions',
        noTransactions: 'No recent transactions found.',
        txHash: 'Hash:',
        txFrom: 'From:',
        txTo: 'To:',
        txContractCreation: 'Contract Creation',
        // Errors
        errorFetchBalance: 'Could not fetch balance from wallet.',
        errorApiKeyNeeded: (chainName) => `Please provide an API Key for ${chainName} to see transactions.`,
        errorInvalidApiKey: (chainName) => `Invalid API Key for ${chainName}. Please check your key.`,
        errorApiGeneric: (chainName) => `API error fetching ${chainName} transactions.`,
        errorNetwork: 'Network error. Could not fetch transactions.',
    },
    es: {
        // Login Screen
        loginTitle: 'CryptoDash',
        loginSubtitle: 'Conecta tu billetera e ingresa tus claves API para ver tu panel.',
        apiKeyExplanation: 'Se necesitan claves API de exploradores de bloques (como Etherscan) para obtener tu historial de transacciones. La clave de Ethereum es obligatoria, las demás son opcionales.',
        getApiKeyHere: 'Obtén tus claves aquí.',
        getApiKeyFrom: 'Obtener de',
        apiKeyOptional: '(Opcional)',
        connectButton: 'Conectar con MetaMask',
        ethereumApiKeyRequired: 'Por favor, ingresa tu clave API de Etherscan para Ethereum.',
        mobileWalletRedirect: 'Parece que estás en un móvil. Intentaremos redirigirte a la app de MetaMask. Si no la tienes, instálala y configura tu billetera primero. Cuando estés listo, vuelve y presiona "Conectar".',
        metamaskNotDetected: 'No se detectó la extensión de MetaMask. Por favor, instala MetaMask para usar esta aplicación.',
        // Dashboard
        headerLogo: 'CryptoDash',
        disconnect: 'Desconectar',
        viewOnExplorer: 'Ver dirección en el explorador',
        selectNetwork: 'Seleccionar red blockchain',
        balanceTitle: 'Saldo',
        transactionsTitle: 'Transacciones Recientes',
        noTransactions: 'No se encontraron transacciones recientes.',
        txHash: 'Hash:',
        txFrom: 'Desde:',
        txTo: 'Para:',
        txContractCreation: 'Creación de Contrato',
         // Errors
        errorFetchBalance: 'No se pudo obtener el saldo de la billetera.',
        errorApiKeyNeeded: (chainName) => `Por favor, proporciona una clave API para ${chainName} para ver las transacciones.`,
        errorInvalidApiKey: (chainName) => `Clave API inválida para ${chainName}. Por favor, revisa tu clave.`,
        errorApiGeneric: (chainName) => `Error de API al obtener transacciones de ${chainName}.`,
        errorNetwork: 'Error de red. No se pudieron obtener las transacciones.',
    }
};

const useTranslations = () => {
    // For this use case, detecting the language once is sufficient.
    const getLanguage = () => {
        const lang = (navigator.language || (navigator as any).userLanguage).split('-')[0];
        return translations[lang] ? lang : 'en'; // Default to English
    };
    return translations[getLanguage()];
};

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

const NetworkSelector = ({ selectedChain, onChainChange }) => {
    const t = useTranslations();
    return (
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
                aria-label={t.selectNetwork}
            >
                {chains.map(chain => (
                    <option key={chain.id} value={chain.id}>
                        {chain.name}
                    </option>
                ))}
            </select>
        </div>
    );
};


const DashboardHeader = ({ walletAddress, onLogout, selectedChain, onChainChange }) => {
    const t = useTranslations();
    return (
        <header className="dashboard-header">
            <div className="logo">{t.headerLogo}</div>
            <div className="wallet-network-group">
                <div className="wallet-info">
                    <a href={`${selectedChain.explorerUrl}/address/${walletAddress}`} target="_blank" rel="noopener noreferrer" aria-label={t.viewOnExplorer}>
                        <span>{`${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`}</span>
                    </a>
                </div>
                <NetworkSelector selectedChain={selectedChain} onChainChange={onChainChange} />
            </div>
            <button onClick={onLogout} className="disconnect-btn" aria-label={t.disconnect}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                    <path d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.11 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
                </svg>
                <span className="disconnect-btn-text">{t.disconnect}</span>
            </button>
        </header>
    );
};

const BalanceCard = ({ balance, symbol, error }) => {
    const t = useTranslations();
    return (
        <div className="card balance-card">
            <h3>{t.balanceTitle} ({symbol.replace('ETH', '')})</h3>
            {error ? (
                <p className="component-error-message">{error}</p>
            ) : (
                <p>{balance !== null ? `${parseFloat(balance).toFixed(6)} ${symbol.replace('ETH', '')}` : '...'}</p>
            )}
        </div>
    );
};

const TransactionsList = ({ transactions, chain, error }) => {
    const t = useTranslations();
    return (
        <div className="card transactions-card">
            <h3>{t.transactionsTitle}</h3>
            {error ? (
                <p className="component-error-message">{error}</p>
            ) : (
                <div className="transaction-list">
                    {transactions.length > 0 ? (
                        transactions.map(tx => (
                            <div key={tx.hash} className="transaction-item">
                                <div className="tx-hash">
                                    <span>{t.txHash}</span>
                                    <a href={`${chain.explorerUrl}/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer">
                                        {`${tx.hash.substring(0, 10)}...`}
                                    </a>
                                </div>
                                <div className="tx-details">
                                    <span>{t.txFrom} {`${tx.from.substring(0, 8)}...`}</span>
                                    <span>{t.txTo} {`${tx.to ? tx.to.substring(0, 8) : t.txContractCreation}...`}</span>
                                </div>
                                <div className="tx-value">
                                    {(parseFloat(tx.value) / 1e18).toFixed(4)} {chain.symbol.replace('ETH', '')}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>{t.noTransactions}</p>
                    )}
                </div>
            )}
        </div>
    );
};

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
    const t = useTranslations();
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
            alert(t.ethereumApiKeyRequired);
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
                alert(t.mobileWalletRedirect);
                const dappUrl = window.location.href.replace(/https?:\/\//, '');
                const metamaskDeepLink = `https://metamask.app.link/dapp/${dappUrl}`;
                window.location.href = metamaskDeepLink;
            } else {
                alert(t.metamaskNotDetected);
            }
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h1>{t.loginTitle}</h1>
                <p>{t.loginSubtitle}</p>
                <p className="explanation-text">
                    {t.apiKeyExplanation} <a href="https://etherscan.io/myapikey" target="_blank" rel="noopener noreferrer">{t.getApiKeyHere}</a>
                </p>
                {chains.map(chain => (
                    <div className="form-group" key={chain.id}>
                        <label htmlFor={`apiKey-${chain.apiKeyName}`}>
                            {chain.name} API Key {chain.name !== 'Ethereum' ? t.apiKeyOptional : ''}
                        </label>
                        <input
                            id={`apiKey-${chain.apiKeyName}`}
                            type="password"
                            value={apiKeys[chain.apiKeyName]}
                            onChange={(e) => handleInputChange(chain.apiKeyName, e.target.value)}
                            placeholder={`Your ${chain.name} API Key`}
                        />
                        <small className="api-key-helper">
                            {t.getApiKeyFrom} <a href={`${chain.explorerUrl.replace(/\/$/, '')}/myapikey`} target="_blank" rel="noopener noreferrer">{chain.explorerUrl.replace('https://', '').split('/')[0]}</a>
                        </small>
                    </div>
                ))}
                <button onClick={handleConnect}>{t.connectButton}</button>
            </div>
        </div>
    );
};

const Dashboard = ({ walletAddress, apiKeys, onLogout }) => {
    const t = useTranslations();
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
            newErrors.balance = t.errorFetchBalance;
        }

        // 2. Fetch Transactions using Etherscan API via Proxy
        const chainApiKey = keys[chain.apiKeyName];
        if (!chainApiKey) {
             newErrors.transactions = t.errorApiKeyNeeded(chain.name);
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
                        newErrors.transactions = t.errorInvalidApiKey(chain.name);
                    } else {
                        newErrors.transactions = data.result || data.message || t.errorApiGeneric(chain.name);
                    }
                }
            } catch (error) {
                console.error("Transactions fetch failed:", error);
                newErrors.transactions = t.errorNetwork;
            }
        }
        
        setComponentErrors(newErrors);
        setLoading(false);

    }, [t]);

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