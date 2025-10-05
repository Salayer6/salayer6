/**
 * COMENTARIO DIDÁCTICO: La Arquitectura de una Aplicación React Moderna
 *
 * Este archivo es el corazón de nuestra aplicación. Está escrito en TypeScript y JSX.
 * - TypeScript (`.ts`): Añade un sistema de tipos a JavaScript. Esto nos ayuda a evitar errores comunes,
 *   mejora el autocompletado del editor de código y hace que el código sea más legible y mantenible.
 * - JSX (`.tsx`): Es una extensión de JavaScript que nos permite escribir una sintaxis similar a HTML
 *   directamente en nuestro código. Facilita enormemente la creación de interfaces de usuario en React.
 *
 * La estructura de este archivo sigue un patrón común:
 * 1. Importaciones: Traemos las librerías y componentes que necesitamos.
 * 2. Declaraciones Globales: Extendemos tipos existentes (como el objeto `window`).
 * 3. Lógica de Negocio/Servicios: En este caso, toda la interacción con la blockchain. En una app más grande,
 *    esto estaría en archivos separados (ej. `services/blockchain.ts`).
 * 4. Definiciones de Tipos: `interfaces` y `types` que modelan los datos de nuestra aplicación.
 * 5. Constantes: Datos estáticos como catálogos o traducciones.
 * 6. Componentes: Bloques de UI reutilizables. Se dividen en componentes "tontos" (solo muestran datos)
 *    y "listos" (manejan estado y lógica).
 * 7. Componente Principal (`App`): El componente que orquesta toda la aplicación.
 * 8. Renderizado: El punto de entrada donde React se "engancha" al DOM del HTML.
 */

// --- 1. IMPORTACIONES ---
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { ethers } from "ethers";

// --- 2. DECLARACIONES GLOBALES ---
/*
 * COMENTARIO DIDÁCTICO: Tipado del Objeto `window`
 *
 * Por defecto, TypeScript no sabe que `window.ethereum` (el objeto inyectado por MetaMask)
 * existe. `declare global` nos permite "enseñarle" a TypeScript sobre esta propiedad,
 * evitando errores de compilación y permitiendo el autocompletado en todo el archivo.
 */
declare global {
    interface Window {
        ethereum?: any;
    }
}

// --- 3. LÓGICA DE BLOCKCHAIN ---

/**
 * COMENTARIO DIDÁCTICO: ¿Qué son el ABI y la Dirección del Contrato?
 *
 * Para interactuar con un Smart Contract en la blockchain, necesitamos dos cosas:
 * 1. La Dirección (Address): Es como la dirección de una casa. Identifica de forma única al contrato
 *    en la red de Ethereum. La que usamos aquí es la del famoso proyecto Bored Ape Yacht Club (BAYC).
 * 2. El ABI (Application Binary Interface): Es como el manual de instrucciones del contrato. Es un
 *    archivo JSON que describe todas las funciones públicas del contrato (ej. `ownerOf`, `totalSupply`)
 *    y los eventos que emite (ej. `Transfer`). Permite que librerías como ethers.js sepan cómo
 *    formatear las llamadas al contrato y cómo interpretar sus respuestas.
 */
const CONTRACT_ADDRESS = "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D";
const CONTRACT_ABI = [
    "function ownerOf(uint256 tokenId) view returns (address)",
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
    "function name() view returns (string)",
    "function totalSupply() view returns (uint256)",
    "function tokenURI(uint256 tokenId) view returns (string)"
];

// Constantes para las redes soportadas, facilitando el cambio y la configuración.
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
 * COMENTARIO DIDÁCTICO: El Objeto Contrato de Ethers.js
 *
 * Esta función es una "fábrica" que nos crea un objeto `Contract` de ethers.js.
 * Este objeto es nuestra puerta de enlace para llamar a las funciones del Smart Contract.
 * Requiere la dirección, el ABI y un "proveedor" (Provider).
 *
 * ¿Qué es un Provider?
 * Es nuestra conexión a la blockchain. Hay varios tipos:
 * - `BrowserProvider`: Se conecta a través de la wallet del usuario en el navegador (MetaMask).
 *   Permite leer datos y también solicitar al usuario que firme transacciones.
 * - `JsonRpcProvider`: Se conecta directamente a un nodo de la blockchain a través de una URL RPC.
 *   Es solo para leer datos (read-only).
 * - `FallbackProvider`: Un proveedor avanzado que puede conectarse a múltiples URLs RPC. Si una falla,
 *   automáticamente intenta con la siguiente. Aumenta la resiliencia de nuestra aplicación.
 */
