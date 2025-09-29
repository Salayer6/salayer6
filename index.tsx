import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { ethers } from "ethers";

// --- FIX: Add global type declaration for window.ethereum at the top to make it available throughout the file.
declare global {
    interface Window {
        ethereum?: any;
    }
}

// --- INICIO: Lógica de Blockchain (integrada desde blockchain.ts) ---

/*
 * Documentación Didáctica (ethers.js):
 * ethers.js es una librería que nos permite interactuar con la blockchain de Ethereum (y compatibles).
 * Simplifica enormemente el proceso de enviar transacciones y leer datos de los contratos.
 */

// 1. LA DIRECCIÓN DEL CONTRATO (de nuestra galería, ahora usando un contrato real)
const CONTRACT_ADDRESS = "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D"; // Dirección del contrato de Bored Ape Yacht Club (BAYC)

// 2. EL ABI (Application Binary Interface) - AÑADIMOS tokenURI
const CONTRACT_ABI = [
    "function ownerOf(uint256 tokenId) view returns (address)",
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
    "function name() view returns (string)",
    "function totalSupply() view returns (uint256)",
    "function tokenURI(uint256 tokenId) view returns (string)" // Estándar para metadatos
];

// 3. Redes Soportadas - Ahora con URL del explorador y RPCs de respaldo para Ethereum
const SUPPORTED_NETWORKS = {
    '0x1': { chainId: '0x1', name: 'Ethereum', rpcUrl: ['https://ethereum.publicnode.com', 'https://cloudflare-eth.com', 'https://eth-mainnet.public.blastapi.io'], blockExplorerUrl: 'https://etherscan.io' },
    '0x89': { chainId: '0x89', name: 'Polygon', rpcUrl: 'https://polygon.publicnode.com', blockExplorerUrl: 'https://polygonscan.com' },
    '0x38': { chainId: '0x38', name: 'BNB Chain', rpcUrl: 'https://bsc.publicnode.com', blockExplorerUrl: 'https://bscscan.com' },
    '0xa86a': { chainId: '0xa86a', name: 'Avalanche', rpcUrl: 'https://avalanche-c-chain.publicnode.com', blockExplorerUrl: 'https://snowtrace.io' },
    '0xa4b1': { chainId: '0xa4b1', name: 'Arbitrum', rpcUrl: 'https://arbitrum-one.publicnode.com', blockExplorerUrl: 'https://arbiscan.io' },
    '0x2105': { chainId: '0x2105', name: 'Base', rpcUrl: 'https://base.publicnode.com', blockExplorerUrl: 'https://basescan.org' },
    '0xe708': { chainId: '0xe708', name: 'Linea', rpcUrl: 'https://linea.publicnode.com', blockExplorerUrl: 'https://lineascan.build' }
};
const DEFAULT_NETWORK = SUPPORTED_NETWORKS['0x1'];


/**
 * Crea una "instancia" del contrato con la que podemos interactuar.
 * @param address La dirección del contrato a instanciar.
 * @param network Opcional. Si se provee, usa un proveedor estático para esa red.
 * @returns Un objeto de contrato de ethers.js, o null si los parámetros no son válidos.
 */
