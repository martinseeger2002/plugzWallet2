import { initializeWallet } from './main.js';
import { userSettingsUI } from './userSettings.js';

export function myInscriptionsUI(selectedWallet) {
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
        userSettingsUI(selectedWallet); // Go back to user settings
    });

    header.appendChild(backButton);
    landingPage.appendChild(header);

    // Title
    const title = document.createElement('h1');
    title.textContent = 'My Inscriptions';
    title.className = 'page-title';
    landingPage.appendChild(title);

    // Create main content container
    const mainContent = document.createElement('div');
    mainContent.className = 'main-content';
    mainContent.style.display = 'flex';
    mainContent.style.flexDirection = 'column';
    mainContent.style.alignItems = 'center';
    mainContent.style.gap = '20px';
    mainContent.style.padding = '20px';
    mainContent.style.maxWidth = '800px';
    mainContent.style.margin = '0 auto';
    mainContent.style.flex = '1';

    // Scrollable iframe container
    const iframe = document.createElement('iframe');
    iframe.className = 'scrollable-iframe';
    iframe.style.width = '100%';
    iframe.style.maxWidth = '400px';
    iframe.style.height = '550px';
    iframe.style.border = '1px solid rgba(255, 255, 255, 0.2)';
    iframe.style.borderRadius = '10px';
    iframe.style.overflow = 'auto';
    iframe.style.backgroundColor = 'black';
    mainContent.appendChild(iframe);

    // Copy to Clipboard button
    const copyButton = document.createElement('button');
    copyButton.textContent = 'Copy';
    copyButton.className = 'styled-button';
    copyButton.style.width = '100%';
    copyButton.style.maxWidth = '400px';
    copyButton.style.fontSize = '20px';
    copyButton.style.fontWeight = '500';
    copyButton.style.textTransform = 'none';
    copyButton.addEventListener('click', () => {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        const pre = doc.querySelector('pre');
        if (pre) {
            navigator.clipboard.writeText(pre.textContent)
                .then(() => alert('JSON data copied to clipboard!'))
                .catch(err => console.error('Failed to copy text: ', err));
        }
    });
    mainContent.appendChild(copyButton);

    // Add main content to landing page
    landingPage.appendChild(mainContent);

    // Function to show inscriptions
    function showInscriptions() {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        doc.open();
        doc.write(`
            <html>
                <body style="background-color: black; color: white; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                </body>
            </html>
        `);
        doc.close();
        const body = doc.body;

        // Get inscriptions from localStorage and filter for selected wallet
        const myInscriptions = JSON.parse(localStorage.getItem('MyInscriptions')) || [];
        const walletInscriptions = myInscriptions.filter(inscription => 
            inscription.sendingaddress === selectedWallet.address
        );

        if (walletInscriptions.length === 0) {
            const noInscriptions = doc.createElement('div');
            noInscriptions.style.padding = '20px';
            noInscriptions.style.textAlign = 'center';
            noInscriptions.textContent = 'No inscriptions found in this wallet';
            body.appendChild(noInscriptions);
            return;
        }

        // Create buttons for different JSON views
        const ordinalsButton = doc.createElement('button');
        ordinalsButton.textContent = 'Ordinals Wallet Format';
        ordinalsButton.className = 'json-button';
        ordinalsButton.style.cssText = `
            background-color: black;
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.2);
            padding: 10px;
            margin: 5px;
            width: 90%;
            cursor: pointer;
            font-family: inherit;
        `;
        ordinalsButton.addEventListener('click', () => showOrdinalsJson(walletInscriptions));
        body.appendChild(ordinalsButton);

        const doggyButton = doc.createElement('button');
        doggyButton.textContent = 'Doggy Market Format';
        doggyButton.className = 'json-button';
        doggyButton.style.cssText = ordinalsButton.style.cssText;
        doggyButton.addEventListener('click', () => showDoggyJson(walletInscriptions));
        body.appendChild(doggyButton);

        // Show inscriptions list
        walletInscriptions.forEach(inscription => {
            const inscriptionDiv = doc.createElement('div');
            inscriptionDiv.style.padding = '10px';
            inscriptionDiv.style.borderBottom = '1px solid rgba(255, 255, 255, 0.2)';
            inscriptionDiv.textContent = `Name: ${inscription.name}`;
            body.appendChild(inscriptionDiv);
        });
    }

    function showOrdinalsJson(inscriptions) {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        const dataToDisplay = inscriptions.map(inscription => ({
            id: `${inscription.txid}i0`,
            meta: {
                name: inscription.name
            }
        }));
        displayJson(doc, dataToDisplay);
    }

    function showDoggyJson(inscriptions) {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        const dataToDisplay = inscriptions.map(inscription => ({
            inscriptionId: `${inscription.txid}i0`,
            name: inscription.name
        }));
        displayJson(doc, dataToDisplay);
    }

    function displayJson(doc, data) {
        doc.body.innerHTML = '';
        const pre = doc.createElement('pre');
        pre.style.padding = '10px';
        pre.style.whiteSpace = 'pre-wrap';
        pre.style.wordBreak = 'break-word';
        pre.textContent = JSON.stringify(data, null, 2);
        doc.body.appendChild(pre);
    }

    // Initialize the display
    showInscriptions();
} 