// createTXhexTwoUtxos.js

const dogecore = require('./bitcore-lib-shic');
const { PrivateKey, Transaction } = dogecore;

/**
 * Converts Bitcoin (BTC / DOGE) to Satoshis (sats).
 * @param {number|string} btc - The amount in BTC/DOGE.
 * @returns {number} The equivalent amount in satoshis.
 */
function btcToSatoshis(btc) {
  return Math.round(parseFloat(btc) * 1e8);
}

/**
 * Converts Satoshis (sats) to Bitcoin (BTC / DOGE).
 * @param {number|string} sats - The amount in satoshis.
 * @returns {number} The equivalent amount in BTC/DOGE.
 */
function satoshisToBtc(sats) {
  return parseFloat(sats) / 1e8;
}

/**
 * Validates the input parameters for sending a transaction with exactly two UTXOs.
 * @param {object} params - The transaction parameters.
 * @throws Will throw an error if validation fails.
 */
function validateInputs(params) {
  const { sendingAddress, wifPrivateKey, utxo0, utxo1, recipients, fee, changeAddress } = params;

  if (!sendingAddress || typeof sendingAddress !== 'string') {
    throw new Error('Invalid sending address.');
  }
  if (!wifPrivateKey || typeof wifPrivateKey !== 'string') {
    throw new Error('Invalid WIF private key.');
  }

  // Validate we have exactly two UTXOs
  if (!utxo0 || !utxo1) {
    throw new Error('Two UTXOs are required (utxo0 and utxo1).');
  }

  // Validate UTXO #0
  if (
    !utxo0.txId ||
    typeof utxo0.txId !== 'string' ||
    isNaN(parseInt(utxo0.vout, 10)) ||
    isNaN(parseInt(utxo0.amount, 10)) ||
    !utxo0.scriptPubKey ||
    typeof utxo0.scriptPubKey !== 'string'
  ) {
    throw new Error('Invalid UTXO #0.');
  }

  // Validate UTXO #1
  if (
    !utxo1.txId ||
    typeof utxo1.txId !== 'string' ||
    isNaN(parseInt(utxo1.vout, 10)) ||
    isNaN(parseInt(utxo1.amount, 10)) ||
    !utxo1.scriptPubKey ||
    typeof utxo1.scriptPubKey !== 'string'
  ) {
    throw new Error('Invalid UTXO #1.');
  }

  // Validate recipients
  if (!Array.isArray(recipients) || recipients.length === 0) {
    throw new Error('Recipients must be a non-empty array.');
  }
  recipients.forEach((recipient, index) => {
    if (
      !recipient.address ||
      typeof recipient.address !== 'string' ||
      isNaN(parseInt(recipient.amount, 10)) ||
      parseInt(recipient.amount, 10) <= 0
    ) {
      throw new Error(`Invalid recipient at index ${index}.`);
    }
  });

  // Validate fee
  if (isNaN(parseInt(fee, 10)) || parseInt(fee, 10) <= 0) {
    throw new Error('Invalid fee amount.');
  }

  // Validate change address
  if (!changeAddress || typeof changeAddress !== 'string') {
    throw new Error('Invalid change address.');
  }
}

/**
 * Sends a Dogecoin transaction using exactly two UTXOs:
 *  - UTXO #0: Spent entirely to the recipient(s).
 *  - UTXO #1: Used only to cover the fee (and any leftover goes to change).
 *
 * @param {string} sendingAddress - The address sending the funds.
 * @param {string} wifPrivateKey - The WIF-formatted private key.
 * @param {object} utxo0 - The main UTXO (index 0) to send to recipient(s) in full.
 * @param {object} utxo1 - The UTXO (index 1) that covers fees (and change).
 * @param {Array} recipients - List of recipients, each with address and amount.
 * @param {number} fee - Transaction fee in satoshis.
 * @param {string} changeAddress - Address to receive leftover from UTXO #1.
 * @returns {Promise<string>} - The raw transaction hex.
 */
async function sendDogeTransactionTwoUtxos(
  sendingAddress,
  wifPrivateKey,
  utxo0,
  utxo1,
  recipients,
  fee,
  changeAddress
) {
  try {
    // 1. Validate inputs
    validateInputs({ sendingAddress, wifPrivateKey, utxo0, utxo1, recipients, fee, changeAddress });

    // 2. Prepare the two inputs (vin)
    //    - The entire utxo0 is ultimately sent to recipients
    //    - utxo1 is used primarily for the fee (remainder to change)
    const formattedInput0 = {
      txId: utxo0.txId,
      outputIndex: parseInt(utxo0.vout, 10),
      address: sendingAddress,
      script: utxo0.scriptPubKey,
      satoshis: parseInt(utxo0.amount, 10),
    };

    const formattedInput1 = {
      txId: utxo1.txId,
      outputIndex: parseInt(utxo1.vout, 10),
      address: sendingAddress,
      script: utxo1.scriptPubKey,
      satoshis: parseInt(utxo1.amount, 10),
    };

    console.log('Formatted UTXO #0:', formattedInput0);
    console.log('Formatted UTXO #1:', formattedInput1);

    // 3. Initialize private key
    let privateKey;
    try {
      privateKey = PrivateKey.fromWIF(wifPrivateKey);
      console.log('Private key initialized successfully.');
    } catch (err) {
      console.error('Failed to parse WIF private key:', err.message);
      throw new Error('Failed to parse WIF private key.');
    }

    // 4. Create a new transaction and add both UTXOs
    let transaction = new Transaction()
      .from([formattedInput0, formattedInput1]);

    console.log('Transaction after adding UTXOs:', transaction);

    // 5. Add recipient outputs
    //    The entire utxo0 is meant for the recipient(s), but you can still rely
    //    on the "amount" from each recipient to total up to utxo0. 
    //    (If you only have one recipient, you could just send the entire utxo0.satoshis.)
    recipients.forEach(recipient => {
      transaction.to(recipient.address, parseInt(recipient.amount, 10));
    });
    console.log('Transaction after adding recipients:', transaction);

    // 6. Set fee
    transaction.fee(parseInt(fee, 10));
    console.log('Transaction after setting fee:', transaction);

    // 7. Set change address (for leftover from UTXO #1, if any)
    transaction.change(changeAddress);
    console.log('Transaction after setting change address:', transaction);

    // 8. Sign the transaction (both UTXOs)
    transaction.sign(privateKey);
    console.log('Signed transaction:', transaction);

    // 9. Serialize and return transaction hex
    const txHex = transaction.serialize();
    console.log('Serialized transaction hex:', txHex);

    if (!txHex) {
      throw new Error("Transaction hex generation failed. No hex string was returned.");
    }

    return txHex;
  } catch (error) {
    console.error('Error sending Dogecoin transaction:', error.message);
    throw error; // Re-throw after logging
  }
}

module.exports = {
  sendDogeTransactionTwoUtxos,
  btcToSatoshis,
  satoshisToBtc
};