const getContract = (address: string, network: { rpcUrl: string | string[] } | null = null) => {
    if (!address || !ethers.isAddress(address)) {
        console.error("La dirección del contrato no es válida.");
        return null;
    }
    if (network) {
        const provider = Array.isArray(network.rpcUrl)
            ? new ethers.FallbackProvider(network.rpcUrl.map(url => new ethers.JsonRpcProvider(url)))
            : new ethers.JsonRpcProvider(network.rpcUrl as string);
        return new ethers.Contract(address, CONTRACT_ABI, provider);
    }
    if (typeof window.ethereum === 'undefined') {
        console.error("MetaMask no está instalado.");
        return null;
    }
    const provider = new ethers.BrowserProvider(window.ethereum);
    return new ethers.Contract(address, CONTRACT_ABI, provider);
};

/**
 * COMENTARIO DIDÁCTICO: Asincronía y Promesas (`async`/`await`)
 *
 * Las interacciones con la blockchain (o cualquier red) no son instantáneas. Toman tiempo.
 * JavaScript maneja estas operaciones asíncronas con "Promesas" (Promises).
 * `async`/`await` es una sintaxis moderna que nos permite trabajar con promesas de una manera
 * que parece síncrona, haciendo el código mucho más fácil de leer y escribir.
 * - `async function`: Declara una función que devolverá una Promesa.
 * - `await`: Pausa la ejecución de la función hasta que la Promesa se resuelva (o se rechace).
 *   Solo se puede usar dentro de una `async function`.
 * - `try...catch`: Es la forma estándar de manejar errores en código síncrono y asíncrono con `await`.
 *   Si la promesa es rechazada (hay un error), el control salta al bloque `catch`.
 */
const connectWallet = async (): Promise<string | null> => {
    if (typeof window.ethereum === 'undefined') {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        // COMENTARIO DIDÁCTICO: Mejorando la UX en Móviles (Deep Linking)
        // En lugar de solo decir "instala MetaMask", intentamos abrir la app directamente si ya está instalada,
        // o llevar al usuario a la tienda de apps si no lo está. Esto reduce la fricción.
        if (isMobile) {
            const dappUrl = window.location.host.replace(/:\d+$/, '');
            const metamaskAppDeepLink = `https://metamask.app.link/dapp/${dappUrl}`;
            window.location.href = metamaskAppDeepLink;
            return null;
        } else {
            if (confirm("MetaMask no detectado. Para interactuar con la funcionalidad blockchain de este sitio, necesitas la extensión de MetaMask. ¿Quieres ir a la página de descarga oficial?")) {
                window.open("https://metamask.io/download/", "_blank");
            }
            return null;
        }
    }
    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []); // Solicita al usuario que conecte su wallet.
        return accounts[0] || null;
    } catch (error) {
        console.error("El usuario rechazó la solicitud de conexión:", error);
        return null;
    }
};


/**
 * COMENTARIO DIDÁCTICO: Genéricos en TypeScript y Resiliencia de Red
 *
 * `<T,>`: Esta es una función genérica. `T` es un "tipo de marcador de posición".
 * Significa que esta función puede trabajar con cualquier tipo de dato que devuelva la
 * función `fn`, y TypeScript entenderá y preservará ese tipo. La coma extra `<T,>`
 * es una peculiaridad de la sintaxis en archivos `.tsx` para diferenciarla de un componente JSX.
 *
 * Esta función `retryAsync` es un ejemplo de "programación defensiva". Las redes (especialmente
 * las blockchains públicas) pueden fallar. En lugar de fallar al primer intento, esta función
 * reintenta la operación varias veces antes de darse por vencida. Esto hace que nuestra
 * aplicación sea mucho más robusta y confiable para el usuario final.
 */
