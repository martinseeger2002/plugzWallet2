/**********************************************************
 * Utility: Format time since a given timestamp
 **********************************************************/
function formatTimeSince(timestamp) {
    const currentTime = Date.now();
    // timestamp expected in seconds, convert to ms
    const txTime = new Date(timestamp * 1000);
    const timeSince = Math.floor((currentTime - txTime) / 1000);

    if (timeSince < 60) {
        return `${timeSince} seconds ago`;
    } else if (timeSince < 3600) {
        return `${Math.floor(timeSince / 60)} mins ago`;
    } else if (timeSince < 86400) {
        return `${Math.floor(timeSince / 3600)} hours ago`;
    } else {
        return `${Math.floor(timeSince / 86400)} days ago`;
    }
}

/**********************************************************
 * Utility: Create a DOM element to display a transaction
 * - netAmount > 0 => Sent
 * - netAmount < 0 => Received
 * - netAmount = 0 => Internal (no net effect)
 **********************************************************/
function createTransactionElement(netAmount, timestamp, txid) {
    const txElement = document.createElement('div');
    txElement.className = 'transaction';

    // Format the net amount (2 decimals instead of 8)
    const absAmount = Math.abs(netAmount).toFixed(2);
    const timeSinceText = formatTimeSince(timestamp);

    let label;
    let color = '#888888'; // Default color for "internal" or zero net

    if (netAmount > 0) {
        label = `Sent ${absAmount}`;
        color = '#ff4444';
    } else if (netAmount < 0) {
        label = `Received ${absAmount}`;
        color = '#44ff44';
    } else {
        label = `Internal 0.00`;
    }

    txElement.textContent = `${label} — ${timeSinceText}`;
    txElement.style.color = color;
    txElement.style.cursor = 'pointer';

    // Add click handler
    txElement.addEventListener('click', () => {
        const dialog = document.createElement('div');
        dialog.className = 'dialog';

        const txIdInput = document.createElement('input');
        txIdInput.type = 'text';
        txIdInput.value = txid;
        txIdInput.readOnly = true;
        txIdInput.className = 'styled-input styled-text';

        const copyButton = document.createElement('button');
        copyButton.className = 'styled-button';
        copyButton.textContent = 'Copy to Clipboard';
        copyButton.addEventListener('click', () => {
            txIdInput.select();
            document.execCommand('copy');
            copyButton.textContent = 'Copied!';
            setTimeout(() => {
                copyButton.textContent = 'Copy to Clipboard';
            }, 2000);
        });

        const closeButton = document.createElement('button');
        closeButton.className = 'styled-button';
        closeButton.textContent = 'Close';
        closeButton.addEventListener('click', () => {
            document.body.removeChild(dialog);
        });

        dialog.appendChild(txIdInput);
        dialog.appendChild(copyButton);
        dialog.appendChild(closeButton);
        document.body.appendChild(dialog);
    });

    return txElement;
}

/**********************************************************
 * Helper: Fetch details of a single input transaction (vin)
 **********************************************************/
async function getInputTransactionDetails(ticker, txid) {
    try {
        const response = await fetch(`/api/gettransaction/${ticker}/${txid}`);
        const data = await response.json();
        if (data.status === 'success') {
            return data.data; // entire transaction object
        }
        return null;
    } catch (error) {
        console.error('Error getting input transaction:', error);
        return null;
    }
}

/**********************************************************
 * Core: Fetch & analyze transaction details to determine
 *       how much your address actually sent or received.
 *
 * Returns an object:
 *   {
 *       netAmount: number, // + => net sent, - => net received, 0 => internal
 *       time: number       // block or transaction time in seconds
 *   }
 **********************************************************/
async function getTransactionDetails(ticker, txid, address) {
    try {
        const response = await fetch(`/api/gettransaction/${ticker}/${txid}`);
        const data = await response.json();

        if (data.status !== 'success') {
            throw new Error(data.message || 'Failed to get transaction details');
        }

        const txDetails = data.data;
        let inputAmount = 0;    // total from this address in vin
        let receivedAmount = 0; // total to this address in vout

        /****************************************************
         * 1) Sum all outputs going to 'address'
         ****************************************************/
        for (const output of txDetails.vout) {
            const value = parseFloat(output.value) || 0;
            const outAddresses = output.scriptPubKey.addresses || [];
            if (outAddresses.includes(address)) {
                receivedAmount += value;
            }
        }

        /****************************************************
         * 2) For each input, if the input belongs to 'address',
         *    add its value to inputAmount
         ****************************************************/
        for (const input of txDetails.vin) {
            if (!input.txid || input.vout === undefined) continue;

            // Grab the previous transaction where this input came from
            const inputTx = await getInputTransactionDetails(ticker, input.txid);
            if (!inputTx || !inputTx.vout) continue;

            // Identify the specific vout that this input is referencing
            const inputVout = inputTx.vout[input.vout];
            if (!inputVout || !inputVout.scriptPubKey) continue;

            // Does this input belong to 'address'?
            const inAddresses = inputVout.scriptPubKey.addresses || [];
            if (inAddresses.includes(address)) {
                const val = parseFloat(inputVout.value) || 0;
                inputAmount += val;
            }
        }

        /****************************************************
         * 3) netAmount = total from address - total back to address
         *    (Positive => net outflow/sent, Negative => net inflow/received)
         ****************************************************/
        const netAmount = inputAmount - receivedAmount;

        // Transaction time (fall back to blocktime or something else if missing)
        const txTime = txDetails.time || txDetails.blocktime || 0;

        return {
            netAmount,
            time: txTime
        };
    } catch (error) {
        console.error('Error getting transaction details:', error);
        return null;
    }
}

/**********************************************************
 * Main function: Fetch last transactions for the address,
 *                analyze each, and display them in container
 **********************************************************/
export async function displayTransactionHistory(ticker, address, container) {
    container.innerHTML = '<div style="margin-left: 20px;">Loading transactions...</div>';

    try {
        // 1) Fetch a list of recent transactions
        const response = await fetch(`/api/getlasttransactions/${ticker}/${address}`);
        const data = await response.json();

        if (data.status !== 'success') {
            throw new Error(data.message || 'Failed to fetch transactions');
        }

        // Remove duplicates and sort by time (most recent first)
        const uniqueTransactions = Array.from(
            new Map(data.data.transactions.map(tx => [tx.txid, tx])).values()
        ).sort((a, b) => b.time - a.time);  // Sort in descending order

        container.innerHTML = '';

        // 2) Loop through each unique transaction
        for (const tx of uniqueTransactions) {
            // Fetch further details to get netAmount
            const txInfo = await getTransactionDetails(ticker, tx.txid, address);
            if (!txInfo) {
                continue;
            }

            // If getTransactionDetails didn't provide a time, use the one from the overview
            const finalTime = txInfo.time || tx.time;

            // 3) Create the element and append it
            const txElement = createTransactionElement(txInfo.netAmount, finalTime, tx.txid);
            container.appendChild(txElement);
        }

        // 4) If no transactions were appended, show a placeholder
        if (!container.children.length) {
            container.innerHTML = '<div style="margin-left: 20px;">No recent transactions</div>';
        }
    } catch (error) {
        console.error('Error fetching transaction history:', error);
        container.innerHTML = '<div style="margin-left: 20px;">Error loading transactions</div>';
    }
}
