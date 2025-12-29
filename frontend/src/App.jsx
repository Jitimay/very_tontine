import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import './App.css'

// Contract ABI - Enhanced with all events
const CONTRACT_ABI = [
  "function createCircle(uint256 _contributionAmount, uint256 _frequency) external",
  "function joinCircle(uint256 _circleId) external",
  "function startCircle(uint256 _circleId) external",
  "function deposit(uint256 _circleId) external payable",
  "function getCircleDetails(uint256 _circleId) external view returns (address, uint256, uint256, uint256, bool)",
  "function getCircleMembers(uint256 _circleId) external view returns (address[] memory)",
  "function getTrustScore(address user) external view returns (int256)",
  "event CircleCreated(uint256 indexed id, address indexed creator, uint256 amount)",
  "event MemberJoined(uint256 indexed id, address indexed member)",
  "event DepositReceived(uint256 indexed id, address indexed member, uint256 amount, uint256 round)",
  "event PayoutExecuted(uint256 indexed id, address indexed recipient, uint256 amount, uint256 round)",
  "event TrustScoreUpdated(address indexed member, int256 newScore)",
  "event DefaultDetected(uint256 indexed id, address indexed member, int256 penalty)"
]

// Update this after deployment or via .env (VITE_CONTRACT_ADDRESS)
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3"

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
  const [startCircleId, setStartCircleId] = useState('')
  const [circleDetails, setCircleDetails] = useState(null)
  const [circleMembers, setCircleMembers] = useState([])

  // UI states
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [notification, setNotification] = useState(null)
  const [recentEvents, setRecentEvents] = useState([])
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [isVerychatConnected, setIsVerychatConnected] = useState(false)

  // Fetch Trust Score
  const fetchTrustScore = async (address, contractInstance) => {
    try {
      const score = await contractInstance.getTrustScore(address)
      setTrustScore(Number(score))
    } catch (err) {
      console.error("Error fetching trust score:", err)
    }
  }

  // Real-time Event Listeners
  useEffect(() => {
    if (!contract) return

    const handleEvent = (name, ...args) => {
      const newEvent = { name, args, id: Date.now() + Math.random() }
      setRecentEvents(prev => [newEvent, ...prev].slice(0, 10))

      // Auto-update state based on events
      if (name === 'TrustScoreUpdated' && args[0].toLowerCase() === account.toLowerCase()) {
        setTrustScore(Number(args[1]))
      }
    }

    contract.on("CircleCreated", (id, creator, amount) => {
      handleEvent("CircleCreated", id, creator, amount)
      setNotification(`New Circle Created! ID: ${id}`)
    })

    contract.on("MemberJoined", (id, member) => {
      handleEvent("MemberJoined", id, member)
      if (viewCircleId === id.toString()) handleViewCircle()
    })

    contract.on("DepositReceived", (id, member, amount, round) => {
      handleEvent("DepositReceived", id, member, amount, round)
      if (viewCircleId === id.toString()) handleViewCircle()
    })

    contract.on("PayoutExecuted", (id, recipient, amount, round) => {
      handleEvent("PayoutExecuted", id, recipient, amount, round)
      setNotification(`Payout Executed for Circle ${id}! Beneficiary: ${recipient}`)
      if (recipient.toLowerCase() === account.toLowerCase()) {
        setNotification(`💰 YOU RECEIVED A PAYOUT! Circle ${id}`)
      }
      if (viewCircleId === id.toString()) handleViewCircle()
    })

    contract.on("TrustScoreUpdated", (member, newScore) => {
      handleEvent("TrustScoreUpdated", member, newScore)
    })

    contract.on("DefaultDetected", (id, member, penalty) => {
      handleEvent("DefaultDetected", id, member, penalty)
      setNotification(`Default Detected in Circle ${id}! Member penalized.`)
    })

    return () => {
      contract.removeAllListeners()
    }
  }, [contract, account, viewCircleId])

  // Clear notifications
  useEffect(() => {
    if (notification || error) {
      const timer = setTimeout(() => {
        setNotification(null)
        setError(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [notification, error])

  // Connect Wallet
  const connectWallet = async () => {
    setLoading(true)
    setError(null)
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

        await fetchTrustScore(address, contractInstance)
      } catch (err) {
        console.error("Error connecting wallet:", err)
        setError("Error connecting wallet. Make sure MetaMask is installed.")
      } finally {
        setLoading(false)
      }
    } else {
      setError("Please install MetaMask!")
      setLoading(false)
    }
  }

  // Create Circle
  const handleCreateCircle = async () => {
    if (!contract) return
    setLoading(true)
    setError(null)
    try {
      const amount = ethers.parseEther(contributionAmount)
      const tx = await contract.createCircle(amount, frequency)
      setNotification("Transaction sent... awaiting confirmation")
      await tx.wait()
      setNotification("Circle Created Successfully!")
    } catch (err) {
      console.error("Error creating circle:", err)
      setError(err.reason || err.message || "Error creating circle")
    } finally {
      setLoading(false)
    }
  }

  // Join Circle
  const handleJoinCircle = async () => {
    if (!contract || !joinCircleId) return
    setLoading(true)
    setError(null)
    try {
      const tx = await contract.joinCircle(joinCircleId)
      setNotification("Transaction sent... awaiting confirmation")
      await tx.wait()
      setNotification(`Joined Circle ${joinCircleId}!`)
    } catch (err) {
      console.error("Error joining circle:", err)
      setError(err.reason || err.message || "Error joining circle")
    } finally {
      setLoading(false)
    }
  }

  // Start Circle
  const handleStartCircle = async () => {
    if (!contract || !startCircleId) return
    setLoading(true)
    setError(null)
    try {
      const tx = await contract.startCircle(startCircleId)
      setNotification("Transaction sent... awaiting confirmation")
      await tx.wait()
      setNotification(`Circle ${startCircleId} Started!`)
      if (viewCircleId === startCircleId) handleViewCircle()
    } catch (err) {
      console.error("Error starting circle:", err)
      setError(err.reason || err.message || "Error starting circle")
    } finally {
      setLoading(false)
    }
  }

  // Deposit
  const handleDeposit = async () => {
    if (!contract || !depositCircleId) return
    setLoading(true)
    setError(null)
    try {
      const details = await contract.getCircleDetails(depositCircleId)
      const amount = details[1]

      const tx = await contract.deposit(depositCircleId, { value: amount })
      setNotification("Transaction sent... awaiting confirmation")
      await tx.wait()
      setNotification(`Deposit successful for Circle ${depositCircleId}`)
    } catch (err) {
      console.error("Error depositing:", err)
      setError(err.reason || err.message || "Error depositing")
    } finally {
      setLoading(false)
    }
  }

  // View Circle Details
  const handleViewCircle = async () => {
    const idToView = viewCircleId
    if (!contract || !idToView) return
    setLoading(true)
    setError(null)
    try {
      const details = await contract.getCircleDetails(idToView)
      setCircleDetails({
        creator: details[0],
        contributionAmount: ethers.formatEther(details[1]),
        currentRound: Number(details[2]),
        memberCount: Number(details[3]),
        active: details[4]
      })

      // Fetch members
      const members = await contract.getCircleMembers(idToView)
      setCircleMembers(members)
    } catch (err) {
      console.error("Error fetching circle:", err)
      setError("Circle not found or error fetching details")
      setCircleDetails(null)
      setCircleMembers([])
    } finally {
      setLoading(false)
    }
  }

  // Toggle Demo Mode
  const toggleDemoMode = () => {
    setIsDemoMode(!isDemoMode)
    if (!isDemoMode) {
      // Mock data for judges
      setCircleDetails({
        creator: "0xVeryChat...777",
        contributionAmount: "0.1",
        currentRound: 3,
        memberCount: 5,
        active: true
      })
      setCircleMembers([
        "0xf726...A7cA",
        "0x1234...5678",
        "0x8888...9999",
        "0xAAAA...BBBB",
        "0xCCCC...DDDD"
      ])
      setRecentEvents([
        { name: 'PayoutExecuted', args: [1, "0xf726...A7cA", 0.5, 2], id: 1 },
        { name: 'DepositReceived', args: [1, "0x1234...5678", 0.1, 3], id: 2 },
        { name: 'TrustScoreUpdated', args: ["0xf726...A7cA", 125], id: 3 }
      ])
      setTrustScore(125)
      setNotification("🚀 Demo Mode Active: Showing mock ecosystem data")
    } else {
      setCircleDetails(null)
      setCircleMembers([])
      setRecentEvents([])
      if (account && contract) fetchTrustScore(account, contract)
    }
  }

  const connectVerychat = () => {
    setIsVerychatConnected(true)
    setNotification("✅ connected to Verychat: @Josh_Buidl")
  }

  return (
    <div className="App">
      {loading && <div className="loader-overlay"><div className="loader"></div></div>}

      {notification && <div className="notification success">{notification}</div>}
      {error && <div className="notification error">{error}</div>}

      <header>
        <h1>🌍 VeryTontine</h1>
        <p>Social Savings Circles on Very Network</p>
      </header>

      <main>
        {!account ? (
          <div className="connect-section">
            <div className="viber-card">
              <button onClick={connectWallet} className="btn-primary" disabled={loading}>
                {loading ? "Connecting..." : "Connect Wallet"}
              </button>

              <div className="social-divider">OR</div>

              <button
                onClick={connectVerychat}
                className={`btn-secondary ${isVerychatConnected ? 'connected' : ''}`}
              >
                {isVerychatConnected ? "✅ @Josh_Buidl Linked" : "💬 Connect Verychat"}
              </button>

              <p className="hint">Linking your Verychat ID boosts your initial Trust Score!</p>
            </div>
          </div>
        ) : (
          <div className="dashboard">
            <div className="dashboard-header">
              <div className="wallet-info">
                <p><strong>Connected:</strong> <span className="address">{account.slice(0, 6)}...{account.slice(-4)}</span></p>
                <p><strong>Trust Score:</strong> <span className="trust-score">{trustScore}</span></p>
                {isVerychatConnected && <span className="badge">@Josh_Buidl</span>}
              </div>
              <div className="demo-toggle">
                <label className="switch">
                  <input type="checkbox" checked={isDemoMode} onChange={toggleDemoMode} />
                  <span className="slider round"></span>
                </label>
                <span>Demo Mode</span>
              </div>
            </div>

            <div className="grid-container">
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
                  <button onClick={handleCreateCircle} className="btn" disabled={loading}>Create Circle</button>
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
                  <button onClick={handleJoinCircle} className="btn" disabled={loading}>Join</button>
                </div>
              </div>

              <div className="section">
                <h2>Start Circle</h2>
                <div className="form">
                  <input
                    type="text"
                    placeholder="Circle ID"
                    value={startCircleId}
                    onChange={(e) => setStartCircleId(e.target.value)}
                  />
                  <button onClick={handleStartCircle} className="btn" disabled={loading}>Start</button>
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
                  <button onClick={handleDeposit} className="btn" disabled={loading}>Deposit</button>
                </div>
              </div>

              <div className="section full-width">
                <h2>View Circle Details</h2>
                <div className="form-row">
                  <input
                    type="text"
                    placeholder="Circle ID"
                    className="flex-1"
                    value={viewCircleId}
                    onChange={(e) => setViewCircleId(e.target.value)}
                  />
                  <button onClick={handleViewCircle} className="btn" disabled={loading}>View</button>
                </div>

                {circleDetails && (
                  <div className="circle-display">
                    <div className="circle-details">
                      <p><strong>Creator:</strong> {circleDetails.creator}</p>
                      <p><strong>Contribution:</strong> {circleDetails.contributionAmount} ETH</p>
                      <p><strong>Current Round:</strong> {circleDetails.currentRound === 0 ? "Not Started" : circleDetails.currentRound}</p>
                      <p><strong>Members:</strong> {circleDetails.memberCount}</p>
                      <p><strong>Status:</strong> {circleDetails.active ? '✅ Active' : '❌ Cancelled'}</p>
                    </div>

                    {circleMembers.length > 0 && (
                      <div className="member-list">
                        <h3>Members</h3>
                        <ul>
                          {circleMembers.map((member, i) => (
                            <li key={i} className={member.toLowerCase() === account.toLowerCase() ? "is-you" : ""}>
                              {member.slice(0, 10)}...{member.slice(-8)} {member.toLowerCase() === account.toLowerCase() ? "(You)" : ""}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {recentEvents.length > 0 && (
                <div className="section full-width events-section">
                  <h2>Recent Activity</h2>
                  <div className="events-list">
                    {recentEvents.map(event => (
                      <div key={event.id} className="event-item">
                        <span className="event-name">{event.name}</span>
                        <span className="event-details">
                          {event.name === 'PayoutExecuted' && `Circle ${event.args[0]}: ${event.args[1].slice(0, 6)} received payout`}
                          {event.name === 'DepositReceived' && `Circle ${event.args[0]}: Deposit from ${event.args[1].slice(0, 6)}`}
                          {event.name === 'CircleCreated' && `New Circle ${event.args[0]} by ${event.args[1].slice(0, 6)}`}
                          {event.name === 'MemberJoined' && `Circle ${event.args[0]}: ${event.args[1].slice(0, 6)} joined`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
