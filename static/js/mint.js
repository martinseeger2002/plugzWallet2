import { initializeWallet } from './main.js';
import { coins } from './networks.js';
import { mintFileUI } from './mintFile.js';

export function mintUI(selectedWallet) {
    const landingPage = document.getElementById('landing-page');
    landingPage.innerHTML = '';

    // Find the coin data for the selected wallet to get the color
    const selectedCoin = coins.find(coin => coin.ticker === selectedWallet.ticker);
    if (selectedCoin) {
        landingPage.style.backgroundColor = selectedCoin.color; // Keep dynamic color
    }

    // Create header with back button
    const header = document.createElement('div');
    header.className = 'header';

    const backButton = document.createElement('button');
    backButton.className = 'back-button';
    backButton.innerHTML = '<img src="./static/images/back.png" alt="Back Icon" />';
    backButton.addEventListener('click', () => {
        landingPage.innerHTML = '';
        initializeWallet();
    });

    header.appendChild(backButton);
    landingPage.appendChild(header);

    // Create title
    const title = document.createElement('h1');
    title.textContent = 'Mint';
    title.className = 'page-title';
    landingPage.appendChild(title);

    // Add warning text below title
    const warningText = document.createElement('p');
    warningText.textContent = 'Choose a mint selection';
    warningText.className = 'warning-text';
    landingPage.appendChild(warningText);

    // Create container for mint buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'stacked-buttons';

    // Create mint buttons
    const mintButtons = [
        { text: 'Mint Image', value: 1 },
        { text: 'Mint File', value: 2 },
        { text: 'Mint Text', value: 3 },
        { text: 'Mint Folder', value: 4 },
        { text: 'Mint Pad', value: 5 }
    ];

    mintButtons.forEach(btn => {
        const button = document.createElement('button');
        button.className = 'styled-button';
        button.textContent = btn.text;
        button.addEventListener('click', () => {
            if (btn.value === 2) { // Mint File button
                mintFileUI(selectedWallet);
            } else {
                console.log(`Mint ${btn.value} clicked for wallet:`, selectedWallet);
                // Add other mint functionality here
            }
        });
        buttonContainer.appendChild(button);
    });

    landingPage.appendChild(buttonContainer);

    // Add the selected coin's icon
    const coinIcon = document.createElement('img');
    coinIcon.src = `/static/images/${selectedWallet.ticker}icon.png`;
    coinIcon.alt = `${selectedWallet.ticker} Icon`;
    coinIcon.className = 'coin-icon';
    landingPage.appendChild(coinIcon);
} 