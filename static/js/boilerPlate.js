import { initializeWallet } from './main.js'; // Ensure this function is exported from main.js
import { addWalletUI } from './addWallet.js'; // Import the addWalletUI function
import { walletSettingsUI } from './walletSettings.js'; // Import the walletSettingsUI function

export function boilerPlateUI(selectedCoin) {
    const landingPage = document.getElementById('landing-page');
    landingPage.innerHTML = ''; // Clear existing content
    landingPage.style.backgroundColor = selectedCoin.color; // Set background color

    const header = document.createElement('div');
    header.className = 'header';

    const backButton = document.createElement('button');
    backButton.className = 'back-button';
    backButton.innerHTML = '<img src="./static/images/back.png" alt="Back Icon" />';
    backButton.addEventListener('click', () => {
        landingPage.innerHTML = ''; // Clear the UI
        initializeWallet(); // Reinitialize the main wallet UI
    });

    header.appendChild(backButton);
    landingPage.appendChild(header);

    const title = document.createElement('h1');
    title.textContent = 'Boilerplate Page';
    title.className = 'page-title';
    landingPage.appendChild(title);

    const walletDropdown = document.createElement('select');
    walletDropdown.className = 'wallet-selector';

    // Example wallets data
    const walletsData = JSON.parse(localStorage.getItem('wallets')) || [];
    const walletsForCoin = walletsData.filter(wallet => wallet.ticker === selectedCoin.ticker);

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
        console.log('Rename Wallet button clicked');
    });
    landingPage.appendChild(renameButton);

    const viewPrivateKeyButton = document.createElement('button');
    viewPrivateKeyButton.className = 'styled-button';
    viewPrivateKeyButton.textContent = 'View Private Key';
    viewPrivateKeyButton.addEventListener('click', () => {
        console.log('View Private Key button clicked');
    });
    landingPage.appendChild(viewPrivateKeyButton);

    const deleteButton = document.createElement('button');
    deleteButton.className = 'styled-button delete-button';
    deleteButton.textContent = 'Delete Wallet';
    deleteButton.addEventListener('click', () => {
        console.log('Delete Wallet button clicked');
    });
    landingPage.appendChild(deleteButton);

    const addWalletButton = document.createElement('button');
    addWalletButton.className = 'styled-button';
    addWalletButton.textContent = 'Add Wallet';
    addWalletButton.addEventListener('click', () => {
        landingPage.innerHTML = ''; // Clear the UI
        addWalletUI(selectedCoin); // Navigate to Add Wallet UI
    });
    landingPage.appendChild(addWalletButton);

    const settingsButton = document.createElement('button');
    settingsButton.className = 'styled-button';
    settingsButton.textContent = 'Settings';
    settingsButton.addEventListener('click', () => {
        console.log('Settings button clicked');
    });
    landingPage.appendChild(settingsButton);

    const coinIcon = document.createElement('img');
    coinIcon.src = `/static/images/${selectedCoin.name}icon.png`; // Ensure the correct property is used
    coinIcon.alt = `${selectedCoin.name} Icon`;
    coinIcon.className = 'coin-icon';
    landingPage.appendChild(coinIcon);
} 