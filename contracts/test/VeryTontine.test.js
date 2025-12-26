// VeryTontine Smart Contract Tests

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VeryTontine", function () {
    let veryTontine;
    let owner, user1, user2, user3;
    const contributionAmount = ethers.parseEther("1.0");
    const frequency = 60; // 60 seconds

    beforeEach(async function () {
        [owner, user1, user2, user3] = await ethers.getSigners();

        const VeryTontine = await ethers.getContractFactory("VeryTontine");
        veryTontine = await VeryTontine.deploy();
        await veryTontine.waitForDeployment();
    });

    describe("Circle Creation", function () {
        it("Should create a circle and emit event", async function () {
            await expect(veryTontine.createCircle(contributionAmount, frequency))
                .to.emit(veryTontine, "CircleCreated")
                .withArgs(1, owner.address, contributionAmount);

            const details = await veryTontine.getCircleDetails(1);
            expect(details[0]).to.equal(owner.address); // creator
            expect(details[1]).to.equal(contributionAmount);
            expect(details[4]).to.equal(true); // active
        });
    });

    describe("Joining Circle", function () {
        beforeEach(async function () {
            await veryTontine.createCircle(contributionAmount, frequency);
        });

        it("Should allow users to join", async function () {
            await expect(veryTontine.connect(user1).joinCircle(1))
                .to.emit(veryTontine, "MemberJoined")
                .withArgs(1, user1.address);

            const details = await veryTontine.getCircleDetails(1);
            expect(details[3]).to.equal(1); // member count
        });

        it("Should initialize trust score to 100 for new users", async function () {
            await veryTontine.connect(user1).joinCircle(1);
            const trustScore = await veryTontine.getTrustScore(user1.address);
            expect(trustScore).to.equal(100);
        });
    });

    describe("Starting and Deposits", function () {
        beforeEach(async function () {
            await veryTontine.createCircle(contributionAmount, frequency);
            await veryTontine.connect(user1).joinCircle(1);
            await veryTontine.connect(user2).joinCircle(1);
            await veryTontine.connect(user3).joinCircle(1);
        });

        it("Should start circle and allow deposits", async function () {
            await veryTontine.startCircle(1);

            const details = await veryTontine.getCircleDetails(1);
            expect(details[2]).to.equal(1); // current round

            await expect(
                veryTontine.connect(user1).deposit(1, { value: contributionAmount })
            ).to.emit(veryTontine, "DepositReceived");
        });

        it("Should reject wrong deposit amount", async function () {
            await veryTontine.startCircle(1);

            await expect(
                veryTontine.connect(user1).deposit(1, { value: ethers.parseEther("0.5") })
            ).to.be.revertedWith("Wrong amount");
        });
    });

    describe("Automatic Payout", function () {
        beforeEach(async function () {
            await veryTontine.createCircle(contributionAmount, frequency);
            await veryTontine.connect(user1).joinCircle(1);
            await veryTontine.connect(user2).joinCircle(1);
            await veryTontine.connect(user3).joinCircle(1);
            await veryTontine.startCircle(1);
        });

        it("Should trigger payout when all members deposit", async function () {
            const initialBalance = await ethers.provider.getBalance(user1.address);

            await veryTontine.connect(user1).deposit(1, { value: contributionAmount });
            await veryTontine.connect(user2).deposit(1, { value: contributionAmount });

            // Last deposit triggers payout to user1 (first in payout order)
            await expect(
                veryTontine.connect(user3).deposit(1, { value: contributionAmount })
            ).to.emit(veryTontine, "PayoutExecuted");

            const finalBalance = await ethers.provider.getBalance(user1.address);
            const totalPayout = contributionAmount * 3n;

            // User1 should have received 3 ETH minus their own contribution
            expect(finalBalance).to.be.gt(initialBalance);
        });

        it("Should increase trust scores after successful round", async function () {
            await veryTontine.connect(user1).deposit(1, { value: contributionAmount });
            await veryTontine.connect(user2).deposit(1, { value: contributionAmount });
            await veryTontine.connect(user3).deposit(1, { value: contributionAmount });

            expect(await veryTontine.getTrustScore(user1.address)).to.equal(105);
            expect(await veryTontine.getTrustScore(user2.address)).to.equal(105);
            expect(await veryTontine.getTrustScore(user3.address)).to.equal(105);
        });
    });

    describe("Trust Score Penalties", function () {
        beforeEach(async function () {
            await veryTontine.createCircle(contributionAmount, frequency);
            await veryTontine.connect(user1).joinCircle(1);
            await veryTontine.connect(user2).joinCircle(1);
            await veryTontine.startCircle(1);
        });

        it("Should penalize defaulters when resolveRound is called", async function () {
            await veryTontine.connect(user1).deposit(1, { value: contributionAmount });
            // user2 doesn't deposit

            // Fast forward time
            await ethers.provider.send("evm_increaseTime", [61]);
            await ethers.provider.send("evm_mine");

            await expect(veryTontine.resolveRound(1))
                .to.emit(veryTontine, "DefaultDetected")
                .withArgs(1, user2.address, -20);

            expect(await veryTontine.getTrustScore(user2.address)).to.equal(80);
        });
    });
});
