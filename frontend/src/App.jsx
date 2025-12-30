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

  const [currentView, setCurrentView] = useState('home') // home, discovery, create, room, profile

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

  // Logout / Disconnect Wallet
  const disconnectWallet = () => {
    setAccount(null)
    setProvider(null)
    setContract(null)
    setTrustScore(0)
    setCircleDetails(null)
    setCircleMembers([])
    setRecentEvents([])
    setIsDemoMode(false)
    setIsVerychatConnected(false)
    setNotification("Logged out successfully")
    setCurrentView('home')
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
      setCurrentView('home')
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
      setCurrentView('room')
      setViewCircleId(joinCircleId)
      handleViewCircle()
    } catch (err) {
      console.error("Error joining circle:", err)
      setError(err.reason || err.message || "Error joining circle")
    } finally {
      setLoading(false)
    }
  }

  // Start Circle
  const handleStartCircle = async (id) => {
    if (!contract || !id) return
    setLoading(true)
    setError(null)
    try {
      const tx = await contract.startCircle(id)
      setNotification("Transaction sent... awaiting confirmation")
      await tx.wait()
      setNotification(`Circle ${id} Started!`)
      handleViewCircle()
    } catch (err) {
      console.error("Error starting circle:", err)
      setError(err.reason || err.message || "Error starting circle")
    } finally {
      setLoading(false)
    }
  }

  // Deposit
  const handleDeposit = async (id) => {
    if (!contract || !id) return
    setLoading(true)
    setError(null)
    try {
      const details = await contract.getCircleDetails(id)
      const amount = details[1]

      const tx = await contract.deposit(id, { value: amount })
      setNotification("Transaction sent... awaiting confirmation")
      await tx.wait()
      setNotification(`Deposit successful for Circle ${id}`)
      handleViewCircle()
    } catch (err) {
      console.error("Error depositing:", err)
      setError(err.reason || err.message || "Error depositing")
    } finally {
      setLoading(false)
    }
  }

  // View Circle Details
  const handleViewCircle = async (idArg) => {
    const idToView = idArg || viewCircleId
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
        active: details[4],
        id: idToView
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
        id: "1",
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

  // View Renderers
  const renderDashboard = () => (
    <div className="section-container">
      <div className="summary-cards">
        <div className="card stat-card">
          <h3>Total Saved</h3>
          <p className="big-number">1,250 VERY</p>
        </div>
        <div className="card stat-card">
          <h3>Active Circles</h3>
          <p className="big-number">2</p>
        </div>
      </div>

      <div className="section">
        <h2>My Active Circles</h2>
        <div className="circles-grid">
          <div className="circle-card" onClick={() => { setCurrentView('room'); setViewCircleId('1'); handleViewCircle('1'); }}>
            <h3>Nairobi Savings Circle</h3>
            <div className="progress-container">
              <div className="progress-bar" style={{ width: '60%' }}></div>
            </div>
            <p>Round 3 of 5</p>
          </div>
          <div className="circle-card join-card" onClick={() => setCurrentView('create')}>
            <div className="plus-icon">+</div>
            <p>Create New Circle</p>
          </div>
        </div>
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
  )

  const renderDiscovery = () => (
    <div className="section-container">
      <div className="section">
        <h2>Discovery & Join</h2>
        <div className="search-container">
          <input type="text" placeholder="Search public Tontines or enter ID..." value={joinCircleId} onChange={(e) => setJoinCircleId(e.target.value)} />
          <button className="btn-primary" onClick={handleJoinCircle}>Join</button>
        </div>

        <div className="list-section">
          <h3>Verified Circles</h3>
          <div className="verified-list">
            <div className="verified-item">
              <div className="v-info">
                <strong>Global Chamas</strong>
                <span>Min Trust: 120</span>
              </div>
              <button className="btn-small">Join</button>
            </div>
            <div className="verified-item">
              <div className="v-info">
                <strong>Tech Buidlers</strong>
                <span>Min Trust: 150</span>
              </div>
              <button className="btn-small">Join</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderCreateCircle = () => (
    <div className="section-container">
      <div className="section">
        <h2>Create a Circle</h2>
        <div className="form create-form">
          <div className="form-group">
            <label>Contribution Amount (VERY)</label>
            <input type="text" value={contributionAmount} onChange={(e) => setContributionAmount(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Frequency (seconds for demo)</label>
            <input type="text" value={frequency} onChange={(e) => setFrequency(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Member Limit</label>
            <input type="number" defaultValue="10" />
          </div>
          <div className="form-group">
            <label>Rotation Logic</label>
            <select>
              <option>Sequential (Default)</option>
              <option>Random</option>
            </select>
          </div>
          <button onClick={handleCreateCircle} className="btn-primary full-width" disabled={loading}>Establish Smart Contract</button>
        </div>
      </div>
    </div>
  )

  const renderCircleRoom = () => (
    <div className="section-container">
      <div className="circle-room-header">
        <button className="btn-back" onClick={() => setCurrentView('home')}>← Dashboard</button>
        <h2>Circle Room: {viewCircleId}</h2>
      </div>

      <div className="circle-room-content">
        <div className="progress-wheel-container">
          <div className="progress-wheel">
            <div className="next-payout">
              <span>Next Payout</span>
              <strong>{circleMembers[circleDetails?.currentRound % circleMembers.length]?.slice(0, 6) || "..."}</strong>
            </div>
          </div>
        </div>

        <div className="section">
          <h3>Contribution Tracker</h3>
          <div className="member-status-list">
            {circleMembers.map((member, i) => (
              <div key={i} className="member-status-item">
                <span>{member.slice(0, 8)}...</span>
                <span className="status-tag pending">⏳ Pending</span>
              </div>
            ))}
          </div>

          <div className="action-footer">
            <button className="btn-primary" onClick={() => handleDeposit(viewCircleId)}>Deposit {circleDetails?.contributionAmount} VERY</button>
            <button className="btn-secondary" onClick={() => handleStartCircle(viewCircleId)}>Start Round</button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderProfile = () => (
    <div className="section-container">
      <div className="section profile-view">
        <div className="profile-header">
          <div className="big-score">{trustScore}</div>
          <h2>Universal Trust Score</h2>
          {isVerychatConnected && <div className="kyc-badge">KYC VERIFIED</div>}
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <strong>5</strong>
            <span>Circles Completed</span>
          </div>
          <div className="stat-card">
            <strong>0</strong>
            <span>Late Payments</span>
          </div>
        </div>

        <div className="history-section">
          <h3>Recent History</h3>
          <div className="history-list">
            <div className="history-item">
              <span>Circle 1 Payout</span>
              <span className="h-plus">+5 pts</span>
            </div>
            <div className="history-item">
              <span>Identity Linked</span>
              <span className="h-plus">+20 pts</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="App">
      {loading && <div className="loader-overlay"><div className="loader"></div></div>}

      {notification && <div className="notification success">{notification}</div>}
      {error && <div className="notification error">{error}</div>}

      <header>
        <img src="/logo1.png" alt="VeryTontine Logo" className="app-logo" />
        <h1>VeryTontine</h1>
        <p>Digitizing community savings on Very Network</p>
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
          <div className="dashboard-container">
            <div className="top-utility-bar">
              <div className="wallet-pill">
                <span className="addr">{account.slice(0, 6)}...</span>
                <span className="score">⭐ {trustScore}</span>
              </div>
              <div className="demo-toggle">
                <label className="switch">
                  <input type="checkbox" checked={isDemoMode} onChange={toggleDemoMode} />
                  <span className="slider round"></span>
                </label>
                <span>Demo Mode</span>
              </div>
              <button onClick={disconnectWallet} className="btn-logout-pill">Logout</button>
            </div>

            <div className="view-content">
              {currentView === 'home' && renderDashboard()}
              {currentView === 'discovery' && renderDiscovery()}
              {currentView === 'create' && renderCreateCircle()}
              {currentView === 'room' && renderCircleRoom()}
              {currentView === 'profile' && renderProfile()}
            </div>

            <nav className="bottom-nav">
              <button className={currentView === 'home' ? 'active' : ''} onClick={() => setCurrentView('home')}>🏠 Home</button>
              <button className={currentView === 'discovery' ? 'active' : ''} onClick={() => setCurrentView('discovery')}>🔍 Explore</button>
              <button className="nav-plus" onClick={() => setCurrentView('create')}>+</button>
              <button className={currentView === 'profile' ? 'active' : ''} onClick={() => setCurrentView('profile')}>👤 Profile</button>
            </nav>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
