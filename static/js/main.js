import { coins } from './networks.js';
import { walletSettingsUI } from './walletSettings.js';
import { receiveUI } from './receive.js'; // Import the receiveUI function

let selectedCoin = null; // Global variable to store the selected coin

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

  // Retrieve wallets from local storage
  const wallets = JSON.parse(localStorage.getItem('wallets')) || [];

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
      .filter(wallet => wallet.ticker === coin.name)
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
      const selectedWallet = wallets.find(wallet => wallet.label === walletSelector.value);
      balance.textContent = selectedWallet ? `${selectedWallet.balance} ${coin.name}` : `0.000 ${coin.name}`;
    };

    walletSelector.addEventListener('change', updateBalance);
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
      const selectedWallet = wallets.find(wallet => wallet.ticker === coin.name && wallet.label === walletSelector.value);
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
      }
    }
  });

  // Set initial background color
  document.body.style.backgroundColor = selectedCoin ? selectedCoin.color : activeCoins[0].color;
}

document.addEventListener('DOMContentLoaded', () => {
  initializeWallet();
}); 