import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import './App.css'

// Contract ABI - Minimal for demo
const CONTRACT_ABI = [
  "function createCircle(uint256 _contributionAmount, uint256 _frequency) external",
  "function joinCircle(uint256 _circleId) external",
  "function startCircle(uint256 _circleId) external",
  "function deposit(uint256 _circleId) external payable",
  "function getCircleDetails(uint256 _circleId) external view returns (address, uint256, uint256, uint256, bool)",
  "function getTrustScore(address user) external view returns (int256)",
  "event CircleCreated(uint256 indexed id, address indexed creator, uint256 amount)",
  "event MemberJoined(uint256 indexed id, address indexed member)",
  "event DepositReceived(uint256 indexed id, address indexed member, uint256 amount, uint256 round)"
]

// Update this after deployment
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"

function App() {
  const [account, setAccount] = useState(null)
  const [provider, setProvider] = useState(null)
  const [contract, setContract] = useState(null)
  const [trustScore, setTrustScore] = useState(0)
  const [circles, setCircles] = useState([])

  // Form states
  const [contributionAmount, setContributionAmount] = useState('1.0')
  const [frequency, setFrequency] = useState('60') // 60 seconds for demo
  const [joinCircleId, setJoinCircleId] = useState('')
  const [depositCircleId, setDepositCircleId] = useState('')
  const [viewCircleId, setViewCircleId] = useState('1')
  const [circleDetails, setCircleDetails] = useState(null)

  // Connect Wallet
  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' })
        const web3Provider = new ethers.BrowserProvider(window.ethereum)
        const signer = await web3Provider.getSigner()
        const address = await signer.getAddress()

        setProvider(web3Provider)
        setAccount(address)

        const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
        setContract(contractInstance)

        // Fetch Trust Score
        const score = await contractInstance.getTrustScore(address)
        setTrustScore(Number(score))

      } catch (error) {
        console.error("Error connecting wallet:", error)
        alert("Error connecting wallet. Make sure MetaMask is installed.")
      }
    } else {
      alert("Please install MetaMask!")
    }
  }

  // Create Circle
  const handleCreateCircle = async () => {
    if (!contract) return
    try {
      const amount = ethers.parseEther(contributionAmount)
      const tx = await contract.createCircle(amount, frequency)
      await tx.wait()
      alert("Circle Created! Check console for Circle ID from event.")
    } catch (error) {
      console.error("Error creating circle:", error)
      alert("Error: " + error.message)
    }
  }

  // Join Circle
  const handleJoinCircle = async () => {
    if (!contract || !joinCircleId) return
    try {
      const tx = await contract.joinCircle(joinCircleId)
      await tx.wait()
      alert(`Joined Circle ${joinCircleId}`)
    } catch (error) {
      console.error("Error joining circle:", error)
      alert("Error: " + error.message)
    }
  }

  // Deposit
  const handleDeposit = async () => {
    if (!contract || !depositCircleId) return
    try {
      // Get circle details to know how much to send
      const details = await contract.getCircleDetails(depositCircleId)
      const amount = details[1] // contributionAmount

      const tx = await contract.deposit(depositCircleId, { value: amount })
      await tx.wait()
      alert(`Deposit successful for Circle ${depositCircleId}`)
    } catch (error) {
      console.error("Error depositing:", error)
      alert("Error: " + error.message)
    }
  }

  // View Circle Details
  const handleViewCircle = async () => {
    if (!contract || !viewCircleId) return
    try {
      const details = await contract.getCircleDetails(viewCircleId)
      setCircleDetails({
        creator: details[0],
        contributionAmount: ethers.formatEther(details[1]),
        currentRound: Number(details[2]),
        memberCount: Number(details[3]),
        active: details[4]
      })
    } catch (error) {
      console.error("Error fetching circle:", error)
      alert("Circle not found or error")
    }
  }

  return (
    <div className="App">
      <header>
        <h1>🌍 VeryTontine</h1>
        <p>Social Savings Circles on Very Network</p>
      </header>

      <main>
        {!account ? (
          <div className="connect-section">
            <button onClick={connectWallet} className="btn-primary">
              Connect Wallet
            </button>
          </div>
        ) : (
          <>
            <div className="wallet-info">
              <p><strong>Connected:</strong> {account.slice(0, 6)}...{account.slice(-4)}</p>
              <p><strong>Trust Score:</strong> <span className="trust-score">{trustScore}</span></p>
            </div>

            <div className="section">
              <h2>Create New Circle</h2>
              <div className="form">
                <input
                  type="text"
                  placeholder="Contribution Amount (ETH)"
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Frequency (seconds)"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                />
                <button onClick={handleCreateCircle} className="btn">Create Circle</button>
              </div>
            </div>

            <div className="section">
              <h2>Join Circle</h2>
              <div className="form">
                <input
                  type="text"
                  placeholder="Circle ID"
                  value={joinCircleId}
                  onChange={(e) => setJoinCircleId(e.target.value)}
                />
                <button onClick={handleJoinCircle} className="btn">Join</button>
              </div>
            </div>

            <div className="section">
              <h2>Make Deposit</h2>
              <div className="form">
                <input
                  type="text"
                  placeholder="Circle ID"
                  value={depositCircleId}
                  onChange={(e) => setDepositCircleId(e.target.value)}
                />
                <button onClick={handleDeposit} className="btn">Deposit</button>
              </div>
            </div>

            <div className="section">
              <h2>View Circle Details</h2>
              <div className="form">
                <input
                  type="text"
                  placeholder="Circle ID"
                  value={viewCircleId}
                  onChange={(e) => setViewCircleId(e.target.value)}
                />
                <button onClick={handleViewCircle} className="btn">View</button>
              </div>

              {circleDetails && (
                <div className="circle-details">
                  <p><strong>Creator:</strong> {circleDetails.creator}</p>
                  <p><strong>Contribution:</strong> {circleDetails.contributionAmount} ETH</p>
                  <p><strong>Current Round:</strong> {circleDetails.currentRound}</p>
                  <p><strong>Members:</strong> {circleDetails.memberCount}</p>
                  <p><strong>Active:</strong> {circleDetails.active ? '✅' : '❌'}</p>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default App
