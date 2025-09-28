import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { ethers } from "ethers";

// --- INICIO: Lógica de Blockchain (integrada desde blockchain.ts) ---

/*
 * Documentación Didáctica (ethers.js):
 * ethers.js es una librería que nos permite interactuar con la blockchain de Ethereum (y compatibles).
 * Simplifica enormemente el proceso de enviar transacciones y leer datos de los contratos.
 */

// 1. LA DIRECCIÓN DEL CONTRATO (de nuestra galería, ahora usada como default)
const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000"; // <--- REEMPLAZAR ESTO

// 2. EL ABI (Application Binary Interface)
const CONTRACT_ABI = [
    "function ownerOf(uint256 tokenId) view returns (address)",
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
    "function name() view returns (string)",
    "function totalSupply() view returns (uint256)"
];

// 3. Redes Soportadas
const SUPPORTED_NETWORKS = {
    '0x1': { chainId: '0x1', name: 'Ethereum', rpcUrl: `https://mainnet.infura.io/v3/` }, // Usar una clave de Infura en producción
    '0x89': { chainId: '0x89', name: 'Polygon', rpcUrl: 'https://polygon-rpc.com/' }
};
const DEFAULT_NETWORK = SUPPORTED_NETWORKS['0x1'];


/**
 * Crea una "instancia" del contrato con la que podemos interactuar.
 * @param address La dirección del contrato a instanciar.
 * @param network Opcional. Si se provee, usa un proveedor estático para esa red.
 * @returns Un objeto de contrato de ethers.js, o null si los parámetros no son válidos.
 */
const getContract = (address: string, network: { rpcUrl: string } | null = null) => {
    if (!address || !ethers.isAddress(address)) {
        console.error("La dirección del contrato no es válida.");
        return null;
    }
    // Si se especifica una red, usamos un proveedor de solo lectura para esa red específica.
    if (network) {
        const provider = new ethers.JsonRpcProvider(network.rpcUrl);
        return new ethers.Contract(address, CONTRACT_ABI, provider);
    }
    // Si no, usamos el proveedor de MetaMask (la red activa del usuario).
    if (typeof window.ethereum === 'undefined') {
        console.error("MetaMask no está instalado.");
        return null;
    }
    const provider = new ethers.BrowserProvider(window.ethereum);
    return new ethers.Contract(address, CONTRACT_ABI, provider);
};


/**
 * Conecta la wallet de MetaMask y devuelve la dirección del usuario.
 * @returns La dirección de la wallet conectada o null si hay un error.
 */
const connectWallet = async (): Promise<string | null> => {
    if (typeof window.ethereum === 'undefined') {
        alert("MetaMask no detectado. Por favor, instala la extensión de MetaMask.");
        return null;
    }
    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        return accounts[0] || null;
    } catch (error) {
        console.error("El usuario rechazó la solicitud de conexión:", error);
        return null;
    }
};

/**
 * Obtiene los detalles de propiedad de un NFT específico desde la blockchain.
 * @param contractAddress La dirección del contrato del NFT.
 * @param tokenId El ID del token a verificar.
 * @param network La red específica en la que buscar.
 * @returns Un objeto con el propietario y el historial (simulado por ahora).
 */
const getOwnershipDetails = async (contractAddress: string, tokenId: string, network: { rpcUrl: string } | null = null) => {
    const contract = getContract(contractAddress, network);
    if (!contract) return null;

    try {
        const owner = await contract.ownerOf(tokenId);
        
        const history = [
             { from: '... (On-Chain Data)', to: owner, date: 'Desde la Blockchain' }
        ];

        return { owner, history };

    } catch (error) {
        // Silenciamos el error en la consola para una búsqueda secuencial más limpia
        // console.error(`Error al obtener datos para el token ${tokenId} del contrato ${contractAddress}:`, error);
        return null; // El token o el contrato pueden no existir en esta red
    }
};

/**
 * Obtiene el número total de NFTs en la colección.
 * @returns El número total de tokens acuñados.
 */
const getTotalSupply = async (): Promise<number> => {
    // Usamos la dirección de nuestro contrato y la red por defecto para esta función.
    const contract = getContract(CONTRACT_ADDRESS, DEFAULT_NETWORK); 
    if (!contract) return 0;
    try {
        const totalSupply = await contract.totalSupply();
        return Number(totalSupply);
    } catch (error) {
        console.error("Error al obtener el total supply:", error);
        return 0;
    }
}

