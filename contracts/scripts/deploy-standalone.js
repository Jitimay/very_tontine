const { ethers } = require("ethers");
require("dotenv").config();
const fs = require("fs");
const path = require("path");

async function main() {
    const RPC_URL = process.env.VERY_MAINNET_RPC || "https://rpc.verylabs.io";
    const PRIVATE_KEY = process.env.PRIVATE_KEY;

    if (!PRIVATE_KEY) {
        console.error("Please provide PRIVATE_KEY in .env");
        process.exit(1);
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    console.log("Deploying with account:", wallet.address);
    const balance = await provider.getBalance(wallet.address);
    console.log("Balance:", ethers.formatEther(balance), "VERY");

    const artifactPath = path.join(__dirname, "../artifacts/contracts/VeryTontine.sol/VeryTontine.json");
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);

    try {
        console.log("Preparing transaction...");
        const tx = await factory.getDeployTransaction({
            gasPrice: 500000000000,
            gasLimit: 1500000, // Reduced limit to be safer
        });

        console.log("Signing and sending...");
        const response = await wallet.sendTransaction(tx);
        console.log("Transaction hash:", response.hash);

        console.log("Waiting for confirmation...");
        const receipt = await response.wait();
        console.log("VeryTontine deployed to:", receipt.contractAddress);
    } catch (error) {
        console.error("ERROR:");
        console.error(error);
        if (error.error) console.error("Nested Error:", error.error);
        throw error;
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
