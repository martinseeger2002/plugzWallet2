import { coins } from './networks.js';
import { walletSettingsUI } from './walletSettings.js';
import { receiveUI } from './receive.js'; // Import the receiveUI function

let selectedCoin = null; // Global variable to store the selected coin
let wallets = JSON.parse(localStorage.getItem('wallets')) || []; // Retrieve wallets from local storage

export function initializeWallet() {
  const landingPage = document.getElementById('landing-page');
  landingPage.innerHTML = ''; // Clear existing content

  // Retrieve saved settings from local storage
  const savedSettings = JSON.parse(localStorage.getItem('coinSettings')) || {};

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

    const maleIcon = document.createElement('img');
    maleIcon.src = '/static/images/male-silhouette.png'; // Ensure this path is correct
    maleIcon.alt = 'Male Silhouette';
    maleIcon.className = 'male-icon';

    const settingsButton = document.createElement('button');
    settingsButton.className = 'settings-button';
    settingsButton.innerHTML = '<img src="/static/images/settings-icon.png" alt="Settings Icon" />';
    settingsButton.style.backgroundColor = 'transparent'; // Make button background transparent
    settingsButton.style.border = 'none'; // Remove border
    settingsButton.addEventListener('click', () => {
      selectedCoin = coin; // Store the selected coin
      console.log('Selected Coin:', selectedCoin); // Debugging: Log the selected coin
      landingPage.innerHTML = ''; // Clear the wallet UI
      walletSettingsUI(coin); // Call the walletSettingsUI function with the selected coin
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
    wallets
      .filter(wallet => wallet.ticker === coin.ticker && wallet.label) // Filter by coin ticker and label
      .forEach(wallet => {
        const option = document.createElement('option');
        option.value = wallet.label;
        option.textContent = wallet.label;
        walletSelector.appendChild(option);
      });
    slide.appendChild(walletSelector);

    // Balance display
    const balance = document.createElement('div');
    balance.className = 'balance';
    slide.appendChild(balance);

    // Update balance display based on selected wallet
    const updateBalance = () => {
      const selectedWallet = wallets.find(wallet => wallet.label === walletSelector.value && wallet.ticker === coin.ticker);
      balance.textContent = selectedWallet ? `${selectedWallet.balance} ${coin.name}` : `0.000 ${coin.name}`;
    };

    walletSelector.addEventListener('change', () => {
      updateWalletData(coin.ticker, walletSelector.value, balance); // Update wallet data on selection change
    });

    // Trigger updateWalletData on dropdown click to ensure it runs even if the same wallet is selected
    walletSelector.addEventListener('click', () => {
      updateWalletData(coin.ticker, walletSelector.value, balance);
    });

    updateBalance(); // Initialize balance display

    // Buttons
    const buttons = document.createElement('div');
    buttons.className = 'buttons';

    const sendButton = document.createElement('div');
    sendButton.className = 'button';
    sendButton.textContent = 'Send';
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
    buttons.appendChild(mintButton);

    slide.appendChild(buttons);

    // Transaction history
    const transactionHistory = document.createElement('div');
    transactionHistory.className = 'transaction-history';
    slide.appendChild(transactionHistory);
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

        // Wait for half a second before proceeding with balance update
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
        selectedWallet.unspent_transactions = data.data.txs;
        localStorage.setItem('wallets', JSON.stringify(wallets)); // Update local storage

        // Calculate total balance from unspent transactions
        const totalBalance = selectedWallet.unspent_transactions.reduce((sum, tx) => sum + parseFloat(tx.value), 0);

        // Wait for half a second before updating the balance display
        setTimeout(() => {
          balanceElement.textContent = `${totalBalance.toFixed(8)} ${ticker}`; // Update balance display
          console.log('Updated wallet data:', selectedWallet);
        }, 500); // 500 milliseconds delay
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

document.addEventListener('DOMContentLoaded', () => {
  initializeWallet();
}); 