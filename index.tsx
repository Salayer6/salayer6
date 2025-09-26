import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

// --- Tipos de Datos ---
interface Token {
  symbol: string;
  name: string;
  balance: number;
  usdValue: number;
}

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timeStamp: string;
}

declare global {
    interface Window {
        ethereum?: any;
    }
}

// --- Componentes de la UI ---

const Spinner = () => <div className="spinner"></div>;

const LoadingScreen = ({ message }: { message: string }) => (
  <div className="loading-container">
    <Spinner />
    <p>{message}</p>
  </div>
);

const ErrorDisplay = ({ message }: { message: string }) => (
    <div className="error-container">
        <p className="error-message">{message}</p>
    </div>
);

const LoginScreen = ({ onConnect, error }: { onConnect: () => void; error: string | null }) => (
  <div className="login-container">
    <h1>CryptoDash</h1>
    <p>Tu panel de control personal para rastrear y analizar tus activos de criptomonedas. Conéctate con MetaMask para empezar.</p>
    <button onClick={onConnect} className="btn btn-primary" aria-label="Conectar con MetaMask">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.53331 5.30931L12 9.74931L16.4666 5.30931L21.411 7.42431L12 16.2503L2.58997 7.42431L7.53331 5.30931Z" fill="white"/><path d="M12 2.5L2.58902 7.424L7.53302 5.309L12 9.749L16.467 5.309L21.411 7.424L12 2.5Z" fill="white"/></svg>
      Conectar Billetera
    </button>
    {error && <ErrorDisplay message={error} />}
  </div>
);

const ApiKeyInputScreen = ({ onSave, currentKey }: { onSave: (key: string) => void; currentKey: string | null }) => {
    const [inputKey, setInputKey] = useState(currentKey || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputKey.trim()) {
            onSave(inputKey.trim());
        }
    };

    return (
        <div className="login-container">
            <h1>Configuración Requerida</h1>
            <p>Por favor, proporciona tu clave API de Etherscan para obtener los datos de la blockchain.</p>
            <form onSubmit={handleSubmit} className="api-key-form">
                <input
                    type="password"
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    placeholder="Pega tu clave API de Etherscan aquí"
                    className="api-key-input"
                    aria-label="Clave API de Etherscan"
                    required
                />
                <button type="submit" className="btn btn-primary">Guardar y Continuar</button>
            </form>
            <p className="api-key-note">Tu clave API se guardará localmente en tu navegador. Puedes obtener una gratis en <a href="https://etherscan.io/myapikey" target="_blank" rel="noopener noreferrer">Etherscan</a>.</p>
        </div>
    );
};


const DashboardHeader = ({ account, onDisconnect, onChangeApiKey }: { account: string; onDisconnect: () => void; onChangeApiKey: () => void; }) => {
    const formattedAccount = `${account.substring(0, 6)}...${account.substring(account.length - 4)}`;
    return (
        <header className="dashboard-header">
            <div className="wallet-info" aria-label={`Cuenta conectada: ${account}`}>{formattedAccount}</div>
            <div className="header-actions">
              <button onClick={onChangeApiKey} className="btn btn-secondary">Cambiar Clave API</button>
              <button onClick={onDisconnect} className="btn btn-secondary">Desconectar</button>
            </div>
        </header>
    );
};

const SummaryCard = ({ title, value }: { title: string; value: string | number; }) => (
    <div className="card">
        <h3 className="card-title">{title}</h3>
        <p className="card-value">{value}</p>
    </div>
);

// --- Funciones de Utilidad ---
const formatBalance = (wei: string): string => {
    const ether = parseFloat(wei) / 1e18;
    return ether.toFixed(4);
};

const formatDate = (timestamp: string): string => {
    return new Date(parseInt(timestamp) * 1000).toLocaleDateString();
};

// --- Componente Principal de la Aplicación ---

