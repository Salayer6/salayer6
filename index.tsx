import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
// Importamos nuestras nuevas funciones de blockchain
import {
    connectWallet,
    getOwnershipDetails,
    getTotalSupply
} from './blockchain.ts';


declare global {
    interface Window {
        ethereum?: any;
    }
}

// --- FUENTE DE DATOS (Catálogo de la Galería) ---
// NOTA DIDÁCTICA: La información "visual" (título, descripción, imagen)
// generalmente no se guarda en la blockchain por su alto costo. Se aloja
// en un servidor o en IPFS. El smart contract solo gestiona la PROPIEDAD.
// Por ahora, mantenemos este catálogo de forma local. Los 'tokenId' ahora
// son secuenciales a partir de '1' para coincidir con el contador del contrato.
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
        verifyDescription: 'Verifica la propiedad y el historial de una obra utilizando su ID de token único o conecta tu wallet para ver tu colección.',
        verifyByTokenId: 'Verificar por ID de Token',
        tokenIdPlaceholder: 'Ingresa el ID del Token (ej: 1)',
        or: 'o',
        myCollection: 'Mi Colección',
        connectToSee: 'Conecta tu wallet para ver tu colección',
        verificationResult: 'Resultado de la Verificación',
        owner: 'Propietario Actual:',
        history: 'Historial de Propiedad:',
        noArtFound: 'No se encontró arte para este ID o no existe en la blockchain.',
        noArtInWallet: 'No posees ninguna obra de esta colección en la wallet conectada.',
        footerText: '© 2024 Galería Abstracta Chile. Todos los derechos reservados.',
        loading: 'Cargando...',
        verifying: 'Verificando en la blockchain...'
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

const Header = ({ walletAddress, onConnect, setPage }) => {
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
                    <div className="wallet-address" title={walletAddress}>
                        {`${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`}
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
                    <button className="verify-button" onClick={() => setPage({ name: 'verify', tokenId: art.tokenId })}>
                        {t.verifyOnChain}
                    </button>
                </div>
            </div>
        </div>
    );
};

const VerificationPortal = ({ initialTokenId = '', walletAddress, onConnect, catalog, setPage }) => {
    const t = useTranslations();
    const [tokenIdInput, setTokenIdInput] = useState(initialTokenId);
    const [result, setResult] = useState(null);
    const [myCollection, setMyCollection] = useState([]);
    const [isVerifying, setIsVerifying] = useState(false);

    useEffect(() => {
        if (initialTokenId) {
            handleVerification();
        }
    }, [initialTokenId]);
    
    useEffect(() => {
       if (walletAddress) {
           setMyCollection([]);
           alert("La función 'Mi Colección' es computacionalmente costosa y no está implementada en esta fase. Se requiere un servicio de indexación para hacerlo de manera eficiente.");
       } else {
           setMyCollection([]);
       }
    }, [walletAddress]);


    const handleVerification = async () => {
        if (!tokenIdInput) return;
        setIsVerifying(true);
        setResult(null);

        const ownership = await getOwnershipDetails(tokenIdInput);
        
        if (ownership) {
            const art = catalog.find(a => a.tokenId === tokenIdInput);
            setResult({ art, ownership });
        } else {
            setResult({ error: t.noArtFound });
        }
        setIsVerifying(false);
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
                        value={tokenIdInput}
                        onChange={(e) => setTokenIdInput(e.target.value)}
                        placeholder={t.tokenIdPlaceholder}
                        disabled={isVerifying}
                    />
                    <button onClick={handleVerification} disabled={isVerifying || !tokenIdInput}>{t.verify}</button>
                </div>
            </div>

            {isVerifying && <Loader text={t.verifying} />}

            {result && (
                 <div className={`verification-result ${result.error ? 'error' : ''}`}>
                    <h3>{t.verificationResult}</h3>
                    {result.error ? <p>{result.error}</p> : (
                        <>
                           <p><strong>{result.art.title}</strong> por {result.art.artist}</p>
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
                    myCollection.length > 0 ? (
                       <div className="art-gallery-grid">
                           {myCollection.map(art => (
                               <ArtCard key={art.id} art={art} onSelect={() => setPage({ name: 'detail', id: art.id })} />
                           ))}
                       </div>
                    ) : <p>{t.noArtInWallet}</p>
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
    const [page, setPage] = useState<{ name: string; id?: number; tokenId?: string }>({ name: 'gallery' });
    const [walletAddress, setWalletAddress] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [catalog, setCatalog] = useState([]);
    const [showEasterEgg, setShowEasterEgg] = useState(false);
    const t = useTranslations();
    
    // Carga inicial de la app (con solución al problema de race condition de MetaMask)
    useEffect(() => {
        const loadGallery = async () => {
            const totalSupply = await getTotalSupply();
            if (totalSupply > 0) {
                const availableArt = artCatalog.filter(art => parseInt(art.tokenId, 10) <= totalSupply);
                setCatalog(availableArt);
            } else {
                console.warn("No se detectaron NFTs acuñados o no se pudo conectar. Mostrando catálogo completo como vista previa.");
                setCatalog(artCatalog);
            }
            setIsLoading(false);
        };
        
        // Damos un respiro más largo para asegurar que el provider de MetaMask (window.ethereum)
        // se inyecte en la página, evitando la condición de carrera en la carga inicial.
        const initTimeout = setTimeout(loadGallery, 1500);

        return () => clearTimeout(initTimeout); // Buena práctica: limpiar el timeout.
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
    
    const renderPage = () => {
        switch (page.name) {
            case 'detail':
                const art = catalog.find(a => a.id === page.id);
                if (!art) return <ArtGallery catalog={catalog} onSelectArt={(id) => setPage({ name: 'detail', id })} />;
                return <ArtDetail art={art} onBack={() => setPage({ name: 'gallery' })} setPage={setPage} />;
            case 'verify':
                return <VerificationPortal 
                    initialTokenId={page.tokenId} 
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
                <Header walletAddress={walletAddress} onConnect={handleConnectWallet} setPage={setPage} />
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
