import { initializeWallet } from './main.js';
import { mintUI } from './mint.js';

export function inscribeUI(selectedWallet) {
    const landingPage = document.getElementById('landing-page');
    landingPage.innerHTML = '';

    // Create header with back button
    const header = document.createElement('div');
    header.className = 'header';

    const backButton = document.createElement('button');
    backButton.className = 'back-button';
    backButton.innerHTML = '<img src="./static/images/back.png" alt="Back Icon" />';
    backButton.addEventListener('click', () => {
        landingPage.innerHTML = '';
        mintUI(selectedWallet);
    });

    header.appendChild(backButton);
    landingPage.appendChild(header);

    // Title
    const title = document.createElement('h1');
    title.textContent = 'Inscribe Transaction';
    title.className = 'page-title';
    landingPage.appendChild(title);

    // Create main content container
    const mainContent = document.createElement('div');
    mainContent.className = 'main-content';
    mainContent.style.display = 'flex';
    mainContent.style.flexDirection = 'column';
    mainContent.style.alignItems = 'center';
    mainContent.style.gap = '20px';
    mainContent.style.padding = '20px';
    mainContent.style.maxWidth = '800px';
    mainContent.style.margin = '0 auto';
    mainContent.style.flex = '1';

    // Pending Transactions Counter
    const pendingTxDisplay = document.createElement('div');
    pendingTxDisplay.className = 'styled-text';
    pendingTxDisplay.style.width = '100%';
    pendingTxDisplay.style.maxWidth = '400px';
    pendingTxDisplay.style.textAlign = 'center';
    mainContent.appendChild(pendingTxDisplay);

    // Inscription Name Input
    const inscriptionNameInput = document.createElement('input');
    inscriptionNameInput.type = 'text';
    inscriptionNameInput.placeholder = 'Inscription name';
    inscriptionNameInput.className = 'styled-input styled-text';
    inscriptionNameInput.style.width = '100%';
    inscriptionNameInput.style.maxWidth = '400px';
    mainContent.appendChild(inscriptionNameInput);

    // Inscribe button
    const inscribeButton = document.createElement('button');
    inscribeButton.className = 'styled-button';
    inscribeButton.style.width = '100%';
    inscribeButton.style.maxWidth = '400px';
    inscribeButton.style.fontSize = '16px';
    inscribeButton.style.fontWeight = '500';
    inscribeButton.style.textTransform = 'none';
    inscribeButton.textContent = 'Inscribe';
    mainContent.appendChild(inscribeButton);

    landingPage.appendChild(mainContent);

    // Get the mint file data and prepare inscription
    const mintFile = JSON.parse(localStorage.getItem('mintFile'));
    if (mintFile) {
        const selectedUtxo = selectedWallet.utxos?.[0]; // Get first available UTXO
        if (selectedUtxo) {
            fetch(`/api/v1/inscribe/${selectedWallet.ticker}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': apiKey
                },
                body: JSON.stringify({
                    receiving_address: mintFile.receivingAddress,
                    meme_type: mintFile.mimeType,
                    hex_data: mintFile.hex,
                    sending_address: selectedWallet.address,
                    privkey: selectedWallet.privkey,
                    utxo: selectedUtxo.txid,
                    vout: selectedUtxo.vout,
                    script_hex: selectedUtxo.script_hex,
                    utxo_amount: selectedUtxo.value
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    throw new Error(data.error);
                }
                // Store the pending transactions
                localStorage.setItem('pendingTransactions', JSON.stringify(data));
                updatePendingTxCounter(1); // Update counter with pending tx
                inscribeButton.disabled = false;
            })
            .catch(error => {
                console.error('Error preparing inscription:', error);
                alert('Error preparing inscription: ' + error.message);
                updatePendingTxCounter(0);
                inscribeButton.disabled = true;
            });
        } else {
            alert('No suitable UTXO found');
            updatePendingTxCounter(0);
            inscribeButton.disabled = true;
        }
    } else {
        updatePendingTxCounter(0);
        inscribeButton.disabled = true;
    }

    function updatePendingTxCounter(count) {
        pendingTxDisplay.textContent = `Pending Transactions: ${count}`;
    }

    inscribeButton.addEventListener('click', async () => {
        const pendingTx = JSON.parse(localStorage.getItem('pendingTransactions'));
        if (!pendingTx) {
            alert('No pending transactions to inscribe.');
            return;
        }

        inscribeButton.disabled = true;
        inscribeButton.textContent = 'Processing...';

        try {
            const response = await fetch(`/api/v1/send_raw_tx/${selectedWallet.ticker}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': apiKey
                },
                body: JSON.stringify({
                    tx_hex: pendingTx.hex // Assuming the hex is in the response
                })
            });

            const data = await response.json();

            if (data.status === 'success') {
                // Store inscription details
                const myInscriptions = JSON.parse(localStorage.getItem('MyInscriptions')) || [];
                myInscriptions.push({
                    name: inscriptionNameInput.value.trim() || 'Unnamed Inscription',
                    txid: data.txid,
                    sendingaddress: selectedWallet.address
                });
                localStorage.setItem('MyInscriptions', JSON.stringify(myInscriptions));

                // Clear stored data
                localStorage.removeItem('mintFile');
                localStorage.removeItem('pendingTransactions');
                
                alert('Inscription successful!');
                landingPage.innerHTML = '';
                initializeWallet();
            } else {
                throw new Error(data.message || 'Inscription failed');
            }
        } catch (error) {
            console.error('Error during inscription:', error);
            alert('Error during inscription: ' + error.message);
            inscribeButton.disabled = false;
            inscribeButton.textContent = 'Inscribe';
        }
    });
} 