const App = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingMessage, setLoadingMessage] = useState<string>('Inicializando...');
  const [account, setAccount] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [showApiKeyScreen, setShowApiKeyScreen] = useState<boolean>(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Datos simulados para tokens
  const mockTokens: Token[] = [
    { symbol: 'USDT', name: 'Tether', balance: 2450.50, usdValue: 2450.50 },
    { symbol: 'LINK', name: 'Chainlink', balance: 120.75, usdValue: 1811.25 },
    { symbol: 'UNI', name: 'Uniswap', balance: 35.20, usdValue: 352.00 },
  ];

  const fetchData = useCallback(async (walletAddress: string, key: string) => {
    if (!key) {
        setError("La clave API de Etherscan no está configurada.");
        setIsLoading(false);
        return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
        setLoadingMessage('Obteniendo datos de la blockchain...');
        const network = 'mainnet';
        
        const balanceResponse = await fetch(`https://api.etherscan.io/api?module=account&action=balance&address=${walletAddress}&tag=latest&apikey=${key}`);
        const balanceData = await balanceResponse.json();
        if (balanceData.status === '1') {
            setBalance(formatBalance(balanceData.result));
        } else {
            throw new Error(balanceData.message || 'No se pudo obtener el saldo.');
        }

        const txResponse = await fetch(`https://api.etherscan.io/api?module=account&action=txlist&address=${walletAddress}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=${key}`);
        const txData = await txResponse.json();
         if (txData.status === '1') {
            setTransactions(txData.result);
        } else {
            if (txData.message === 'No transactions found') {
                setTransactions([]);
            } else {
                throw new Error(txData.message || 'No se pudieron obtener las transacciones.');
            }
        }
    } catch (err: any) {
        console.error("Error al obtener datos:", err);
        const errorMessage = err.message.includes("Invalid API Key")
            ? "Clave API de Etherscan inválida. Por favor, verifica tu clave."
            : `Error al obtener datos: ${err.message}.`;
        setError(errorMessage);
    } finally {
        setIsLoading(false);
    }
  }, []);

  const handleAccountsChanged = useCallback((accounts: string[]) => {
      if (accounts.length === 0) {
          setAccount(null);
          setBalance(null);
          setTransactions([]);
      } else if (accounts[0] !== account) {
          const newAccount = accounts[0];
          setAccount(newAccount);
          if (apiKey) {
            fetchData(newAccount, apiKey);
          }
      }
  }, [account, apiKey, fetchData]);

  useEffect(() => {
    const savedApiKey = localStorage.getItem('etherscanApiKey');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
      
    if (window.ethereum) {
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        
        const checkConnection = async () => {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    const userAccount = accounts[0];
                    setAccount(userAccount);
                    if (savedApiKey) {
                        fetchData(userAccount, savedApiKey);
                    } else {
                        setIsLoading(false);
                    }
                } else {
                    setIsLoading(false);
                }
            } catch (err) {
                console.error("Error al comprobar la conexión de la billetera:", err);
                setIsLoading(false);
            }
        };
        checkConnection();
        
        return () => {
            window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        };
    } else {
        setIsLoading(false);
    }
  }, [fetchData, handleAccountsChanged]);


  const connectWallet = async () => {
    if (!window.ethereum) {
      setError("MetaMask no está instalado. Por favor, instala la extensión y vuelve a intentarlo.");
      return;
    }

    try {
      setError(null);
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const userAccount = accounts[0];
      setAccount(userAccount);
      if (apiKey) {
        fetchData(userAccount, apiKey);
      }
    } catch (err: any) {
      console.error("Error al conectar la billetera:", err);
      setError(err.message || "El usuario rechazó la conexión.");
    }
  };
  
  const disconnectWallet = () => {
      setAccount(null);
      setBalance(null);
      setTransactions([]);
      setError(null);
      // Opcional: limpiar la clave API al desconectar
      // localStorage.removeItem('etherscanApiKey');
      // setApiKey(null);
  };

  const handleSaveApiKey = (key: string) => {
    localStorage.setItem('etherscanApiKey', key);
    setApiKey(key);
    setShowApiKeyScreen(false);
    if (account) {
      fetchData(account, key);
    }
  };

  const handleChangeApiKey = () => {
    setShowApiKeyScreen(true);
  };

  if (isLoading) {
    return <LoadingScreen message={loadingMessage} />;
  }

  if (!account) {
    return <LoginScreen onConnect={connectWallet} error={error} />;
  }
  
  if (!apiKey || showApiKeyScreen) {
      return <ApiKeyInputScreen onSave={handleSaveApiKey} currentKey={apiKey} />;
  }

  return (
    <div className="container">
      <DashboardHeader account={account} onDisconnect={disconnectWallet} onChangeApiKey={handleChangeApiKey} />
      {error && <ErrorDisplay message={error} />}

      <section className="dashboard-grid">
        <SummaryCard title="Saldo de ETH" value={balance ?? '...'} />
        <SummaryCard title="Transacciones Recientes" value={transactions.length >= 10 ? '10' : transactions.length} />
        <SummaryCard title="Valor Total del Portfolio (Simulado)" value={`$${mockTokens.reduce((sum, t) => sum + t.usdValue, 0).toFixed(2)}`} />
      </section>

      <section className="card">
        <h3 className="card-title">Mis Tokens (Simulado)</h3>
        <div className="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Activo</th>
                        <th>Balance</th>
                        <th>Valor en USD</th>
                    </tr>
                </thead>
                <tbody>
                    {mockTokens.map(token => (
                        <tr key={token.symbol}>
                            <td>{token.name} ({token.symbol})</td>
                            <td>{token.balance.toFixed(2)}</td>
                            <td>${token.usdValue.toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </section>

      <section className="card" style={{ marginTop: '1.5rem' }}>
        <h3 className="card-title">Historial de Transacciones Recientes</h3>
        <div className="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Tipo</th>
                        <th>Desde</th>
                        <th>Hasta</th>
                        <th>Valor (ETH)</th>
                        <th>Fecha</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.length > 0 ? transactions.map(tx => (
                        <tr key={tx.hash}>
                            <td>
                                {tx.to.toLowerCase() === account.toLowerCase()
                                ? <span className="tx-type tx-type-in">IN</span>
                                : <span className="tx-type tx-type-out">OUT</span>
                                }
                            </td>
                            <td className="address-cell">{`${tx.from.substring(0, 6)}...`}</td>
                            <td className="address-cell">{`${tx.to.substring(0, 6)}...`}</td>
                            <td>{formatBalance(tx.value)}</td>
                            <td>{formatDate(tx.timeStamp)}</td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan={5} style={{textAlign: 'center'}}>No se encontraron transacciones.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </section>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}