const retryAsync = async <T,>(
    fn: () => Promise<T>,
    retries = 2,
    delay = 500
): Promise<T> => {
    let lastError: Error | null = null;
    for (let i = 0; i <= retries; i++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;
            if (i < retries) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    throw lastError;
};

const getOwnershipDetails = async (contractAddress: string, tokenId: string, network: { name: string, rpcUrl: string | string[] }) => {
    const provider = Array.isArray(network.rpcUrl)
        ? new ethers.FallbackProvider(network.rpcUrl.map(url => new ethers.JsonRpcProvider(url)))
        : new ethers.JsonRpcProvider(network.rpcUrl as string);

    // Verificación de existencia del contrato: una optimización para no hacer llamadas innecesarias.
    try {
        const code = await retryAsync(() => provider.getCode(contractAddress));
        if (code === '0x') return { status: 'not_found' }; // '0x' significa que no hay código en esa dirección.
    } catch (error: any) {
        console.error(`Error al verificar el código del contrato en ${network.name}:`, error);
        return { status: 'error', message: `No se pudo conectar a ${network.name}.` };
    }

    const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, provider);
    let owner;

    // Obtención del propietario: la funcionalidad principal.
    try {
        owner = await retryAsync(() => contract.ownerOf(tokenId));
    } catch (error: any) {
        // Manejo de errores específicos de la blockchain.
        if (error.code === 'CALL_EXCEPTION' || (error.info?.error?.message || '').includes('owner query for nonexistent token')) {
            return { status: 'not_found' };
        }
        console.error(`Error al obtener el propietario en ${network.name}:`, error);
        return { status: 'error', message: error.message };
    }

    // COMENTARIO DIDÁCTICO: Mejora Progresiva (Progressive Enhancement)
    // El historial y la metadata son "extras". Si fallan, la funcionalidad principal (verificar
    // el propietario) no se ve afectada. El `try...catch` aquí solo muestra una advertencia
    // (`console.warn`) en lugar de detener todo. Esto hace la app más resiliente.
    let lastTransfer = null;
    try {
        const transferEvents = await contract.queryFilter(contract.filters.Transfer(null, null, tokenId), 0, 'latest');
        if (transferEvents.length > 0) {
            const latestEvent = transferEvents[transferEvents.length - 1] as ethers.EventLog;
            if (latestEvent.args) {
                lastTransfer = { from: latestEvent.args.from, to: latestEvent.args.to };
            }
        }
    } catch (error: any) {
        console.warn(`No se pudo obtener el historial en ${network.name}.`, error);
    }

    let metadata = null;
    try {
        const tokenURI = await contract.tokenURI(tokenId);
        // COMENTARIO DIDÁCTICO: Manejo de IPFS
        // Muchos NFTs alojan su metadata en IPFS (InterPlanetary File System). Las URLs `ipfs://`
        // no son accesibles directamente por los navegadores. Las convertimos a una URL de una
        // "pasarela" (gateway) pública de IPFS como `ipfs.io` para poder hacer el `fetch`.
        const metadataUrl = tokenURI.startsWith('ipfs://')
            ? tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/')
            : tokenURI;
        
        const response = await fetch(metadataUrl);
        if (response.ok) {
            const data = await response.json();
            const imageUrl = data.image && data.image.startsWith('ipfs://')
                ? data.image.replace('ipfs://', 'https://ipfs.io/ipfs/')
                : data.image;

            metadata = { name: data.name, description: data.description, image: imageUrl };
        }
    } catch (error) {
        console.warn(`No se pudo obtener la metadata (tokenURI) en ${network.name}.`, error);
    }

    return { status: 'found', data: { owner, lastTransfer, metadata } };
};

const getTotalSupply = async (): Promise<number> => {
    const contract = getContract(CONTRACT_ADDRESS, DEFAULT_NETWORK); 
    if (!contract) return 0;
    try {
        const totalSupply = await retryAsync(() => contract.totalSupply());
        return Number(totalSupply);
    } catch (error) {
        console.error("Error al obtener el total supply:", error);
        return 0;
    }
}

const switchNetwork = async (chainId: string) => {
    if (!window.ethereum) return;
    try {
        // Llama a una función específica de la API de MetaMask para solicitar el cambio de red.
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId }],
        });
    } catch (switchError) {
        console.error("Error al cambiar de red:", switchError);
    }
};

// --- 4. DEFINICIONES DE TIPOS ---
/*
 * COMENTARIO DIDÁCTICO: Modelando los Datos con Interfaces
 *
 * `interface` es una construcción de TypeScript que nos permite definir la "forma" de un objeto.
 * Es un contrato que dice "cualquier objeto de tipo 'Art' debe tener estas propiedades con estos tipos".
 * - Mejora la legibilidad: Cualquiera puede ver qué datos componen una obra de arte.
 * - Previene errores: TypeScript nos avisará si intentamos acceder a una propiedad que no existe
 *   (ej. `art.color`) o si le pasamos un tipo de dato incorrecto.
 * - Facilita el desarrollo: El autocompletado del editor funciona a la perfección.
 */
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

// Un "tipo de unión discriminada" para manejar el estado de la página.
// Cada objeto tiene una propiedad `name` que nos permite saber en qué página estamos.
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

