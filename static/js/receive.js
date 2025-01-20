import { initializeWallet } from './main.js'; // Ensure this function is exported from main.js

export function receiveUI(selectedWallet) {
    const landingPage = document.getElementById('landing-page');
    landingPage.innerHTML = ''; // Clear existing content

    // Create a header for the back button
    const header = document.createElement('div');
    header.className = 'header';

    // Create a back button
    const backButton = document.createElement('button');
    backButton.className = 'back-button';
    backButton.innerHTML = '<img src="./static/images/back.png" alt="Back Icon" />';
    backButton.addEventListener('click', () => {
        landingPage.innerHTML = ''; // Clear the receive UI
        initializeWallet(); // Navigate back to the main wallet UI
    });

    header.appendChild(backButton);
    landingPage.appendChild(header);

    // Create a container for the QR code and address
    const container = document.createElement('div');
    container.className = 'receive-container';

    // Create a canvas element for the QR code
    const qrCanvas = document.createElement('canvas');
    qrCanvas.width = 325;
    qrCanvas.height = 325;
    container.appendChild(qrCanvas);

    // Generate the QR code using the global QRCode object
    QRCode.toCanvas(qrCanvas, selectedWallet.address, { width: 325, height: 325 }, (error) => {
        if (error) console.error('Error generating QR code:', error);
    });

    // Create a text input for the address
    const addressInput = document.createElement('input');
    addressInput.type = 'text';
    addressInput.value = selectedWallet.address;
    addressInput.readOnly = true; // Make the input read-only
    addressInput.className = 'address-input';
    container.appendChild(addressInput);

    // Create a button to copy the address to the clipboard
    const copyButton = document.createElement('button');
    copyButton.className = 'styled-button';
    copyButton.textContent = 'Copy to Clipboard';
    copyButton.addEventListener('click', () => {
        addressInput.select();
        document.execCommand('copy');
        alert('Address copied to clipboard!');
    });
    container.appendChild(copyButton);

    landingPage.appendChild(container);
} 