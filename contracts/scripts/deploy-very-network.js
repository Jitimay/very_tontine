const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);

    const VeryTontine = await hre.ethers.getContractFactory("VeryTontine");
    const veryTontine = await VeryTontine.deploy({
        gasPrice: 500000000000, // 500 Gwei
        gasLimit: 4000000,
    });

    await veryTontine.waitForDeployment();

    const address = await veryTontine.getAddress();
    console.log("VeryTontine deployed to:", address);

    // Verification helper if on a public network
    if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
        console.log("Sleeping for 30s before verification...");
        await new Promise((resolve) => setTimeout(resolve, 30000));

        // Attempt verification if explorer supports it
        // try {
        //   await hre.run("verify:verify", {
        //     address: address,
        //     constructorArguments: [],
        //   });
        // } catch (e) {
        //   console.log("Verification failed (might be expected on some testnets):", e.message);
        // }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