// --- 5. CONSTANTES ---
const artCatalog: Art[] = [
    { id: 1, tokenId: '1', title: 'Ecos Cósmicos', artist: 'Elena Valdés', priceCLP: '450.000', priceETH: '0.25', imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzOTurlV7fDB8MXxzZWFyY2h8N3x8YWJzdHJhY3QlMjBwYWludGluZ3xlbnwwfHx8fDE3MTU2MzM4MTB8MA&ixlib=rb-4.0.3&q=80&w=400', description: 'Una exploración vibrante de la creación y la destrucción en el universo, utilizando acrílicos sobre lienzo de 100x120cm.' },
    { id: 2, tokenId: '2', title: 'Frontera Líquida', artist: 'Javier Ríos', priceCLP: '620.000', priceETH: '0.35', imageUrl: 'https://images.unsplash.com/photo-1536924430914-94f33bd6a133?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzOTurlV7fDB8MXxzZWFyY2h8MTF8fGFic3RyYWN0JTIwcGFpbnRpbmd8ZW58MHx8fHwxNzE1NjMzODEwfDA&ixlib=rb-4.0.3&q=80&w=400', description: 'Obra que captura la tensión entre la calma y el caos, representada a través de fluidos de tinta sobre papel de alto gramaje.' },
    { id: 3, tokenId: '3', title: 'Nostalgia Urbana', artist: 'Sofía Castillo', priceCLP: '380.000', priceETH: '0.21', imageUrl: 'https://images.unsplash.com/photo-1578301978018-30057590f48f7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzOTurlV7fDB8MXxzZWFyY2h8MTd8fGFic3RyYWN0JTIwcGFpbnRpbmd8ZW58MHx8fHwxNzE1NjMzODEwfDA&ixlib=rb-4.0.3&q=80&w=400', description: 'Un collage de emociones que evoca los recuerdos fragmentados de una ciudad bulliciosa. Técnica mixta sobre madera.' },
    { id: 4, tokenId: '4', title: 'El Jardín Silente', artist: 'Elena Valdés', priceCLP: '750.000', priceETH: '0.42', imageUrl: 'https://images.unsplash.com/photo-1552554623-74b86f6580e6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzOTurlV7fDB8MXxzZWFyY2h8MjZ8fGFic3RyYWN0JTIwcGFpbnRpbmd8ZW58MHx8fHwxNzE1NjMzODQxfDA&ixlib=rb-4.0.3&q=80&w=400', description: 'Capas de óleo que construyen un paisaje onírico y tranquilo, invitando a la introspección. Dimensiones 150x100cm.' },
    { id: 5, tokenId: '5', title: 'Ritmo Quebrado', artist: 'Carlos Mendoza', priceCLP: '510.000', priceETH: '0.29', imageUrl: 'https://images.unsplash.com/photo-1502537233324-179a83446b23?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzOTurlV7fDB8MXxzZWFyY2h8MzB8fGFic3RyYWN0JTIwcGFpbnRpbmd8ZW58MHx8fHwxNzE1NjMzODQxfDA&ixlib=rb-4.0.3&q=80&w=400', description: 'La improvisación del jazz hecha pintura. Trazos enérgicos y colores contrastantes sobre lienzo.' },
    { id: 6, tokenId: '6', title: 'Amanecer Digital', artist: 'Javier Ríos', priceCLP: '890.000', priceETH: '0.50', imageUrl: 'https://images.unsplash.com/photo-1549490349-8643362247b5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzOTurlV7fDB8MXxzZWFyY2h8NDF8fGFic3RyYWN0JTIwcGFpbnRpbmd8ZW58MHx8fHwxNzE1NjMzODQxfDA&ixlib=rb-4.0.3&q=80&w=400', description: 'Una obra a gran escala que interpreta la fusión entre la naturaleza y la tecnología en la era moderna.' }
];

const translations = {
    es: { gallery: 'Galería', verify: 'Verificar Autenticidad', connectWallet: 'Conectar Wallet', walletConnected: 'Wallet Conectada', viewDetails: 'Ver Detalles', buyNow: 'Adquirir', verifyOnChain: 'Verificar en Blockchain', backToGallery: '← Volver a la Galería', verifyTitle: 'Portal de Verificación de Autenticidad', verifyDescription: 'La unicidad de un NFT se define por su Contrato y su ID de Token. Introduce ambos para verificar la propiedad en la blockchain.', verifyByTokenId: 'Verificar un NFT', tokenIdPlaceholder: 'Ingresa el ID del Token (ej: 346)', contractAddressPlaceholder: 'Pega la dirección de cualquier contrato NFT', or: 'o', myCollection: 'Mi Colección', connectToSee: 'Conecta tu wallet para ver tu colección', verificationResult: 'Resultado de la Verificación', owner: 'Propietario Actual:', history: 'Última Transacción Registrada', noArtFound: 'No se encontraron datos para esta combinación de Contrato y Token ID. Verifica que ambos sean correctos.', noArtInWallet: 'No posees ninguna obra de esta colección en la wallet conectada.', myCollectionDisabled: "La función 'Mi Colección' es computacionalmente costosa y no está implementada en esta fase. Se requiere un servicio de indexación para hacerlo de manera eficiente.", footerText: '© 2024 Galería Abstracta Chile. Todos los derechos reservados.', loading: 'Cargando...', verifying: 'Verificando en la blockchain...', howToFindTokenId: '¿Cómo encuentro el ID del Token?', tokenIdHelpTitle: 'Para encontrar el ID del Token de un NFT:', tokenIdHelpText: 'Ve a la página del NFT en un marketplace como OpenSea. El ID del Token es el último número que aparece en la URL.', unsupportedNetwork: 'Red Desconocida', switchTo: 'Cambiar a', searchingOn: 'Buscando en {network}...', foundOn: 'Encontrado en la red:', from: 'De:', to: 'Para:', mintEvent: 'Acuñación (Creación del NFT)', viewOnExplorer: 'Ver en Explorador de Bloques', searchLogTitle: 'Registro de Búsqueda:', statusFound: 'Encontrado', statusNotFound: 'No Encontrado', statusError: 'Error de Red' }
};
const useTranslations = () => translations.es;


// --- 6. COMPONENTES ---

/**
 * COMENTARIO DIDÁCTICO: Componentes Funcionales y Props
 *
 * `Loader` es un "componente funcional". En React moderno, casi todos los componentes son funciones.
 * - Recibe un objeto de `props` (propiedades) como argumento.
 * - Devuelve JSX que describe qué debe renderizar.
 * - `React.FC<LoaderProps>`: Usamos TypeScript para definir la "forma" de las props.
 *   `FC` significa Functional Component. Esto nos da autocompletado y verificación de tipos para las props.
 * - `aria-label`: Un atributo de accesibilidad importante. Proporciona una etiqueta textual para
 *   elementos no textuales (como nuestro spinner), para que los lectores de pantalla puedan describirlo.
 */
interface LoaderProps { text?: string; }
const Loader: React.FC<LoaderProps> = ({ text = '' }) => {
    const t = useTranslations();
    return (
        <div className="loader-container">
            <div className="loader" aria-label={t.loading}></div>
            {text && <p className="loader-text">{text}</p>}
        </div>
    );
};

interface NetworkIndicatorProps { network: NetworkInfo | null; onSwitch: (chainId: string) => void; }
const NetworkIndicator: React.FC<NetworkIndicatorProps> = ({ network, onSwitch }) => {
    const t = useTranslations();
    // COMENTARIO DIDÁCTICO: El Hook `useState`
    // `useState` nos permite añadir "estado" a un componente funcional. El estado son datos que
    // pueden cambiar con el tiempo y que, cuando cambian, provocan que el componente se vuelva a renderizar.
    // - `isOpen`: Es la variable de estado.
    // - `setIsOpen`: Es la función para actualizar esa variable.
    // - `useState(false)`: `false` es el valor inicial del estado.
    const [isOpen, setIsOpen] = useState(false);

    // COMENTARIO DIDÁCTICO: El Hook `useRef`
    // `useRef` puede usarse para obtener una referencia directa a un elemento del DOM.
    // A diferencia del estado, cambiar una `ref` NO provoca una nueva renderización.
    // Aquí lo usamos para detectar clics fuera del dropdown y poder cerrarlo.
    const dropdownRef = useRef<HTMLDivElement>(null);

    // COMENTARIO DIDÁCTICO: El Hook `useEffect`
    // `useEffect` nos permite ejecutar "efectos secundarios" en nuestros componentes.
    // Un efecto secundario es cualquier código que afecta a algo fuera del propio componente,
    // como suscripciones, timers, o manipulación directa del DOM (como añadir un event listener).
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Si el clic fue fuera del elemento referenciado por `dropdownRef`, cerramos el menú.
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        // Añadimos el listener cuando el componente se monta.
        document.addEventListener('mousedown', handleClickOutside);
        // COMENTARIO DIDÁCTICO: La Función de Limpieza de `useEffect`
        // La función que se retorna desde `useEffect` es la "función de limpieza".
        // React la ejecuta cuando el componente se "desmonta" (se elimina de la UI).
        // Es crucial para evitar "memory leaks" (fugas de memoria), como tener event listeners
        // que siguen existiendo después de que el componente ha desaparecido.
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []); // El array vacío `[]` significa que este efecto solo se ejecuta una vez, al montar el componente.

    if (!network) return null;

    // FIX: Define isSupported to check if the current network is in the list of supported networks.
    const isSupported = network.name !== t.unsupportedNetwork;

    // COMENTARIO DIDÁCTICO: Renderizado Condicional
    // En JSX, podemos usar operadores de JavaScript como el ternario (`condición ? A : B`) o el `&&`
    // para decidir qué renderizar.
    // - `isSupported ? 'supported' : 'unsupported'`: Cambia la clase CSS basado en una condición.
    // - `isOpen && (...)`: El dropdown solo se renderiza si `isOpen` es `true`.
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

interface HeaderProps { walletAddress: string; onConnect: () => void; setPage: (page: PageState) => void; network: NetworkInfo | null; onSwitchNetwork: (chainId: string) => void; }
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

interface ArtCardProps { art: Art; onSelect: (id: number) => void; }
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

interface ArtGalleryProps { catalog: Art[]; onSelectArt: (id: number) => void; }
const ArtGallery: React.FC<ArtGalleryProps> = ({ catalog, onSelectArt }) => {
    return (
        <div className="art-gallery-grid">
            {/*
              COMENTARIO DIDÁCTICO: Renderizando Listas con `.map()` y la Prop `key`

              Para renderizar una lista de elementos en React, lo común es usar el método `.map()` de los arrays.
              - `catalog.map(art => ...)`: Itera sobre cada `art` en el `catalog` y devuelve un componente `<ArtCard>` por cada uno.
              - `key={art.id}`: La prop `key` es crucial. React la utiliza para identificar de forma única cada
                elemento en la lista. Esto le permite optimizar las actualizaciones, inserciones y eliminaciones
                de elementos sin tener que volver a renderizar toda la lista. La `key` debe ser un string o
                número único y estable entre renderizados. El `id` del elemento es la elección perfecta.
            */}
            {catalog.map(art => (
                <React.Fragment key={art.id}>
                    <ArtCard art={art} onSelect={onSelectArt} />
                </React.Fragment>
            ))}
        </div>
    );
};

interface ArtDetailProps { art: Art; onBack: () => void; setPage: (page: PageState) => void; }
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

// Tipos más específicos para el estado del resultado de la verificación.
type NetworkFromSupported = typeof SUPPORTED_NETWORKS[keyof typeof SUPPORTED_NETWORKS];
interface VerificationSuccess {
    art: Art | { title: string, artist: string };
    ownership: { owner: string; lastTransfer: { from: string, to: string } | null; network: NetworkFromSupported; metadata?: { name?: string; description?: string; image?: string; } }
}
interface VerificationError { error: string; searchLog?: { network: string, status: string }[]; }
type VerificationResult = VerificationSuccess | VerificationError | null;

interface VerificationPortalProps { initialTokenId?: string; initialContractAddress?: string; walletAddress: string; onConnect: () => void; catalog: Art[]; setPage: (page: PageState) => void; }
const VerificationPortal: React.FC<VerificationPortalProps> = ({ initialTokenId = '', initialContractAddress = '', walletAddress, onConnect, catalog, setPage }) => {
    const t = useTranslations();
    const [tokenIdInput, setTokenIdInput] = useState(initialTokenId);
    const [contractAddressInput, setContractAddressInput] = useState(initialContractAddress);
    const [result, setResult] = useState<VerificationResult>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [verifyingMessage, setVerifyingMessage] = useState('');
    const [showHelp, setShowHelp] = useState(false);
    const helpRef = useRef<HTMLDivElement>(null);

    // Este `useEffect` se dispara si el componente se renderiza con un `initialTokenId`,
    // por ejemplo, al venir desde la página de detalle de una obra.
    useEffect(() => {
        if (initialTokenId && initialContractAddress) {
            handleMultiNetworkVerification();
        }
    }, [initialTokenId, initialContractAddress]); // El array de dependencias asegura que solo se ejecute si estos valores cambian.

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

        // Itera sobre todas las redes soportadas para buscar el NFT.
        for (const network of Object.values(SUPPORTED_NETWORKS)) {
            setVerifyingMessage(t.searchingOn.replace('{network}', network.name));
            const ownershipResult = await getOwnershipDetails(cleanContractAddress, cleanTokenId, network);
            
            if (ownershipResult.status === 'found') {
                foundOwnership = { ...ownershipResult.data, network };
                searchLog.push({ network: network.name, status: t.statusFound });
                break; // Detiene la búsqueda al encontrar el primer resultado.
            } else if (ownershipResult.status === 'not_found') {
                searchLog.push({ network: network.name, status: t.statusNotFound });
            } else {
                searchLog.push({ network: network.name, status: t.statusError });
            }
        }
        
        if (foundOwnership) {
            const art = cleanContractAddress.toLowerCase() === CONTRACT_ADDRESS.toLowerCase() 
                ? catalog.find(a => a.tokenId === cleanTokenId)
                : { title: foundOwnership.metadata?.name || `Token ID: ${cleanTokenId}`, artist: `Contrato: ${cleanContractAddress}` };
            setResult({ art: art!, ownership: foundOwnership });
        } else {
            setResult({ error: t.noArtFound, searchLog });
        }
        setIsVerifying(false);
        setVerifyingMessage('');
    };
    
    const renderHistory = () => {
        if (!result || 'error' in result || !result.ownership || !result.ownership.lastTransfer) return null;
        const { lastTransfer } = result.ownership;
        const isMint = lastTransfer.from === ethers.ZeroAddress; // Una transferencia desde la dirección cero significa que el token fue creado (acuñado).
        return (
            <div className="history-item">
                <p><strong>{t.from}</strong> {isMint ? <span className="mint-event">{t.mintEvent}</span> : lastTransfer.from}</p>
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
                    <input type="text" value={contractAddressInput} onChange={(e) => setContractAddressInput(e.target.value)} placeholder={t.contractAddressPlaceholder} disabled={isVerifying} />
                </div>
                 <div className="form-group-wrapper" ref={helpRef}>
                    <div className="form-group">
                        <input type="text" value={tokenIdInput} onChange={(e) => setTokenIdInput(e.target.value)} placeholder={t.tokenIdPlaceholder} disabled={isVerifying} />
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
                                    <ul>{result.searchLog.map(log => (<li key={log.network}>{log.network}: <span className={`status-${log.status.toLowerCase().replace(/\s+/g, '-')}`}>{log.status}</span></li>))}</ul>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                           {result.ownership.metadata?.image && (<div className="verification-image-wrapper"><img src={result.ownership.metadata.image} alt={result.art.title} className="verification-image" /></div>)}
                           <p><strong>{result.art.title}</strong></p>
                           <p className="owner-info"><em>{result.art.artist}</em></p>
                           {result.ownership.metadata?.description && (<p className="metadata-description">{result.ownership.metadata.description}</p>)}
                           <p className="network-info"><strong>{t.foundOn}</strong> {result.ownership.network.name}</p>
                           <p className="owner-info"><strong>{t.owner}</strong> {result.ownership.owner}</p>
                           <h4>{t.history}</h4>
                           {renderHistory()}
                           <a href={`${result.ownership.network.blockExplorerUrl}/token/${contractAddressInput.trim()}?id=${tokenIdInput.trim()}`} target="_blank" rel="noopener noreferrer" className="explorer-link">{t.viewOnExplorer}</a>
                        </>
                    )}
                 </div>
            )}
            <div className="separator">{t.or}</div>
            <div className="verifier-box">
                <h2>{t.myCollection}</h2>
                {walletAddress ? (<p className="disabled-feature-notice">{t.myCollectionDisabled}</p>) : (<button onClick={onConnect} className="connect-wallet-btn">{t.connectToSee}</button>)}
            </div>
        </div>
    );
};

