import { initializeWallet } from './main.js';
import { coins } from './networks.js'; // Import coins to get the color

export function sendTXUI(selectedWallet) {
    const landingPage = document.getElementById('landing-page');
    landingPage.innerHTML = ''; // Clear existing content

    // Find the coin data for the selected wallet to get the color
    const selectedCoin = coins.find(coin => coin.ticker === selectedWallet.ticker);
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

    // Create container for wallet info
    const walletInfoContainer = document.createElement('div');
    walletInfoContainer.className = 'wallet-info-container';

    // Display wallet information
    const walletInfo = document.createElement('pre');
    walletInfo.className = 'wallet-info';
    walletInfo.textContent = JSON.stringify(selectedWallet, null, 2);
    walletInfoContainer.appendChild(walletInfo);

    landingPage.appendChild(walletInfoContainer);

    // Add the selected coin's icon at the bottom
    const coinIcon = document.createElement('img');
    coinIcon.src = `/static/images/${selectedWallet.ticker()}icon.png`;
    coinIcon.alt = `${selectedWallet.ticker} Icon`;
    coinIcon.className = 'coin-icon';
    landingPage.appendChild(coinIcon);
} 