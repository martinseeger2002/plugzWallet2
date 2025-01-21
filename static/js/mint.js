import { initializeWallet } from './main.js';

export function mintUI(selectedWallet) {
    const landingPage = document.getElementById('landing-page');
    landingPage.innerHTML = ''; // Clear existing content
    landingPage.style.backgroundColor = selectedWallet.color; // Set background color

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
    title.textContent = 'Mint';
    title.className = 'page-title';
    landingPage.appendChild(title);

    // Add warning text below title
    const warningText = document.createElement('p');
    warningText.textContent = 'Choose a mint selection';
    warningText.className = 'warning-text';
    warningText.style.textAlign = 'center';
    warningText.style.marginTop = '10px';
    landingPage.appendChild(warningText);

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
        button.className = 'styled-button';  // Use the same button style as wallet settings
        button.textContent = btn.text;
        button.addEventListener('click', () => {
            console.log(`Mint ${btn.value} clicked for wallet:`, selectedWallet);
            // Add mint functionality here
        });
        landingPage.appendChild(button);
    });

    // Add the selected coin's icon below the settings button
    const coinIcon = document.createElement('img');
    coinIcon.src = `/static/images/${selectedCoin.name}icon.png`; // Ensure the correct property is used
    coinIcon.alt = `${selectedCoin.name} Icon`;
    coinIcon.className = 'coin-icon';
    landingPage.appendChild(coinIcon);
} 