import { coins } from './networks.js';
import { walletSettingsUI } from './walletSettings.js';
import { receiveUI } from './receive.js'; // Import the receiveUI function
import { sendTXUI } from './sendTX.js';
import { mintUI } from './mint.js';
import { userSettingsUI } from './userSettings.js';
import { displayTransactionHistory } from './getHistory.js';
import { addWalletUI } from './addWallet.js';  // Add this import

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
  frame.style.border = 'none'; // Ensure no border is applied to the frame
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

    const maleIcon = document.createElement('button');  // Changed from img to button
    maleIcon.className = 'back-button';  // Use the same class as back button
    maleIcon.innerHTML = '<img src="/static/images/male-silhouette.png" alt="Male Silhouette" />';
    maleIcon.style.cursor = 'pointer';
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
    coinIcon.className = 'coin-icon';
    slide.appendChild(coinIcon);

    // Wallet selector dropdown
    const walletSelector = document.createElement('select');
    walletSelector.className = 'wallet-selector';
    wallets
      .filter(wallet => wallet.ticker === coin.ticker && wallet.label)
      .forEach(wallet => {
        const option = document.createElement('option');
        option.value = wallet.label;
        option.textContent = wallet.label;
        walletSelector.appendChild(option);
      });
    slide.appendChild(walletSelector);

    // Set the selected wallet from local storage if available
    if (savedSelectedWallets[coin.ticker]) {
      walletSelector.value = savedSelectedWallets[coin.ticker];
    }

    // Balance display
    const balance = document.createElement('div');
    balance.className = 'balance styled-text';
    slide.appendChild(balance);

    // Buttons
    const buttons = document.createElement('div');
    buttons.className = 'buttons';

    const buttonConfigs = [
        { text: 'Send', onClick: () => {
            const selectedWallet = wallets.find(wallet => 
                wallet.ticker === coin.ticker && 
                wallet.label === walletSelector.value
            );
            if (selectedWallet) {
                landingPage.innerHTML = '';
                sendTXUI(selectedWallet);
            }
        }},
        { text: 'Receive', onClick: () => {
            const selectedWallet = wallets.find(wallet => 
                wallet.ticker === coin.ticker && 
                wallet.label === walletSelector.value
            );
            if (selectedWallet) {
                landingPage.innerHTML = '';
                receiveUI(selectedWallet);
            }
        }},
        { text: 'Mint', onClick: () => {
            const selectedWallet = wallets.find(wallet => 
                wallet.ticker === coin.ticker && 
                wallet.label === walletSelector.value
            );
            if (selectedWallet) {
                landingPage.innerHTML = '';
                mintUI(selectedWallet);
            }
        }}
    ];

    buttonConfigs.forEach(config => {
        const button = document.createElement('div');
        button.className = 'button';
        button.textContent = config.text;
        button.addEventListener('click', config.onClick);
        buttons.appendChild(button);
    });

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
        balance.style.cursor = 'default';
        balance.onclick = null;
        // Clear existing transaction history before fetching new ones
        transactionHistory.innerHTML = '';
        fetchAndDisplayTransactions(coin.ticker, selectedWallet.address, transactionHistory);
      } else {
        balance.textContent = `Add a wallet`;
        balance.style.cursor = 'pointer';
        balance.onclick = () => {
          landingPage.innerHTML = '';
          addWalletUI(coin);
        };
        transactionHistory.innerHTML = '<div class="transaction">No recent transactions</div>';
      }
    };

    // Only call updateWalletInfo on change event
    walletSelector.addEventListener('change', () => {
      updateWalletData(coin.ticker, walletSelector.value, balance);
      updateWalletInfo();

      // Save the selected wallet to local storage
      savedSelectedWallets[coin.ticker] = walletSelector.value;
      localStorage.setItem('selectedWallets', JSON.stringify(savedSelectedWallets));
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
        selectedCoin = activeCoins[activeIndex];

        setTimeout(() => {
          const activeSlide = document.querySelector('.swiper-slide-active');
          const walletSelector = activeSlide.querySelector('.wallet-selector');
          const balanceElement = activeSlide.querySelector('.balance');

          if (walletSelector && balanceElement) {
            // Check if there are any wallets for this coin
            const hasWallets = wallets.some(wallet => wallet.ticker === selectedCoin.ticker);
            if (!hasWallets) {
              balanceElement.textContent = 'Add a wallet';
              balanceElement.style.cursor = 'pointer';
              balanceElement.onclick = () => {
                landingPage.innerHTML = '';
                addWalletUI(selectedCoin);
              };
              return;
            }
            
            walletSelector.selectedIndex = 0;
            balanceElement.textContent = 'Loading...';
            balanceElement.style.cursor = 'default';
            balanceElement.onclick = null;
            
            // Update wallet data and transaction history in sequence
            updateWalletData(selectedCoin.ticker, walletSelector.value, balanceElement)
              .then(() => {
                const transactionHistory = activeSlide.querySelector('.transaction-history');
                if (transactionHistory) {
                  transactionHistory.innerHTML = '';
                  fetchAndDisplayTransactions(selectedCoin.ticker, walletSelector.value, transactionHistory);
                }
              });
          }
        }, 500);
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
    displayTransactionHistory(ticker, address, transactionHistoryContainer);
}

document.addEventListener('DOMContentLoaded', () => {
  initializeWallet();
}); 