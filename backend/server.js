const express = require('express');
const { ethers } = require('ethers');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;

// MOCK DATABASE for Chat Context
const users = {
    'user1': { address: null, telegramId: 123 },
    'user2': { address: null, telegramId: 456 }
};

// Contract Configuration (Will need to be updated after deployment)
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Localhost default (usually)
// Minimal ABI for events and functions we need
const ABI = [
    "event CircleCreated(uint256 indexed id, address indexed creator, uint256 amount)",
    "event MemberJoined(uint256 indexed id, address indexed member)",
    "event DepositReceived(uint256 indexed id, address indexed member, uint256 amount, uint256 round)",
    "event PayoutExecuted(uint256 indexed id, address indexed recipient, uint256 amount, uint256 round)",
    "event DefaultDetected(uint256 indexed id, address indexed member, int256 penalty)",
    "event TrustScoreUpdated(address indexed member, int256 newScore)",
    "function getCircleDetails(uint256 _circleId) external view returns (address, uint256, uint256, uint256, bool)",
    "function resolveRound(uint256 _circleId) external"
];

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
// Note: relayWallet needs funds. On localhost standard account #0 usually.
// For automated calls, we'd need a private key.
// const relayWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider); 

// --- Chat Bot Endpoints ---

// 1. Webhook for Chat Commands (Simulated)
app.post('/api/chat/webhook', async (req, res) => {
    const { command, userId, args } = req.body;
    console.log(`Received command: ${command} from ${userId} with args:`, args);

    try {
        let responseText = "";

        if (command === '/create_tontine') {
            responseText = "Please use the Mini-App to create the circle securely with your wallet: [Open Mini-App](http://localhost:5173)";
        }
        else if (command === '/join') {
            const circleId = args[0];
            if (!circleId) return res.json({ text: "Usage: /join <circle_id>" });
            responseText = `Please invoke the transaction in your wallet to join Circle ${circleId}.`;
        }
        else if (command === '/status') {
            const circleId = args[0];
            // Fetch from contract
            try {
                const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
                const details = await contract.getCircleDetails(circleId);
                responseText = `Circle ${circleId}:
Creators: ${details[0]}
Round: ${details[2]}
Members: ${details[3]}
Active: ${details[4]}`;
            } catch (e) {
                responseText = "Circle not found or error fetching details.";
            }
        }
        else if (command === '/trustscore') {
            // Check trust score mock
            responseText = "Your Trust Score is being tracked on-chain. Check the Mini-App.";
        }
        else {
            responseText = "Unknown command.";
        }

        res.json({ text: responseText });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Error" });
    }
});

// --- Event Listeners ---
async function startListeners() {
    console.log("Starting Event Listeners...");
    try {
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

        contract.on("CircleCreated", (id, creator, amount) => {
            console.log(`[EVENT] Circle Created: ID ${id} by ${creator}`);
            // In prod: Send notification to chat
        });

        contract.on("DepositReceived", (id, member, amount, round) => {
            console.log(`[EVENT] Deposit: Circle ${id}, Member ${member}, Round ${round}`);
        });

        contract.on("PayoutExecuted", (id, recipient, amount, round) => {
            console.log(`[EVENT] PAYOUT! Circle ${id}, Recipient ${recipient}, Round ${round}`);
            // Notify Chat!
        });

        contract.on("TrustScoreUpdated", (member, newScore) => {
            console.log(`[EVENT] Trust Score Update: ${member} -> ${newScore}`);
        });

    } catch (e) {
        console.log("Error connecting to contract (maybe not deployed yet?):", e.message);
    }
}

app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
    startListeners();
});
