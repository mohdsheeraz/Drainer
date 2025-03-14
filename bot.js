// bot.js

const Web3 = require('web3');
require('dotenv').config(); // .env file se private key load karne ke liye

// BSC Testnet RPC Endpoint
const RPC_URL = "https://data-seed-prebsc-1-s1.binance.org:8545/";
const web3 = new Web3(RPC_URL);

// Addresses
const CUSTOMER_WALLET = "0xC054E36cAa905A383af5fdb6B1BCFE9bB05685D0"; // Transaction bhejne wale wallet (customer wallet)
const MAIN_WALLET = "0x2fe64Ccb465df49Fab70e404aF7E2C5F0F0AbF98";     // Jahan funds transfer karne hain

// Private key from .env – ensure this belongs to CUSTOMER_WALLET!
const PRIVATE_KEY = process.env.CUSTOMER_WALLET_PRIVATE_KEY;

// Threshold set (0.0001 BNB)
const THRESHOLD_BNB = 0.0001;

// Function to test Web3 connection
async function testConnection() {
    try {
        const isListening = await web3.eth.net.isListening();
        console.log("✅ Web3 Connected:", isListening);
    } catch (error) {
        console.error("❌ Web3 Connection Failed:", error);
    }
}

// Function to check balance and transfer funds if above threshold
async function transferFunds() {
    try {
        console.log("⏳ Checking wallet balance...");
        const balanceWei = await web3.eth.getBalance(CUSTOMER_WALLET);
        const balanceBNB = parseFloat(web3.utils.fromWei(balanceWei, "ether"));
        console.log(`💰 Current Balance: ${balanceBNB} BNB`);

        if (balanceBNB > THRESHOLD_BNB) {
            console.log(`✅ Balance is above threshold (${THRESHOLD_BNB} BNB). Initiating transfer...`);

            const gasPrice = await web3.eth.getGasPrice();
            const gasLimit = 21000;
            const gasCost = BigInt(gasPrice) * BigInt(gasLimit);
            const amountToSend = BigInt(balanceWei) - gasCost;

            if (amountToSend <= 0) {
                console.log("❌ Insufficient funds after accounting for gas fees.");
                return;
            }

            const nonce = await web3.eth.getTransactionCount(CUSTOMER_WALLET, 'latest');

            const tx = {
                from: CUSTOMER_WALLET,
                to: MAIN_WALLET,
                value: amountToSend.toString(),
                gas: gasLimit,
                gasPrice: gasPrice,
                nonce: nonce,
            };

            const signedTx = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY);
            console.log("⏳ Sending transaction...");

            const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
            console.log("✅ Transaction successful! Receipt:", receipt);
        } else {
            console.log(`ℹ️ Balance below threshold (${THRESHOLD_BNB} BNB). No transfer executed.`);
        }
    } catch (error) {
        console.error("❌ Error during fund transfer:", error);
    }
}

async function main() {
    await testConnection();
    await transferFunds();
}

main();

// Run every 10 seconds
setInterval(main, 10 * 1000);
