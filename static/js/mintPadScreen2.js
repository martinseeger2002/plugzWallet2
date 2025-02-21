import { mintPadUI } from './mintpad.js';
import { inscribeUI } from './inscriber.js';

export function mintPadScreen2UI(selectedWallet) {
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
        mintPadUI(selectedWallet);
    });

    header.appendChild(backButton);
    landingPage.appendChild(header);

    // Title
    const title = document.createElement('h1');
    title.textContent = 'Mint Pad';
    title.className = 'page-title';
    landingPage.appendChild(title);

    // Display the collection name
    const pendingCollectionDetails = JSON.parse(localStorage.getItem('pendingCollectionDetails'));
    const collectionName = pendingCollectionDetails.collection_name || 'Unknown Collection';
    const collectionNameDisplay = document.createElement('h2');
    collectionNameDisplay.textContent = `Collection: ${collectionName}`;
    collectionNameDisplay.className = 'collection-name';
    landingPage.appendChild(collectionNameDisplay);

    // Wallet dropdown
    const walletDropdown = document.createElement('select');
    walletDropdown.className = 'styled-select';
    const wallets = JSON.parse(localStorage.getItem('wallets')) || [];

    const defaultOption = document.createElement('option');
    defaultOption.textContent = 'Select a Wallet';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    walletDropdown.appendChild(defaultOption);

    wallets.forEach(wallet => {
        const option = document.createElement('option');
        option.value = wallet.label;
        option.textContent = wallet.label;
        if (wallet.label === selectedWallet.label) {
            option.selected = true;
        }
        walletDropdown.appendChild(option);
    });
    landingPage.appendChild(walletDropdown);

    // UTXO dropdown
    const utxoDropdown = document.createElement('select');
    utxoDropdown.className = 'styled-select';
    landingPage.appendChild(utxoDropdown);

    // Update UTXO dropdown based on selected wallet
    walletDropdown.addEventListener('change', () => {
        const selectedWallet = wallets.find(wallet => wallet.label === walletDropdown.value);
        const pendingCollectionDetails = JSON.parse(localStorage.getItem('pendingCollectionDetails'));
        const mintPriceInCoins = parseFloat(pendingCollectionDetails.mint_price) / 100000000;
        const minUtxoValue = mintPriceInCoins + 0.30;

        if (selectedWallet && selectedWallet.utxos && selectedWallet.utxos.length > 0) {
            utxoDropdown.innerHTML = '';
            selectedWallet.utxos
                .filter(utxo => parseFloat(utxo.value) >= minUtxoValue && utxo.confirmations >= 1)
                .forEach(utxo => {
                    const option = document.createElement('option');
                    option.value = `${utxo.txid}:${utxo.vout}`;
                    option.textContent = utxo.value;
                    utxoDropdown.appendChild(option);
                });
            if (selectedWallet.utxos.filter(utxo => parseFloat(utxo.value) >= minUtxoValue && utxo.confirmations >= 1).length === 0) {
                utxoDropdown.innerHTML = '<option disabled>No UTXOs available above the required amount with sufficient confirmations</option>';
            }
        } else {
            utxoDropdown.innerHTML = '<option disabled>No UTXOs available</option>';
        }

        if (selectedWallet) {
            localStorage.setItem('selectedWalletLabel', selectedWallet.label);
        } else {
            localStorage.removeItem('selectedWalletLabel');
        }
    });

    if (selectedWallet.label) {
        walletDropdown.value = selectedWallet.label;
        walletDropdown.dispatchEvent(new Event('change'));
    }

    // Receiving address input
    const addressInput = document.createElement('input');
    addressInput.type = 'text';
    addressInput.placeholder = 'Enter receiving address (optional)';
    addressInput.className = 'styled-input';
    landingPage.appendChild(addressInput);

    // Inscribe button
    const inscribeButton = document.createElement('button');
    inscribeButton.textContent = 'Inscribe';
    inscribeButton.className = 'styled-button';
    inscribeButton.addEventListener('click', () => {
        generateTransactions().then(() => {
            landingPage.innerHTML = '';
            inscribeUI(selectedWallet);
        }).catch(error => {
            console.error('Error generating transaction:', error);
            alert('An error occurred while generating the transaction.');
        });
    });
    landingPage.appendChild(inscribeButton);

    function generateTransactions() {
        return new Promise((resolve, reject) => {
            const selectedWallet = wallets.find(wallet => wallet.label === walletDropdown.value);
            if (!selectedWallet) {
                alert('Please select a wallet.');
                return reject('No wallet selected');
            }

            if (!utxoDropdown.value) {
                alert('Please select a UTXO.');
                return reject('No UTXO selected');
            }

            const [txid, vout] = utxoDropdown.value.split(':');
            const selectedUtxo = selectedWallet.utxos.find(utxo => utxo.txid === txid && utxo.vout == vout);

            console.log('Selected UTXO for Transaction:', selectedUtxo);

            const pendingHexData = JSON.parse(localStorage.getItem('pendingHexData'));
            if (!pendingHexData) {
                alert('No pending hex data found. Please ensure the data is available.');
                return reject('No pending hex data');
            }

            const receivingAddressInput = addressInput.value.trim();
            const receivingAddress = receivingAddressInput || selectedWallet.address;

            const pendingCollectionDetails = JSON.parse(localStorage.getItem('pendingCollectionDetails'));
            const mintPrice = parseFloat(pendingCollectionDetails.mint_price);
            const mintAddress = pendingCollectionDetails.mint_address;

            const requestBody = {
                receiving_address: receivingAddress,
                meme_type: pendingHexData.mimeType,
                hex_data: pendingHexData.hexData,
                sending_address: selectedWallet.address,
                privkey: selectedWallet.privkey,
                utxo: selectedUtxo.txid,
                vout: selectedUtxo.vout,
                script_hex: selectedUtxo.script_hex,
                utxo_amount: selectedUtxo.value
            };

            if (mintPrice > 0) {
                requestBody.mint_address = mintAddress;
                requestBody.mint_price = mintPrice;
            }

            console.log('Request Body:', requestBody);

            fetch(`/rc001/mint_rc001/${selectedWallet.ticker}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            })
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        throw new Error(`Server error: ${text}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                console.log('Response Data:', JSON.stringify(data, null, 2));

                if (data.pendingTransactions && Array.isArray(data.pendingTransactions) && data.pendingTransactions.length > 0) {
                    console.log('Pending Transactions:', data.pendingTransactions);

                    try {
                        let existingHexes = JSON.parse(localStorage.getItem('transactionHexes')) || [];
                        const newHexes = data.pendingTransactions.map(tx => tx.hex);
                        existingHexes.push(...newHexes);
                        localStorage.setItem('transactionHexes', JSON.stringify(existingHexes));
                        console.log('Transaction hexes saved successfully:', newHexes);
                    } catch (error) {
                        console.error('Error saving transaction hexes to local storage:', error);
                        alert('An error occurred while saving the transaction hexes.');
                    }

                    try {
                        const pendingTransactions = data.pendingTransactions.map(tx => ({
                            ...tx,
                            ticker: selectedWallet.ticker
                        }));

                        localStorage.setItem('mintResponse', JSON.stringify({ pendingTransactions }));
                        console.log('Mint response saved successfully.');
                        
                        resolve();
                    } catch (error) {
                        console.error('Error saving mintResponse to local storage:', error);
                        alert('An error occurred while saving the mint response.');
                        reject(error);
                    }

                    try {
                        let pendingUTXOs = JSON.parse(localStorage.getItem('pendingUTXOs')) || [];
                        const usedUtxo = {
                            txid: selectedUtxo.txid,
                            vout: selectedUtxo.vout
                        };

                        const isAlreadyPending = pendingUTXOs.some(utxo => utxo.txid === usedUtxo.txid && utxo.vout === usedUtxo.vout);
                        if (!isAlreadyPending) {
                            pendingUTXOs.push(usedUtxo);
                            localStorage.setItem('pendingUTXOs', JSON.stringify(pendingUTXOs));
                            console.log('Pending UTXO saved:', usedUtxo);
                        } else {
                            console.log('UTXO is already marked as pending:', usedUtxo);
                        }
                    } catch (error) {
                        console.error('Error saving pending UTXOs to local storage:', error);
                        alert('An error occurred while saving the pending UTXO.');
                    }

                    localStorage.removeItem('pendingHexData');
                } else {
                    console.error('Mint API did not return pendingTransactions or it is empty:', data);
                    alert(data.message || 'An error occurred.');
                    reject('No pending transactions returned');
                }
            })
            .catch(error => {
                console.error('Error generating transaction:', error);
                alert('An error occurred while generating the transaction.');
                reject(error);
            });
        });
    }
}