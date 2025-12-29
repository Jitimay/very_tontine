const { ethers } = require("ethers");

async function main() {
    const RPC_URL = "https://rpc.verylabs.io";
    const CONTRACT_ADDRESS = "0xA3012C011643B8a726c7B322D8aFC52a0Bc679d2";
    const provider = new ethers.JsonRpcProvider(RPC_URL);

    const ABI = [
        "function getCircleDetails(uint256 _circleId) external view returns (address, uint256, uint256, uint256, bool)",
        "function getCircleMembers(uint256 _circleId) external view returns (address[] memory)",
        "function memberStates(uint256, address) external view returns (bool, uint256)"
    ];

    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
    const circleId = 1;
    const userAddress = "0xf72657fc9d1BBE6C8CF699A450603bd9e8B2A7cA";

    try {
        const details = await contract.getCircleDetails(circleId);
        console.log(`Circle ${circleId} Details:`);
        console.log(`- Creator: ${details[0]}`);
        console.log(`- Contribution Amount: ${ethers.formatEther(details[1])} VERY`);
        console.log(`- Current Round: ${details[2]}`);
        console.log(`- Member Count: ${details[3]}`);
        console.log(`- Active: ${details[4]}`);

        const members = await contract.getCircleMembers(circleId);
        console.log(`- Members: ${members.join(", ")}`);

        const mState = await contract.memberStates(circleId, userAddress);
        console.log(`Payment Status for ${userAddress}:`);
        console.log(`- Has Paid This Round: ${mState[0]}`);
        console.log(`- Last Paid Round: ${mState[1]}`);

        if (mState[0]) {
            console.log("\n⚠️ DIAGNOSIS: You have ALREADY paid for this round. You cannot deposit twice in the same round.");
        } else if (Number(details[2]) === 0) {
            console.log("\n⚠️ DIAGNOSIS: The circle has NOT started yet. The creator must click 'START' before deposits are allowed.");
        }
    } catch (e) {
        console.error("Error fetching details:", e.message);
    }
}

main();
