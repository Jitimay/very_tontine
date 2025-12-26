# VeryTontine - Social Savings Circles on Very Network

## 🌍 Overview
VeryTontine digitizes traditional African savings circles (Tontines/Ikimba/Chama) using smart contracts. Members contribute regularly, and payouts rotate automatically - all secured on-chain with no human treasurer.

## 🏗️ Architecture

### Smart Contract (`contracts/`)
- **VeryTontine.sol**: Core contract managing circles, deposits, payouts, and trust scores
- Solidity 0.8.28, EVM-compatible
- Features: Circle creation, member management, automated payouts, trust scoring

### Backend (`backend/`)
- Node.js server with Express
- Event listener for contract events
- Mock chat bot endpoints
- Automatic round resolution (demo mode)

### Frontend (`frontend/`)
- React + Vite mini-app
- Wallet integration (MetaMask)
- UI for creating/joining circles, making deposits, viewing status

## 🚀 Quick Start

### Prerequisites
- Node.js v20+ 
- MetaMask browser extension
- Git

### Installation

```bash
# Clone and navigate
cd very_tontine

# Install Contract Dependencies
cd contracts
npm install

# Install Backend Dependencies  
cd ../backend
npm install

# Install Frontend Dependencies
cd ../frontend
npm install
```

### Running the Demo

#### 1. Start Local Blockchain
```bash
cd contracts
npx hardhat node
```
Keep this terminal running. You'll see 20 test accounts with addresses and private keys.

#### 2. Deploy Smart Contract
In a new terminal:
```bash
cd contracts
npx hardhat run scripts/deploy.js --network localhost
```
Copy the deployed contract address (e.g., `0x5FbDB2...`).

#### 3. Update Contract Address
Update the contract address in two files:
- `frontend/src/App.jsx` (line 17)
- `backend/.env` (CONTRACT_ADDRESS=...)

#### 4. Start Backend
```bash
cd backend
npm start
```

#### 5. Start Frontend
```bash
cd frontend
npm run dev
```
Open http://localhost:5173 in your browser.

#### 6. Configure MetaMask
- Add localhost network (RPC: http://127.0.0.1:8545, Chain ID: 1337)
- Import 2-3 test accounts using private keys from step 1
- Switch between accounts to simulate different users

## 🎮 Demo Flow

### Scenario: 3 Users, 1 ETH weekly contributions

1. **User A (Creator)**:
   - Connect wallet
   - Create Circle: 1.0 ETH, 60 seconds frequency
   - Note the Circle ID (logged in console, or use Circle ID 1)

2. **User B & C (Members)**:
   - Switch MetaMask account
   - Connect wallet
   - Join Circle (Circle ID: 1)

3. **Start Circle** (User A):
   - Call `startCircle(1)` via console or add button in UI
   - Or use Hardhat console:
     ```js
     npx hardhat console --network localhost
     const VT = await ethers.getContractAt("VeryTontine", "0x5FbDB2...")
     await VT.startCircle(1)
     ```

4. **All Users Deposit**:
   - Each user deposits (Circle ID: 1)
   - When all 3 deposits are in, payout automatically triggers
   - User A receives 3 ETH (first in rotation)
   - Trust scores increase by +5

5. **Round 2**:
   - All users deposit again
   - User B receives payout
   - Process continues rotating

6. **Default Scenario** (Optional):
   - If someone doesn't deposit within 60 seconds
   - Anyone can call `resolveRound(1)`
   - Non-depositors get -20 trust score penalty

## 📁 Project Structure

```
very_tontine/
├── contracts/
│   ├── contracts/VeryTontine.sol
│   ├── scripts/deploy.js
│   ├── hardhat.config.js
│   └── package.json
├── backend/
│   ├── server.js
│   ├── .env
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── App.css
│   └── package.json
└── README.md
```

## 🔑 Key Features

- ✅ **Trustless Automation**: Smart contract treasurer, no human control
- ✅ **Trust Scoring**: Global reputation system (starts at 100)
- ✅ **Rotating Payouts**: Automatic FIFO beneficiary rotation
- ✅ **Default Handling**: Penalties for missed payments
- ✅ **Demo Mode**: 60-second rounds instead of weekly
- ✅ **Chat Bot Ready**: Mock endpoints for VeryChat integration

## 🛠️ Development

### Compile Contracts
```bash
cd contracts
npx hardhat compile
```

### Run Tests (if you add them)
```bash
cd contracts
npx hardhat test
```

### Deploy to Testnet
1. Update `hardhat.config.js` with testnet RPC
2. Add deployer private key to `.env`
3. Run: `npx hardhat run scripts/deploy.js --network <testnet>`

## 🎯 Hackathon Submission Checklist

- ✅ Smart Contract (Solidity)
- ✅ Backend Service (Node.js)
- ✅ Frontend Mini-App (React)
- ✅ README with setup instructions
- ✅ Demo script (see above)
- ✅ Clean, commented code
- ✅ Fast demo mode (60s rounds)

## 🔮 Future Enhancements

- Emergency withdrawal mechanism
- Multi-circle participation tracking
- Analytics dashboard
- Merchant integration for direct purchases
- KYC integration with Very Network identity system

## 📝 License

MIT

## 🙋 Support

For issues or questions about Very Network deployment, consult Very Network documentation or community channels.

---

**Built for VeryNetwork Hackathon** | **Demo-Ready** | **Production-Extensible**
# very_tontine
