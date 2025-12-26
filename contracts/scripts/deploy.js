const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);

    const VeryTontine = await hre.ethers.getContractFactory("VeryTontine");
    const veryTontine = await VeryTontine.deploy();

    await veryTontine.waitForDeployment();

    console.log("VeryTontine deployed to:", await veryTontine.getAddress());

    // Create a demo circle
    console.log("Creating Demo Circle...");
    const contributionAmount = hre.ethers.parseEther("1.0"); // 1 ETH/Token
    const frequency = 60; // 1 Minute for Demo

    await veryTontine.createCircle(contributionAmount, frequency);
    console.log("Demo Circle Created (ID 1)");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
