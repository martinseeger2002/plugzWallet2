import { coins } from './networks.js';
import { walletSettingsUI } from './walletSettings.js';
import { receiveUI } from './receive.js'; // Import the receiveUI function
import { sendTXUI } from './sendTX.js';
import { mintUI } from './mint.js';
import { userSettingsUI } from './userSettings.js';

// Initialize wallets variable
let wallets = [];

let selectedCoin = null; // Global variable to store the selected coin

export function initializeWallet() {
  // Refresh wallets data from localStorage each time initializeWallet is called
  wallets = JSON.parse(localStorage.getItem('wallets')) || [];
  
  const landingPage = document.getElementById('landing-page');
  landingPage.innerHTML = ''; // Clear existing content

  // Retrieve saved settings from local storage
  const savedSettings = JSON.parse(localStorage.getItem('coinSettings')) || {};

  // Then, read selected wallets after wallets are loaded
  const savedSelectedWallets = JSON.parse(localStorage.getItem('selectedWallets')) || {};

  // Filter coins based on saved settings
  const activeCoins = coins.filter(coin => savedSettings[coin.ticker] !== false);

  // Create the frame for the wallet UI
  const frame = document.createElement('div');
  frame.className = 'frame';
  frame.style.border = 'none'; // Remove the border
  landingPage.appendChild(frame);

  // Create the swiper container
  const swiperContainer = document.createElement('div');
  swiperContainer.className = 'swiper';
  frame.appendChild(swiperContainer);

  // Create the swiper wrapper
  const swiperWrapper = document.createElement('div');
  swiperWrapper.className = 'swiper-wrapper';
  swiperContainer.appendChild(swiperWrapper);

  // Create a slide for each active coin
  activeCoins.forEach((coin, index) => {
    const slide = document.createElement('div');
    slide.className = 'swiper-slide';
    slide.style.backgroundColor = coin.color; // Set the background color
    swiperWrapper.appendChild(slide);

    // Header with settings button and male silhouette
    const header = document.createElement('div');
    header.className = 'header';

    const maleIcon = document.createElement('img');
    maleIcon.src = '/static/images/male-silhouette.png';
    maleIcon.alt = 'Male Silhouette';
    maleIcon.className = 'male-icon';
    // Add click event to male icon for user settings
    maleIcon.style.cursor = 'pointer'; // Add pointer cursor to indicate it's clickable
    maleIcon.addEventListener('click', () => {
        const selectedWallet = wallets.find(wallet => 
            wallet.ticker === coin.ticker && 
            wallet.label === walletSelector.value
        );
        landingPage.innerHTML = '';
        userSettingsUI(selectedWallet);
    });

    const settingsButton = document.createElement('button');
    settingsButton.className = 'settings-button';
    settingsButton.innerHTML = '<img src="/static/images/settings-icon.png" alt="Settings Icon" />';
    settingsButton.style.backgroundColor = 'transparent';
    settingsButton.style.border = 'none';
    settingsButton.addEventListener('click', () => {
        // Get the currently selected wallet
        const selectedWallet = wallets.find(wallet => 
            wallet.ticker === coin.ticker && 
            wallet.label === walletSelector.value
        );
        
        landingPage.innerHTML = '';
        walletSettingsUI(coin, selectedWallet); // Pass both coin and selected wallet
    });

    header.appendChild(maleIcon);
    header.appendChild(settingsButton);
    slide.appendChild(header);

    // Coin icon
    const coinIcon = document.createElement('img');
    coinIcon.src = `/static/images/${coin.name}icon.png`; // Path to the coin icon
    coinIcon.alt = `${coin.name} Icon`;
    coinIcon.style.width = '200px';
    coinIcon.style.height = '200px';
    coinIcon.style.margin = '20px 0';
    slide.appendChild(coinIcon);

    // Wallet selector dropdown
    const walletSelector = document.createElement('select');
    walletSelector.className = 'wallet-selector';
    walletSelector.style.fontFamily = "'Press Start 2P', cursive"; // Match button font
    walletSelector.style.fontSize = '16px'; // Increased font size
    walletSelector.style.fontWeight = 'bold'; // Make text bold
    wallets
      .filter(wallet => wallet.ticker === coin.ticker && wallet.label) // Filter by coin ticker and label
      .forEach(wallet => {
        const option = document.createElement('option');
        option.value = wallet.label;
        option.textContent = wallet.label;
        option.style.fontFamily = "'Press Start 2P', cursive"; // Apply font to options
        option.style.fontSize = '16px'; // Increased font size for options
        option.style.fontWeight = 'bold'; // Make options bold
        walletSelector.appendChild(option);
      });
    slide.appendChild(walletSelector);

    // Set the selected wallet from local storage if available
    if (savedSelectedWallets[coin.ticker]) {
      walletSelector.value = savedSelectedWallets[coin.ticker];
    }

    // Balance display
    const balance = document.createElement('div');
    balance.className = 'balance';
    slide.appendChild(balance);

    // Buttons
    const buttons = document.createElement('div');
    buttons.className = 'buttons';

    const sendButton = document.createElement('div');
    sendButton.className = 'button';
    sendButton.textContent = 'Send';
    sendButton.addEventListener('click', () => {
        const selectedWallet = wallets.find(wallet => wallet.ticker === coin.ticker && wallet.label === walletSelector.value);
        if (selectedWallet) {
            landingPage.innerHTML = ''; // Clear the current UI
            sendTXUI(selectedWallet); // Call the sendTXUI function with the selected wallet
        }
    });
    buttons.appendChild(sendButton);

    const receiveButton = document.createElement('div');
    receiveButton.className = 'button';
    receiveButton.textContent = 'Receive';
    receiveButton.addEventListener('click', () => {
      const selectedWallet = wallets.find(wallet => wallet.ticker === coin.ticker && wallet.label === walletSelector.value);
      if (selectedWallet) {
        landingPage.innerHTML = ''; // Clear the current UI
        receiveUI(selectedWallet); // Call the receiveUI function with the selected wallet
      }
    });
    buttons.appendChild(receiveButton);

    const mintButton = document.createElement('div');
    mintButton.className = 'button';
    mintButton.textContent = 'Mint';
    mintButton.addEventListener('click', () => {
        const selectedWallet = wallets.find(wallet => wallet.ticker === coin.ticker && wallet.label === walletSelector.value);
        if (selectedWallet) {
            landingPage.innerHTML = ''; // Clear the current UI
            mintUI(selectedWallet); // Call the mintUI function with the selected wallet
        }
    });
    buttons.appendChild(mintButton);

    slide.appendChild(buttons); // Append buttons before transaction history

    // Transaction history
    const transactionHistory = document.createElement('div');
    transactionHistory.className = 'transaction-history';
    slide.appendChild(transactionHistory);

    // Update balance and transaction history based on selected wallet
    const updateWalletInfo = () => {
      const selectedWallet = wallets.find(wallet => wallet.label === walletSelector.value && wallet.ticker === coin.ticker);
      if (selectedWallet) {
        balance.textContent = `${selectedWallet.balance} ${coin.name}`;
        fetchAndDisplayTransactions(coin.ticker, selectedWallet.address, transactionHistory);
      } else {
        balance.textContent = `0.000 ${coin.name}`;
        transactionHistory.innerHTML = '<div style="margin-left: 20px;">No recent transactions</div>'; // Added margin
      }
    };

    walletSelector.addEventListener('change', () => {
      updateWalletData(coin.ticker, walletSelector.value, balance); // Update wallet data on selection change
      updateWalletInfo(); // Update transaction history

      // Save the selected wallet to local storage
      savedSelectedWallets[coin.ticker] = walletSelector.value;
      localStorage.setItem('selectedWallets', JSON.stringify(savedSelectedWallets));
    });

    // Trigger updateWalletData on dropdown click to ensure it runs even if the same wallet is selected
    walletSelector.addEventListener('click', () => {
      updateWalletData(coin.ticker, walletSelector.value, balance);
      updateWalletInfo(); // Update transaction history
    });

    updateWalletInfo(); // Initialize balance and transaction history display
  });

  // Initialize Swiper
  const swiper = new Swiper('.swiper', {
    direction: 'horizontal',
    loop: true,
    pagination: {
      el: '.swiper-pagination',
    },
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
    slidesPerView: 1,
    slidesPerGroup: 1,
    initialSlide: selectedCoin ? activeCoins.findIndex(c => c.name === selectedCoin.name) : 0,
    on: {
      slideChange: function () {
        const activeIndex = this.realIndex;
        document.body.style.backgroundColor = activeCoins[activeIndex].color;
        selectedCoin = activeCoins[activeIndex]; // Update selected coin

        // Wait for half a second before proceeding with balance updatey
        setTimeout(() => {
          const activeSlide = document.querySelector('.swiper-slide-active');
          const walletSelector = activeSlide.querySelector('.wallet-selector');
          const balanceElement = activeSlide.querySelector('.balance');

          if (walletSelector && balanceElement) {
            walletSelector.selectedIndex = 0; // Select the first wallet in the dropdown
            
            // Clear the balance display immediately to avoid showing the old balance
            balanceElement.textContent = 'Loading...';

            updateWalletData(selectedCoin.ticker, walletSelector.value, balanceElement);
          }
        }, 500); // 500 milliseconds delay
      }
    }
  });

  // Set initial background color
  document.body.style.backgroundColor = selectedCoin ? selectedCoin.color : activeCoins[0].color;

  // Update wallet data for the initial coin and wallet
  const initialWalletSelector = document.querySelector('.swiper-slide-active .wallet-selector');
  const initialBalanceElement = document.querySelector('.swiper-slide-active .balance');
  if (initialWalletSelector && initialBalanceElement) {
    initialWalletSelector.selectedIndex = 0; // Select the first wallet initially
    initialBalanceElement.textContent = 'Loading...'; // Clear initial balance display
    updateWalletData(activeCoins[0].ticker, initialWalletSelector.value, initialBalanceElement);
  }
}

