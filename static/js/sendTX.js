import { initializeWallet } from './main.js';
import { coins } from './networks.js'; // Import coins to get the color

/**
 * Converts coin amount to satoshis
 * @param {number} amount - Amount in coins
 * @returns {number} Amount in satoshis
 */
function toSatoshis(amount) {
    return Math.floor(amount * 100000000);
}

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

    // Add wallet selector with mobile-friendly styling
    const walletSelector = document.createElement('select');
    walletSelector.className = 'wallet-selector styled-text';
    const wallets = JSON.parse(localStorage.getItem('wallets')) || [];
    wallets
        .filter(wallet => wallet.ticker === walletData.ticker)
        .forEach(wallet => {
            const option = document.createElement('option');
            option.value = wallet.label;
            option.textContent = wallet.label;
            option.className = 'styled-text';
            if (wallet.label === walletData.label) {
                option.selected = true;
            }
            walletSelector.appendChild(option);
        });
    landingPage.appendChild(walletSelector);

    // Add balance display with mobile-friendly styling
    const balance = document.createElement('div');
    balance.className = 'balance styled-text';
    balance.textContent = `${walletData.balance.toFixed(8)} ${walletData.ticker}`;
    landingPage.appendChild(balance);

    // Create form container
    const formContainer = document.createElement('div');
    formContainer.className = 'tx-form-container';

    // Create form
    const form = document.createElement('form');
    form.className = 'wallet-form';

    // Create receiving address input
    const receivingAddressInput = document.createElement('input');
    receivingAddressInput.type = 'text';
    receivingAddressInput.id = 'receivingAddress';
    receivingAddressInput.placeholder = 'Receiving Address';
    receivingAddressInput.className = 'styled-input styled-text';
    receivingAddressInput.required = true;
    form.appendChild(receivingAddressInput);

    // Create amount input
    const amountInput = document.createElement('input');
    amountInput.type = 'number';
    amountInput.id = 'amount';
    amountInput.placeholder = `Amount in ${walletData.ticker}`;
    amountInput.className = 'styled-input styled-text';
    amountInput.required = true;
    amountInput.step = '0.00000001';
    amountInput.min = '0.00000001';
    form.appendChild(amountInput);

    // Create fee display and slider
    const feeContainer = document.createElement('div');
    feeContainer.className = 'fee-container';
    
    const feeLabel = document.createElement('div');
    feeLabel.textContent = `Fee: `;
    feeLabel.className = 'fee-label styled-text';
    
    const feeDisplay = document.createElement('span');
    feeDisplay.id = 'feeDisplay';
    feeDisplay.textContent = '0.01';
    feeDisplay.className = 'styled-text';
    feeLabel.appendChild(feeDisplay);
    feeLabel.appendChild(document.createTextNode(` ${walletData.ticker}`));
    
    const feeSlider = document.createElement('input');
    feeSlider.type = 'range';
    feeSlider.id = 'fee';
    feeSlider.className = 'styled-input fee-slider';
    feeSlider.min = '100000';
    feeSlider.max = '10000000';
    feeSlider.step = '100000';
    feeSlider.value = '1000000';

    feeContainer.appendChild(feeLabel);
    feeContainer.appendChild(feeSlider);
    form.appendChild(feeContainer);

    // Create submit button
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.className = 'button styled-text';
    submitButton.textContent = 'Send';
    form.appendChild(submitButton);

    // Add wallet selector change handler
    walletSelector.addEventListener('change', () => {
        const selectedWallet = wallets.find(wallet => 
            wallet.ticker === walletData.ticker && 
            wallet.label === walletSelector.value
        );
        if (selectedWallet) {
            walletData = selectedWallet;
            balance.textContent = `${selectedWallet.balance.toFixed(8)} ${selectedWallet.ticker}`;
        }
    });

    // Add fee slider event listener
    feeSlider.addEventListener('input', (e) => {
        const satoshiValue = parseInt(e.target.value);
        const coinValue = (satoshiValue / 100000000).toFixed(8);
        feeDisplay.textContent = parseFloat(coinValue).toString();
    });

    // Create result container
    const resultContainer = document.createElement('div');
    resultContainer.className = 'tx-result-container';
    resultContainer.innerHTML = `
        <div class="tx-hex-container" style="display: none;">
            <textarea id="txHex" readonly class="styled-input styled-text"></textarea>
            <button id="copyTxHex" class="button styled-text">Copy</button>
        </div>
        <div id="errorMessage" class="error-message styled-text" style="display: none;"></div>
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

            // Get values
            const amountInputValue = parseFloat(document.getElementById('amount').value);
            const feeInSats = parseInt(document.getElementById('fee').value);
            const receivingAddress = document.getElementById('receivingAddress').value.trim();

            // Validate inputs
            if (!receivingAddress) throw new Error('Receiving address is required');
            if (isNaN(amountInputValue) || amountInputValue <= 0) {
                throw new Error('Invalid amount');
            }
            if (amountInputValue < 0.00000001) {
                throw new Error('Amount must be at least 0.00000001');
            }
            if (isNaN(feeInSats) || feeInSats < 100000 || feeInSats > 10000000) {
                throw new Error('Invalid fee (must be between 0.001 and 0.1 coins)');
            }

            // Convert amount to satoshis
            const amountInSats = toSatoshis(amountInputValue);
            console.log(`Converting ${amountInputValue} ${walletData.ticker} to ${amountInSats} satoshis`);

            // Call the API endpoint
            const response = await fetch('/bitcore_lib/generate-tx', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    walletData,
                    receivingAddress,
                    amount: amountInSats,
                    fee: feeInSats
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
            submitButton.textContent = 'Send';
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

    // Append everything to the page
    formContainer.appendChild(form);
    formContainer.appendChild(resultContainer);
    landingPage.appendChild(formContainer);

    // Add the coin icon at the bottom
    const coinIcon = document.createElement('img');
    coinIcon.src = `./static/images/${walletData.ticker}icon.png`;  // Keep ticker uppercase
    coinIcon.alt = `${walletData.ticker} Icon`;
    coinIcon.className = 'coin-icon';
    coinIcon.style.width = '100px';
    coinIcon.style.height = '100px';
    landingPage.appendChild(coinIcon);
} 