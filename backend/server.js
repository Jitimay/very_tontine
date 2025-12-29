const express = require('express');
const { ethers } = require('ethers');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Contract Configuration
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const ABI = [
    "event CircleCreated(uint256 indexed id, address indexed creator, uint256 amount)",
    "event MemberJoined(uint256 indexed id, address indexed member)",
    "event DepositReceived(uint256 indexed id, address indexed member, uint256 amount, uint256 round)",
    "event PayoutExecuted(uint256 indexed id, address indexed recipient, uint256 amount, uint256 round)",
    "event DefaultDetected(uint256 indexed id, address indexed member, int256 penalty)",
    "event TrustScoreUpdated(address indexed member, int256 newScore)",
    "function getCircleDetails(uint256 _circleId) external view returns (address, uint256, uint256, uint256, bool)",
    "function resolveRound(uint256 _circleId) external",
    "function nextCircleId() external view returns (uint256)"
];

const provider = new ethers.JsonRpcProvider(RPC_URL);
let relayWallet;
if (PRIVATE_KEY) {
    relayWallet = new ethers.Wallet(PRIVATE_KEY, provider);
}

// --- API Endpoints ---

// 1. Get all circles (Listing)
app.get('/api/circles', async (req, res) => {
    try {
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
        const nextId = await contract.nextCircleId();
        const circles = [];

        // Fetch last 10 circles for brevity
        const startId = Math.max(1, Number(nextId) - 10);
        for (let i = startId; i < Number(nextId); i++) {
            const details = await contract.getCircleDetails(i);
            circles.push({
                id: i,
                creator: details[0],
                amount: ethers.formatEther(details[1]),
                round: Number(details[2]),
                memberCount: Number(details[3]),
                active: details[4]
            });
        }
        res.json(circles);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch circles" });
    }
});

// 2. Resolve Round (Relayer Endpoint)
app.post('/api/resolve/:id', async (req, res) => {
    const { id } = req.params;
    if (!relayWallet) return res.status(403).json({ error: "Relayer not configured" });

    try {
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, relayWallet);
        const tx = await contract.resolveRound(id);
        await tx.wait();
        res.json({ success: true, txHash: tx.hash });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.reason || "Resolution failed" });
    }
});

// 3. Webhook for Chat Commands (Simulated)
app.post('/api/chat/webhook', async (req, res) => {
    const { command, userId, args } = req.body;
    const miniAppUrl = process.env.MINI_APP_URL || "http://localhost:5173";

    try {
        let text = "";
        if (command === '/create_tontine') {
            text = `Create your circle here: [Open VeryTontine](${miniAppUrl})`;
        } else if (command === '/status') {
            const circleId = args[0];
            const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
            const details = await contract.getCircleDetails(circleId);
            text = `Circle ${circleId}: Round ${details[2]}, ${details[3]} members. ${details[4] ? "✅ Active" : "❌ Inactive"}`;
        } else {
            text = "Unknown command. Try /create_tontine or /status <id>";
        }
        res.json({ text });
    } catch (error) {
        res.status(500).json({ error: "Internal Error" });
    }
});

// --- Event Listeners (For background logging/notifications) ---
async function startListeners() {
    if (process.env.VERCEL) return; // Don't start listeners on Vercel serverless functions

    console.log("Starting Event Listeners...");
    try {
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
        contract.on("PayoutExecuted", (id, recipient, amount, round) => {
            console.log(`[PAYOUT] Circle ${id}: ${recipient} received ${ethers.formatEther(amount)} ETH`);
        });
        contract.on("DefaultDetected", (id, member, penalty) => {
            console.log(`[DEFAULT] Circle ${id}: member ${member} penalized ${penalty}`);
        });
    } catch (e) {
        console.error("Listener error:", e.message);
    }
}

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Backend running on port ${PORT}`);
        startListeners();
    });
}

module.exports = app; // For Vercel
