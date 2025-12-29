require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        version: "0.8.19",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    networks: {
        hardhat: {
            chainId: 1337,
        },
        veryMainnet: {
            url: process.env.VERY_MAINNET_RPC || "https://rpc.verylabs.io",
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            chainId: 4613,
            gasPrice: 1, // Bypass Hardhat hex fee cap check (overridden in script)
        },
        veryTestnet: {
            url: process.env.VERY_TESTNET_RPC || "https://rpc.testnet.verylabs.io", // Placeholder for testnet
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            chainId: process.env.VERY_TESTNET_CHAIN_ID ? Number(process.env.VERY_TESTNET_CHAIN_ID) : 4614, // Assuming +1 or placeholder
        },
    },
};
