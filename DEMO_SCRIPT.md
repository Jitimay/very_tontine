# VeryTontine Demo Script

## 🎬 Live Demo Walkthrough (5 Minutes)

### Setup (Pre-Demo)
- ✅ Local blockchain running (`npx hardhat node`)
- ✅ Contract deployed
- ✅ Backend server running
- ✅ Frontend at localhost:5173
- ✅ 3 MetaMask accounts imported

---

## 🎯 Demo Narrative

### **Act 1: The Problem** (30 seconds)
> "In Africa, *millions* of people use 'Tontines' - informal savings circles where friends contribute weekly and take turns receiving the pot. But they're **cash-based, risky, and hard to trust** at scale. What if we could put this on-chain?"

### **Act 2: The Solution** (30 seconds)
> "VeryTontine brings savings circles to VeryChat. A **smart contract acts as the treasurer** - no human can touch the funds. Contributions are enforced, payouts are automatic, and defaulters lose trust score."

---

## 🚀 Live Demo Steps

### **1. Create Circle** (User A - Alice)
**Time: 1 minute**

1. Open frontend at http://localhost:5173
2. Click **"Connect Wallet"** (MetaMask pops up)
3. Switch to Account 1 (Alice)
4. Show **Trust Score: 100** (everyone starts here)
5. Fill in "Create New Circle":
   - Contribution: **1.0 ETH**
   - Frequency: **60 seconds** (demo mode - normally 1 week)
6. Click **"Create Circle"**
7. Approve MetaMask transaction
8. ✅ **Circle Created!** (ID: 1 shown in alert/console)

**Say**: *"Alice just created a circle. 1 ETH weekly (well, 60 seconds for demo). Let's get some friends."*

---

### **2. Join Circle** (User B & C - Bob and Carol)
**Time: 1 minute**

#### Bob Joins:
1. Switch MetaMask to **Account 2** (Bob)
2. Refresh page, click **"Connect Wallet"**
3. Go to "Join Circle" section
4. Enter Circle ID: **1**
5. Click **"Join"**, approve transaction
6. ✅ **Joined!**

#### Carol Joins:
1. Switch MetaMask to **Account 3** (Carol)
2. Refresh, connect wallet
3. Join Circle ID: **1**
4. ✅ **Joined!**

**Say**: *"Now we have 3 members. Let's start the circle and see the magic."*

---

### **3. Start Circle** (Alice)
**Time: 30 seconds**

**Option A (If you added a "Start" button in UI):**
- Switch back to Alice
- Click "Start Circle"

**Option B (Console - More dramatic for hackathon):**
Open browser console:
```javascript
// Quick hardhat console command shown on screen/terminal
```

Or just call from UI if you added the function.

**Say**: *"Circle started. Round 1 begins NOW. Everyone needs to deposit within 60 seconds."*

---

### **4. Deposits & Automatic Payout** (All Users)
**Time: 2 minutes**

#### Alice Deposits:
1. Switch to Alice
2. Go to "Make Deposit"
3. Enter Circle ID: **1**
4. Click **"Deposit"**
5. MetaMask shows **1.0 ETH** - approve
6. ✅ Deposit confirmed

**Backend Console**: 
```
[EVENT] Deposit: Circle 1, Member 0x..., Round 1
```

#### Bob Deposits:
1. Switch to Bob
2. Deposit to Circle 1
3. ✅ Confirmed

#### Carol Deposits (Trigger Payout!):
1. Switch to Carol
2. Deposit to Circle 1
3. ⚡ **AUTOMATIC PAYOUT TRIGGERED!**

**Backend Console**:
```
[EVENT] PAYOUT! Circle 1, Recipient 0x... (Alice), Round 1
[EVENT] Trust Score Update: Alice -> 105
[EVENT] Trust Score Update: Bob -> 105
[EVENT] Trust Score Update: Carol -> 105
```

**Say**: *"**BOOM!** All 3 deposits in. The smart contract **automatically paid Alice** 3 ETH. Everyone's trust score went up. No treasurer, no permission - pure code."*

---

### **5. View Circle Status** (Show Transparency)
**Time: 30 seconds**

1. Go to "View Circle Details"
2. Enter Circle ID: **1**
3. Click **"View"**

**Show on screen:**
```
Creator: 0x... (Alice)
Contribution: 1.0 ETH
Current Round: 2 ← Advanced automatically!
Members: 3
Active: ✅
```

**Say**: *"Round 2 already started. Next payout goes to Bob. This rotates forever."*

---

### **6. Default Scenario (Optional - if time)** 
**Time: 1 minute**

**Say**: *"What if someone doesn't pay?"*

1. Wait 60 seconds (or call `resolveRound` manually)
2. Show backend logs:
   ```
   [EVENT] Default Detected: Carol, Penalty: -20
   [EVENT] Trust Score Update: Carol -> 85
   ```
3. Show Carol's trust score dropped

**Say**: *"Defaulters get penalized **globally**. Other circles can see this and reject low-trust members."*

---

## 🎤 Closing (30 seconds)

**Say**:
> "VeryTontine makes community savings **safe, transparent, and accessible**. No cash, no fraud, no sketchy treasurer. Just your friends, your phone, and the blockchain. This is **real financial inclusion** for the 2 billion unbanked."

**Show**:
- Point to code on GitHub
- Mention Very Network integration
- Highlight chat-native UX vision

---

## 📊 Judge Q&A Prep

**Q: What if someone quits mid-circle?**
A: Current version continues with remaining members. V2: require deposits upfront or implement exit penalties.

**Q: Gas fees?**
A: Very Network is low-fee. For extreme scale, we'd batch or use L2.

**Q: KYC?**
A: Very Network has KYC built-in. We mock it here but would integrate their identity system.

**Q: Why not just use Venmo/PayPal?**
A: 
1. They don't operate in most of Africa
2. Requires bank accounts (our users don't have)
3. No programmable trust enforcement
4. Centralized - can freeze/censor

---

## ✅ Pre-Demo Checklist

- [ ] All terminals running (blockchain, backend, frontend)
- [ ] 3 MetaMask accounts imported and funded
- [ ] Chrome DevTools open for console logs
- [ ] Backend terminal visible for events
- [ ] Contract address updated in code
- [ ] Practiced transitions between accounts
- [ ] Slides/talking points ready

---

**Time Budget:**
- Problem/Solution: 1 min
- Create Circle: 1 min
- Join (2 users): 1 min  
- Start + Deposits: 2 min
- Results + Q&A: 30 sec

**Total: ~5 minutes**

Good luck! 🚀
