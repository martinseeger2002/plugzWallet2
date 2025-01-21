// createTXhex.js

const dogecore = require('./bitcore-lib-shic');
const { PrivateKey, Transaction, Script } = dogecore;

/**
 * Converts PEP amount to satoshis
 * @param {number} amount - Amount in PEP
 * @returns {number} Amount in satoshis
 */
function toSatoshis(amount) {
    // Round to 8 decimal places first to avoid floating point issues
    const roundedAmount = Math.floor(amount * 100000000) / 100000000;
    return Math.floor(roundedAmount * 100000000);
}

/**
 * Selects the most appropriate UTXO for the transaction
 * @param {Array} utxos - Array of UTXOs
 * @param {number} amount - Amount to send in satoshis
 * @param {number} fee - Transaction fee in satoshis
 * @returns {Array} Selected UTXOs
 */
function selectUtxos(utxos, amount, fee) {
    const totalNeeded = amount + fee;
    
    // Convert all UTXO values to satoshis and sort by value
    const sortedUtxos = utxos
        .map(utxo => ({
            ...utxo,
            satoshis: toSatoshis(utxo.value)
        }))
        .sort((a, b) => a.satoshis - b.satoshis);

    // Find the smallest UTXO that covers the amount needed
    const selectedUtxo = sortedUtxos.find(utxo => utxo.satoshis >= totalNeeded);
    
    if (selectedUtxo) {
        console.error('Selected single UTXO:', {
            txid: selectedUtxo.txid,
            value: selectedUtxo.value,
            satoshis: selectedUtxo.satoshis,
            needed: totalNeeded
        });
        return [selectedUtxo];
    }

    // If no single UTXO is big enough, throw an error
    throw new Error(`No single UTXO found that covers the amount needed (${totalNeeded} satoshis)`);
}

/**
 * Validates the input parameters for creating a transaction.
 * @param {object} walletData - The wallet data object
 * @param {string} receivingAddress - Destination address
 * @param {number} amount - Amount to send in satoshis
 * @param {number} fee - Transaction fee in satoshis
 * @throws Will throw an error if validation fails
 */
function validateInputs(walletData, receivingAddress, amount, fee) {
    console.error('Validating inputs:', {
        address: walletData.address,
        receivingAddress,
        amount,
        fee,
        utxoCount: walletData.utxos?.length
    });

    if (!walletData || typeof walletData !== 'object') {
        throw new Error('Invalid wallet data object');
    }

    if (!walletData.address || typeof walletData.address !== 'string') {
        throw new Error('Invalid wallet address');
    }

    if (!walletData.privkey || typeof walletData.privkey !== 'string') {
        throw new Error('Invalid private key');
    }

    if (!Array.isArray(walletData.utxos) || walletData.utxos.length === 0) {
        throw new Error('UTXOs must be a non-empty array');
    }

    // Calculate total UTXO value in satoshis for validation only
    const totalUtxoValue = walletData.utxos.reduce((sum, utxo) => sum + toSatoshis(utxo.value), 0);
    console.error('Total available (satoshis):', totalUtxoValue);
    console.error('Required amount + fee (satoshis):', amount + fee);

    if (totalUtxoValue < (amount + fee)) {
        throw new Error(`Insufficient funds. Available: ${totalUtxoValue} satoshis, Required: ${amount + fee} satoshis`);
    }

    // Validate UTXO structure
    walletData.utxos.forEach((utxo, index) => {
        console.error(`Validating UTXO ${index}:`, {
            ...utxo,
            valueInSatoshis: toSatoshis(utxo.value)
        });
        
        if (!utxo.txid) throw new Error(`UTXO ${index} missing txid`);
        if (typeof utxo.vout !== 'number') throw new Error(`UTXO ${index} missing or invalid vout`);
        if (typeof utxo.value !== 'number') throw new Error(`UTXO ${index} missing or invalid value`);
        if (!utxo.script_hex) throw new Error(`UTXO ${index} missing script_hex`);
    });

    if (!receivingAddress || typeof receivingAddress !== 'string') {
        throw new Error('Invalid receiving address');
    }

    if (typeof amount !== 'number' || amount <= 0) {
        throw new Error('Amount must be a positive number');
    }

    if (typeof fee !== 'number' || fee < 0) {
        throw new Error('Fee must be a non-negative number');
    }

    return { amount, fee };
}

/**
 * Creates a transaction hex from wallet data.
 * @param {object} walletData - Wallet data including UTXOs and private key
 * @param {string} receivingAddress - Destination address
 * @param {number} amount - Amount to send in satoshis
 * @param {number} fee - Transaction fee in satoshis
 * @returns {Promise<string>} Transaction hex
 */
async function generateTransactionHex(walletData, receivingAddress, amount, fee) {
    try {
        console.error('Starting transaction generation with:', {
            address: walletData.address,
            receivingAddress,
            amount,
            fee
        });

        // Validate inputs
        validateInputs(walletData, receivingAddress, amount, fee);

        // Select the appropriate UTXO(s)
        const selectedUtxos = selectUtxos(walletData.utxos, amount, fee);

        // Format selected UTXOs
        const formattedUtxos = selectedUtxos.map(utxo => {
            console.error('Processing selected UTXO:', utxo);
            
            // Handle script conversion
            let script;
            try {
                script = Script.fromHex(utxo.script_hex);
                console.error('Script created successfully:', script.toString());
            } catch (error) {
                console.error('Error converting script:', error);
                throw new Error(`Failed to convert script for UTXO ${utxo.txid}: ${error.message}`);
            }
            
            return {
                txId: utxo.txid,
                outputIndex: utxo.vout,
                address: walletData.address,
                script: script,
                satoshis: toSatoshis(utxo.value)
            };
        });

        console.error('Formatted UTXOs:', formattedUtxos.map(utxo => ({
            ...utxo,
            script: utxo.script.toString()
        })));

        // Initialize private key
        const privateKey = PrivateKey.fromWIF(walletData.privkey);
        console.error('Private key initialized successfully');

        // Create transaction
        console.error('Creating transaction with:', {
            utxoCount: formattedUtxos.length,
            amount,
            fee,
            changeAddress: walletData.address
        });

        const transaction = new Transaction()
            .from(formattedUtxos)
            .to(receivingAddress, amount)
            .fee(fee)
            .change(walletData.address)
            .sign(privateKey);

        console.error('Transaction created successfully');

        // Serialize and return transaction hex
        const txHex = transaction.serialize(true);
        
        if (!txHex) {
            throw new Error("Transaction hex generation failed");
        }

        console.error('Transaction hex generated:', txHex.substring(0, 64) + '...');
        return txHex;

    } catch (error) {
        console.error('Error in generateTransactionHex:', error);
        throw error;
    }
}

module.exports = {
    generateTransactionHex
};