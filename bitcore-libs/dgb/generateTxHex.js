// createTXhex.js

const dogecore = require('./bitcore-lib-digibyte');
const { PrivateKey, Transaction } = dogecore;

/**
 * Converts Bitcoin (BTC) to Satoshis (sats).
 * @param {number|string} btc - The amount in BTC.
 * @returns {number} The equivalent amount in satoshis.
 */
function btcToSatoshis(btc) {
  return Math.round(parseFloat(btc) * 1e8);
}

/**
 * Converts Satoshis (sats) to Bitcoin (BTC).
 * @param {number|string} sats - The amount in satoshis.
 * @returns {number} The equivalent amount in BTC.
 */
function satoshisToBtc(sats) {
  return parseFloat(sats) / 1e8;
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

  if (!receivingAddress || typeof receivingAddress !== 'string') {
    throw new Error('Invalid receiving address');
  }

  if (isNaN(amount) || amount <= 0) {
    throw new Error('Invalid amount');
  }

  if (isNaN(fee) || fee < 0) {
    throw new Error('Invalid fee');
  }
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
    // Validate inputs
    validateInputs(walletData, receivingAddress, amount, fee);

    // Format UTXOs
    const formattedUtxos = walletData.utxos.map(utxo => ({
      txId: utxo.txid,
      outputIndex: utxo.vout,
      address: walletData.address,
      script: utxo.script_hex,
      satoshis: utxo.value
    }));

    // Initialize private key
    const privateKey = PrivateKey.fromWIF(walletData.privkey);

    // Create and build transaction
    const transaction = new Transaction()
      .from(formattedUtxos)
      .to(receivingAddress, amount)
      .fee(fee)
      .change(walletData.address)
      .sign(privateKey);

    // Serialize and return transaction hex
    const txHex = transaction.serialize();
    
    if (!txHex) {
      throw new Error("Transaction hex generation failed");
    }

    return txHex;

  } catch (error) {
    console.error('Error generating transaction hex:', error.message);
    throw error;
  }
}

module.exports = {
  generateTransactionHex,
  btcToSatoshis, 
  satoshisToBtc
};