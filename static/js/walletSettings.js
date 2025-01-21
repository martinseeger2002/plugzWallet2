import { initializeWallet } from './main.js'; // Ensure this function is exported from main.js
import { coins } from './networks.js';
import { addWalletUI } from './addWallet.js'; // Import the addWalletUI function
import { settingsUI } from './settings.js'; // Import the settingsUI function

export function walletSettingsUI(selectedCoin) {
    const landingPage = document.getElementById('landing-page');
    landingPage.innerHTML = ''; // Clear existing content
    landingPage.style.backgroundColor = selectedCoin.color; // Set background color

    const header = document.createElement('div');
    header.className = 'header';

    const backButton = document.createElement('button');
    backButton.className = 'back-button';
    backButton.innerHTML = '<img src="./static/images/back.png" alt="Back Icon" />';
    backButton.addEventListener('click', () => {
        landingPage.innerHTML = ''; // Clear the wallet settings UI
        initializeWallet(); // Reinitialize the main wallet UI
    });

    header.appendChild(backButton);
    landingPage.appendChild(header);

    const title = document.createElement('h1');
    title.textContent = 'Wallet Settings';
    title.className = 'page-title';
    landingPage.appendChild(title);

    const walletDropdown = document.createElement('select');
    walletDropdown.className = 'wallet-selector';

    // Retrieve wallets from local storage
    const walletsData = JSON.parse(localStorage.getItem('wallets')) || [];
    // Filter wallets for the selected coin and exclude those without a label
    const walletsForCoin = walletsData.filter(wallet => wallet.ticker === selectedCoin.ticker && wallet.label);

    // Populate dropdown with wallets for the selected coin
    walletsForCoin.forEach(wallet => {
        const option = document.createElement('option');
        option.value = wallet.label;
        option.textContent = wallet.label;
        walletDropdown.appendChild(option);
    });
    landingPage.appendChild(walletDropdown);

    const renameButton = document.createElement('button');
    renameButton.className = 'styled-button';
    renameButton.textContent = 'Rename Wallet';
    renameButton.addEventListener('click', () => {
        const currentLabel = walletDropdown.value;
        const newLabel = prompt('Enter new label:', currentLabel);
        if (newLabel && newLabel !== currentLabel) {
            // Update the wallet label in local storage
            const walletIndex = walletsData.findIndex(wallet => wallet.label === currentLabel && wallet.ticker === selectedCoin.ticker);
            if (walletIndex !== -1) {
                walletsData[walletIndex].label = newLabel;
                localStorage.setItem('wallets', JSON.stringify(walletsData));
                console.log('Wallet label updated:', newLabel);
                
                // Update the dropdown option text
                walletDropdown.options[walletDropdown.selectedIndex].textContent = newLabel;
                walletDropdown.options[walletDropdown.selectedIndex].value = newLabel;
            }
        }
    });
    landingPage.appendChild(renameButton);

    const viewPrivateKeyButton = document.createElement('button');
    viewPrivateKeyButton.className = 'styled-button';
    viewPrivateKeyButton.textContent = 'View Private Key';
    viewPrivateKeyButton.addEventListener('click', () => {
        const currentLabel = walletDropdown.value;
        const wallet = walletsData.find(wallet => wallet.label === currentLabel && wallet.ticker === selectedCoin.ticker);
        if (wallet) {
            const dialog = document.createElement('div');
            dialog.className = 'dialog';

            const privKeyInput = document.createElement('input');
            privKeyInput.type = 'text';
            privKeyInput.value = wallet.privkey;
            privKeyInput.readOnly = true; // Make the input read-only
            privKeyInput.style.width = '100%'; // Full width for better visibility
            dialog.appendChild(privKeyInput);

            const copyButton = document.createElement('button');
            copyButton.textContent = 'Copy to Clipboard';
            copyButton.addEventListener('click', () => {
                privKeyInput.select();
                document.execCommand('copy');
                alert('Private key copied to clipboard!');
            });
            dialog.appendChild(copyButton);

            const closeButton = document.createElement('button');
            closeButton.textContent = 'Close';
            closeButton.addEventListener('click', () => {
                landingPage.removeChild(dialog);
            });
            dialog.appendChild(closeButton);

            landingPage.appendChild(dialog);
        }
    });
    landingPage.appendChild(viewPrivateKeyButton);

    const deleteButton = document.createElement('button');
    deleteButton.className = 'styled-button delete-button';
    deleteButton.textContent = 'Delete Wallet';
    deleteButton.addEventListener('click', () => {
        const currentLabel = walletDropdown.value;
        const confirmDelete = confirm('Are you sure? This action cannot be undone.');
        if (confirmDelete) {
            // Find the index of the wallet to delete
            const walletIndex = walletsData.findIndex(wallet => wallet.label === currentLabel && wallet.ticker === selectedCoin.ticker);
            if (walletIndex !== -1) {
                // Remove the wallet from the array
                walletsData.splice(walletIndex, 1);
                // Update local storage
                localStorage.setItem('wallets', JSON.stringify(walletsData));
                console.log('Wallet deleted:', currentLabel);
                // Remove the option from the dropdown
                walletDropdown.remove(walletDropdown.selectedIndex);
            }
        }
    });
    landingPage.appendChild(deleteButton);

    const addWalletButton = document.createElement('button');
    addWalletButton.className = 'styled-button';
    addWalletButton.textContent = 'Add Wallet';
    addWalletButton.addEventListener('click', () => {
        landingPage.innerHTML = ''; // Clear the wallet settings UI
        addWalletUI(selectedCoin); // Pass the entire selectedCoin object
    });
    landingPage.appendChild(addWalletButton);

    // Add the "Settings" button below the "Add Wallet" button
    const settingsButton = document.createElement('button');
    settingsButton.className = 'styled-button';
    settingsButton.textContent = 'Settings';
    settingsButton.addEventListener('click', () => {
        landingPage.innerHTML = ''; // Clear the wallet settings UI
        settingsUI(selectedCoin); // Navigate to the Settings page
    });
    landingPage.appendChild(settingsButton);

    // Add the selected coin's icon below the settings button
    const coinIcon = document.createElement('img');
    coinIcon.src = `/static/images/${selectedCoin.name}icon.png`; // Ensure the correct property is used
    coinIcon.alt = `${selectedCoin.name} Icon`;
    coinIcon.className = 'coin-icon';
    landingPage.appendChild(coinIcon);
}

// Example function to get wallets for a selected coin
function getWalletsForCoin(coin) {
    // Replace with actual logic to retrieve wallets for the selected coin
    return ['Wallet 1', 'Wallet 2', 'Wallet 3'];
} 