const getContract = (address: string, network: { rpcUrl: string | string[] } | null = null) => {
    if (!address || !ethers.isAddress(address)) {
        console.error("La dirección del contrato no es válida.");
        return null;
    }
    // Si se especifica una red, usamos un proveedor estático.
    if (network) {
        // Si la red tiene múltiples RPCs (como Ethereum), usamos un FallbackProvider.
        // Si no, usamos un JsonRpcProvider simple.
        const provider = Array.isArray(network.rpcUrl)
            ? new ethers.FallbackProvider(network.rpcUrl.map(url => new ethers.JsonRpcProvider(url)))
            : new ethers.JsonRpcProvider(network.rpcUrl as string);
        return new ethers.Contract(address, CONTRACT_ABI, provider);
    }
    // Si no se especifica red, usamos el proveedor de MetaMask (la red activa del usuario).
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

// --- FIX: Corrected generic type syntax for TSX files. `<T>` was being interpreted as a JSX tag.
// The trailing comma `<T,>` tells the TypeScript parser that this is a generic type parameter, not a component.
// This single fix resolves a large cascade of parsing errors throughout the file.
const retryAsync = async <T,>(
    fn: () => Promise<T>,
    retries = 2, // 2 reintentos = 3 intentos en total
    delay = 500
): Promise<T> => {
    let lastError: Error | null = null;
    for (let i = 0; i <= retries; i++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;
            if (i < retries) {
                // Espera antes del siguiente reintento
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    // Si todos los reintentos fallan, lanza el último error capturado.
    throw lastError;
};

/**
 * Obtiene los detalles de propiedad y la última transferencia de un NFT.
 * Refactorizado para ser resiliente: utiliza reintentos para las llamadas críticas a la red
 * y maneja con gracia los fallos en la obtención del historial de transacciones.
 * @param contractAddress La dirección del contrato del NFT.
 * @param tokenId El ID del token a verificar.
 * @param network La red específica en la que buscar.
 * @returns Un objeto con el estado de la búsqueda y los datos si se encuentra.
 */
const getOwnershipDetails = async (contractAddress: string, tokenId: string, network: { name: string, rpcUrl: string | string[] }) => {
    // Si la red tiene múltiples RPCs, usamos un FallbackProvider para resiliencia.
    // Si no, un JsonRpcProvider normal.
    const provider = Array.isArray(network.rpcUrl)
        ? new ethers.FallbackProvider(network.rpcUrl.map(url => new ethers.JsonRpcProvider(url)))
        : new ethers.JsonRpcProvider(network.rpcUrl as string);

    // Paso 1: Verificar si el contrato existe, con reintentos.
    try {
        const code = await retryAsync(() => provider.getCode(contractAddress));
        if (code === '0x') {
            return { status: 'not_found' };
        }
    } catch (error: any) {
        console.error(`Error al verificar el código del contrato en ${network.name} después de varios intentos:`, error);
        return { status: 'error', message: `No se pudo conectar a ${network.name}.` };
    }

    const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, provider);
    let owner;

    // Paso 2: Obtener propietario, con reintentos (Funcionalidad Principal).
    try {
        owner = await retryAsync(() => contract.ownerOf(tokenId));
    } catch (error: any) {
        if (error.code === 'CALL_EXCEPTION' || (error.info?.error?.message || '').includes('owner query for nonexistent token')) {
            return { status: 'not_found' };
        }
        console.error(`Error al obtener el propietario en ${network.name} después de varios intentos:`, error);
        return { status: 'error', message: error.message };
    }

    // Paso 3: Obtener historial (Mejora, puede fallar sin detener la verificación). No necesita reintentos.
    let lastTransfer = null;
    try {
        const transferEvents = await contract.queryFilter(contract.filters.Transfer(null, null, tokenId), 0, 'latest');
        if (transferEvents.length > 0) {
            const latestEvent = transferEvents[transferEvents.length - 1] as ethers.EventLog;
            if (latestEvent.args) {
                lastTransfer = {
                    from: latestEvent.args.from,
                    to: latestEvent.args.to,
                };
            }
        }
    } catch (error: any) {
        console.warn(`No se pudo obtener el historial de transacciones en ${network.name}. Esto es común en nodos RPC públicos. La verificación de propiedad sigue siendo válida.`, error);
    }

    // Éxito: Se encontró al menos el propietario.
    return { status: 'found', data: { owner, lastTransfer } };
};

/**
 * Obtiene los metadatos de un NFT (nombre, imagen, etc.) desde su tokenURI.
 * @param contract El contrato de ethers.js ya instanciado.
 * @param tokenId El ID del token.
 * @returns Un objeto con los metadatos o null si falla.
 */
const getNFTMetadata = async (contract: ethers.Contract, tokenId: string) => {
    try {
        const tokenURI = await contract.tokenURI(tokenId);
        
        // Convierte URLs de IPFS a URLs HTTP públicas
        const httpURI = tokenURI.startsWith('ipfs://')
            ? tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/')
            : tokenURI;

        const response = await fetch(httpURI);
        if (!response.ok) {
            console.error(`Error al obtener metadatos desde ${httpURI}:`, response.statusText);
            return null;
        }
        
        const metadata = await response.json();

        // Normaliza la URL de la imagen (también podría ser IPFS)
        if (metadata.image && metadata.image.startsWith('ipfs://')) {
            metadata.image = metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/');
        }

        return {
            name: metadata.name || 'Sin Título',
            description: metadata.description || 'Sin Descripción',
            image: metadata.image || null
        };

    } catch (error) {
        console.warn("No se pudieron obtener los metadatos del NFT:", error);
        return null;
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
        // Envolvemos la llamada al contrato en nuestra función de reintentos para
        // hacerla más robusta frente a fallos de red intermitentes.
        const totalSupply = await retryAsync(() => contract.totalSupply());
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

// --- FIX: Add type definitions for application data structures.
interface Art {
    id: number;
    tokenId: string;
    title: string;
    artist: string;
    priceCLP: string;
    priceETH: string;
    imageUrl: string;
    description: string;
}

interface NetworkInfo {
    chainId: string;
    name: string;
}

type PageState = {
    name: 'gallery'
} | {
    name: 'detail',
    id: number
} | {
    name: 'verify',
    tokenId?: string,
    contractAddress?: string
};

// --- FUENTE DE DATOS (Catálogo de la Galería) ---
const artCatalog: Art[] = [
    { id: 1, tokenId: '1', title: 'Ecos Cósmicos', artist: 'Elena Valdés', priceCLP: '450.000', priceETH: '0.25', imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzOTurlV7fDB8MXxzZWFyY2h8N3x8YWJzdHJhY3QlMjBwYWludGluZ3xlbnwwfHx8fDE3MTU2MzM4MTB8MA&ixlib=rb-4.0.3&q=80&w=400', description: 'Una exploración vibrante de la creación y la destrucción en el universo, utilizando acrílicos sobre lienzo de 100x120cm.' },
    { id: 2, tokenId: '2', title: 'Frontera Líquida', artist: 'Javier Ríos', priceCLP: '620.000', priceETH: '0.35', imageUrl: 'https://images.unsplash.com/photo-1536924430914-94f33bd6a133?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzOTurlV7fDB8MXxzZWFyY2h8MTF8fGFic3RyYWN0JTIwcGFpbnRpbmd8ZW58MHx8fHwxNzE1NjMzODEwfDA&ixlibrb-4.0.3&q=80&w=400', description: 'Obra que captura la tensión entre la calma y el caos, representada a través de fluidos de tinta sobre papel de alto gramaje.' },
    { id: 3, tokenId: '3', title: 'Nostalgia Urbana', artist: 'Sofía Castillo', priceCLP: '380.000', priceETH: '0.21', imageUrl: 'https://images.unsplash.com/photo-1578301978018-30057590f48f7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzOTurlV7fDB8MXxzZWFyY2h8MTd8fGFic3RyYWN0JTIwcGFpbnRpbmd8ZW58MHx8fHwxNzE1NjMzODEwfDA&ixlib.rb-4.0.3&q=80&w=400', description: 'Un collage de emociones que evoca los recuerdos fragmentados de una ciudad bulliciosa. Técnica mixta sobre madera.' },
    { id: 4, tokenId: '4', title: 'El Jardín Silente', artist: 'Elena Valdés', priceCLP: '750.000', priceETH: '0.42', imageUrl: 'https://images.unsplash.com/photo-1552554623-74b86f6580e6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzOTurlV7fDB8MXxzZWFyY2h8MjZ8fGFic3RyYWN0JTIwcGFpbnRpbmd8ZW58MHx8fHwxNzE1NjMzODQxfDA&ixlib.rb-4.0.3&q=80&w=400', description: 'Capas de óleo que construyen un paisaje onírico y tranquilo, invitando a la introspección. Dimensiones 150x100cm.' },
    { id: 5, tokenId: '5', title: 'Ritmo Quebrado', artist: 'Carlos Mendoza', priceCLP: '510.000', priceETH: '0.29', imageUrl: 'https://images.unsplash.com/photo-1502537233324-179a83446b23?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzOTurlV7fDB8MXxzZWFyY2h8MzB8fGFic3RyYWN0JTIwcGFpbnRpbmd8ZW58MHx8fHwxNzE1NjMzODQxfDA&ixlib.rb-4.0.3&q=80&w=400', description: 'La improvisación del jazz hecha pintura. Trazos enérgicos y colores contrastantes sobre lienzo.' },
    { id: 6, tokenId: '6', title: 'Amanecer Digital', artist: 'Javier Ríos', priceCLP: '890.000', priceETH: '0.50', imageUrl: 'https://images.unsplash.com/photo-1549490349-8643362247b5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzOTurlV7fDB8MXxzZWFyY2h8NDF8fGFic3RyYWN0JTIwcGFpbnRpbmd8ZW58MHx8fHwxNzE1NjMzODQxfDA&ixlib.rb-4.0.3&q=80&w=400', description: 'Una obra a gran escala que interpreta la fusión entre la naturaleza y la tecnología en la era moderna.' }
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
        contractAddressPlaceholder: 'Pega la dirección de cualquier contrato NFT',
        or: 'o',
        myCollection: 'Mi Colección',
        connectToSee: 'Conecta tu wallet para ver tu colección',
        verificationResult: 'Resultado de la Verificación',
        owner: 'Propietario Actual:',
        history: 'Última Transacción Registrada',
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
        foundOn: 'Encontrado en la red:',
        from: 'De:',
        to: 'Para:',
        mintEvent: 'Acuñación (Creación del NFT)',
        viewOnExplorer: 'Ver en Explorador de Bloques',
        searchLogTitle: 'Registro de Búsqueda:',
        statusFound: 'Encontrado',
        statusNotFound: 'No Encontrado',
        statusError: 'Error de Red',
        blockchainDataTitle: 'Datos Verificados en Blockchain',
        catalogInfoTitle: 'Información de Nuestro Catálogo',
        nftMetadataTitle: 'Metadatos del NFT',
        tokenId: 'Token ID:',
        contractAddress: 'Dirección del Contrato:'
    }
};
const useTranslations = () => translations.es;


// --- COMPONENTS ---

// --- FIX: Add prop types for component
interface LoaderProps {
    text?: string;
}
const Loader: React.FC<LoaderProps> = ({ text = '' }) => {
    const t = useTranslations();
    return (
        <div className="loader-container">
            <div className="loader" aria-label={t.loading}></div>
            {text && <p className="loader-text">{text}</p>}
        </div>
    );
};

// --- FIX: Add prop types for component
interface NetworkIndicatorProps {
    network: NetworkInfo | null;
    onSwitch: (chainId: string) => void;
}
const NetworkIndicator: React.FC<NetworkIndicatorProps> = ({ network, onSwitch }) => {
    const t = useTranslations();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const isSupported = network && SUPPORTED_NETWORKS[network.chainId as keyof typeof SUPPORTED_NETWORKS];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

// --- FIX: Add prop types for component
interface HeaderProps {
    walletAddress: string;
    onConnect: () => void;
    setPage: (page: PageState) => void;
    network: NetworkInfo | null;
    onSwitchNetwork: (chainId: string) => void;
}
const Header: React.FC<HeaderProps> = ({ walletAddress, onConnect, setPage, network, onSwitchNetwork }) => {
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

// --- FIX: Add prop types for component
interface ArtCardProps {
    art: Art;
    onSelect: (id: number) => void;
}
const ArtCard: React.FC<ArtCardProps> = ({ art, onSelect }) => {
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

// --- FIX: Add prop types for component
interface ArtGalleryProps {
    catalog: Art[];
    onSelectArt: (id: number) => void;
}
const ArtGallery: React.FC<ArtGalleryProps> = ({ catalog, onSelectArt }) => {
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

// --- FIX: Add prop types for component
interface ArtDetailProps {
    art: Art;
    onBack: () => void;
    setPage: (page: PageState) => void;
}
const ArtDetail: React.FC<ArtDetailProps> = ({ art, onBack, setPage }) => {
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

// --- FIX: Add specific types for verification result state
type NetworkFromSupported = typeof SUPPORTED_NETWORKS[keyof typeof SUPPORTED_NETWORKS];
interface NFTMetadata {
    name: string;
    description: string;
    image: string | null;
}
interface VerificationSuccess {
    metadata: NFTMetadata | null; // Los metadatos reales del NFT.
    ownership: {
        owner: string;
        lastTransfer: { from: string, to: string } | null;
        network: NetworkFromSupported;
    };
    contractAddress: string;
    tokenId: string;
}
interface VerificationError {
    error: string;
    searchLog?: { network: string, status: string }[];
}
type VerificationResult = VerificationSuccess | VerificationError | null;

// --- FIX: Add prop types for component
interface VerificationPortalProps {
    initialTokenId?: string;
    initialContractAddress?: string;
    walletAddress: string;
    onConnect: () => void;
    catalog: Art[];
    setPage: (page: PageState) => void;
}

const VerificationPortal: React.FC<VerificationPortalProps> = ({ initialTokenId = '', initialContractAddress = '', walletAddress, onConnect, catalog, setPage }) => {
    const t = useTranslations();
    const [tokenIdInput, setTokenIdInput] = useState(initialTokenId);
    const [contractAddressInput, setContractAddressInput] = useState(initialContractAddress);
    const [result, setResult] = useState<VerificationResult>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [verifyingMessage, setVerifyingMessage] = useState('');
    const [showHelp, setShowHelp] = useState(false);
    const helpRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (initialTokenId && initialContractAddress) {
            handleMultiNetworkVerification();
        }
    }, [initialTokenId, initialContractAddress]);

     useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (helpRef.current && !helpRef.current.contains(event.target as Node)) {
                setShowHelp(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    
    const handleMultiNetworkVerification = async () => {
        const cleanContractAddress = contractAddressInput.trim();
        const cleanTokenId = tokenIdInput.trim();
        if (!cleanTokenId || !ethers.isAddress(cleanContractAddress)) {
            alert("Por favor, introduce una dirección de contrato y un ID de token válidos.");
            return;
        }
        
        setIsVerifying(true);
        setResult(null);

        let foundOwnership = null;
        const searchLog: { network: string, status: string }[] = [];
        let contractForMetadata: ethers.Contract | null = null;
        let foundNetwork: NetworkFromSupported | null = null;

        for (const network of Object.values(SUPPORTED_NETWORKS)) {
            setVerifyingMessage(t.searchingOn.replace('{network}', network.name));
            const ownershipResult = await getOwnershipDetails(cleanContractAddress, cleanTokenId, network);
            
            if (ownershipResult.status === 'found') {
                foundOwnership = { ...ownershipResult.data, network };
                foundNetwork = network;
                searchLog.push({ network: network.name, status: t.statusFound });
                break; // Detener la búsqueda al encontrar el primer resultado
            } else if (ownershipResult.status === 'not_found') {
                searchLog.push({ network: network.name, status: t.statusNotFound });
            } else { // 'error'
                searchLog.push({ network: network.name, status: t.statusError });
            }
        }
        
        if (foundOwnership && foundNetwork) {
            // Ahora que encontramos el dueño, intentamos obtener los metadatos
            setVerifyingMessage("Obteniendo metadatos del NFT...");
            const provider = Array.isArray(foundNetwork.rpcUrl)
                ? new ethers.FallbackProvider(foundNetwork.rpcUrl.map(url => new ethers.JsonRpcProvider(url)))
                : new ethers.JsonRpcProvider(foundNetwork.rpcUrl as string);
            
            const contract = new ethers.Contract(cleanContractAddress, CONTRACT_ABI, provider);
            const metadata = await getNFTMetadata(contract, cleanTokenId);

            setResult({
                metadata,
                ownership: foundOwnership,
                contractAddress: cleanContractAddress,
                tokenId: cleanTokenId
            });
        } else {
            setResult({ error: t.noArtFound, searchLog });
        }
        setIsVerifying(false);
        setVerifyingMessage('');
    };
    
    const renderHistory = () => {
        if (!result || 'error' in result || !result.ownership || !result.ownership.lastTransfer) {
            return null;
        }

        const { lastTransfer } = result.ownership;
        const isMint = lastTransfer.from === ethers.ZeroAddress;

        return (
            <div className="history-item">
                <p>
                    <strong>{t.from}</strong> 
                    {isMint ? <span className="mint-event">{t.mintEvent}</span> : lastTransfer.from}
                </p>
                <p><strong>{t.to}</strong> {lastTransfer.to}</p>
            </div>
        );
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
                            <code>opensea.io/assets/.../[TOKEN_ID]</code>
                        </div>
                    )}
                </div>
            </div>

            {isVerifying && <Loader text={verifyingMessage} />}

            {result && (
                 <div className={`verification-result ${'error' in result ? 'error' : ''}`}>
                    <h3>{t.verificationResult}</h3>
                    {'error' in result ? (
                        <>
                            <p>{result.error}</p>
                            {result.searchLog && (
                                <div className="search-log">
                                    <h4>{t.searchLogTitle}</h4>
                                    <ul>
                                        {result.searchLog.map(log => (
                                            <li key={log.network}>
                                                {log.network}: <span className={`status-${log.status.toLowerCase().replace(/\s+/g, '-')}`}>{log.status}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                           {result.metadata && (
                                <div className="catalog-info-section">
                                    <h4>{t.nftMetadataTitle}</h4>
                                    <div className="catalog-info-content">
                                        {result.metadata.image && <img src={result.metadata.image} alt={result.metadata.name} className="catalog-info-image" />}
                                        <div className="catalog-info-text">
                                            <p><strong>{result.metadata.name}</strong></p>
                                            <p className="artist-name"><em>{result.metadata.description}</em></p>
                                        </div>
                                    </div>
                                </div>
                           )}

                           <div className="blockchain-data-section">
                                <h4>{t.blockchainDataTitle}</h4>
                                <p className="network-info"><strong>{t.foundOn}</strong> {result.ownership.network.name}</p>
                                <p className="owner-info"><strong>{t.tokenId}</strong> {result.tokenId}</p>
                                <p className="owner-info"><strong>{t.contractAddress}</strong> {result.contractAddress}</p>
                                <p className="owner-info"><strong>{t.owner}</strong> {result.ownership.owner}</p>
                                
                                <h5>{t.history}</h5>
                                {renderHistory() || <p>No se encontró historial de transferencias.</p>}
                                
                                <a 
                                    href={`${result.ownership.network.blockExplorerUrl}/token/${contractAddressInput.trim()}?id=${tokenIdInput.trim()}`}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="explorer-link"
                                >
                                    {t.viewOnExplorer}
                                </a>
                           </div>
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

// --- FIX: Add prop types for component
interface CyberpunkEasterEggProps {
    onClose: () => void;
}
const CyberpunkEasterEgg: React.FC<CyberpunkEasterEggProps> = ({ onClose }) => {
    const lines = [
        "// ACCEDIENDO A CORE_IDENTITY.SYS...",
        "// CONEXIÓN ESTABLECIDA. DESCIFRANDO MANIFESTO...",
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
    // --- FIX: Add specific types for React state hooks
    const [page, setPage] = useState<PageState>({ name: 'gallery' });
    const [walletAddress, setWalletAddress] = useState('');
    const [network, setNetwork] = useState<NetworkInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [catalog, setCatalog] = useState<Art[]>([]);
    const [showEasterEgg, setShowEasterEgg] = useState(false);
    const t = useTranslations();
    
    const updateNetwork = async () => {
        if (!window.ethereum) return;
        const provider = new ethers.BrowserProvider(window.ethereum);
        const net = await provider.getNetwork();
        const chainId = `0x${net.chainId.toString(16)}`;
        const networkInfo = Object.values(SUPPORTED_NETWORKS).find(n => n.chainId === chainId);
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
    }, [walletAddress, t.unsupportedNetwork]);
    
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
    
    const handleSwitchNetwork = async (chainId: string) => {
        await switchNetwork(chainId);
    };
    
    const renderPage = () => {
        switch (page.name) {
            case 'detail':
                const art = catalog.find(a => a.id === page.id);
                // --- FIX: Ensure `art` is not undefined before passing to `ArtDetail`.
                // If the art piece is not found (e.g., due to a direct URL with an invalid ID),
                // it's safer to redirect to the gallery rather than risk a runtime error.
                if (!art) {
                    // Si el arte no se encuentra, vuelve a la galería.
                    setPage({ name: 'gallery' });
                    return <ArtGallery catalog={catalog} onSelectArt={(id) => setPage({ name: 'detail', id })} />;
                }
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

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);