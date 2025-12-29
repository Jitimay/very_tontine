// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract VeryTontine {
    error Err();
    address public owner;
    bool public paused;
    bool private locked;
    uint256 public nextCircleId;

    struct Circle {
        uint256 id;
        address creator;
        uint256 contributionAmount;
        uint256 frequency;
        uint256 currentRound;
        uint256 lastRoundStartTime;
        address[] members;
        address[] payoutOrder;
        bool active;
    }

    struct MemberState {
        bool hasPaidThisRound;
        uint256 lastPaidRound;
    }

    mapping(uint256 => Circle) public circles;
    mapping(uint256 => mapping(address => MemberState)) public memberStates;
    mapping(address => int256) public trustScores;

    event CircleCreated(uint256 indexed id, address indexed creator, uint256 amount);
    event MemberJoined(uint256 indexed id, address indexed member);
    event DepositReceived(uint256 indexed id, address indexed member, uint256 amount, uint256 round);
    event PayoutExecuted(uint256 indexed id, address indexed recipient, uint256 amount, uint256 round);
    event TrustScoreUpdated(address indexed member, int256 newScore);
    event DefaultDetected(uint256 indexed id, address indexed member, int256 penalty);

    modifier onlyOwner() { if (msg.sender != owner) revert Err(); _; }
    modifier nonReentrant() { if (locked) revert Err(); locked = true; _; locked = false; }
    modifier whenNotPaused() { if (paused) revert Err(); _; }

    constructor() {
        owner = msg.sender;
        nextCircleId = 1;
    }

    function createCircle(uint256 _amt, uint256 _freq) external whenNotPaused {
        if (_amt < 0.001 ether || _freq < 60) revert Err();
        Circle storage c = circles[nextCircleId];
        c.id = nextCircleId;
        c.creator = msg.sender;
        c.contributionAmount = _amt;
        c.frequency = _freq;
        c.lastRoundStartTime = block.timestamp;
        c.active = true;
        emit CircleCreated(nextCircleId, msg.sender, _amt);
        nextCircleId++;
    }

    function joinCircle(uint256 _id) external whenNotPaused {
        Circle storage c = circles[_id];
        if (!c.active || c.currentRound != 0 || c.members.length >= 50) revert Err();
        if (trustScores[msg.sender] == 0) trustScores[msg.sender] = 100;
        c.members.push(msg.sender);
        c.payoutOrder.push(msg.sender);
        emit MemberJoined(_id, msg.sender);
    }

    function startCircle(uint256 _id) external whenNotPaused {
        Circle storage c = circles[_id];
        if (msg.sender != c.creator || c.currentRound != 0 || c.members.length < 2) revert Err();
        c.currentRound = 1;
        c.lastRoundStartTime = block.timestamp;
    }

    function deposit(uint256 _id) external payable nonReentrant whenNotPaused {
        Circle storage c = circles[_id];
        if (c.currentRound == 0 || msg.value != c.contributionAmount || memberStates[_id][msg.sender].hasPaidThisRound) revert Err();
        memberStates[_id][msg.sender].hasPaidThisRound = true;
        emit DepositReceived(_id, msg.sender, msg.value, c.currentRound);
        uint256 paid = 0;
        for (uint i = 0; i < c.members.length; i++) {
            if (memberStates[_id][c.members[i]].hasPaidThisRound) paid++;
        }
        if (paid == c.members.length) {
            uint256 amt = c.contributionAmount * paid;
            address m = c.payoutOrder[(c.currentRound - 1) % c.members.length];
            (bool s, ) = payable(m).call{value: amt}("");
            if (!s) revert Err();
            emit PayoutExecuted(_id, m, amt, c.currentRound);
            for (uint i = 0; i < c.members.length; i++) {
                address mem = c.members[i];
                trustScores[mem] += 5;
                memberStates[_id][mem].hasPaidThisRound = false;
            }
            c.currentRound++;
            c.lastRoundStartTime = block.timestamp;
        }
    }

    function resolveRound(uint256 _id) external nonReentrant whenNotPaused {
        Circle storage c = circles[_id];
        if (block.timestamp < c.lastRoundStartTime + c.frequency) revert Err();
        uint256 col = 0;
        for (uint i = 0; i < c.members.length; i++) {
            address m = c.members[i];
            if (memberStates[_id][m].hasPaidThisRound) col += c.contributionAmount;
            else { trustScores[m] -= 20; emit DefaultDetected(_id, m, -20); }
            memberStates[_id][m].hasPaidThisRound = false;
        }
        if (col > 0) {
            address b = c.payoutOrder[(c.currentRound - 1) % c.members.length];
            (bool s, ) = payable(b).call{value: col}("");
            if (!s) revert Err();
            emit PayoutExecuted(_id, b, col, c.currentRound);
        }
        c.currentRound++;
        c.lastRoundStartTime = block.timestamp;
    }

    function getCircleDetails(uint256 _id) external view returns (address, uint256, uint256, uint256, bool) {
        Circle storage c = circles[_id];
        return (c.creator, c.contributionAmount, c.currentRound, c.members.length, c.active);
    }

    function getCircleMembers(uint256 _id) external view returns (address[] memory) {
        return circles[_id].members;
    }

    function getTrustScore(address u) external view returns (int256) {
        return trustScores[u] == 0 ? int256(100) : trustScores[u];
    }

    function setPaused(bool _p) external onlyOwner { paused = _p; }
}