interface CyberpunkEasterEggProps { onClose: () => void; }
const CyberpunkEasterEgg: React.FC<CyberpunkEasterEggProps> = ({ onClose }) => {
    const lines = [ "// ACCEDIENDO A CORE_IDENTITY.SYS...", "// CONEXIÓN ESTABLECIDA. DESCIFRANDO MANIFESTO...", "> En la intersección del arte y el código, nosotros existimos.", "> Misión: Vincular la expresión humana a la verdad inmutable de la cadena de bloques.", "> Somos un colectivo de creadores y tecnólogos que creen que la procedencia es un derecho, no un privilegio.", "> Cada token es una promesa. Cada transacción, una historia.", "> Has vislumbrado el código fuente de nuestra convicción.", "> El futuro del arte es verificable.", "// FIN DE LA TRANSMISIÓN." ];
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

// FIX: Define the Footer component.
const Footer: React.FC = () => {
    const t = useTranslations();
    return (
        <footer className="app-footer">
            <p>{t.footerText}</p>
        </footer>
    );
};

// --- 7. COMPONENTE PRINCIPAL (APP) ---
/**
 * COMENTARIO DIDÁCTICO: El Componente Orquestador (`App`)
 *
 * `App` es el componente de más alto nivel. No renderiza mucha UI por sí mismo, sino que
 * su principal responsabilidad es:
 * 1. Manejar el estado global de la aplicación: Qué página se está mostrando (`page`),
 *    la dirección de la wallet conectada (`walletAddress`), la red actual (`network`), etc.
 * 2. Contener la lógica principal de la aplicación: Funciones como `handleConnectWallet`
 *    que modifican el estado global.
 * 3. Pasar el estado y las funciones a los componentes hijos a través de props. Este patrón
 *    se conoce como "levantar el estado" (lifting state up).
 * 4. Orquestar qué componente de página se debe renderizar basado en el estado actual (`renderPage`).
 */
const App = () => {
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
        setNetwork({ chainId, name: networkInfo ? networkInfo.name : t.unsupportedNetwork });
    };
    
    useEffect(() => {
        if(walletAddress) updateNetwork();
        if (window.ethereum) {
            // MetaMask emite este evento cuando el usuario cambia de red.
            const handleChainChanged = () => window.location.reload(); // La forma más simple de manejarlo es recargar la app.
            window.ethereum.on('chainChanged', handleChainChanged);
            return () => window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
    }, [walletAddress, t.unsupportedNetwork]);
    
    // `useEffect` para la carga inicial de datos.
    useEffect(() => {
        const initializeApp = async () => {
            try {
                // Filtramos el catálogo para mostrar solo los NFTs que han sido "acuñados" (existen on-chain).
                const totalSupply = await getTotalSupply();
                setCatalog(totalSupply > 0 ? artCatalog.filter(art => parseInt(art.tokenId, 10) <= totalSupply) : artCatalog);
            } catch (error) {
                console.error("No se pudo conectar a la blockchain. Mostrando catálogo en modo vista previa.", error);
                setCatalog(artCatalog);
            }
            setIsLoading(false);
        };
        initializeApp();
    }, []); // El `[]` asegura que esto se ejecute solo una vez.

    // `useEffect` para el "easter egg".
    useEffect(() => {
        const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
        let index = 0;
        let touchStartX = 0, touchStartY = 0;
    
        const processInput = (key: string) => {
            if (key.toLowerCase() === konamiCode[index].toLowerCase()) {
                index++;
                if (index === konamiCode.length) {
                    setShowEasterEgg(true);
                    index = 0;
                }
            } else { index = 0; }
        };

        const keyHandler = (event: KeyboardEvent) => processInput(event.key);
        const touchStartHandler = (event: TouchEvent) => {
            touchStartX = event.changedTouches[0].screenX;
            touchStartY = event.changedTouches[0].screenY;
            if (event.touches.length === 2) processInput('b'); // Dos dedos para 'B'
        };
        const touchEndHandler = (event: TouchEvent) => {
            const deltaX = event.changedTouches[0].screenX - touchStartX;
            const deltaY = event.changedTouches[0].screenY - touchStartY;
            const swipeThreshold = 50;
            if (Math.abs(deltaX) > swipeThreshold || Math.abs(deltaY) > swipeThreshold) {
                if (Math.abs(deltaX) > Math.abs(deltaY)) processInput(deltaX > 0 ? 'ArrowRight' : 'ArrowLeft');
                else processInput(deltaY > 0 ? 'ArrowDown' : 'ArrowUp');
            } else if (event.touches.length === 0) processInput('a'); // Un toque para 'A'
        };

        window.addEventListener('keydown', keyHandler);
        window.addEventListener('touchstart', touchStartHandler);
        window.addEventListener('touchend', touchEndHandler);

        return () => {
            window.removeEventListener('keydown', keyHandler);
            window.removeEventListener('touchstart', touchStartHandler);
            window.removeEventListener('touchend', touchEndHandler);
        };
    }, []);

    const handleConnectWallet = async () => {
        const address = await connectWallet();
        if (address) setWalletAddress(address);
    };
    
    const handleSwitchNetwork = async (chainId: string) => {
        await switchNetwork(chainId);
    };
    
    const renderPage = () => {
        switch (page.name) {
            case 'detail':
                const art = catalog.find(a => a.id === page.id);
                if (!art) return <ArtGallery catalog={catalog} onSelectArt={(id) => setPage({ name: 'detail', id })} />;
                return <ArtDetail art={art} onBack={() => setPage({ name: 'gallery' })} setPage={setPage} />;
            case 'verify':
                return <VerificationPortal initialTokenId={page.tokenId} initialContractAddress={page.contractAddress} walletAddress={walletAddress} onConnect={handleConnectWallet} catalog={catalog} setPage={setPage} />;
            case 'gallery':
            default:
                return <ArtGallery catalog={catalog} onSelectArt={(id) => setPage({ name: 'detail', id })} />;
        }
    };

    return (
        // `React.Fragment` (`<>`) nos permite devolver múltiples elementos sin añadir un nodo extra al DOM.
        <>
            {showEasterEgg && <CyberpunkEasterEgg onClose={() => setShowEasterEgg(false)} />}
            <div className="app-container">
                <Header walletAddress={walletAddress} onConnect={handleConnectWallet} setPage={setPage} network={network} onSwitchNetwork={handleSwitchNetwork} />
                <main>
                    {isLoading ? <Loader text={t.loading} /> : renderPage()}
                </main>
            </div>
            <Footer />
        </>
    );
};

// --- 8. RENDERIZADO DE LA APLICACIÓN ---
/**
 * COMENTARIO DIDÁCTICO: El "Root" de la Aplicación
 *
 * Esta es la línea que conecta nuestra aplicación de React con el archivo HTML.
 * - `ReactDOM.createRoot()`: Crea una "raíz" de renderizado de React en el elemento del DOM
 *   con el id 'root' (que definimos en `index.html`).
 * - `.render(<App />)`: Le dice a React que renderice nuestro componente `App` principal
 *   (y todos sus componentes hijos) dentro de esa raíz.
 */
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);