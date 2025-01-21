import { coins } from './networks.js';
import { walletSettingsUI } from './walletSettings.js'; // Import the walletSettingsUI function
import { initializeWallet } from './main.js';  // Add this import

export function settingsUI(selectedCoin) {
    const landingPage = document.getElementById('landing-page');
    landingPage.innerHTML = ''; // Clear existing content

    const header = document.createElement('div');
    header.className = 'header';

    const backButton = document.createElement('button');
    backButton.className = 'back-button';
    backButton.innerHTML = '<img src="./static/images/back.png" alt="Back Icon" />';
    backButton.addEventListener('click', () => {
        const confirmExit = confirm('Go back without saving?');
        if (confirmExit) {
            landingPage.innerHTML = ''; // Clear the settings UI
            walletSettingsUI(selectedCoin); // Navigate back to the Wallet Settings page
        }
    });

    header.appendChild(backButton);
    landingPage.appendChild(header);

    const title = document.createElement('h1');
    title.textContent = 'Settings';
    title.className = 'page-title';
    landingPage.appendChild(title);

    const form = document.createElement('form');
    form.className = 'settings-form';

    // Retrieve saved settings from local storage
    const savedSettings = JSON.parse(localStorage.getItem('coinSettings')) || {};

    coins.forEach(coin => {
        const label = document.createElement('label');
        label.className = 'coin-label';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = savedSettings[coin.ticker] !== false; // Default to true if not set
        checkbox.addEventListener('change', () => {
            // Ensure at least one checkbox is checked
            const checkedBoxes = form.querySelectorAll('input[type="checkbox"]:checked');
            if (checkedBoxes.length === 0) {
                checkbox.checked = true; // Revert change if no boxes are checked
                alert('At least one coin network must be selected.');
            }
        });

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(` ${coin.name}`));
        form.appendChild(label);
    });

    // Save Settings button
    const saveButton = document.createElement('button');
    saveButton.className = 'styled-button';
    saveButton.style.width = '100%';
    saveButton.style.maxWidth = '200px';
    saveButton.style.fontSize = '20px';
    saveButton.style.fontWeight = '500';
    saveButton.style.textTransform = 'none';
    saveButton.textContent = 'Save Settings';
    saveButton.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent form submission

        // Save settings to local storage
        const newSettings = {};
        form.querySelectorAll('input[type="checkbox"]').forEach((checkbox, index) => {
            newSettings[coins[index].ticker] = checkbox.checked;
        });

        localStorage.setItem('coinSettings', JSON.stringify(newSettings));
        console.log('Settings saved:', newSettings);
        
        // Show success message and return to main
        alert('Settings saved successfully!');
        landingPage.innerHTML = '';
        initializeWallet();
    });

    form.appendChild(saveButton);
    landingPage.appendChild(form);
} 