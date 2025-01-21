import { initializeWallet } from './main.js';

export function userSettingsUI() {
    const landingPage = document.getElementById('landing-page');
    landingPage.innerHTML = ''; // Clear existing content

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
    title.textContent = 'User Settings';
    title.className = 'page-title';
    landingPage.appendChild(title);

    // Create buttons array
    const settingsButtons = [
        {
            text: 'My Inscriptions',
            onClick: () => {
                console.log('View inscriptions clicked');
                // Add inscription viewing functionality here
            }
        },
        {
            text: 'Clear Mint Cache',
            onClick: () => {
                const confirmClear = confirm('Are you sure you want to clear the mint cache?');
                if (confirmClear) {
                    localStorage.removeItem('mintCache');
                    console.log('Mint cache cleared');
                    alert('Mint cache has been cleared');
                }
            }
        }
    ];

    // Create and append buttons
    settingsButtons.forEach(btn => {
        const button = document.createElement('button');
        button.className = 'styled-button';
        button.textContent = btn.text;
        button.addEventListener('click', btn.onClick);
        landingPage.appendChild(button);
    });
} 