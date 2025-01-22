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
    receivingAddressInput.autocomplete = 'off';
    form.appendChild(receivingAddressInput);

    // Create amount input
    const amountInput = document.createElement('input');
    amountInput.type = 'number';
    amountInput.id = 'amount';
    amountInput.placeholder = `Amount in ${walletData.ticker}`;
    amountInput.className = 'styled-input styled-text no-spinner';
    amountInput.required = true;
    amountInput.step = '0.00000001';
    amountInput.min = '0.00000001';
    amountInput.autocomplete = 'off';
    form.appendChild(amountInput);

    // Add subtract fee checkbox
    const subtractFeeContainer = document.createElement('div');
    subtractFeeContainer.className = 'subtract-fee-container';
    
    const subtractFeeCheckbox = document.createElement('input');
    subtractFeeCheckbox.type = 'checkbox';
    subtractFeeCheckbox.id = 'subtractFee';
    subtractFeeCheckbox.className = 'styled-checkbox';
    
    const subtractFeeLabel = document.createElement('label');
    subtractFeeLabel.htmlFor = 'subtractFee';
    subtractFeeLabel.className = 'styled-text';
    subtractFeeLabel.textContent = 'Subtract fee';
    
    subtractFeeContainer.appendChild(subtractFeeCheckbox);
    subtractFeeContainer.appendChild(subtractFeeLabel);
    form.appendChild(subtractFeeContainer);

    // Create fee display and slider
    const feeContainer = document.createElement('div');
    feeContainer.className = 'fee-container';
    
    const feeLabel = document.createElement('div');
    feeLabel.textContent = `Fee: `;
    feeLabel.className = 'fee-label styled-text';
    
    const feeDisplay = document.createElement('span');
    feeDisplay.id = 'feeDisplay';
    feeDisplay.className = 'styled-text';
    
    // Get network fee from coins configuration
    const networkFee = selectedCoin?.networkfee;
    const defaultFee = networkFee ? networkFee : 1000000; // Default to 0.01 if not specified
    
    feeDisplay.textContent = (defaultFee / 100000000).toFixed(8);
    feeLabel.appendChild(feeDisplay);
    feeLabel.appendChild(document.createTextNode(` ${walletData.ticker}`));
    
    const feeSlider = document.createElement('input');
    feeSlider.type = 'range';
    feeSlider.id = 'fee';
    feeSlider.className = 'styled-input fee-slider';
    feeSlider.min = networkFee ? networkFee.toString() : '100000';  // Use network fee as minimum if defined
    // Set max fee based on network fee - if it's higher than 0.1, use that instead
    feeSlider.max = networkFee && networkFee > 10000000 ? networkFee.toString() : '10000000';
    feeSlider.step = '100000';
    feeSlider.value = defaultFee.toString();

    feeContainer.appendChild(feeLabel);
    feeContainer.appendChild(feeSlider);
    form.appendChild(feeContainer);

    // Create submit button
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.className = 'button styled-text';
    submitButton.textContent = 'Send';
    form.appendChild(submitButton);

    // Add error message div
    const errorDiv = document.createElement('div');
    errorDiv.id = 'errorMessage';
    errorDiv.className = 'error-message styled-text';
    errorDiv.style.display = 'none';
    form.appendChild(errorDiv);

    // Append form to landing page
    landingPage.appendChild(form);

    // Add the coin icon at the bottom
    const coinIcon = document.createElement('img');
    coinIcon.src = `./static/images/${walletData.ticker}icon.png`;
    coinIcon.alt = `${walletData.ticker} Icon`;
    coinIcon.className = 'coin-icon';
    coinIcon.style.width = '100px';
    coinIcon.style.height = '100px';
    landingPage.appendChild(coinIcon);

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
        const submitButton = form.querySelector('button[type="submit"]');

        try {
            submitButton.disabled = true;
            submitButton.textContent = 'Sending...';

            const amountInputValue = parseFloat(document.getElementById('amount').value);
            const feeInSats = parseInt(document.getElementById('fee').value);
            const receivingAddress = document.getElementById('receivingAddress').value.trim();
            const subtractFee = document.getElementById('subtractFee').checked;

            // Validate inputs
            if (!receivingAddress) throw new Error('Receiving address is required');
            if (isNaN(amountInputValue) || amountInputValue <= 0) {
                throw new Error('Invalid amount');
            }
            if (amountInputValue < 0.00000001) {
                throw new Error('Amount must be at least 0.00000001');
            }
            
            // Updated fee validation to allow higher network fees
            if (networkFee && feeInSats < networkFee) {
                throw new Error(`Fee must be at least ${(networkFee / 100000000).toFixed(8)} ${walletData.ticker}`);
            }
            // Only apply maximum fee check if network fee is not higher than standard max
            if (!networkFee || networkFee <= 10000000) {
                if (feeInSats > 10000000) {
                    throw new Error('Fee must not exceed 0.1 coins');
                }
            }

            // Filter out UTXOs less than or equal to 0.01
            const filteredWalletData = {
                ...walletData,
                utxos: walletData.utxos.filter(utxo => utxo.value > 0.01)
            };

            // Convert amount to satoshis
            let amountInSats = toSatoshis(amountInputValue);
            
            // If subtract fee is checked, reduce the amount by the fee
            if (subtractFee) {
                amountInSats -= feeInSats;
                if (amountInSats <= 0) {
                    throw new Error('Amount after fee subtraction must be greater than 0');
                }
            }
            
            console.log(`Converting ${amountInputValue} ${walletData.ticker} to ${amountInSats} satoshis${subtractFee ? ' (fee subtracted)' : ''}`);

            // Generate the transaction with filtered UTXOs
            const generateResponse = await fetch('/bitcore_lib/generate-tx', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    walletData: filteredWalletData,
                    receivingAddress,
                    amount: amountInSats,
                    fee: feeInSats
                })
            });

            const generateResult = await generateResponse.json();

            if (!generateResponse.ok) {
                throw new Error(generateResult.error || 'Failed to generate transaction');
            }

            // Broadcast the transaction
            const broadcastResponse = await fetch(`/api/sendrawtransaction/${walletData.ticker}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    raw_tx: generateResult.txHex
                })
            });

            const broadcastResult = await broadcastResponse.json();

            if (!broadcastResponse.ok) {
                throw new Error(broadcastResult.error || 'Failed to broadcast transaction');
            }

            // Show success message with txid
            alert(`Transaction sent successfully!\nTransaction ID: ${broadcastResult.txid}`);
            
            // Return to wallet
            landingPage.innerHTML = '';
            initializeWallet();

        } catch (error) {
            errorDiv.textContent = `Error: ${error.message}`;
            errorDiv.style.display = 'block';
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
} 