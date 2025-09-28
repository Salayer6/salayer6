import { ethers } from "ethers";

/*
 * Documentación Didáctica (ethers.js):
 * ethers.js es una librería que nos permite interactuar con la blockchain de Ethereum (y compatibles).
 * Simplifica enormemente el proceso de enviar transacciones y leer datos de los contratos.
 */

// 1. LA DIRECCIÓN DEL CONTRATO
// ----------------------------
// Cuando despliegas un smart contract en la blockchain, se le asigna una dirección única.
// Debes reemplazar este valor con la dirección de TU contrato una vez desplegado.
export const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000"; // <--- REEMPLAZAR ESTO

// 2. EL ABI (Application Binary Interface)
// ----------------------------------------
// El ABI es como el "menú de funciones" de un smart contract. Es un archivo JSON que le
// dice a nuestro código JavaScript qué funciones están disponibles en el contrato y cómo llamarlas.
// Esto se genera automáticamente cuando compilas tu contrato con herramientas como Hardhat o Remix.
// Para este ejemplo, lo definimos a mano con las funciones que nos interesan.
export const CONTRACT_ABI = [
    // Función para obtener el propietario de un token
    "function ownerOf(uint256 tokenId) view returns (address)",
    // Evento que se emite cuando se transfiere un token (útil para historial)
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
    // Función para obtener el nombre de la colección
    "function name() view returns (string)",
    // Función para obtener el total de NFTs acuñados
    "function totalSupply() view returns (uint256)"
];


/**
 * Crea una "instancia" del contrato con la que podemos interactuar.
 * @returns Un objeto de contrato de ethers.js, o null si MetaMask no está disponible.
 */
const getContract = () => {
    if (typeof window.ethereum === 'undefined') {
        console.error("MetaMask no está instalado.");
        return null;
    }
    // El 'provider' es nuestra conexión a la blockchain (a través de MetaMask).
    const provider = new ethers.BrowserProvider(window.ethereum);
    // El 'contract' es el objeto que nos permite llamar a las funciones del smart contract.
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    return contract;
};


/**
 * Conecta la wallet de MetaMask y devuelve la dirección del usuario.
 * @returns La dirección de la wallet conectada o null si hay un error.
 */
export const connectWallet = async (): Promise<string | null> => {
    if (typeof window.ethereum === 'undefined') {
        alert("MetaMask no detectado. Por favor, instala la extensión de MetaMask.");
        return null;
    }
    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        // Solicita al usuario que conecte su cuenta.
        const accounts = await provider.send("eth_requestAccounts", []);
        return accounts[0] || null;
    } catch (error) {
        console.error("El usuario rechazó la solicitud de conexión:", error);
        return null;
    }
};

/**
 * Obtiene los detalles de propiedad de un NFT específico desde la blockchain.
 * @param tokenId El ID del token a verificar.
 * @returns Un objeto con el propietario y el historial (simulado por ahora).
 */
export const getOwnershipDetails = async (tokenId: string) => {
    const contract = getContract();
    if (!contract) return null;

    try {
        // Llama a la función 'ownerOf' del smart contract.
        const owner = await contract.ownerOf(tokenId);
        
        // NOTA DIDÁCTICA: Obtener el historial de transferencias es complejo y
        // generalmente requiere servicios de indexación como The Graph.
        // Por ahora, devolvemos solo el propietario actual y un historial de ejemplo.
        const history = [
             { from: '... (On-Chain Data)', to: owner, date: 'Desde la Blockchain' }
        ];

        return { owner, history };

    } catch (error) {
        console.error(`Error al obtener datos para el token ${tokenId}:`, error);
        return null; // El token puede no existir
    }
};

/**
 * Obtiene el número total de NFTs en la colección.
 * @returns El número total de tokens acuñados.
 */
export const getTotalSupply = async (): Promise<number> => {
    const contract = getContract();
    if (!contract) return 0;
    try {
        const totalSupply = await contract.totalSupply();
        return Number(totalSupply);
    } catch (error) {
        console.error("Error al obtener el total supply:", error);
        return 0;
    }
}
