const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    const feeData = await hre.ethers.provider.getFeeData();

    console.log("Deployer Address:", deployer.address);
    console.log("Deployer Balance:", hre.ethers.formatEther(balance), "VERY");
    console.log("Current Gas Price:", hre.ethers.formatUnits(feeData.gasPrice || 0n, "gwei"), "Gwei");

    const VeryTontine = await hre.ethers.getContractFactory("VeryTontine");
    const deploymentTx = await VeryTontine.getDeployTransaction();
    const gasEstimate = await hre.ethers.provider.estimateGas(deploymentTx);

    console.log("Estimated Gas:", gasEstimate.toString());
    const totalCost = (feeData.gasPrice || 0n) * gasEstimate;
    console.log("Total Estimated Cost:", hre.ethers.formatEther(totalCost), "VERY");
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