/**
 * Solicita a MetaMask cambiar a una red específica.
 * @param chainId El ID de la cadena en formato hexadecimal (ej: '0x1').
 */
const switchNetwork = async (chainId: string) => {
    if (!window.ethereum) return;
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId }],
        });
    } catch (switchError) {
        // Este error (código 4902) indica que la red no ha sido agregada a MetaMask.
        // Aquí se podría implementar la lógica para agregar la red, pero se omite por simplicidad.
        console.error("Error al cambiar de red:", switchError);
    }
};


// --- FIN: Lógica de Blockchain ---


declare global {
    interface Window {
        ethereum?: any;
    }
}

// --- FUENTE DE DATOS (Catálogo de la Galería) ---
const artCatalog = [
    { id: 1, tokenId: '1', title: 'Ecos Cósmicos', artist: 'Elena Valdés', priceCLP: '450.000', priceETH: '0.25', imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzOTurlV7fDB8MXxzZWFyY2h8N3x8YWJzdHJhY3QlMjBwYWludGluZ3xlbnwwfHx8fDE3MTU2MzM4MTB8MA&ixlib=rb-4.0.3&q=80&w=400', description: 'Una exploración vibrante de la creación y la destrucción en el universo, utilizando acrílicos sobre lienzo de 100x120cm.' },
    { id: 2, tokenId: '2', title: 'Frontera Líquida', artist: 'Javier Ríos', priceCLP: '620.000', priceETH: '0.35', imageUrl: 'https://images.unsplash.com/photo-1536924430914-94f33bd6a133?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzOTurlV7fDB8MXxzZWFyY2h8MTF8fGFic3RyYWN0JTIwcGFpbnRpbmd8ZW58MHx8fHwxNzE1NjMzODEwfDA&ixlib=rb-4.0.3&q=80&w=400', description: 'Obra que captura la tensión entre la calma y el caos, representada a través de fluidos de tinta sobre papel de alto gramaje.' },
    { id: 3, tokenId: '3', title: 'Nostalgia Urbana', artist: 'Sofía Castillo', priceCLP: '380.000', priceETH: '0.21', imageUrl: 'https://images.unsplash.com/photo-1578301978018-3005759f48f7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzOTurlV7fDB8MXxzZWFyY2h8MTd8fGFic3RyYWN0JTIwcGFpbnRpbmd8ZW58MHx8fHwxNzE1NjMzODEwfDA&ixlib=rb-4.0.3&q=80&w=400', description: 'Un collage de emociones que evoca los recuerdos fragmentados de una ciudad bulliciosa. Técnica mixta sobre madera.' },
    { id: 4, tokenId: '4', title: 'El Jardín Silente', artist: 'Elena Valdés', priceCLP: '750.000', priceETH: '0.42', imageUrl: 'https://images.unsplash.com/photo-1552554623-74b86f6580e6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzOTurlV7fDB8MXxzZWFyY2h8MjZ8fGFic3RyYWN0JTIwcGFpbnRpbmd8ZW58MHx8fHwxNzE1NjMzODQxfDA&ixlib=rb-4.0.3&q=80&w=400', description: 'Capas de óleo que construyen un paisaje onírico y tranquilo, invitando a la introspección. Dimensiones 150x100cm.' },
    { id: 5, tokenId: '5', title: 'Ritmo Quebrado', artist: 'Carlos Mendoza', priceCLP: '510.000', priceETH: '0.29', imageUrl: 'https://images.unsplash.com/photo-1502537233324-179a83446b23?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzOTurlV7fDB8MXxzZWFyY2h8MzB8fGFic3RyYWN0JTIwcGFpbnRpbmd8ZW58MHx8fHwxNzE1NjMzODQxfDA&ixlib=rb-4.0.3&q=80&w=400', description: 'La improvisación del jazz hecha pintura. Trazos enérgicos y colores contrastantes sobre lienzo.' },
    { id: 6, tokenId: '6', title: 'Amanecer Digital', artist: 'Javier Ríos', priceCLP: '890.000', priceETH: '0.50', imageUrl: 'https://images.unsplash.com/photo-1549490349-8643362247b5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzOTurlV7fDB8MXxzZWFyY2h8NDF8fGFic3RyYWN0JTIwcGFpbnRpbmd8ZW58MHx8fHwxNzE1NjMzODQxfDA&ixlib=rb-4.0.3&q=80&w=400', description: 'Una obra a gran escala que interpreta la fusión entre la naturaleza y la tecnología en la era moderna.' }
];

// --- I18N ---
const translations = {
    es: {
        gallery: 'Galería',
        verify: 'Verificar Autenticidad',
        connectWallet: 'Conectar Wallet',
        walletConnected: 'Wallet Conectada',
        viewDetails: 'Ver Detalles',
        buyNow: 'Adquirir',
        verifyOnChain: 'Verificar en Blockchain',
        backToGallery: '← Volver a la Galería',
        verifyTitle: 'Portal de Verificación de Autenticidad',
        verifyDescription: 'La unicidad de un NFT se define por su Contrato y su ID de Token. Introduce ambos para verificar la propiedad en la blockchain.',
        verifyByTokenId: 'Verificar un NFT',
        tokenIdPlaceholder: 'Ingresa el ID del Token (ej: 346)',
        contractAddressPlaceholder: 'Dirección del Contrato (ej: 0x...)',
        or: 'o',
        myCollection: 'Mi Colección',
        connectToSee: 'Conecta tu wallet para ver tu colección',
        verificationResult: 'Resultado de la Verificación',
        owner: 'Propietario Actual:',
        history: 'Historial de Propiedad:',
        noArtFound: 'No se encontraron datos para esta combinación de Contrato y Token ID. Verifica que ambos sean correctos.',
        noArtInWallet: 'No posees ninguna obra de esta colección en la wallet conectada.',
        myCollectionDisabled: "La función 'Mi Colección' es computacionalmente costosa y no está implementada en esta fase. Se requiere un servicio de indexación para hacerlo de manera eficiente.",
        footerText: '© 2024 Galería Abstracta Chile. Todos los derechos reservados.',
        loading: 'Cargando...',
        verifying: 'Verificando en la blockchain...',
        howToFindTokenId: '¿Cómo encuentro el ID del Token?',
        tokenIdHelpTitle: 'Para encontrar el ID del Token de un NFT:',
        tokenIdHelpText: 'Ve a la página del NFT en un marketplace como OpenSea. El ID del Token es el último número que aparece en la URL.',
        unsupportedNetwork: 'Red Desconocida',
        switchTo: 'Cambiar a',
        searchingOn: 'Buscando en {network}...',
        foundOn: 'Encontrado en la red:'
    }
};
const useTranslations = () => translations.es;


// --- COMPONENTS ---

const Loader = ({ text = '' }) => {
    const t = useTranslations();
    return (
        <div className="loader-container">
            <div className="loader" aria-label={t.loading}></div>
            {text && <p className="loader-text">{text}</p>}
        </div>
    );
};

const NetworkIndicator = ({ network, onSwitch }) => {
    const t = useTranslations();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const isSupported = network && SUPPORTED_NETWORKS[network.chainId];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!network) return null;

    return (
        <div className="network-indicator" ref={dropdownRef}>
            <button className={`network-button ${isSupported ? 'supported' : 'unsupported'}`} onClick={() => setIsOpen(!isOpen)}>
                <span className="network-dot"></span>
                {isSupported ? network.name : t.unsupportedNetwork}
            </button>
            {isOpen && (
                <div className="network-dropdown">
                    {Object.values(SUPPORTED_NETWORKS).map(net => (
                        <a 
                            key={net.chainId}
                            href="#" 
                            onClick={(e) => {
                                e.preventDefault();
                                onSwitch(net.chainId);
                                setIsOpen(false);
                            }}
                        >
                           {t.switchTo} {net.name}
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
};

const Header = ({ walletAddress, onConnect, setPage, network, onSwitchNetwork }) => {
    const t = useTranslations();
    return (
        <header className="app-header">
            <a href="#" onClick={(e) => { e.preventDefault(); setPage({ name: 'gallery' }); }} className="header-logo">Galería Abstracta</a>
            <nav className="header-nav">
                <a href="#" onClick={(e) => { e.preventDefault(); setPage({ name: 'gallery' }); }} className="nav-link active">
                    {t.gallery}
                </a>
                <a href="#" onClick={(e) => { e.preventDefault(); setPage({ name: 'verify' }); }} className="nav-link">
                    {t.verify}
                </a>
                {walletAddress ? (
                    <div className="wallet-info">
                         <NetworkIndicator network={network} onSwitch={onSwitchNetwork} />
                        <div className="wallet-address" title={walletAddress}>
                            {`${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`}
                        </div>
                    </div>
                ) : (
                    <button onClick={onConnect} className="connect-wallet-btn">{t.connectWallet}</button>
                )}
            </nav>
        </header>
    );
};

const ArtCard = ({ art, onSelect }) => {
    return (
        <div className="art-card" onClick={() => onSelect(art.id)}>
            <div className="art-card-image-wrapper">
                <img src={art.imageUrl} alt={art.title} className="art-card-image" />
            </div>
            <div className="art-card-info">
                <h3>{art.title}</h3>
                <p>{art.artist}</p>
                <p className="price">
                    ${art.priceCLP} CLP <span className="eth-price">({art.priceETH} ETH)</span>
                </p>
            </div>
        </div>
    );
};

const ArtGallery = ({ catalog, onSelectArt }) => {
    return (
        <div className="art-gallery-grid">
            {catalog.map(art => (
                <React.Fragment key={art.id}>
                    <ArtCard art={art} onSelect={onSelectArt} />
                </React.Fragment>
            ))}
        </div>
    );
};

const ArtDetail = ({ art, onBack, setPage }) => {
    const t = useTranslations();
    return (
        <div className="art-detail-container">
            <div className="art-detail-image">
                 <a href="#" onClick={(e) => { e.preventDefault(); onBack(); }} className="back-button">{t.backToGallery}</a>
                <img src={art.imageUrl} alt={art.title} />
            </div>
            <div className="art-detail-info">
                <h1>{art.title}</h1>
                <h2>por {art.artist}</h2>
                <p>{art.description}</p>
                <div className="price-box">
                    <p>${art.priceCLP} CLP</p>
                    <p className="eth-price">{art.priceETH} ETH</p>
                </div>
                <div className="action-buttons">
                    <button className="buy-button" onClick={() => alert('Función de compra no implementada.')}>
                        {t.buyNow}
                    </button>
                    <button className="verify-button" onClick={() => setPage({ name: 'verify', tokenId: art.tokenId, contractAddress: CONTRACT_ADDRESS })}>
                        {t.verifyOnChain}
                    </button>
                </div>
            </div>
        </div>
    );
};

const VerificationPortal = ({ initialTokenId = '', initialContractAddress = '', walletAddress, onConnect, catalog, setPage }) => {
    const t = useTranslations();
    const [tokenIdInput, setTokenIdInput] = useState(initialTokenId);
    const [contractAddressInput, setContractAddressInput] = useState(initialContractAddress);
    const [result, setResult] = useState(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [verifyingMessage, setVerifyingMessage] = useState('');
    const [showHelp, setShowHelp] = useState(false);
    const helpRef = useRef(null);

    useEffect(() => {
        if (initialTokenId && initialContractAddress) {
            handleMultiNetworkVerification();
        }
    }, [initialTokenId, initialContractAddress]);

     useEffect(() => {
        const handleClickOutside = (event) => {
            if (helpRef.current && !helpRef.current.contains(event.target)) {
                setShowHelp(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    
    const handleMultiNetworkVerification = async () => {
        if (!tokenIdInput || !contractAddressInput) return;
        setIsVerifying(true);
        setResult(null);

        let foundOwnership = null;
        for (const network of Object.values(SUPPORTED_NETWORKS)) {
            setVerifyingMessage(t.searchingOn.replace('{network}', network.name));
            const ownership = await getOwnershipDetails(contractAddressInput, tokenIdInput, network);
            if (ownership) {
                foundOwnership = { ...ownership, networkName: network.name };
                break; // Detener la búsqueda al encontrar el primer resultado
            }
        }
        
        if (foundOwnership) {
            const art = contractAddressInput.toLowerCase() === CONTRACT_ADDRESS.toLowerCase() 
                ? catalog.find(a => a.tokenId === tokenIdInput)
                : { title: `Token ID: ${tokenIdInput}`, artist: `Contrato: ${contractAddressInput}` };
            setResult({ art, ownership: foundOwnership });
        } else {
            setResult({ error: t.noArtFound });
        }
        setIsVerifying(false);
        setVerifyingMessage('');
    };

    return (
        <div className="verification-portal">
            <h1>{t.verifyTitle}</h1>
            <p>{t.verifyDescription}</p>
            
            <div className="verifier-box">
                <h2>{t.verifyByTokenId}</h2>
                <div className="form-group">
                    <input 
                        type="text" 
                        value={contractAddressInput}
                        onChange={(e) => setContractAddressInput(e.target.value)}
                        placeholder={t.contractAddressPlaceholder}
                        disabled={isVerifying}
                    />
                </div>
                 <div className="form-group-wrapper" ref={helpRef}>
                    <div className="form-group">
                        <input 
                            type="text" 
                            value={tokenIdInput}
                            onChange={(e) => setTokenIdInput(e.target.value)}
                            placeholder={t.tokenIdPlaceholder}
                            disabled={isVerifying}
                        />
                         <button onClick={handleMultiNetworkVerification} disabled={isVerifying || !tokenIdInput || !contractAddressInput}>{t.verify}</button>
                    </div>
                    <div className="verifier-help-trigger" onClick={() => setShowHelp(!showHelp)} title={t.howToFindTokenId}>?</div>
                    {showHelp && (
                        <div className="verifier-help-box">
                            <h4>{t.tokenIdHelpTitle}</h4>
                            <p>{t.tokenIdHelpText}</p>
                            <code>opensea.io/assets/.../`{`{TOKEN_ID}`}</code>
                        </div>
                    )}
                </div>
            </div>

            {isVerifying && <Loader text={verifyingMessage} />}

            {result && (
                 <div className={`verification-result ${result.error ? 'error' : ''}`}>
                    <h3>{t.verificationResult}</h3>
                    {result.error ? <p>{result.error}</p> : (
                        <>
                           <p><strong>{result.art.title}</strong></p>
                           <p className="owner-info"><em>{result.art.artist}</em></p>
                           <p className="network-info"><strong>{t.foundOn}</strong> {result.ownership.networkName}</p>
                           <p className="owner-info"><strong>{t.owner}</strong> {result.ownership.owner}</p>
                           <h4>{t.history}</h4>
                           {result.ownership.history.map((tx, i) => (
                               <div key={i} className="history-item">
                                   <p><strong>De:</strong> {tx.from}</p>
                                   <p><strong>Para:</strong> {tx.to}</p>
                                   <p><strong>Info:</strong> {tx.date}</p>
                               </div>
                           ))}
                        </>
                    )}
                 </div>
            )}
            
            <div className="separator">{t.or}</div>

            <div className="verifier-box">
                <h2>{t.myCollection}</h2>
                {walletAddress ? (
                    <p className="disabled-feature-notice">{t.myCollectionDisabled}</p>
                ) : (
                    <button onClick={onConnect} className="connect-wallet-btn">{t.connectToSee}</button>
                )}
            </div>
        </div>
    );
};


const Footer = () => {
    const t = useTranslations();
    return (
        <footer className="app-footer">
            <p>{t.footerText}</p>
        </footer>
    );
};

const CyberpunkEasterEgg = ({ onClose }) => {
    const lines = [
        "// ACCEDIENDO A CORE_IDENTITY.SYS...",
        "// CONEXIÓN ESTABLECIDA. DESCIFRANDO MANIFIESTO...",
        "> En la intersección del arte y el código, nosotros existimos.",
        "> Misión: Vincular la expresión humana a la verdad inmutable de la cadena de bloques.",
        "> Somos un colectivo de creadores y tecnólogos que creen que la procedencia es un derecho, no un privilegio.",
        "> Cada token es una promesa. Cada transacción, una historia.",
        "> Has vislumbrado el código fuente de nuestra convicción.",
        "> El futuro del arte es verificable.",
        "// FIN DE LA TRANSMISIÓN."
    ];

    return (
        <div className="easter-egg-overlay" onClick={onClose}>
            <div className="scanline-effect"></div>
            <div className="easter-egg-content" onClick={(e) => e.stopPropagation()}>
                {lines.map((line, index) => <p key={index}>{line}</p>)}
                <button onClick={onClose} className="easter-egg-close-btn">[ SALIR ]</button>
            </div>
        </div>
    );
};


const App = () => {
    const [page, setPage] = useState<{ name: string; id?: number; tokenId?: string; contractAddress?: string; }>({ name: 'gallery' });
    const [walletAddress, setWalletAddress] = useState('');
    const [network, setNetwork] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [catalog, setCatalog] = useState([]);
    const [showEasterEgg, setShowEasterEgg] = useState(false);
    const t = useTranslations();
    
    const updateNetwork = async () => {
        if (!window.ethereum) return;
        const provider = new ethers.BrowserProvider(window.ethereum);
        const net = await provider.getNetwork();
        const chainId = `0x${net.chainId.toString(16)}`;
        const networkInfo = SUPPORTED_NETWORKS[chainId];
        setNetwork({
            chainId,
            name: networkInfo ? networkInfo.name : t.unsupportedNetwork
        });
    };
    
    useEffect(() => {
        if(walletAddress) {
            updateNetwork();
        }
        if (window.ethereum) {
            const handleChainChanged = () => window.location.reload(); // Simple reload on network change
            window.ethereum.on('chainChanged', handleChainChanged);
            return () => window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
    }, [walletAddress]);
    
    // Carga inicial de la app
    useEffect(() => {
        const initializeApp = async () => {
            console.log("Inicializando aplicación...");
            try {
                // Obtenemos el total supply de nuestro contrato para mostrar solo los NFTs "acuñados"
                const totalSupply = await getTotalSupply();
                if (totalSupply > 0) {
                    const availableArt = artCatalog.filter(art => parseInt(art.tokenId, 10) <= totalSupply);
                    setCatalog(availableArt);
                } else {
                    console.warn("Conectado, pero el total supply del contrato es 0. Mostrando catálogo completo como vista previa.");
                    setCatalog(artCatalog);
                }
            } catch (error) {
                console.error("No se pudo conectar a la blockchain para obtener el total supply. Mostrando catálogo en modo vista previa.", error);
                setCatalog(artCatalog);
            }
            setIsLoading(false);
        };

        initializeApp();

    }, []);

    // Listener para el código Konami del Easter Egg
    useEffect(() => {
        const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
        let index = 0;
        const keyHandler = (event: KeyboardEvent) => {
            if (event.key.toLowerCase() === konamiCode[index].toLowerCase()) {
                index++;
                if (index === konamiCode.length) {
                    setShowEasterEgg(true);
                    index = 0;
                }
            } else {
                index = 0;
            }
        };
        window.addEventListener('keydown', keyHandler);
        return () => {
            window.removeEventListener('keydown', keyHandler);
        };
    }, []);

    const handleConnectWallet = async () => {
        const address = await connectWallet();
        if (address) {
            setWalletAddress(address);
        }
    };
    
    const handleSwitchNetwork = async (chainId) => {
        await switchNetwork(chainId);
    };
    
    const renderPage = () => {
        switch (page.name) {
            case 'detail':
                const art = catalog.find(a => a.id === page.id);
                if (!art) return <ArtGallery catalog={catalog} onSelectArt={(id) => setPage({ name: 'detail', id })} />;
                return <ArtDetail art={art} onBack={() => setPage({ name: 'gallery' })} setPage={setPage} />;
            case 'verify':
                return <VerificationPortal 
                    initialTokenId={page.tokenId}
                    initialContractAddress={page.contractAddress}
                    walletAddress={walletAddress} 
                    onConnect={handleConnectWallet} 
                    catalog={catalog}
                    setPage={setPage}
                />;
            case 'gallery':
            default:
                return <ArtGallery catalog={catalog} onSelectArt={(id) => setPage({ name: 'detail', id })} />;
        }
    };

    return (
        <>
            {showEasterEgg && <CyberpunkEasterEgg onClose={() => setShowEasterEgg(false)} />}
            <div className="app-container">
                <Header 
                    walletAddress={walletAddress} 
                    onConnect={handleConnectWallet} 
                    setPage={setPage}
                    network={network}
                    onSwitchNetwork={handleSwitchNetwork}
                />
                <main>
                    {isLoading ? <Loader text={t.loading} /> : renderPage()}
                </main>
            </div>
            <Footer />
        </>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);