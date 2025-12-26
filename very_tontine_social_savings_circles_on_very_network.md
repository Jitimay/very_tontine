# VeryTontine — Social Savings Circles on Very Network

## Overview
VeryTontine digitizes traditional African savings circles (Tontines / Ikimba / Chama) directly inside VeryChat. It replaces cash and notebooks with smart contracts, KYC-backed trust, and automatic payouts.

## Problem
Millions of people rely on informal savings groups. These systems are:
- Cash-based and unsafe
- Vulnerable to theft and fraud
- Difficult to scale or prove trustworthiness

## Solution
A chat-native smart contract system where:
- Groups are created inside VeryChat
- A smart contract acts as the treasurer
- Weekly contributions are enforced on-chain
- Payouts are automatic and transparent

## Core Features
### 1. Circle Creation
- Creator defines:
  - Number of members
  - Contribution amount
  - Contribution frequency
  - Payout rotation order

### 2. KYC & Trust Score
- Only KYC-verified users can join
- Each user has a Trust Score
- Missed payments reduce Trust Score globally

### 3. Smart Contract Treasurer
- Holds funds securely
- Enforces deposits
- Automatically releases weekly payout

### 4. Automated Payouts
- Rotating beneficiary
- No human control over funds

### 5. Default Handling
- Missed deposit → penalty
- Trust score reduction
- Optional exclusion from future circles

## User Flow
1. User creates a Tontine circle in VeryChat
2. Members join via invite
3. Weekly deposit triggered by chat bot
4. Smart contract locks funds
5. Weekly winner automatically paid
6. Trust scores updated

## Technical Architecture
- Frontend: VeryChat Mini-App
- Backend: Very Network Smart Contracts
- Wallet: Very Wallet
- Identity: Very KYC system
- Bot: Chat-triggered transaction bot

## Impact
- Financial inclusion
- Safer community savings
- Real-world adoption
- Daily active usage

## Hackathon Alignment
- Social + Finance
- Chat-native UX
- High adoption potential
- Clear demo story

## Future Extensions
- Emergency withdrawal rules
- Multi-circle participation
- Analytics dashboard
- Integration with merchants

