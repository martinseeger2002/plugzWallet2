import { initializeWallet } from './main.js';
import { coins } from './networks.js'; // Import coins to get the color

export function sendTXUI(walletData) {
    const landingPage = document.getElementById('landing-page');
    landingPage.innerHTML = ''; // Clear existing content

    // Find the coin data for the selected wallet to get the color
    const selectedCoin = coins.find(coin => coin.ticker === walletData.ticker);
    if (selectedCoin) {
        landingPage.style.backgroundColor = selectedCoin.color; // Set background color
    }

    // Create header with back button
    const header = document.createElement('div');
    header.className = 'header';

    const backButton = document.createElement('button');
    backButton.className = 'back-button';
    backButton.innerHTML = '<img src="./static/images/back.png" alt="Back Icon" />';
    backButton.addEventListener('click', () => {
        landingPage.innerHTML = ''; // Clear the UI
        initializeWallet(); // Return to main wallet UI
    });

    header.appendChild(backButton);
    landingPage.appendChild(header);

    // Create title
    const title = document.createElement('h1');
    title.textContent = 'Send Transaction';
    title.className = 'page-title';
    landingPage.appendChild(title);

    // Create form container
    const formContainer = document.createElement('div');
    formContainer.className = 'tx-form-container';

    // Create form
    const form = document.createElement('form');
    form.className = 'tx-form';
    form.innerHTML = `
        <div class="form-group">
            <label for="receivingAddress">Receiving Address:</label>
            <input type="text" id="receivingAddress" required placeholder="Enter receiving address">
        </div>

        <div class="form-group">
            <label for="amount">Amount (in satoshis):</label>
            <input type="number" id="amount" required placeholder="Enter amount in satoshis">
        </div>

        <div class="form-group">
            <label for="fee">Fee (in satoshis):</label>
            <input type="number" id="fee" required placeholder="Enter fee in satoshis">
        </div>

        <button type="submit" class="create-tx-button">Create Transaction</button>
    `;

    // Create result container
    const resultContainer = document.createElement('div');
    resultContainer.className = 'tx-result-container';
    resultContainer.innerHTML = `
        <div class="tx-hex-container" style="display: none;">
            <h3>Transaction Hex:</h3>
            <textarea id="txHex" readonly></textarea>
            <button id="copyTxHex" class="copy-button">Copy Hex</button>
        </div>
        <div id="errorMessage" class="error-message" style="display: none;"></div>
    `;

    // Add form submission handler
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorDiv = document.getElementById('errorMessage');
        const txHexContainer = document.querySelector('.tx-hex-container');
        const txHexArea = document.getElementById('txHex');
        const submitButton = form.querySelector('button[type="submit"]');

        try {
            submitButton.disabled = true;
            submitButton.textContent = 'Creating...';

            // Get values directly in satoshis
            const amountInSats = parseInt(document.getElementById('amount').value);
            const feeInSats = parseInt(document.getElementById('fee').value);
            const receivingAddress = document.getElementById('receivingAddress').value.trim();

            // Validate inputs
            if (!receivingAddress) throw new Error('Receiving address is required');
            if (isNaN(amountInSats) || amountInSats <= 0) throw new Error('Invalid amount');
            if (isNaN(feeInSats) || feeInSats < 0) throw new Error('Invalid fee');

            // Call the API endpoint
            const response = await fetch('/bitcore_lib/generate-tx', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    walletData,
                    receivingAddress,
                    amount: amountInSats,  // Already in satoshis
                    fee: feeInSats  // Already in satoshis
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to generate transaction');
            }

            // Display the result
            txHexArea.value = result.txHex;
            txHexContainer.style.display = 'block';
            errorDiv.style.display = 'none';

        } catch (error) {
            errorDiv.textContent = `Error: ${error.message}`;
            errorDiv.style.display = 'block';
            txHexContainer.style.display = 'none';
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Create Transaction';
        }
    });

    // Add copy button handler
    const copyButton = resultContainer.querySelector('#copyTxHex');
    copyButton.addEventListener('click', () => {
        const txHex = document.getElementById('txHex');
        txHex.select();
        document.execCommand('copy');
        copyButton.textContent = 'Copied!';
        setTimeout(() => {
            copyButton.textContent = 'Copy Hex';
        }, 2000);
    });

    // Add wallet info display
    const walletInfoContainer = document.createElement('div');
    walletInfoContainer.className = 'wallet-info-container';
    
    const walletInfo = document.createElement('pre');
    walletInfo.className = 'wallet-info';
    walletInfo.textContent = JSON.stringify({
        address: walletData.address,
        balance: walletData.balance,
        ticker: walletData.ticker
    }, null, 2);
    
    walletInfoContainer.appendChild(walletInfo);

    // Append everything to the page
    landingPage.appendChild(walletInfoContainer);
    formContainer.appendChild(form);
    formContainer.appendChild(resultContainer);
    landingPage.appendChild(formContainer);

    // Add the selected coin's icon at the bottom
    const coinIcon = document.createElement('img');
    coinIcon.src = `./static/images/coins/${walletData.ticker.toLowerCase()}icon.png`;
    coinIcon.alt = `${walletData.ticker} Icon`;
    coinIcon.className = 'coin-icon';
    landingPage.appendChild(coinIcon);
} 