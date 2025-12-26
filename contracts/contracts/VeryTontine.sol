// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract VeryTontine {
    struct Circle {
        uint256 id;
        address creator;
        uint256 contributionAmount;
        uint256 frequency; // in seconds
        uint256 createdAt;
        bool active;
        uint256 currentRound;
        uint256 lastRoundStartTime;
        address[] members;
        address[] payoutOrder;
    }

    struct MemberState {
        bool hasPaidThisRound;
        uint256 lastPaidRound;
    }

    uint256 public nextCircleId;
    mapping(uint256 => Circle) public circles;
    mapping(uint256 => mapping(address => MemberState)) public memberStates;
    mapping(address => int256) public trustScores; // Global Trust Score

    event CircleCreated(uint256 indexed id, address indexed creator, uint256 amount);
    event MemberJoined(uint256 indexed id, address indexed member);
    event DepositReceived(uint256 indexed id, address indexed member, uint256 amount, uint256 round);
    event PayoutExecuted(uint256 indexed id, address indexed recipient, uint256 amount, uint256 round);
    event DefaultDetected(uint256 indexed id, address indexed member, int256 penalty);
    event TrustScoreUpdated(address indexed member, int256 newScore);

    constructor() {
        nextCircleId = 1;
    }

    function createCircle(uint256 _contributionAmount, uint256 _frequency) external {
        Circle storage circle = circles[nextCircleId];
        circle.id = nextCircleId;
        circle.creator = msg.sender;
        circle.contributionAmount = _contributionAmount;
        circle.frequency = _frequency;
        circle.createdAt = block.timestamp;
        circle.active = true;
        circle.currentRound = 0;
        circle.lastRoundStartTime = block.timestamp; // Starts immediately? Or waits for start? Let's say active immediately for joining, but rounds start when full?
        // Simpler: Round 1 starts when first deposit or explicitly started. 
        // For Hackathon: Let's simpler. Round 0 is "recruiting". Payouts start from Round 1.
        
        emit CircleCreated(nextCircleId, msg.sender, _contributionAmount);
        nextCircleId++;
        
        // Creator implicitly joins? Maybe not, allow them to just be organizer.
        // Let's make creator join by default for simplicity? No, let them join explicitly.
    }

    function joinCircle(uint256 _circleId) external {
        Circle storage circle = circles[_circleId];
        require(circle.active, "Circle not active");
        require(circle.currentRound == 0, "Already started");
        
        // Initialize Trust Score if new
        if (trustScores[msg.sender] == 0) {
            trustScores[msg.sender] = 100;
        }

        circle.members.push(msg.sender);
        circle.payoutOrder.push(msg.sender); // Simple FIFO order for now
        
        emit MemberJoined(_circleId, msg.sender);
    }

    // Call this to lock in the circle and start rotating
    function startCircle(uint256 _circleId) external {
        Circle storage circle = circles[_circleId];
        require(msg.sender == circle.creator, "Only creator");
        require(circle.currentRound == 0, "Already started");
        require(circle.members.length > 1, "Need members");

        circle.currentRound = 1;
        circle.lastRoundStartTime = block.timestamp;
    }

    function deposit(uint256 _circleId) external payable {
        Circle storage circle = circles[_circleId];
        MemberState storage state = memberStates[_circleId][msg.sender];

        require(circle.currentRound > 0, "Not started");
        require(msg.value == circle.contributionAmount, "Wrong amount");
        require(!state.hasPaidThisRound, "Already paid");
        
        // Check if member is in this circle
        bool isMember = false;
        for (uint i = 0; i < circle.members.length; i++) {
            if (circle.members[i] == msg.sender) isMember = true;
        }
        require(isMember, "Not a member");

        state.hasPaidThisRound = true;
        state.lastPaidRound = circle.currentRound;

        emit DepositReceived(_circleId, msg.sender, msg.value, circle.currentRound);
        
        // Check if everyone paid, if so, trigger payout immediately? 
        // Or wait for time? Tontines usually pay out when everyone contributes.
        // Let's auto-payout if everyone contributed.
        _checkAndExecutePayout(_circleId);
    }

    function _checkAndExecutePayout(uint256 _circleId) internal {
        Circle storage circle = circles[_circleId];
        uint256 collected = 0;
        uint256 paidCount = 0;

        for (uint i = 0; i < circle.members.length; i++) {
            if (memberStates[_circleId][circle.members[i]].hasPaidThisRound) {
                paidCount++;
                collected += circle.contributionAmount;
            }
        }

        if (paidCount == circle.members.length) {
            // Everyone paid! Execute Payout.
            _payout(_circleId, collected);
        }
    }

    function _payout(uint256 _circleId, uint256 amount) internal {
        Circle storage circle = circles[_circleId];
        
        // Who is the beneficiary?
        // Round 1 -> Index 0
        // Round N -> Index (N-1) % Length
        uint256 beneficiaryIndex = (circle.currentRound - 1) % circle.payoutOrder.length;
        address payable beneficiary = payable(circle.payoutOrder[beneficiaryIndex]);

        // Transfer
        (bool sent, ) = beneficiary.call{value: amount}("");
        require(sent, "Failed to send Ether");

        emit PayoutExecuted(_circleId, beneficiary, amount, circle.currentRound);

        // Update Trust Scores (Everyone gets +5)
        for (uint i = 0; i < circle.members.length; i++) {
             // Basic implementation: Only increase if they actually paid. 
             // Since we only payout if everyone paid, safe to assume everyone paid.
             trustScores[circle.members[i]] += 5;
             emit TrustScoreUpdated(circle.members[i], trustScores[circle.members[i]]);
             
             // Reset state for next round
             memberStates[_circleId][circle.members[i]].hasPaidThisRound = false;
        }

        // Advance Round
        circle.currentRound++;
        circle.lastRoundStartTime = block.timestamp;
    }
    
    // Manual trigger if someone defaults?
    // "Force Payout" skipping defaulters?
    // Hackathon version: If 24h passed (or frequency passed) and not everyone paid, 
    // allow anyone to call "resolveRound" which penalizes defaulters and pays out what is collected.
    function resolveRound(uint256 _circleId) external {
        Circle storage circle = circles[_circleId];
        require(block.timestamp >= circle.lastRoundStartTime + circle.frequency, "Too early");
        
        uint256 collected = 0;
        for (uint i = 0; i < circle.members.length; i++) {
            address member = circle.members[i];
            if (memberStates[_circleId][member].hasPaidThisRound) {
                collected += circle.contributionAmount;
            } else {
                // PENALTY
                trustScores[member] -= 20;
                emit DefaultDetected(_circleId, member, -20);
                emit TrustScoreUpdated(member, trustScores[member]);
            }
             // Reset for next
            memberStates[_circleId][member].hasPaidThisRound = false;
        }

        // Payout to current beneficiary if they are not the defaulter? 
        // If beneficiary checked out, tough luck?
        // Simple: Pay beneficiary whatever was collected.
        uint256 beneficiaryIndex = (circle.currentRound - 1) % circle.payoutOrder.length;
        address payable beneficiary = payable(circle.payoutOrder[beneficiaryIndex]);
        
        if (collected > 0) {
            (bool sent, ) = beneficiary.call{value: collected}("");
            require(sent, "Failed to send Ether");
            emit PayoutExecuted(_circleId, beneficiary, collected, circle.currentRound);
        }

        circle.currentRound++;
        circle.lastRoundStartTime = block.timestamp;
    }

    function getCircleDetails(uint256 _circleId) external view returns (
        address creator,
        uint256 contributionAmount,
        uint256 currentRound,
        uint256 memberCount,
        bool active
    ) {
        Circle storage circle = circles[_circleId];
        return (
            circle.creator,
            circle.contributionAmount,
            circle.currentRound,
            circle.members.length,
            circle.active
        );
    }
    
    function getTrustScore(address user) external view returns (int256) {
        return trustScores[user];
    }
}