function updateWalletData(ticker, walletLabel, balanceElement) {
    const selectedWallet = wallets.find(wallet => wallet.label === walletLabel && wallet.ticker === ticker);
    if (!selectedWallet) return;

    fetch(`/api/listunspent/${ticker}/${selectedWallet.address}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                // Calculate total balance and incoming (unconfirmed) amount
                let totalBalance = 0;
                let incomingBalance = 0;

                // Update UTXOs with the correct structure
                selectedWallet.utxos = data.data.txs.map(tx => ({
                    txid: tx.txid,
                    value: parseFloat(tx.value),
                    confirmations: tx.confirmations,
                    vout: tx.vout,
                    script_hex: tx.script_hex
                }));

                // Calculate balances, ignoring UTXOs of 0.01 or less
                selectedWallet.utxos.forEach(utxo => {
                    if (utxo.value > 0.01) { // Only count UTXOs greater than 0.01
                        if (utxo.confirmations === 0) {
                            incomingBalance += utxo.value;
                        }
                        totalBalance += utxo.value;
                    }
                });

                // Update wallet properties
                selectedWallet.balance = totalBalance;
                selectedWallet.incoming = incomingBalance;
                
                // Remove the duplicate unspent_transactions field
                delete selectedWallet.unspent_transactions;
                delete selectedWallet.transactions;

                // Save updated wallet to local storage
                localStorage.setItem('wallets', JSON.stringify(wallets));

                // Update UI
                setTimeout(() => {
                    balanceElement.textContent = `${totalBalance.toFixed(8)} ${ticker}`;
                    console.log('Updated wallet data:', selectedWallet);
                }, 500);
            } else {
                console.error('Failed to fetch unspent transactions:', data.message);
                balanceElement.textContent = 'Error loading balance';
            }
        })
        .catch(error => {
            console.error('Error fetching unspent transactions:', error);
            balanceElement.textContent = 'Error loading balance';
        });
}

function fetchAndDisplayTransactions(ticker, address, transactionHistoryContainer) {
  transactionHistoryContainer.innerHTML = '<div style="margin-left: 20px;">Loading transactions...</div>'; // Added margin

  fetch(`/api/getlasttransactions/${ticker}/${address}`)
    .then(response => response.json())
    .then(data => {
      if (data.status === 'success') {
        const transactions = data.data.transactions;
        transactionHistoryContainer.innerHTML = ''; // Clear the loading message

        // Populate the transaction history with the fetched transactions
        transactions.forEach(tx => {
          const txElement = document.createElement('div');
          txElement.className = 'transaction';
          txElement.style.marginLeft = '20px'; // Add left margin

          // Calculate time since transaction was sent
          const currentTime = Date.now();
          const txTime = new Date(tx.time * 1000);
          const timeSince = Math.floor((currentTime - txTime) / 1000); // Time in seconds

          // Format time since transaction
          let timeSinceText;
          if (timeSince < 60) {
            timeSinceText = `${timeSince} seconds ago`;
          } else if (timeSince < 3600) {
            timeSinceText = `${Math.floor(timeSince / 60)} mins ago`;
          } else if (timeSince < 86400) {
            timeSinceText = `${Math.floor(timeSince / 3600)} hours ago`;
          } else {
            timeSinceText = `${Math.floor(timeSince / 86400)} days ago`;
          }

          // Display amount and time since transaction
          txElement.textContent = `${tx.amount} ${timeSinceText}`;
          transactionHistoryContainer.appendChild(txElement);
        });
      } else {
        transactionHistoryContainer.innerHTML = '<div style="margin-left: 20px;">Failed to load transactions</div>'; // Added margin
        console.error('Error fetching transactions:', data.message);
      }
    })
    .catch(error => {
      transactionHistoryContainer.innerHTML = '<div style="margin-left: 20px;">Error loading transactions</div>'; // Added margin
      console.error('Error fetching transactions:', error);
    });
}

document.addEventListener('DOMContentLoaded', () => {
  initializeWallet();
}); 