import { initializeWallet } from './main.js';
import { mintUI } from './mint.js';
import { coins } from './networks.js';

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
    title.textContent = 'Inscribe Transactions';
    title.className = 'page-title';
    landingPage.appendChild(title);

    // Create main content container
    const mainContent = document.createElement('div');
    mainContent.className = 'main-content';

    // Pending Transactions Counter
    const pendingTxDisplay = document.createElement('div');
    pendingTxDisplay.className = 'styled-text';
    mainContent.appendChild(pendingTxDisplay);

    // Initialize Pending Transactions Counter
    const mintResponse = JSON.parse(localStorage.getItem('mintResponse')) || {};
    let pendingTransactions = mintResponse.pendingTransactions || [];
    updatePendingTxCounter(pendingTransactions.length);

    // Inscription Name Input
    const inscriptionNameInput = document.createElement('input');
    inscriptionNameInput.type = 'text';
    inscriptionNameInput.placeholder = 'Inscription name';
    inscriptionNameInput.className = 'styled-input';
    mainContent.appendChild(inscriptionNameInput);

    // Inscribe button
    const inscribeButton = document.createElement('button');
    inscribeButton.className = 'styled-button';
    inscribeButton.textContent = 'Inscribe';
    inscribeButton.addEventListener('click', inscribeAllTransactions);
    mainContent.appendChild(inscribeButton);

    landingPage.appendChild(mainContent);

    function updatePendingTxCounter(count) {
        pendingTxDisplay.textContent = `Pending Transactions: ${count}`;
    }

    function inscribeTransaction(showAlert = true) {
        const mintResponse = JSON.parse(localStorage.getItem('mintResponse')) || {};
        let pendingTransactions = mintResponse.pendingTransactions || [];
        
        if (pendingTransactions.length === 0) {
            alert('No pending transactions available.');
            return Promise.reject('No pending transactions available.');
        }

        inscribeButton.disabled = true;
        inscribeButton.textContent = 'Processing...';

        const topTransaction = pendingTransactions[0];
        const txHex = topTransaction.hex;

        return fetch(`/api/sendrawtransaction/${selectedWallet.ticker}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ tx_hex: txHex })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                const inscriptionName = inscriptionNameInput.value.trim();
                const myInscriptions = JSON.parse(localStorage.getItem('MyInscriptions')) || [];

                if (topTransaction.transactionNumber === 2) {
                    myInscriptions.push({
                        name: inscriptionName || 'Unnamed Inscription',
                        txid: data.txid,
                        sendingaddress: selectedWallet.address
                    });
                    localStorage.setItem('MyInscriptions', JSON.stringify(myInscriptions));
                }

                pendingTransactions.shift();
                localStorage.setItem('mintResponse', JSON.stringify({ pendingTransactions }));
                updatePendingTxCounter(pendingTransactions.length);

                if (showAlert) {
                    alert(`Transaction sent successfully! TXID: ${data.txid}`);
                }
            } else {
                if (data.message?.includes('mandatory-script-verify-flag-failed')) {
                    console.log('Signature verification failed. Removing transaction from the list.');
                    pendingTransactions.shift();
                    localStorage.setItem('mintResponse', JSON.stringify({ pendingTransactions }));
                    updatePendingTxCounter(pendingTransactions.length);
                } else {
                    throw new Error(data.message || 'Failed to send transaction');
                }
            }
        })
        .catch(error => {
            console.error('Error sending transaction:', error);
            if (showAlert) {
                alert('Error sending transaction: ' + error.message);
            }
            return Promise.reject(error);
        })
        .finally(() => {
            inscribeButton.disabled = false;
            inscribeButton.textContent = 'Inscribe';
        });
    }

    function inscribeAllTransactions() {
        function processNextTransaction() {
            if (pendingTransactions.length === 0) {
                alert('All transactions processed successfully!');
                return;
            }

            inscribeTransaction(false)
                .then(() => {
                    pendingTransactions = JSON.parse(localStorage.getItem('mintResponse')).pendingTransactions || [];
                    setTimeout(processNextTransaction, 1000);
                })
                .catch(error => {
                    console.error('Error processing transactions:', error);
                    alert('Error processing transactions: ' + error.message);
                });
        }

        processNextTransaction();
    }
} 