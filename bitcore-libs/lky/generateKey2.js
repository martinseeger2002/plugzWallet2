#!/usr/bin/env node

const dogecore = require('./bitcore-lib-luckycoin');
const { PrivateKey } = dogecore;

// Check if a private key is provided as a command line argument
if (process.argv.length < 3) {
    console.error('Please provide a private key as an argument.');
    process.exit(1);
}

// Get the private key from the command line arguments
const inputPrivateKey = process.argv[2];

try {
    // Create a PrivateKey object from the input
    const privateKey = new PrivateKey(inputPrivateKey);

    // Generate the corresponding address
    const address = privateKey.toAddress();

    console.log('Corresponding Address:', address.toString());
} catch (error) {
    console.error('Invalid private key:', error.message);
    process.exit(1);
}