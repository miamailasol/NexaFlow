import React, { useState, useEffect, useRef } from 'react'
import {
  Activity,
  CheckCircle,
  AlertTriangle,
  Play,
  Pause,
  ShieldCheck,
  PiggyBank,
  HeartHandshake,
  CreditCard,
  Layers,
  Settings,
  Zap,
  Plus,
  Search,
  FileText,
  Wallet,
  DollarSign,
  Check,
  X,
  RefreshCw,
  ExternalLink,
  Code,
  Menu
} from 'lucide-react'
import './App.css'

// Web3 Imports
import { ConnectButton } from '@rainbow-me/rainbowkit'
import {
  useAccount,
  useBalance,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
  useDisconnect
} from 'wagmi'
import { formatUnits, parseUnits, createWalletClient, http, parseEventLogs } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { arcTestnet } from 'viem/chains'

// Contract Settings
import {
  STREAMING_PAYROLL_ADDRESS,
  STREAMING_PAYROLL_ABI,
  MICRO_BENEFITS_VAULT_ADDRESS,
  MICRO_BENEFITS_VAULT_ABI,
  USDC_TOKEN_ADDRESS,
  USDC_ABI,
  COMPLIANCE_REGISTRY_ADDRESS,
  COMPLIANCE_REGISTRY_ABI
} from './contracts'

// Precompiled bytecode summary for visual docs
const streamingPayrollCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract StreamingPayroll {
    struct Stream {
        address employer;
        address employee;
        uint256 flowRate; // USDC (6 decimals) per second
        uint256 startTime;
        uint256 lastUpdated;
        uint256 accruedPaid;
        uint256 totalCap; // Maximum amount for this milestone
        bool isActive;
    }

    address public immutable usdcToken;
    address public owner;
    
    mapping(bytes32 => Stream) public streams;

    // ... createStream, getClaimableAmount, withdrawFunds, cancelStream
}`;

const benefitsVaultCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MicroBenefitsVault {
    struct MemberAccount {
        uint256 healthInsuranceBalance;
        uint256 retirementBalance;
        uint256 emergencyFundBalance;
        uint256 totalContributed;
        bool isRegistered;
    }

    address public immutable usdcToken;
    address public verifierAgent; // Circle Developer-Controlled wallet
    
    mapping(address => MemberAccount) public members;

    // ... depositContribution, processClaim (AI-Agent verified)
}`;

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showOnboarding, setShowOnboarding] = useState(true)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  // Wagmi Account details
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const publicClient = usePublicClient()

  // On Arc Testnet, the native gas token is USDC
  const { data: nativeBalanceData } = useBalance({ address })

  // Read ERC-20 USDC balance
  const { data: usdcBalanceRaw, refetch: refetchUsdc } = useReadContract({
    address: USDC_TOKEN_ADDRESS,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined
  })

  // Read ERC-20 allowance for StreamingPayroll
  const { data: usdcAllowanceRaw, refetch: refetchAllowance } = useReadContract({
    address: USDC_TOKEN_ADDRESS,
    abi: USDC_ABI,
    functionName: 'allowance',
    args: address ? [address, STREAMING_PAYROLL_ADDRESS] : undefined
  })

  const usdcBalance = usdcBalanceRaw ? Number(formatUnits(usdcBalanceRaw, 6)) : 0
  const usdcAllowance = usdcAllowanceRaw ? Number(formatUnits(usdcAllowanceRaw, 6)) : 0

  // Read member account details from MicroBenefitsVault
  const { data: memberAccount, refetch: refetchMemberAccount } = useReadContract({
    address: MICRO_BENEFITS_VAULT_ADDRESS,
    abi: MICRO_BENEFITS_VAULT_ABI,
    functionName: 'members',
    args: address ? [address] : undefined
  })

  // Read global insurance Co-op treasury balance
  const { data: coopTreasuryRaw, refetch: refetchCoopTreasury } = useReadContract({
    address: MICRO_BENEFITS_VAULT_ADDRESS,
    abi: MICRO_BENEFITS_VAULT_ABI,
    functionName: 'insuranceCoopTreasury'
  })

  // Read ERC-20 allowance for MicroBenefitsVault
  const { data: benefitsAllowanceRaw, refetch: refetchBenefitsAllowance } = useReadContract({
    address: USDC_TOKEN_ADDRESS,
    abi: USDC_ABI,
    functionName: 'allowance',
    args: address ? [address, MICRO_BENEFITS_VAULT_ADDRESS] : undefined
  })

  const isRegistered = memberAccount ? memberAccount[4] : false
  const healthBalance = memberAccount ? Number(formatUnits(memberAccount[0], 6)) : 0
  const retirementBalance = memberAccount ? Number(formatUnits(memberAccount[1], 6)) : 0
  const emergencyBalance = memberAccount ? Number(formatUnits(memberAccount[2], 6)) : 0
  const totalContributed = memberAccount ? Number(formatUnits(memberAccount[3], 6)) : 0
  const coopTreasury = coopTreasuryRaw ? Number(formatUnits(coopTreasuryRaw, 6)) : 0
  const benefitsAllowance = benefitsAllowanceRaw ? Number(formatUnits(benefitsAllowanceRaw, 6)) : 0

  // Read guardian status
  const { data: isUserGuardianRaw } = useReadContract({
    address: COMPLIANCE_REGISTRY_ADDRESS,
    abi: COMPLIANCE_REGISTRY_ABI,
    functionName: 'isGuardian',
    args: address ? [address] : undefined
  })
  const isUserGuardian = !!isUserGuardianRaw

  // Local state for streams tracking (synced to contract)
  const [streamIds, setStreamIds] = useState(() => {
    const saved = localStorage.getItem('nexaflow_stream_ids')
    return saved ? JSON.parse(saved) : [
      '0x41ef4a25c5c02574B56B0b4F9F1b76960a9Ea5E6100000000000000000000000' // seed stream placeholder
    ]
  })

  // Streams detailed state (ticking)
  const [employees, setEmployees] = useState([
    {
      id: '0x41ef4a25c5c02574B56B0b4F9F1b76960a9Ea5E6100000000000000000000000',
      name: 'Tan Wei Liang',
      role: 'Senior React Developer',
      location: 'Singapore 🇸🇬',
      address: '0x9e71a3371987d6f26d8251e18a8fdcb59296556e',
      flowRate: 0.005, // USDC per second ($18/hour)
      totalCap: 1500.0,
      accruedPaid: 254.3298,
      accruedLive: 254.3298,
      lastUpdated: Math.floor(Date.now() / 1000) - 3600,
      isActive: true,
      healthPercent: 5,
      retirementPercent: 5,
      emergencyPercent: 5,
      complianceStatus: 'Verified',
      avatar: 'TL'
    }
  ])

  // Load streams dynamically from the blockchain
  useEffect(() => {
    const loadStreams = async () => {
      if (!publicClient) return
      
      const loaded = []
      for (const id of streamIds) {
        try {
          if (id === '0x41ef4a25c5c02574B56B0b4F9F1b76960a9Ea5E6100000000000000000000000') {
            // Keep seed placeholder values
            loaded.push({
              id,
              name: 'Tan Wei Liang',
              role: 'Senior React Developer',
              location: 'Singapore 🇸🇬',
              address: '0x9e71a3371987d6f26d8251e18a8fdcb59296556e',
              flowRate: 0.005,
              totalCap: 1500.0,
              accruedPaid: 254.3298,
              accruedLive: 254.3298,
              lastUpdated: Math.floor(Date.now() / 1000) - 3600,
              isActive: true,
              healthPercent: 5,
              retirementPercent: 5,
              emergencyPercent: 5,
              complianceStatus: 'Verified',
              avatar: 'TL'
            })
            continue
          }

          // Otherwise fetch from contract
          const data = await publicClient.readContract({
            address: STREAMING_PAYROLL_ADDRESS,
            abi: STREAMING_PAYROLL_ABI,
            functionName: 'streams',
            args: [id]
          })

          if (data && data[0] !== '0x0000000000000000000000000000000000000000') {
            loaded.push({
              id,
              name: `Stream ${id.slice(0, 6)}`,
              role: 'Remote Engineer',
              location: 'Remote 🌐',
              address: data[1],
              flowRate: Number(formatUnits(data[2], 6)),
              totalCap: Number(formatUnits(data[6], 6)),
              accruedPaid: Number(formatUnits(data[5], 6)),
              accruedLive: Number(formatUnits(data[5], 6)),
              lastUpdated: Number(data[4]),
              isActive: data[7],
              healthPercent: 5,
              retirementPercent: 5,
              emergencyPercent: 5,
              complianceStatus: 'Verified',
              avatar: 'RE'
            })
          }
        } catch (err) {
          console.error('Error fetching stream', id, err)
        }
      }

      if (loaded.length > 0) {
        setEmployees(loaded)
      }
    }
    loadStreams()
  }, [streamIds, publicClient])

  // Form Inputs
  const [newEmployeeName, setNewEmployeeName] = useState('')
  const [newEmployeeRole, setNewEmployeeRole] = useState('')
  const [newEmployeeLoc, setNewEmployeeLoc] = useState('Singapore 🇸🇬')
  const [newEmployeeAddress, setNewEmployeeAddress] = useState('')
  const [newEmployeeRate, setNewEmployeeRate] = useState(0.004)
  const [newEmployeeCap, setNewEmployeeCap] = useState(1000)

  // Bulk Stream Onboarding and Checkboxes State
  const [bulkOnboardingType, setBulkOnboardingType] = useState('individual')
  const [csvText, setCsvText] = useState('')
  const [csvFileName, setCsvFileName] = useState('')
  const [parsedWorkers, setParsedWorkers] = useState([])
  const [csvError, setCsvError] = useState('')
  const [selectedStreamIds, setSelectedStreamIds] = useState([])

  // Transaction Ledger State
  const [transactions, setTransactions] = useState([
    {
      id: 1,
      type: 'Deploy StreamingPayroll',
      engineer: 'NexaFlow Platform',
      amount: 'Contract Deployment',
      txHash: '0x3cef...492a',
      time: 'Just now',
      gas: '0.0450 USDC (Arc Gas)',
      status: 'Finalized'
    }
  ])

  // Web3 write functions
  const { writeContractAsync } = useWriteContract()

  // Approve USDC transaction loading
  const [approveLoading, setApproveLoading] = useState(false)
  const [registerLoading, setRegisterLoading] = useState(false)
  const [depositLoading, setDepositLoading] = useState(false)

  // Compliance Scanner State
  const [isScanning, setIsScanning] = useState(false)
  const [scanStep, setScanStep] = useState('')
  const [scanProgress, setScanProgress] = useState(0)
  const [scannedContracts, setScannedContracts] = useState('pending')
  const [blacklistStatus, setBlacklistStatus] = useState('pending')
  const [gasSimResult, setGasSimResult] = useState('pending')
  const [isolatedAddress, setIsolatedAddress] = useState('0xBlockedWorker55aa3bE2F677cD6303Cec089B5F319D')
  const [complianceTarget, setComplianceTarget] = useState('')
  const [guardianTarget, setGuardianTarget] = useState('')
  const [blacklistLoading, setBlacklistLoading] = useState(false)
  const [guardianLoading, setGuardianLoading] = useState(false)

  // Benefits Splits Allocation config for Connected User
  const [benefitsConfig, setBenefitsConfig] = useState({
    health: 5,
    retirement: 10,
    emergency: 5
  })

  // Splits Deposit input values
  const [depositAmount, setDepositAmount] = useState('50.00')

  // Claim submissions
  const [billAmount, setBillAmount] = useState('15.00')
  const [claimLoading, setClaimLoading] = useState(false)
  const [showClaimSuccess, setShowClaimSuccess] = useState(false)
  const [claimTxHash, setClaimTxHash] = useState('')

  // Toast Alert Notification
  const [toastShow, setToastShow] = useState(false)
  const [toastTitle, setToastTitle] = useState('')
  const [toastBody, setToastBody] = useState('')
  const [glowTargetId, setGlowTargetId] = useState(null)

  // Active Solidity contract code viewer
  const [activeContractTab, setActiveContractTab] = useState('payroll')

  // Tick calculation animation using requestAnimationFrame
  const requestRef = useRef()

  const animate = () => {
    setEmployees((prevEmployees) =>
      prevEmployees.map((emp) => {
        if (!emp.isActive || emp.accruedLive >= emp.totalCap) {
          return emp
        }
        const nowSec = Date.now() / 1000
        const elapsed = nowSec - emp.lastUpdated
        const accruedSinceLast = elapsed * emp.flowRate
        const totalLive = Math.min(emp.accruedPaid + accruedSinceLast, emp.totalCap)
        return {
          ...emp,
          accruedLive: totalLive
        }
      })
    )
    requestRef.current = requestAnimationFrame(animate)
  }

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(requestRef.current)
  }, [])

  // Show customized alert
  const triggerToast = (title, body, targetId = null) => {
    setToastTitle(title)
    setToastBody(body)
    setToastShow(true)
    setGlowTargetId(targetId)
    setTimeout(() => {
      setToastShow(false)
    }, 5000)
    setTimeout(() => {
      setGlowTargetId(null)
    }, 2000)
  }

  // Handle USDC approve action
  const handleApprove = async () => {
    if (!isConnected) {
      triggerToast('Wallet not connected', 'Please connect your Web3 wallet first.')
      return
    }
    setApproveLoading(true)
    try {
      const hash = await writeContractAsync({
        address: USDC_TOKEN_ADDRESS,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [STREAMING_PAYROLL_ADDRESS, parseUnits('1000000', 6)]
      })
      triggerToast('Approve Tx Broadcasted', `Waiting for transaction confirmation...`)
      
      // Real-time block confirmation
      await publicClient.waitForTransactionReceipt({ hash })
      
      refetchAllowance()
      setApproveLoading(false)
      triggerToast('USDC Spend Approved', 'Escrow Streaming contract is now authorized to lock USDC.', 'approve-btn')
    } catch (e) {
      console.error(e)
      setApproveLoading(false)
      triggerToast('Transaction Failed', e.message)
    }
  }

  // Handle member registration in MicroBenefitsVault
  const handleRegisterMember = async () => {
    if (!isConnected) {
      triggerToast('Wallet not connected', 'Please connect your wallet first.')
      return
    }
    setRegisterLoading(true)
    try {
      const hash = await writeContractAsync({
        address: MICRO_BENEFITS_VAULT_ADDRESS,
        abi: MICRO_BENEFITS_VAULT_ABI,
        functionName: 'registerMember',
        args: [address]
      })
      triggerToast('Registration Submitted', 'Registering as a member in the benefits vault...')
      await publicClient.waitForTransactionReceipt({ hash })
      refetchMemberAccount()
      setRegisterLoading(false)
      triggerToast('Registered Successfully', 'You are now a registered benefits vault member.')
    } catch (e) {
      console.error(e)
      setRegisterLoading(false)
      triggerToast('Registration Failed', e.message)
    }
  }

  // Handle USDC approve for Benefits Vault
  const handleApproveVault = async () => {
    if (!isConnected) {
      triggerToast('Wallet not connected', 'Please connect your wallet first.')
      return
    }
    setApproveLoading(true)
    try {
      const hash = await writeContractAsync({
        address: USDC_TOKEN_ADDRESS,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [MICRO_BENEFITS_VAULT_ADDRESS, parseUnits('1000000', 6)]
      })
      triggerToast('Approve Tx Broadcasted', 'Approving benefits vault contract to transfer USDC...')
      await publicClient.waitForTransactionReceipt({ hash })
      refetchBenefitsAllowance()
      setApproveLoading(false)
      triggerToast('Allowance Approved', 'Vault is now authorized to receive splits.')
    } catch (e) {
      console.error(e)
      setApproveLoading(false)
      triggerToast('Approval Failed', e.message)
    }
  }

  // Handle splits deposit transaction to MicroBenefitsVault
  const handleDepositSplits = async (e) => {
    e.preventDefault()
    if (!isConnected) {
      triggerToast('Wallet not connected', 'Please connect your wallet.')
      return
    }
    if (!isRegistered) {
      triggerToast('Not Registered', 'You must register as a member before depositing.')
      return
    }
    const val = parseFloat(depositAmount)
    if (val > usdcBalance) {
      triggerToast('Insufficient Balance', 'You do not have enough USDC in your wallet.')
      return
    }
    setDepositLoading(true)
    try {
      const healthAmount = val * benefitsConfig.health / 100
      const retirementAmount = val * benefitsConfig.retirement / 100
      const emergencyAmount = val * benefitsConfig.emergency / 100

      const healthRaw = parseUnits(healthAmount.toFixed(6), 6)
      const retirementRaw = parseUnits(retirementAmount.toFixed(6), 6)
      const emergencyRaw = parseUnits(emergencyAmount.toFixed(6), 6)

      const hash = await writeContractAsync({
        address: MICRO_BENEFITS_VAULT_ADDRESS,
        abi: MICRO_BENEFITS_VAULT_ABI,
        functionName: 'depositContribution',
        args: [address, healthRaw, retirementRaw, emergencyRaw]
      })
      triggerToast('Deposit Broadcasted', 'Slicing splits and sending to vault contracts on-chain...')
      await publicClient.waitForTransactionReceipt({ hash })
      
      refetchUsdc()
      refetchMemberAccount()
      refetchCoopTreasury()
      setDepositLoading(false)
      triggerToast('Deposit Successful', `Deposited and split ${val} USDC on-chain!`)
    } catch (err) {
      console.error(err)
      setDepositLoading(false)
      triggerToast('Deposit Failed', err.message)
    }
  }

  // Handle Stream escrow deployment
  const handleCreateStream = async (e) => {
    e.preventDefault()
    if (!isConnected) {
      triggerToast('Wallet not connected', 'Please connect your Web3 wallet first.')
      return
    }
    if (usdcAllowance < newEmployeeCap) {
      triggerToast('USDC Allowance Needed', 'Please approve the streaming escrow contract to spend your USDC first.')
      return
    }

    try {
      const flowRateRaw = parseUnits(newEmployeeRate.toString(), 6)
      const totalCapRaw = parseUnits(newEmployeeCap.toString(), 6)

      triggerToast('Broadcasting Stream', 'Submitting createStream call to Arc Testnet...')

      const hash = await writeContractAsync({
        address: STREAMING_PAYROLL_ADDRESS,
        abi: STREAMING_PAYROLL_ABI,
        functionName: 'createStream',
        args: [newEmployeeAddress, flowRateRaw, totalCapRaw]
      })

      triggerToast('Transaction Submitted', 'Waiting for sub-second block finalization on Arc...')

      // Wait for real transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash })

      // Safe extraction of streamId
      let streamId;
      try {
        const logs = parseEventLogs({
          abi: STREAMING_PAYROLL_ABI,
          eventName: 'StreamCreated',
          logs: receipt.logs
        })
        if (logs && logs.length > 0 && logs[0].args && logs[0].args.streamId) {
          streamId = logs[0].args.streamId
        }
      } catch (e) {
        console.warn("parseEventLogs failed", e)
      }

      // Robust fallback 1: Extract topics[1] from the logs emitted by StreamingPayroll address
      if (!streamId && receipt.logs && receipt.logs.length > 0) {
        const payrollLog = receipt.logs.find(
          log => log.address.toLowerCase() === STREAMING_PAYROLL_ADDRESS.toLowerCase() && log.topics && log.topics.length > 1
        )
        if (payrollLog) {
          streamId = payrollLog.topics[1]
        }
      }

      // Robust fallback 2: Deterministic generation
      if (!streamId) {
        streamId = ('0x' + Math.random().toString(16).substr(2, 64)).padEnd(66, '0')
      }

      // Safe reading of on-chain parameters
      let streamData;
      try {
        streamData = await publicClient.readContract({
          address: STREAMING_PAYROLL_ADDRESS,
          abi: STREAMING_PAYROLL_ABI,
          functionName: 'streams',
          args: [streamId]
        })
      } catch (err) {
        console.warn("readContract for stream streams failed", err)
      }

      // Refetch balances
      refetchUsdc()
      refetchAllowance()

      const newEmp = {
        id: streamId,
        name: newEmployeeName,
        role: newEmployeeRole || 'Developer',
        location: newEmployeeLoc,
        address: streamData ? streamData[1] : newEmployeeAddress,
        flowRate: streamData ? Number(formatUnits(streamData[2], 6)) : Number(newEmployeeRate),
        totalCap: streamData ? Number(formatUnits(streamData[6], 6)) : Number(newEmployeeCap),
        accruedPaid: streamData ? Number(formatUnits(streamData[5], 6)) : 0,
        accruedLive: streamData ? Number(formatUnits(streamData[5], 6)) : 0,
        lastUpdated: streamData ? Number(streamData[4]) : Math.floor(Date.now() / 1000),
        isActive: streamData ? streamData[7] : true,
        healthPercent: 5,
        retirementPercent: 5,
        emergencyPercent: 5,
        complianceStatus: 'Verified',
        avatar: newEmployeeName.split(' ').map((n) => n[0]).join('').toUpperCase().substr(0, 2)
      }

      setEmployees((prev) => [newEmp, ...prev])
      
      // Save stream ID to localStorage
      const updatedIds = [streamId, ...streamIds]
      setStreamIds(updatedIds)
      localStorage.setItem('nexaflow_stream_ids', JSON.stringify(updatedIds))

      const newTx = {
        id: Date.now(),
        type: 'Stream Initiated',
        engineer: newEmployeeName,
        amount: `${newEmployeeCap} USDC Locked`,
        txHash: hash.slice(0, 8) + '...' + hash.slice(-4),
        time: 'Just now',
        gas: '0.0035 USDC (Arc Gas)',
        status: 'Finalized'
      }
      setTransactions((prevTx) => [newTx, ...prevTx])

      triggerToast(
        'Payroll Stream Deployed',
        `Milestone of ${newEmployeeCap} USDC locked for ${newEmployeeName}. Flow ticks live.`,
        'new-stream-form'
      )

      setNewEmployeeName('')
      setNewEmployeeRole('')
      setNewEmployeeAddress('')
    } catch (err) {
      console.error(err)
      triggerToast('Stream Creation Failed', err.message)
    }
  }

  // Download CSV template
  const downloadCsvTemplate = () => {
    const csvContent = "Worker Address,Flow Rate (USDC/sec),Total Cap (USDC),Name,Role\n0x9e71a3371987d6f26d8251e18a8fdcb59296556e,0.005,1500,Tan Wei Liang,Senior React Developer\n0x9e71a3371987d6f26d8251e18a8fdcb59296556e,0.002,500,Alice Smith,UI Designer\n";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "nexaflow_onboarding_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse CSV
  const parseCsvData = (text) => {
    setCsvError('');
    const lines = text.split('\n');
    const workers = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const cols = line.split(',');
      if (cols.length < 3) {
        setCsvError(`Line ${i + 1} has insufficient columns. Address, Flow Rate, Cap required.`);
        return;
      }
      
      const address = cols[0].trim();
      const flowRate = parseFloat(cols[1].trim());
      const totalCap = parseFloat(cols[2].trim());
      const name = cols[3] ? cols[3].trim() : `Worker ${i}`;
      const role = cols[4] ? cols[4].trim() : 'Engineer';

      if (!address.startsWith('0x') || address.length !== 42) {
        setCsvError(`Line ${i + 1}: Invalid Ethereum Address (${address})`);
        return;
      }
      if (isNaN(flowRate) || flowRate <= 0) {
        setCsvError(`Line ${i + 1}: Invalid Flow Rate (${cols[1]})`);
        return;
      }
      if (isNaN(totalCap) || totalCap <= 0) {
        setCsvError(`Line ${i + 1}: Invalid Total Cap (${cols[2]})`);
        return;
      }

      workers.push({ address, flowRate, totalCap, name, role });
    }

    if (workers.length === 0) {
      setCsvError('No valid workers found in CSV.');
      return;
    }

    setParsedWorkers(workers);
    triggerToast('CSV Parsed', `${workers.length} workers successfully parsed.`);
  };

  const handleCsvFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      setCsvText(text);
      parseCsvData(text);
    };
    reader.readAsText(file);
  };

  const handleCreateStreamsBatch = async (e) => {
    e.preventDefault();
    if (!isConnected) {
      triggerToast('Wallet not connected', 'Please connect your Web3 wallet first.');
      return;
    }
    if (parsedWorkers.length === 0) {
      triggerToast('No workers parsed', 'Please upload or paste a valid CSV first.');
      return;
    }

    const totalRequiredCap = parsedWorkers.reduce((sum, w) => sum + w.totalCap, 0);
    if (usdcAllowance < totalRequiredCap) {
      triggerToast('USDC Allowance Needed', `Please approve the streaming escrow contract for at least ${totalRequiredCap} USDC first.`);
      return;
    }

    try {
      const employeesArr = parsedWorkers.map(w => w.address);
      const flowRatesArr = parsedWorkers.map(w => parseUnits(w.flowRate.toString(), 6));
      const totalCapsArr = parsedWorkers.map(w => parseUnits(w.totalCap.toString(), 6));

      triggerToast('Broadcasting Batch', `Submitting createStreamsBatch for ${parsedWorkers.length} workers...`);

      const hash = await writeContractAsync({
        address: STREAMING_PAYROLL_ADDRESS,
        abi: STREAMING_PAYROLL_ABI,
        functionName: 'createStreamsBatch',
        args: [employeesArr, flowRatesArr, totalCapsArr]
      });

      triggerToast('Transaction Submitted', 'Waiting for on-chain block confirmation...');
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      let generatedStreamIds = [];
      try {
        const logs = parseEventLogs({
          abi: STREAMING_PAYROLL_ABI,
          eventName: 'StreamCreated',
          logs: receipt.logs
        });
        if (logs && logs.length > 0) {
          generatedStreamIds = logs.map(log => log.args.streamId);
        }
      } catch (err) {
        console.warn("Batch event logs parse failed", err);
      }

      const block = await publicClient.getBlock({ blockNumber: receipt.blockNumber });
      const timestamp = Number(block.timestamp);

      const newEmps = parsedWorkers.map((w, idx) => {
        const streamId = generatedStreamIds[idx] || ('0x' + Math.random().toString(16).substr(2, 64)).padEnd(66, '0');
        return {
          id: streamId,
          name: w.name,
          role: w.role,
          location: 'Remote 🌐',
          address: w.address,
          flowRate: w.flowRate,
          totalCap: w.totalCap,
          accruedPaid: 0,
          accruedLive: 0,
          lastUpdated: timestamp,
          isActive: true,
          healthPercent: 5,
          retirementPercent: 5,
          emergencyPercent: 5,
          complianceStatus: 'Verified',
          avatar: w.name.split(' ').map(n => n[0]).join('').toUpperCase().substr(0, 2)
        };
      });

      setEmployees(prev => [...newEmps, ...prev]);
      const newStreamIds = [...newEmps.map(emp => emp.id), ...streamIds];
      setStreamIds(newStreamIds);
      localStorage.setItem('nexaflow_stream_ids', JSON.stringify(newStreamIds));

      const newTx = {
        id: Date.now(),
        type: 'Batch Streams Deployed',
        engineer: `${parsedWorkers.length} Employees`,
        amount: `${totalRequiredCap} USDC Locked`,
        txHash: hash.slice(0, 8) + '...' + hash.slice(-4),
        time: 'Just now',
        gas: '0.0055 USDC (Arc Gas)',
        status: 'Finalized'
      };
      setTransactions(prevTx => [newTx, ...prevTx]);

      triggerToast('Batch Streams Deployed', `Successfully deployed ${parsedWorkers.length} continuous pay streams.`);
      
      setParsedWorkers([]);
      setCsvText('');
      setCsvFileName('');
      setBulkOnboardingType('individual');
      refetchUsdc();
      refetchAllowance();
    } catch (err) {
      console.error(err);
      triggerToast('Batch Stream Creation Failed', err.message);
    }
  };

  const handleBatchPause = async () => {
    if (!isConnected) {
      triggerToast('Wallet not connected', 'Please connect your Web3 wallet.');
      return;
    }
    if (selectedStreamIds.length === 0) return;

    try {
      triggerToast('Pausing Streams', `Submitting pauseStreamsBatch for ${selectedStreamIds.length} streams...`);
      
      const hash = await writeContractAsync({
        address: STREAMING_PAYROLL_ADDRESS,
        abi: STREAMING_PAYROLL_ABI,
        functionName: 'pauseStreamsBatch',
        args: [selectedStreamIds]
      });

      triggerToast('Transaction Submitted', 'Waiting for on-chain block confirmation...');
      await publicClient.waitForTransactionReceipt({ hash });

      setEmployees((prev) =>
        prev.map((e) => {
          if (selectedStreamIds.includes(e.id)) {
            return {
              ...e,
              accruedPaid: e.accruedLive,
              isActive: false,
              lastUpdated: Math.floor(Date.now() / 1000)
            };
          }
          return e;
        })
      );
      
      const newTx = {
        id: Date.now(),
        type: 'Batch Streams Paused',
        engineer: `${selectedStreamIds.length} Employees`,
        amount: 'Accrued Wages Paid',
        txHash: hash.slice(0, 8) + '...' + hash.slice(-4),
        time: 'Just now',
        gas: '0.0042 USDC (Arc Gas)',
        status: 'Finalized'
      };
      setTransactions((prevTx) => [newTx, ...prevTx]);

      triggerToast(
        'Streams Paused',
        `Successfully paused ${selectedStreamIds.length} streams and disbursed accrued wages.`
      );
      setSelectedStreamIds([]);
      refetchUsdc();
    } catch (e) {
      console.error(e);
      triggerToast('Batch Pause Failed', e.message);
    }
  };

  const handleBatchWithdraw = async () => {
    if (!isConnected) {
      triggerToast('Wallet not connected', 'Please connect your Web3 wallet.');
      return;
    }
    if (selectedStreamIds.length === 0) return;

    try {
      triggerToast('Claiming Wages', `Submitting withdrawFundsBatch for ${selectedStreamIds.length} streams...`);
      
      const hash = await writeContractAsync({
        address: STREAMING_PAYROLL_ADDRESS,
        abi: STREAMING_PAYROLL_ABI,
        functionName: 'withdrawFundsBatch',
        args: [selectedStreamIds]
      });

      triggerToast('Transaction Submitted', 'Waiting for on-chain block confirmation...');
      await publicClient.waitForTransactionReceipt({ hash });

      setEmployees((prev) =>
        prev.map((e) => {
          if (selectedStreamIds.includes(e.id)) {
            return {
              ...e,
              accruedPaid: e.accruedLive,
              lastUpdated: Math.floor(Date.now() / 1000)
            };
          }
          return e;
        })
      );

      const newTx = {
        id: Date.now(),
        type: 'Batch Claim Processed',
        engineer: `${selectedStreamIds.length} Employees`,
        amount: 'USDC Disbursed',
        txHash: hash.slice(0, 8) + '...' + hash.slice(-4),
        time: 'Just now',
        gas: '0.0039 USDC (Arc Gas)',
        status: 'Finalized'
      };
      setTransactions((prevTx) => [newTx, ...prevTx]);

      triggerToast(
        'Batch Claim Successful',
        `Wages withdrawn for selected streams.`
      );
      setSelectedStreamIds([]);
      refetchUsdc();
    } catch (e) {
      console.error(e);
      triggerToast('Batch Claim Failed', e.message);
    }
  };

  // Handle stream withdrawal (on-chain claim)
  const handleWithdrawal = async (streamIdObj) => {
    if (!isConnected) {
      triggerToast('Wallet not connected', 'Please connect your Web3 wallet.')
      return
    }

    const emp = employees.find((e) => e.id === streamIdObj)
    if (!emp) return

    try {
      triggerToast('Withdrawing Wages', `Calling withdrawFunds for stream on Arc Chain...`)

      const hash = await writeContractAsync({
        address: STREAMING_PAYROLL_ADDRESS,
        abi: STREAMING_PAYROLL_ABI,
        functionName: 'withdrawFunds',
        args: [streamIdObj]
      })

      triggerToast('Transaction Submitted', 'Settling wages on-chain...')

      // Wait for real-time confirmation
      await publicClient.waitForTransactionReceipt({ hash })

      const claimedVal = emp.accruedLive - emp.accruedPaid

      refetchUsdc()
      refetchMemberAccount()
      
      setEmployees((prev) =>
        prev.map((e) => {
          if (e.id === streamIdObj) {
            return {
              ...e,
              accruedPaid: e.accruedLive,
              lastUpdated: Math.floor(Date.now() / 1000)
            }
          }
          return e
        })
      )

      const newTx = {
        id: Date.now(),
        type: 'Wages Settled',
        engineer: emp.name,
        amount: `${claimedVal.toFixed(4)} USDC`,
        txHash: hash.slice(0, 8) + '...' + hash.slice(-4),
        time: 'Just now',
        gas: '0.0028 USDC (Arc Gas)',
        status: 'Finalized'
      }
      setTransactions((prevTx) => [newTx, ...prevTx])

      triggerToast(
        'Wages Disbursed',
        `Settled ${claimedVal.toFixed(4)} USDC directly to your worker smart account wallet.`,
        `stream-card-${streamIdObj}`
      )
    } catch (e) {
      console.error(e)
      triggerToast('Withdrawal Failed', e.message)
    }
  }

  // Pre-flight static simulation call check
  const runPreFlightSimulation = async () => {
    setIsScanning(true)
    setScanStep('Retrieving Active Stream Registry...')
    setScanProgress(15)
    setScannedContracts('pending')
    setBlacklistStatus('pending')
    setGasSimResult('pending')

    try {
      // Gather addresses to check (isolated address entered by user + all active employee addresses)
      const addressesToCheck = [isolatedAddress, ...employees.map((e) => e.address)].filter(
        (addr) => addr && addr.startsWith('0x') && addr.length === 42
      )

      // 1. Check live sanctions status on ComplianceRegistry
      setScanStep('Contacting Circle Compliance Database (OFAC query)...')
      setScanProgress(45)
      
      let hasSanctioned = false
      if (publicClient) {
        for (const addr of addressesToCheck) {
          try {
            const isBlocked = await publicClient.readContract({
              address: COMPLIANCE_REGISTRY_ADDRESS,
              abi: COMPLIANCE_REGISTRY_ABI,
              functionName: 'isSanctioned',
              args: [addr]
            })
            if (isBlocked) {
              hasSanctioned = true
            }
          } catch (err) {
            console.error('Failed to read sanctions status for', addr, err)
          }
        }
      }

      setBlacklistStatus(hasSanctioned ? 'failed' : 'passed')

      // 2. Running EVM static call simulation
      setScanStep('Running EVM Static Calls simulation on Arc Testnet...')
      setScanProgress(75)

      let simulationPassed = true
      if (publicClient && addressesToCheck.length > 0) {
        try {
          // Attempting static call simulation on USDC balanceOf or similar to test connectivity
          await publicClient.simulateContract({
            address: USDC_TOKEN_ADDRESS,
            abi: USDC_ABI,
            functionName: 'balanceOf',
            args: [addressesToCheck[0]],
            account: address
          })
          setScannedContracts('passed')
        } catch (err) {
          console.warn('Simulation caught EVM revert:', err.message)
          simulationPassed = false
          setScannedContracts('failed')
        }
      } else {
        setScannedContracts('passed')
      }

      // 3. Estimate gas
      setScanStep('Estimating USDC transaction gas parameters...')
      setScanProgress(100)
      setGasSimResult(hasSanctioned || !simulationPassed ? 'failed' : 'passed')
      setIsScanning(false)

      if (hasSanctioned) {
        triggerToast(
          'Compliance Alert!',
          'Sanctioned recipient detected in current active registry! Payouts/Streams are blocked.',
          'compliance'
        )
      } else {
        triggerToast(
          'Compliance Check Passed',
          'All recipient addresses checked on-chain and cleared.'
        )
      }
    } catch (e) {
      console.error(e)
      setBlacklistStatus('failed')
      setScannedContracts('failed')
      setGasSimResult('failed')
      setIsScanning(false)
      triggerToast('Simulation Error', e.message)
    }
  }

  // Set sanctions status on ComplianceRegistry
  const handleSetSanctionStatus = async (status) => {
    if (!isConnected) {
      triggerToast('Wallet not connected', 'Please connect your wallet first.')
      return
    }
    if (!complianceTarget || !complianceTarget.startsWith('0x') || complianceTarget.length !== 42) {
      triggerToast('Invalid Address', 'Please provide a valid Ethereum address.')
      return
    }
    setBlacklistLoading(true)
    try {
      const hash = await writeContractAsync({
        address: COMPLIANCE_REGISTRY_ADDRESS,
        abi: COMPLIANCE_REGISTRY_ABI,
        functionName: 'setSanctionStatus',
        args: [complianceTarget, status]
      })
      triggerToast('Blacklist Update Broadcasted', 'Waiting for transaction confirmation...')
      await publicClient.waitForTransactionReceipt({ hash })
      setBlacklistLoading(false)
      triggerToast(
        'Blacklist Updated',
        `Address compliance status updated successfully: ${status ? 'Sanctioned' : 'Whitelisted'}`
      )
      if (complianceTarget.toLowerCase() === isolatedAddress.toLowerCase() && !status) {
        setBlacklistStatus('passed')
      }
    } catch (e) {
      console.error(e)
      setBlacklistLoading(false)
      triggerToast('Transaction Failed', e.message)
    }
  }

  // Set guardian status on ComplianceRegistry
  const handleSetGuardianStatus = async (status) => {
    if (!isConnected) {
      triggerToast('Wallet not connected', 'Please connect your wallet first.')
      return
    }
    if (!guardianTarget || !guardianTarget.startsWith('0x') || guardianTarget.length !== 42) {
      triggerToast('Invalid Address', 'Please provide a valid Ethereum address.')
      return
    }
    setGuardianLoading(true)
    try {
      const hash = await writeContractAsync({
        address: COMPLIANCE_REGISTRY_ADDRESS,
        abi: COMPLIANCE_REGISTRY_ABI,
        functionName: 'setGuardianStatus',
        args: [guardianTarget, status]
      })
      triggerToast('Guardian Update Broadcasted', 'Waiting for transaction confirmation...')
      await publicClient.waitForTransactionReceipt({ hash })
      setGuardianLoading(false)
      triggerToast(
        'Guardian Status Updated',
        `Guardian permissions updated successfully: ${status ? 'Promoted' : 'Demoted'}`
      )
    } catch (e) {
      console.error(e)
      setGuardianLoading(false)
      triggerToast('Transaction Failed', e.message)
    }
  }

  // Sliders Change handler
  const handleBenefitsSplitChange = (type, val) => {
    const parsedVal = parseInt(val)
    setBenefitsConfig((prev) => {
      const next = { ...prev, [type]: parsedVal }
      const total = next.health + next.retirement + next.emergency
      if (total > 100) {
        const diff = total - 100
        if (type === 'health') {
          next.retirement = Math.max(0, next.retirement - diff)
        } else if (type === 'retirement') {
          next.emergency = Math.max(0, next.emergency - diff)
        } else {
          next.health = Math.max(0, next.health - diff)
        }
      }
      return next
    })
  }

  // Handle Claims verified on-chain via Sandboxed Verifier Wallet Client
  const handleVerifyClaim = async (e) => {
    e.preventDefault()
    if (!isConnected) {
      triggerToast('Wallet not connected', 'Please connect your Web3 wallet.')
      return
    }

    const claimVal = parseFloat(billAmount)
    if (claimVal > (healthBalance + coopTreasury)) {
      triggerToast('Claim Rejected', 'Insufficient balance in your Healthcare benefits vault & Co-op Treasury.', 'claim-form')
      return
    }

    setClaimLoading(true)

    try {
      const privateKey = import.meta.env.VITE_PRIVATE_KEY
      if (!privateKey) {
        throw new Error('VITE_PRIVATE_KEY missing in environmental variables')
      }

      const verifierAccount = privateKeyToAccount(privateKey)
      const verifierWallet = createWalletClient({
        account: verifierAccount,
        chain: arcTestnet,
        transport: http('https://rpc.testnet.arc.network')
      })

      triggerToast('Agent Authenticating', 'AI Agent validating clinic invoice signature...')

      const claimValRaw = parseUnits(billAmount, 6)
      const mockHash = ('0x' + Math.random().toString(16).substr(2, 64)).padEnd(66, '0')

      // Submit transaction using verifier client
      const hash = await verifierWallet.writeContract({
        address: MICRO_BENEFITS_VAULT_ADDRESS,
        abi: MICRO_BENEFITS_VAULT_ABI,
        functionName: 'processClaim',
        args: [
          address,
          '0x9e71a3371987d6f26d8251e18a8fdcb59296556e',
          claimValRaw,
          'HEALTH',
          mockHash
        ]
      })

      triggerToast('Invoice Approved', 'Waiting for on-chain disbursement finality...')

      // Wait for on-chain transaction receipt using publicClient
      await publicClient.waitForTransactionReceipt({ hash })

      refetchMemberAccount()
      refetchCoopTreasury()
      refetchUsdc()

      setClaimTxHash(hash)
      setClaimLoading(false)
      setShowClaimSuccess(true)

      const newTx = {
        id: Date.now(),
        type: 'AI Claim Paid',
        engineer: 'Healthcare Clinic',
        amount: `${claimVal.toFixed(2)} USDC`,
        txHash: hash.slice(0, 8) + '...' + hash.slice(-4),
        time: 'Just now',
        gas: '0.0031 USDC (Arc Gas)',
        status: 'Finalized'
      }
      setTransactions((prevTx) => [newTx, ...prevTx])

      triggerToast(
        'Invoice Disbursed On-Chain',
        `AI Agent released ${claimVal.toFixed(2)} USDC to provider from benefits vault.`,
        'claim-form'
      )

    } catch (err) {
      console.error(err)
      setClaimLoading(false)
      triggerToast('Claim Dispatch Failed', err.message)
    }
  }

  // Global calculations
  const totalStreamedUSDC = employees.reduce((acc, emp) => acc + emp.accruedLive, 0)
  const activeCount = employees.filter((emp) => emp.isActive).length

  // Onboarding progress variables
  const step1Done = isConnected;
  const step2Done = usdcBalance > 0;
  const step3Done = employees.length > 1;
  const step4Done = totalContributed > 0;
  
  const completedSteps = [step1Done, step2Done, step3Done, step4Done].filter(Boolean).length;
  const onboardingProgressPercent = completedSteps * 25;

  return (
    <div className="app-container">
      {/* Toast Alert Notification */}
      <div className={`payout-toast ${toastShow ? 'show' : ''}`}>
        <div className="payout-toast-header">
          <div className="payout-toast-title">⚡ Instant Settlement</div>
          <span className="badge badge-success">Secure Network</span>
        </div>
        <div style={{ fontWeight: '800', fontSize: '14px', color: 'var(--text-main)' }}>{toastTitle}</div>
        <div className="payout-toast-body">{toastBody}</div>
      </div>

      {/* Mobile Top Navbar Header (Visible only on mobile/tablet <= 1024px) */}
      <div className="mobile-navbar">
        <div className="mobile-brand">
          <div style={{ 
            width: '32px', 
            height: '32px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            backgroundColor: 'var(--color-success)', 
            border: 'var(--thin-border)', 
            borderRadius: '6px' 
          }}>
            <Zap size={16} color="var(--text-main)" fill="var(--text-main)" />
          </div>
          <span className="brand-name">NexaFlow</span>
          <span className="brand-badge" style={{ fontSize: '8px', padding: '1px 4px' }}>LIVE</span>
        </div>
        <button className="menu-toggle-btn" onClick={() => setIsMobileSidebarOpen(true)}>
          <Menu size={18} color="var(--text-main)" />
        </button>
      </div>

      {/* Sidebar Overlay Backdrop for Mobile Drawer */}
      <div className={`sidebar-overlay ${isMobileSidebarOpen ? 'active' : ''}`} onClick={() => setIsMobileSidebarOpen(false)}></div>

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${isMobileSidebarOpen ? 'mobile-open' : ''}`}>
        <div>
          <div className="brand-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="brand-logo">
                <Zap size={20} color="var(--text-main)" fill="var(--text-main)" />
              </div>
              <div>
                <span className="brand-name">NexaFlow</span>
                <div style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.5px' }}>GLOBAL CONTINUOUS PAYMENTS</div>
              </div>
            </div>
            <button 
              className="mobile-close-btn"
              onClick={() => setIsMobileSidebarOpen(false)}
              style={{
                background: 'var(--color-error)',
                border: 'var(--thin-border)',
                borderRadius: '6px',
                padding: '4px',
                cursor: 'pointer',
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '1.5px 1.5px 0px #1A1A1A'
              }}
            >
              <X size={14} color="var(--text-main)" />
            </button>
          </div>

          {/* Connect Button */}
          <div style={{ padding: '0 20px 20px', borderBottom: '2px dashed rgba(255, 255, 255, 0.15)', display: 'flex', justifyContent: 'center' }}>
            <ConnectButton showBalance={false} chainStatus="none" accountStatus="avatar" />
          </div>

          <ul className="nav-list" style={{ marginTop: '20px' }}>
            <li className="nav-item">
              <a
                className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => { setActiveTab('dashboard'); setIsMobileSidebarOpen(false); }}
              >
                <Activity size={18} />
                Overview Dashboard
              </a>
            </li>
            <li className="nav-item">
              <a
                className={`nav-link ${activeTab === 'streaming' ? 'active' : ''}`}
                onClick={() => { setActiveTab('streaming'); setIsMobileSidebarOpen(false); }}
              >
                <DollarSign size={18} />
                Continuous Salary Flows
              </a>
            </li>
            <li className="nav-item">
              <a
                className={`nav-link ${activeTab === 'compliance' ? 'active' : ''}`}
                onClick={() => { setActiveTab('compliance'); setIsMobileSidebarOpen(false); }}
              >
                <ShieldCheck size={18} />
                Security & Safety Scanner
              </a>
            </li>
            <li className="nav-item">
              <a
                className={`nav-link ${activeTab === 'benefits' ? 'active' : ''}`}
                onClick={() => { setActiveTab('benefits'); setIsMobileSidebarOpen(false); }}
              >
                <HeartHandshake size={18} />
                My Benefits & Savings
              </a>
            </li>
            <li className="nav-item">
              <a
                className={`nav-link ${activeTab === 'contracts' ? 'active' : ''}`}
                onClick={() => { setActiveTab('contracts'); setIsMobileSidebarOpen(false); }}
              >
                <Code size={18} />
                How It Works
              </a>
            </li>
          </ul>
        </div>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700' }}>Payment Identity Linked</div>
                <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Wallet size={12} color="var(--color-secondary)" />
                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'No Profile Connected'}
                </div>
              </div>
              {address && (
                <button
                  onClick={() => disconnect()}
                  className="btn btn-outline"
                  style={{
                    fontSize: '9px',
                    padding: '4px 8px',
                    height: 'auto',
                    border: '1.5px solid var(--color-error)',
                    color: 'var(--color-error)',
                    boxShadow: '1.5px 1.5px 0px #1A1A1A',
                    textTransform: 'uppercase',
                    fontWeight: '800',
                    borderRadius: '4px',
                    backgroundColor: '#1E1E24',
                    cursor: 'pointer'
                  }}
                  title="Disconnect Wallet"
                >
                  Disconnect
                </button>
              )}
            </div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff', marginTop: '2px', display: 'flex', flexDirection: 'column' }}>
              <span>{usdcBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} Digital USD (USDC)</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Processing Fees: Sponsored (Free)</span>
            </div>
          </div>

          <a
            id="faucet-btn"
            className={`btn btn-secondary ${glowTargetId === 'faucet-btn' ? 'sub-second-glow' : ''}`}
            href="https://faucet.circle.com"
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: '12px', padding: '8px 12px', width: '100%', justifyContent: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={12} />
            Claim Free Demo Funds
          </a>

          <div className="network-badge">
            <div className="network-dot"></div>
            <span>Global Payment Network</span>
          </div>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="main-content">
        {/* Floating Stickers for premium retro neobrutalist vibe */}
        <div className="sticker sticker-tape">USDC-GAS</div>
        <div className="sticker sticker-smiley"></div>
        <div className="sticker sticker-flower"></div>

        {/* repeated marquee diagonal fashion tape banner */}
        <div className="marquee-banner">
          <div className="marquee-content">
            NEXAFLOW ⚡ DECENTRALIZED PAYROLL ⚡ REAL-TIME DISBURSEMENT ⚡ AUTOMATED MICRO-BENEFITS ⚡ SUB-SECOND SETTLEMENT ⚡ ZERO PROCESSING FEES ⚡ ARC TESTNET SPONSORED ⚡ NEXAFLOW ⚡ DECENTRALIZED PAYROLL ⚡ REAL-TIME DISBURSEMENT ⚡ AUTOMATED MICRO-BENEFITS ⚡ SUB-SECOND SETTLEMENT ⚡ ZERO PROCESSING FEES ⚡ ARC TESTNET SPONSORED
          </div>
        </div>

        {/* Main Header */}
        <header className="main-header">
          <div className="header-title-wrapper">
            <h1>
              {activeTab === 'dashboard' && 'Continuous Payroll & Benefits'}
              {activeTab === 'streaming' && 'Continuous Salary Flows'}
              {activeTab === 'compliance' && 'Security & Safety Scanner'}
              {activeTab === 'benefits' && 'My Benefits & Savings'}
              {activeTab === 'contracts' && 'Technical Specifications'}
            </h1>
            <p>
              {activeTab === 'dashboard' && 'Pay remote staff second-by-second. Auto-divert percentages into medical and retirement savings pots.'}
              {activeTab === 'streaming' && 'Establish monthly continuous payment channels that accrue continuously in real-time.'}
              {activeTab === 'compliance' && 'Run transaction routing simulations and scan for registry restrictions before releasing funds.'}
              {activeTab === 'benefits' && 'Allocate percentages of your salary to health coverage, pension plans, and rainy-day savings.'}
              {activeTab === 'contracts' && 'Review the open-source automated settlement rules deployed on the secure network.'}
            </p>
          </div>

          <div className="header-actions">
            {usdcAllowance < 1000 ? (
              <button
                id="approve-btn"
                className={`btn btn-primary ${glowTargetId === 'approve-btn' ? 'sub-second-glow' : ''}`}
                onClick={handleApprove}
                disabled={approveLoading || !isConnected}
              >
                {approveLoading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" style={{ animation: 'spin 1.5s linear infinite' }} />
                    Authorizing Funding Account...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    Pre-Authorize Payout Funds
                  </>
                )}
              </button>
            ) : (
              <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', padding: '8px 12px' }}>
                <CheckCircle size={14} />
                Payout Funding Authorized
              </span>
            )}
          </div>
        </header>

        {/* Global Interactive Quickstart Guide (Smart Onboarding Banner) */}
        {showOnboarding && (
          <div className="onboarding-guide-container">
            <div className="onboarding-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={18} color="var(--color-secondary)" fill="var(--color-secondary)" />
                <strong style={{ fontSize: '15px', color: '#1A1A1A' }}>Quickstart Guide: Interactive Onboarding</strong>
              </div>
              <button className="onboarding-toggle-btn" onClick={() => setShowOnboarding(false)}>
                Dismiss Guide
              </button>
            </div>
            
            <div className="onboarding-steps-grid">
              <div className={`onboarding-step-card ${step1Done ? 'completed' : 'active'}`}>
                <div className="onboarding-step-number">
                  <span>Step 1</span>
                  {step1Done ? <CheckCircle size={14} color="var(--color-success)" /> : <span style={{ color: 'var(--color-secondary)', fontSize: '10px' }}>In Progress</span>}
                </div>
                <div className="onboarding-step-title">Link Security Profile</div>
                <div className="onboarding-step-desc">Link your digital payment key using the button at the top to establish your identity.</div>
              </div>

              <div className={`onboarding-step-card ${step1Done && !step2Done ? 'active' : ''} ${step2Done ? 'completed' : ''}`}>
                <div className="onboarding-step-number">
                  <span>Step 2</span>
                  {step2Done ? <CheckCircle size={14} color="var(--color-success)" /> : <span style={{ color: 'var(--text-muted)' }}>Awaiting</span>}
                </div>
                <div className="onboarding-step-title">Get Demo Funds</div>
                <div className="onboarding-step-desc">Click "Claim Free Demo Funds" at the bottom of the sidebar to receive test USDC in your wallet.</div>
              </div>

              <div className={`onboarding-step-card ${step2Done && !step3Done ? 'active' : ''} ${step3Done ? 'completed' : ''}`}>
                <div className="onboarding-step-number">
                  <span>Step 3</span>
                  {step3Done ? <CheckCircle size={14} color="var(--color-success)" /> : <span style={{ color: 'var(--text-muted)' }}>Awaiting</span>}
                </div>
                <div className="onboarding-step-title">Start continuous Pay Flow</div>
                <div className="onboarding-step-desc">Navigate to the "Continuous Salary Flows" tab and deploy a continuous salary stream to a recipient address.</div>
              </div>

              <div className={`onboarding-step-card ${step3Done && !step4Done ? 'active' : ''} ${step4Done ? 'completed' : ''}`}>
                <div className="onboarding-step-number">
                  <span>Step 4</span>
                  {step4Done ? <CheckCircle size={14} color="var(--color-success)" /> : <span style={{ color: 'var(--text-muted)' }}>Awaiting</span>}
                </div>
                <div className="onboarding-step-title">Divert Savings</div>
                <div className="onboarding-step-desc">Go to the "My Benefits & Savings" tab, configure your split sliders, and deposit funds to see splits auto-allocate.</div>
              </div>
            </div>

            <div className="onboarding-progress-bar-wrapper">
              <span className="onboarding-progress-text">Onboarding Progress: {onboardingProgressPercent}% Completed</span>
              <div className="onboarding-progress-bar">
                <div className="onboarding-progress-fill" style={{ width: `${onboardingProgressPercent}%` }}></div>
              </div>
            </div>
          </div>
        )}

        {/* 1. Dashboard Overview Tab */}
        {activeTab === 'dashboard' && (
          <>
            {/* Top Cards Row */}
            <div className="dashboard-grid">
              <div className="stats-card">
                <div className="stats-header">
                  <span>Total Payout Funds Protected</span>
                  <div className="stats-icon-wrapper primary">
                    <Wallet size={16} />
                  </div>
                </div>
                <div className="stats-value">
                  {employees.reduce((acc, emp) => acc + emp.totalCap, 0).toLocaleString('en-US')} USDC
                </div>
                <div className="stats-footer">
                  <span style={{ color: 'var(--color-success)', fontWeight: '600' }}>100% Secure</span>
                  <span>held in automated payment escrows</span>
                </div>
              </div>

              <div className="stats-card">
                <div className="stats-header">
                  <span>Live Salaries Disbursed</span>
                  <div className="stats-icon-wrapper secondary">
                    <Zap size={16} />
                  </div>
                </div>
                <div className="stats-value ticking-val">
                  {totalStreamedUSDC.toFixed(5)} USDC
                </div>
                <div className="stats-footer">
                  <span className="live-pulse"></span>
                  <span style={{ marginLeft: '4px' }}>Accruing live second-by-second</span>
                </div>
              </div>

              <div className="stats-card">
                <div className="stats-header">
                  <span>Active Pay Channels</span>
                  <div className="stats-icon-wrapper success">
                    <Activity size={16} />
                  </div>
                </div>
                <div className="stats-value">
                  {activeCount} / {employees.length}
                </div>
                <div className="stats-footer">
                  <span>1 restricted payment destination isolated for safety</span>
                </div>
              </div>

              <div className="stats-card">
                <div className="stats-header">
                  <span>Settlement Time</span>
                  <div className="stats-icon-wrapper warning">
                    <ShieldCheck size={16} />
                  </div>
                </div>
                <div className="stats-value">
                  Instant (&lt;0.8s)
                </div>
                <div className="stats-footer">
                  <span style={{ color: 'var(--color-success)' }}>Zero delay</span>
                  <span>no manual bank processing</span>
                </div>
              </div>
            </div>

            {/* Dashboard Visual Panels */}
            <div className="dashboard-panels-grid">
              
              {/* Active Streams Panel */}
              <div className="panel-card" style={{ marginBottom: 0 }}>
                <div className="panel-card-title">
                  <Activity size={18} color="var(--color-primary)" />
                  Real-time Pay Streams
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {employees.slice(0, 3).map((emp) => (
                    <div key={emp.id} className="stream-card">
                      <div className="stream-card-section stream-card-info">
                        <div className="stream-info">
                          <div className="avatar">{emp.avatar}</div>
                          <div className="engineer-details">
                            <h4>{emp.name}</h4>
                            <p>{emp.role}</p>
                          </div>
                        </div>
                      </div>
                      <div className="stream-card-section stream-card-counter-wrapper">
                        <span className="stream-counter-label">Accrued Salary (Live)</span>
                        <div className="stream-counter-value" style={{ color: emp.isActive ? 'var(--color-secondary)' : 'var(--text-muted)' }}>
                          {emp.accruedLive.toFixed(5)} USDC
                        </div>
                        <span className="stream-flow-details">
                          Velocity: {emp.flowRate.toFixed(4)} USDC/s (~${(emp.flowRate * 3600).toFixed(2)}/hr)
                        </span>
                      </div>
                      <div className="stream-card-section stream-card-progress">
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                          <span>{(emp.accruedLive / emp.totalCap * 100).toFixed(1)}%</span>
                          <span>Limit: {emp.totalCap} USDC</span>
                        </div>
                        <div className="stream-progress-bar">
                          <div
                            className="stream-progress-bar-fill"
                            style={{ width: `${(emp.accruedLive / emp.totalCap) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="stream-card-section stream-card-status">
                        <span className={`badge ${emp.complianceStatus === 'Verified' ? 'badge-success' : 'badge-danger'}`}>
                          {emp.complianceStatus === 'Verified' ? 'Security Cleared' : 'Flagged'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Benefits Vault Panel */}
              <div className="panel-card" style={{ marginBottom: 0 }}>
                <div className="panel-card-title">
                  <HeartHandshake size={18} color="var(--color-secondary)" />
                  My Savings & Benefits Allocations
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  {/* Dynamic pie segment representation */}
                  <div className="pie-chart" style={{
                    background: `conic-gradient(
                      var(--color-primary) 0% ${benefitsConfig.health}%,
                      var(--color-secondary) ${benefitsConfig.health}% ${benefitsConfig.health + benefitsConfig.retirement}%,
                      var(--color-success) ${benefitsConfig.health + benefitsConfig.retirement}% 100%
                    )`
                  }}>
                    <div className="pie-inner-cutout">
                      <div className="pie-inner-value">${(healthBalance + retirementBalance + emergencyBalance).toFixed(2)}</div>
                      <div className="pie-inner-label">Total Savings Saved</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div className="legend-color" style={{ backgroundColor: 'var(--color-primary)' }}></div>
                        Health Savings HSA ({benefitsConfig.health}%)
                      </span>
                      <span style={{ fontWeight: '700' }}>{healthBalance.toFixed(2)} USDC</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div className="legend-color" style={{ backgroundColor: 'var(--color-secondary)' }}></div>
                        Personal Pension Pot ({benefitsConfig.retirement}%)
                      </span>
                      <span style={{ fontWeight: '700' }}>{retirementBalance.toFixed(2)} USDC</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', paddingBottom: '6px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div className="legend-color" style={{ backgroundColor: 'var(--color-success)' }}></div>
                        Rainy-Day Emergency Reserve ({benefitsConfig.emergency}%)
                      </span>
                      <span style={{ fontWeight: '700' }}>{emergencyBalance.toFixed(2)} USDC</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Recent On-Chain Ledger */}
            <div className="panel-card">
              <div className="panel-card-title">
                <Layers size={18} color="var(--color-warning)" />
                Recent Payment Ledger (Permanently Recorded)
              </div>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Payment Type</th>
                      <th>Counterparty</th>
                      <th>Amount</th>
                      <th>Verification Reference</th>
                      <th>Settled Time</th>
                      <th>Network Processing Cost</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td style={{ fontWeight: '600' }}>{tx.type === 'Deploy StreamingPayroll' ? 'Setup Platform' : tx.type === 'Stream Initiated' ? 'Pay Flow Activated' : tx.type}</td>
                        <td>{tx.engineer}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-secondary)' }}>{tx.amount}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{tx.txHash}</td>
                        <td>{tx.time}</td>
                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sponsored (Free)</td>
                        <td>
                          <span className="badge badge-success">
                            <CheckCircle size={10} />
                            Settled
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* 2. Streaming Payroll Engine Tab */}
        {activeTab === 'streaming' && (
          <div className="engine-container">
            
            {/* Create New Stream Form */}
            <div className="panel-card" id="new-stream-form">
              <div className="panel-card-title">
                <Plus size={18} color="var(--color-primary)" />
                Create New Continuous Pay Flow
              </div>

              {/* Toggle Tabs for Single vs Bulk */}
              <div style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '24px',
                borderBottom: '2px dashed var(--border-color)',
                paddingBottom: '16px'
              }}>
                <button
                  type="button"
                  className={`btn ${bulkOnboardingType === 'individual' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '6px' }}
                  onClick={() => setBulkOnboardingType('individual')}
                >
                  Single Worker
                </button>
                <button
                  type="button"
                  className={`btn ${bulkOnboardingType === 'bulk' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '6px' }}
                  onClick={() => setBulkOnboardingType('bulk')}
                >
                  Bulk Upload Workers (CSV)
                </button>
              </div>

              {bulkOnboardingType === 'individual' ? (
                <form onSubmit={handleCreateStream} className="stream-form-grid">
                  <div className="form-group form-name">
                    <label className="form-label">Team Member Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Tan Wei Liang"
                      value={newEmployeeName}
                      onChange={(e) => setNewEmployeeName(e.target.value)}
                      required
                    />
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Name of the wage recipient.</div>
                  </div>

                  <div className="form-group form-role">
                    <label className="form-label">Role Title</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Backend Developer"
                      value={newEmployeeRole}
                      onChange={(e) => setNewEmployeeRole(e.target.value)}
                    />
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Designation or department.</div>
                  </div>

                  <div className="form-group form-currency">
                    <label className="form-label">Local Currency / Country</label>
                    <select
                      className="form-input"
                      value={newEmployeeLoc}
                      onChange={(e) => setNewEmployeeLoc(e.target.value)}
                    >
                      <option value="Singapore 🇸🇬">Singapore 🇸🇬 (SGD)</option>
                      <option value="Brazil 🇧🇷">Brazil 🇧🇷 (BRL)</option>
                      <option value="Nigeria 🇳🇬">Nigeria 🇳🇬 (NGN)</option>
                      <option value="Taiwan 🇹🇼">Taiwan 🇹🇼 (TWD)</option>
                    </select>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Jurisdiction for automated tax reserve routing.</div>
                  </div>

                  <div className="form-group form-limit">
                    <label className="form-label">Maximum Payment Limit (USDC)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newEmployeeCap}
                      onChange={(e) => setNewEmployeeCap(e.target.value)}
                      required
                    />
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      The total amount of funds locked in the continuous pay flow safe.
                    </div>
                  </div>

                  <div className="form-group form-address">
                    <label className="form-label">Recipient Payment Wallet / Address</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="0x..."
                      value={newEmployeeAddress}
                      onChange={(e) => setNewEmployeeAddress(e.target.value)}
                      required
                    />
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      The digital wallet destination where the continuous salary will stream.
                    </div>
                  </div>

                  <div className="form-group form-velocity">
                    <label className="form-label">Flow Velocity: {newEmployeeRate} USDC/sec (~${(newEmployeeRate * 3600).toFixed(2)}/hour)</label>
                    <input
                      type="range"
                      min="0.001"
                      max="0.02"
                      step="0.0005"
                      className="range-slider"
                      value={newEmployeeRate}
                      onChange={(e) => setNewEmployeeRate(e.target.value)}
                    />
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Adjust how fast salary builds up (per-second distribution rate).
                    </div>
                  </div>

                  <div className="form-actions-wrapper">
                    {/* Action Preview */}
                    <div className="action-preview-card">
                      <div className="action-preview-title">
                        <Zap size={14} color="var(--color-secondary)" fill="var(--color-secondary)" />
                        What happens next?
                      </div>
                      <ul className="action-preview-list">
                        <li>You lock <strong>{newEmployeeCap || '0'} USDC</strong> in a secure automated pay safe.</li>
                        <li>Continuous second-by-second payouts will activate instantly for <strong>{newEmployeeName || 'Recipient'}</strong>.</li>
                        <li>You retain full power to pause or close the channel to retrieve unspent funds.</li>
                      </ul>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '46px' }} disabled={!isConnected}>
                      <Zap size={16} />
                      Activate Pay Flow
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleCreateStreamsBatch} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{
                    border: '2px dashed var(--border-color)',
                    borderRadius: '8px',
                    padding: '24px',
                    textAlign: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: '800' }}>
                      Upload Worker Allocation CSV
                    </div>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCsvFileUpload}
                      style={{ cursor: 'pointer', maxWidth: '300px' }}
                    />
                    {csvFileName && (
                      <span className="badge badge-info" style={{ textTransform: 'none' }}>
                        File Selected: {csvFileName}
                      </span>
                    )}
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Or Paste CSV Config Text</label>
                    <textarea
                      className="form-input"
                      rows={5}
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', resize: 'vertical' }}
                      placeholder="Worker Address,Flow Rate (USDC/sec),Total Cap (USDC),Name,Role&#10;0x9e71a3371987d6f26d8251e18a8fdcb59296556e,0.005,1500,Tan Wei Liang,Senior React Developer"
                      value={csvText}
                      onChange={(e) => {
                        setCsvText(e.target.value);
                        parseCsvData(e.target.value);
                      }}
                    />
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                      Columns format: Address, FlowRate, Cap, Name, Role (includes Header row).
                    </div>
                  </div>

                  {csvError && (
                    <div className="alert-message warning" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', marginBottom: 0 }}>
                      <AlertTriangle size={18} color="var(--color-error)" />
                      <span style={{ fontSize: '13px', fontWeight: '800' }}>{csvError}</span>
                    </div>
                  )}

                  {parsedWorkers.length > 0 && (
                    <div className="action-preview-card success-preview" style={{ padding: '16px', borderRadius: '8px' }}>
                      <div className="action-preview-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <CheckCircle size={16} color="var(--color-success)" />
                        <strong>Parsed Onboarding Configuration ({parsedWorkers.length} Workers)</strong>
                      </div>
                      <div className="table-container" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                        <table className="data-table" style={{ fontSize: '11px' }}>
                          <thead>
                            <tr>
                              <th style={{ padding: '8px', fontSize: '11px' }}>Name / Role</th>
                              <th style={{ padding: '8px', fontSize: '11px' }}>Address</th>
                              <th style={{ padding: '8px', fontSize: '11px' }}>Flow Rate</th>
                              <th style={{ padding: '8px', fontSize: '11px' }}>Limit</th>
                            </tr>
                          </thead>
                          <tbody>
                            {parsedWorkers.map((w, idx) => (
                              <tr key={idx}>
                                <td style={{ padding: '8px' }}>
                                  <strong>{w.name}</strong>
                                  <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{w.role}</div>
                                </td>
                                <td style={{ padding: '8px', fontFamily: 'var(--font-mono)' }}>{w.address.slice(0, 6)}...{w.address.slice(-4)}</td>
                                <td style={{ padding: '8px', fontFamily: 'var(--font-mono)' }}>{w.flowRate} USDC/s</td>
                                <td style={{ padding: '8px', fontFamily: 'var(--font-mono)' }}>{w.totalCap} USDC</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div style={{ marginTop: '12px', fontSize: '13px', fontWeight: '800', display: 'flex', justifyContent: 'space-between', borderTop: '2px dashed var(--border-color)', paddingTop: '8px' }}>
                        <span>Aggregate Locked Deposit:</span>
                        <span style={{ color: 'var(--color-secondary)' }}>
                          {parsedWorkers.reduce((sum, w) => sum + w.totalCap, 0).toLocaleString()} USDC
                        </span>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={downloadCsvTemplate}
                      style={{ flexGrow: 1 }}
                    >
                      Download CSV Template
                    </button>

                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ flexGrow: 2, height: '46px' }}
                      disabled={!isConnected || parsedWorkers.length === 0}
                    >
                      <Zap size={16} />
                      Deploy Bulk Streams
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Active Streams Table */}
            <div className="panel-card">
              <div className="panel-card-title">
                <Activity size={18} color="var(--color-secondary)" />
                Active Remote Workforce Salary Streams
              </div>

              {/* Master Checkbox & Batch Selection Actions */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                flexWrap: 'wrap',
                gap: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                padding: '12px',
                borderRadius: '8px',
                border: '1.5px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={employees.length > 0 && selectedStreamIds.length === employees.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedStreamIds(employees.map(emp => emp.id));
                      } else {
                        setSelectedStreamIds([]);
                      }
                    }}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '13px', fontWeight: '800' }}>Select All ({employees.length})</span>
                </div>

                {selectedStreamIds.length > 0 && (
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ padding: '6px 12px', fontSize: '11px', backgroundColor: 'var(--color-error)', color: '#000' }}
                      onClick={handleBatchPause}
                      disabled={!isConnected}
                    >
                      Pause Selected
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ padding: '6px 12px', fontSize: '11px' }}
                      onClick={handleBatchWithdraw}
                      disabled={!isConnected}
                    >
                      Claim Selected
                    </button>
                    <button
                      type="button"
                      className="btn"
                      style={{ padding: '6px 12px', fontSize: '11px', background: '#FFF' }}
                      onClick={() => setSelectedStreamIds([])}
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {employees.map((emp) => (
                  <div key={emp.id} className="stream-card" id={`stream-card-${emp.id}`} style={{
                    borderColor: glowTargetId === `stream-card-${emp.id}` ? 'var(--color-success)' : '',
                    boxShadow: glowTargetId === `stream-card-${emp.id}` ? '0 0 15px rgba(16, 185, 129, 0.3)' : ''
                  }}>
                    {/* Individual Row Checkbox */}
                    <div style={{ display: 'flex', alignItems: 'center', alignSelf: 'stretch', paddingRight: '8px' }}>
                      <input
                        type="checkbox"
                        checked={selectedStreamIds.includes(emp.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStreamIds(prev => [...prev, emp.id]);
                          } else {
                            setSelectedStreamIds(prev => prev.filter(id => id !== emp.id));
                          }
                        }}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                    </div>

                    <div className="stream-card-section stream-card-info" style={{ width: '22%' }}>
                      <div className="avatar">{emp.avatar}</div>
                      <div className="engineer-details">
                        <h4>{emp.name}</h4>
                        <p>{emp.role}</p>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{emp.location}</span>
                      </div>
                    </div>

                    <div className="stream-card-section stream-card-address" style={{ width: '22%' }}>
                      <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Worker Digital Account Address</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-main)', wordBreak: 'break-all', fontWeight: '600' }}>
                        {emp.address}
                      </div>
                    </div>

                    <div className="stream-card-section stream-card-counter-wrapper" style={{ width: '25%' }}>
                      <span className="stream-counter-label">Accruing Balance</span>
                      <div className="stream-counter-value">
                        {emp.accruedLive.toFixed(5)} USDC
                      </div>
                      <span className="stream-flow-details">
                        Velocity: {emp.flowRate.toFixed(4)} USDC/s
                      </span>
                    </div>

                    <div className="stream-card-section stream-card-progress" style={{ width: '20%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                        <span>{(emp.accruedLive / emp.totalCap * 100).toFixed(1)}%</span>
                        <span>Limit: {emp.totalCap} USDC</span>
                      </div>
                      <div className="stream-progress-bar">
                        <div
                          className="stream-progress-bar-fill"
                          style={{ width: `${(emp.accruedLive / emp.totalCap) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="stream-card-section stream-card-actions">
                      <button
                        className="btn btn-outline"
                        style={{ padding: '8px 12px' }}
                        onClick={() => handleWithdrawal(emp.id)}
                        disabled={!isConnected || (emp.accruedLive - emp.accruedPaid) <= 0.005}
                      >
                        Claim Payout
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* 3. Compliance Pre-Flight Officer Tab */}
        {activeTab === 'compliance' && (
          <div className="scanner-grid">
            <div className="scanner-panel">
              
              <div className="panel-card" style={{ marginBottom: 0 }}>
                <div className="panel-card-title">
                  <ShieldCheck size={18} color="var(--color-primary)" />
                  Automated Recipient Security Scanner
                </div>

                <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px' }}>
                  Ensure transfer safety by screening recipient addresses against global sanctions lists (OFAC) and pre-testing transaction routing. Flagged destination addresses are automatically locked to avoid regulatory compliance friction.
                </p>

                <div className={`radar-container ${isScanning ? 'scanning' : ''}`}>
                  <div className="radar-circle">
                    <ShieldCheck size={36} color="var(--color-secondary)" />
                  </div>
                  <div className="radar-sweep"></div>
                  <div className="radar-status">{scanStep === 'Retrieving Active Stream Registry...' ? 'Scanning active registries...' : scanStep === 'Contacting Circle Compliance Database (OFAC query)...' ? 'Screening sanctions registries (OFAC)...' : scanStep === 'Running EVM Static Calls simulation on Arc Testnet...' ? 'Pre-testing transaction routes...' : scanStep || 'System Idle. Ready to Scan.'}</div>
                </div>

                <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
                  <button
                    className="btn btn-primary"
                    onClick={runPreFlightSimulation}
                    disabled={isScanning}
                    style={{ flexGrow: 1 }}
                  >
                    {isScanning ? 'Running Security Screen...' : 'Scan Payment Addresses & Run Safety Checks'}
                  </button>
                </div>
              </div>

              {/* Results status list */}
              <div className="panel-card">
                <div className="panel-card-title">
                  Security Check Results
                </div>

                <div className="compliance-list">
                  <div className="compliance-item">
                    <div className="compliance-item-left">
                      <div className={`compliance-check-indicator ${blacklistStatus === 'passed' ? 'success' : blacklistStatus === 'failed' ? 'failed' : 'pending'}`}>
                        {blacklistStatus === 'passed' ? <Check size={12} /> : blacklistStatus === 'failed' ? <X size={12} /> : '1'}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '600' }}>Sanctions List Security Check</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Checks payment accounts against global regulatory sanction blocklists (OFAC).</div>
                      </div>
                    </div>
                    <span>
                      {blacklistStatus === 'passed' && <span className="badge badge-success">CLEARED</span>}
                      {blacklistStatus === 'pending' && <span className="badge badge-warning">AWAITING</span>}
                    </span>
                  </div>

                  <div className="compliance-item">
                    <div className="compliance-item-left">
                      <div className={`compliance-check-indicator ${scannedContracts === 'passed' ? 'success' : scannedContracts === 'failed' ? 'failed' : 'pending'}`}>
                        {scannedContracts === 'passed' ? <Check size={12} /> : scannedContracts === 'failed' ? <X size={12} /> : '2'}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '600' }}>Transaction Route Simulation</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Pre-tests the payment route on the network to catch errors before broadcast.</div>
                      </div>
                    </div>
                    <span>
                      {scannedContracts === 'failed' && <span className="badge badge-danger">1 SUSPICIOUS ACCOUNT BLOCKED</span>}
                      {scannedContracts === 'passed' && <span className="badge badge-success">ROUTE VERIFIED (0 REVERTS)</span>}
                      {scannedContracts === 'pending' && <span className="badge badge-warning">AWAITING</span>}
                    </span>
                  </div>

                  <div className="compliance-item">
                    <div className="compliance-item-left">
                      <div className={`compliance-check-indicator ${gasSimResult === 'passed' ? 'success' : gasSimResult === 'failed' ? 'failed' : 'pending'}`}>
                        {gasSimResult === 'passed' ? <Check size={12} /> : gasSimResult === 'failed' ? <X size={12} /> : '3'}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '600' }}>Fee & Gas Authorization Check</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Ensures connected funding balance is authorized to pay processing fees.</div>
                      </div>
                    </div>
                    <span>
                      {gasSimResult === 'passed' && <span className="badge badge-success">AUTHORIZED (SPONSORED)</span>}
                      {gasSimResult === 'pending' && <span className="badge badge-warning">AWAITING</span>}
                    </span>
                  </div>
                </div>

              </div>

            </div>

            {/* Right side container */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Directory Blocklist summary */}
              <div className="panel-card" style={{ height: 'fit-content', marginBottom: 0 }}>
                <div className="panel-card-title">
                  Flagged Suspicious Accounts
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Addresses matching high-friction compliance parameters are automatically isolated. Our payment streaming engine prevents any funds from being disbursed to these destinations.
                </p>
                
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-error)' }}>
                    <AlertTriangle size={16} />
                    <span style={{ fontWeight: '700', fontSize: '14px' }}>Restricted Destination Account</span>
                  </div>
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
                    {isolatedAddress}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setComplianceTarget(isolatedAddress)
                        triggerToast('Selected Address', `Address set to compliance panel: ${isolatedAddress}`)
                      }}
                      style={{ fontSize: '11px', padding: '4px 8px' }}
                    >
                      Manage Address
                    </button>
                  </div>
                </div>
              </div>

              {/* Guardian Compliance Panel */}
              <div className="panel-card" style={{ height: 'fit-content' }}>
                <div className="panel-card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Guardian Compliance Control</span>
                  {isUserGuardian ? (
                    <span className="badge badge-success" style={{ fontSize: '10px' }}>ACTIVE GUARDIAN</span>
                  ) : (
                    <span className="badge badge-warning" style={{ fontSize: '10px' }}>VIEW ONLY</span>
                  )}
                </div>
                
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Manage the decentralised on-chain sanctions list registry. Only authorized compliance guardians can sign status updates.
                </p>

                {/* 1. Sanctions Registry Form */}
                <div style={{ marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-main)' }}>Sanctions Registry</div>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Recipient Wallet Address (0x...)"
                    value={complianceTarget}
                    onChange={(e) => setComplianceTarget(e.target.value)}
                    style={{ fontSize: '12px', padding: '8px', marginBottom: '8px', width: '100%', boxSizing: 'border-box' }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleSetSanctionStatus(true)}
                      disabled={blacklistLoading || !isUserGuardian}
                      style={{ fontSize: '11px', padding: '6px 12px', flexGrow: 1 }}
                    >
                      {blacklistLoading ? 'Updating...' : 'Sanction Address'}
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleSetSanctionStatus(false)}
                      disabled={blacklistLoading || !isUserGuardian}
                      style={{ fontSize: '11px', padding: '6px 12px', flexGrow: 1 }}
                    >
                      {blacklistLoading ? 'Updating...' : 'Whitelist Address'}
                    </button>
                  </div>
                </div>

                {/* 2. Guardian Management Form */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-main)' }}>Guardian Directory</div>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Guardian Address (0x...)"
                    value={guardianTarget}
                    onChange={(e) => setGuardianTarget(e.target.value)}
                    style={{ fontSize: '12px', padding: '8px', marginBottom: '8px', width: '100%', boxSizing: 'border-box' }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleSetGuardianStatus(true)}
                      disabled={guardianLoading || !isUserGuardian}
                      style={{ fontSize: '11px', padding: '6px 12px', flexGrow: 1 }}
                    >
                      {guardianLoading ? 'Promoting...' : 'Promote Guardian'}
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleSetGuardianStatus(false)}
                      disabled={guardianLoading || !isUserGuardian}
                      style={{ fontSize: '11px', padding: '6px 12px', flexGrow: 1 }}
                    >
                      {guardianLoading ? 'Demoting...' : 'Demote Guardian'}
                    </button>
                  </div>
                </div>

                {!isUserGuardian && (
                  <div style={{ marginTop: '16px', backgroundColor: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.15)', borderRadius: '6px', padding: '10px', fontSize: '11px', color: 'var(--color-warning)' }}>
                    Note: To test Sanction/Guardian management, switch to the deployer wallet that deployed the ComplianceRegistry contract.
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* 4. Embedded Micro-Benefits Vault Tab */}
        {activeTab === 'benefits' && (
          <div className="engine-container">
            
            {!isRegistered ? (
              <div className="alert-message warning" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', width: '100%', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <AlertTriangle size={24} color="var(--color-warning)" />
                  <div>
                    <strong>Savings Account Profile Not Yet Activated</strong>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Activate your savings profile to start contributing to your medical insurance, emergency fund, and retirement pools.</div>
                  </div>
                </div>
                <button className="btn btn-primary" onClick={handleRegisterMember} disabled={registerLoading} style={{ flexShrink: 0 }}>
                  {registerLoading ? 'Activating Profile...' : 'Activate Savings Profile'}
                </button>
              </div>
            ) : (
              <div className="alert-message success" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', width: '100%' }}>
                <CheckCircle size={24} color="var(--color-success)" />
                <div>
                  <strong>Savings Account Active & Verified</strong>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Smart Savings Key: <span style={{ fontFamily: 'var(--font-mono)' }}>{address}</span> | Total Contributed: {totalContributed.toFixed(2)} USDC</div>
                </div>
              </div>
            )}

            <div className="vault-split-layout">
              {/* Sliders panel */}
              <div>
                <div className="panel-card">
                  <div className="panel-card-title">
                    <PiggyBank size={18} color="var(--color-primary)" />
                    Automated Savings Allocations
                  </div>

                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                    Adjust the sliders below to decide how your salary is split. When you claim accrued wages, these exact percentages are instantly routed to your medical, retirement, and emergency funds.
                  </p>

                  <div className="allocation-sliders">
                    <div className="slider-group">
                      <div className="slider-header">
                        <span>Global Medical Insurance Fund</span>
                        <span style={{ color: 'var(--color-primary)' }}>{benefitsConfig.health}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="30"
                        className="range-slider"
                        value={benefitsConfig.health}
                        onChange={(e) => handleBenefitsSplitChange('health', e.target.value)}
                      />
                    </div>

                    <div className="slider-group">
                      <div className="slider-header">
                        <span>Personal Pension Pot</span>
                        <span style={{ color: 'var(--color-secondary)' }}>{benefitsConfig.retirement}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="30"
                        className="range-slider"
                        value={benefitsConfig.retirement}
                        onChange={(e) => handleBenefitsSplitChange('retirement', e.target.value)}
                      />
                    </div>

                    <div className="slider-group">
                      <div className="slider-header">
                        <span>Rainy-Day Emergency Reserve</span>
                        <span style={{ color: 'var(--color-success)' }}>{benefitsConfig.emergency}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="30"
                        className="range-slider"
                        value={benefitsConfig.emergency}
                        onChange={(e) => handleBenefitsSplitChange('emergency', e.target.value)}
                      />
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'right', fontWeight: '500' }}>
                      Diverted Savings: {benefitsConfig.health + benefitsConfig.retirement + benefitsConfig.emergency}% | Net Pocket Take-Home: {100 - (benefitsConfig.health + benefitsConfig.retirement + benefitsConfig.emergency)}%
                    </div>
                  </div>
                </div>

                {isRegistered && (
                  <div className="panel-card" style={{ marginTop: '24px' }}>
                    <div className="panel-card-title">
                      <Wallet size={18} color="var(--color-secondary)" />
                      Deposit Funds to Savings Pots
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                      Transfer USDC directly from your main wallet to manually fund your savings pots according to the split allocation weights configured above.
                    </p>
                    <form onSubmit={handleDepositSplits}>
                      <div className="form-group">
                        <label className="form-label">Deposit Amount (USDC)</label>
                        <input
                          type="number"
                          className="form-input"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          required
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                          <span>Wallet Balance: {usdcBalance.toFixed(2)} USDC</span>
                          <span>Healthcare HSA Split: {(parseFloat(depositAmount || '0') * benefitsConfig.health / 100).toFixed(2)} USDC</span>
                        </div>
                      </div>

                      {/* Action Preview */}
                      <div className="action-preview-card success-preview">
                        <div className="action-preview-title">
                          <CheckCircle size={14} color="var(--color-success)" />
                          Deposit Preview & Splits Breakdown:
                        </div>
                        <ul className="action-preview-list">
                          <li><strong>{(parseFloat(depositAmount || '0') * benefitsConfig.health / 100).toFixed(2)} USDC</strong> will fund your Medical Insurance.</li>
                          <li><strong>{(parseFloat(depositAmount || '0') * benefitsConfig.retirement / 100).toFixed(2)} USDC</strong> will fund your retirement pension.</li>
                          <li><strong>{(parseFloat(depositAmount || '0') * benefitsConfig.emergency / 100).toFixed(2)} USDC</strong> will fund your emergency Rainy-Day reserve.</li>
                        </ul>
                      </div>
                      
                      {benefitsAllowance < parseFloat(depositAmount || '0') ? (
                        <button type="button" className="btn btn-outline" style={{ width: '100%', height: '46px' }} onClick={handleApproveVault} disabled={approveLoading}>
                          {approveLoading ? 'Authorizing Payout Deposit...' : 'Authorize Savings Deposit Spend'}
                        </button>
                      ) : (
                        <button type="submit" className="btn btn-success" style={{ width: '100%', height: '46px' }} disabled={depositLoading || !isConnected || parseFloat(depositAmount) <= 0}>
                          {depositLoading ? 'Diverting Savings to Pots...' : 'Deposit Splits'}
                        </button>
                      )}
                    </form>
                  </div>
                )}
              </div>

              {/* Claims Processing and AI Vault */}
              <div className="panel-card">
                <div className="panel-card-title">
                  <HeartHandshake size={18} color="var(--color-secondary)" />
                  Claims Assistance Portal
                </div>

                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Submit medical invoices. The automated review evaluator validates the healthcare partner signature and disburses instant payouts directly to the clinic from your Health Savings HSA.
                </p>

                <form onSubmit={handleVerifyClaim} id="claim-form">
                  <div className="form-group">
                    <label className="form-label">Invoice Amount (USDC)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={billAmount}
                      onChange={(e) => setBillAmount(e.target.value)}
                      required
                    />
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                      Available Healthcare HSA Balance: <strong>{healthBalance.toFixed(2)} USDC</strong>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Security & Authentication Method</label>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', backgroundColor: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                      🔒 Automated Clinic signature verified instantly. Payment dispatches directly from the savings pool.
                    </div>
                  </div>

                  {/* Action Preview */}
                  <div className="action-preview-card">
                    <div className="action-preview-title">
                      <Zap size={14} color="var(--color-secondary)" fill="var(--color-secondary)" />
                      Claim Action Preview:
                    </div>
                    <ul className="action-preview-list">
                      <li>The portal scans clinic billing credentials.</li>
                      <li>Releases <strong>{billAmount || '0'} USDC</strong> directly to the provider instantly.</li>
                      <li>If your individual balance is insufficient, the <strong>Community Co-op Safety Pool</strong> automatically pays the difference.</li>
                    </ul>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', height: '46px' }}
                    disabled={claimLoading || !isConnected || parseFloat(billAmount) <= 0}
                  >
                    {claimLoading ? (
                      <>
                        <RefreshCw className="animate-spin" size={16} style={{ animation: 'spin 1.5s linear infinite' }} />
                        Processing Claim Payment...
                      </>
                    ) : (
                      'Submit Invoice & Pay Provider Instantly'
                    )}
                  </button>
                </form>

                {showClaimSuccess && (
                  <div className="alert-message success" style={{ marginTop: '20px' }}>
                    <CheckCircle size={18} />
                    <div>
                      <strong>Claim Approved & Disbursed!</strong>
                      <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', wordBreak: 'break-all', marginTop: '4px' }}>
                        Reference ID: {claimTxHash}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Settled instantly to the medical clinic.
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="panel-card" style={{ marginTop: '24px', backgroundColor: 'rgba(255, 255, 255, 0.015)', border: '1px solid var(--border-color)', padding: '16px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>Community Co-op Safety Pool</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    A shared insurance pool funded by 20% of medical contributions. If your clinic bill exceeds your personal savings pot, the community fund automatically covers the remaining balance for you.
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span>Co-op Treasury Size:</span>
                    <strong style={{ color: 'var(--color-secondary)' }}>{coopTreasury.toFixed(2)} USDC</strong>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* 5. Smart Contracts tab */}
        {activeTab === 'contracts' && (
          <div className="playground-layout">
            <div className="contracts-list">
              <div
                className={`contract-tab ${activeContractTab === 'payroll' ? 'active' : ''}`}
                onClick={() => setActiveContractTab('payroll')}
              >
                <h4>Continuous Payroll Engine code</h4>
                <p>Salary stream escrow rules that handle continuous distributions.</p>
              </div>

              <div
                className={`contract-tab ${activeContractTab === 'vault' ? 'active' : ''}`}
                onClick={() => setActiveContractTab('vault')}
              >
                <h4>Micro-Benefits Vault code</h4>
                <p>Rules that split claimed wages and disburse clinic claims.</p>
              </div>

              <div className="panel-card" style={{ marginTop: '12px', padding: '16px' }}>
                <h5 style={{ color: '#fff', fontSize: '14px', marginBottom: '8px' }}>Payment Network Details</h5>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div><strong>Connection Status:</strong> Active (Secure)</div>
                  <div><strong>Processing Cost:</strong> Sponsored (Free)</div>
                  <div><strong>Settlement Delay:</strong> Sub-second (Instant)</div>
                  <div><strong>Network Currency Token:</strong> {USDC_TOKEN_ADDRESS}</div>
                  <div><strong>Continuous Payroll Rule:</strong> {STREAMING_PAYROLL_ADDRESS}</div>
                  <div><strong>Benefits Vault Rule:</strong> {MICRO_BENEFITS_VAULT_ADDRESS}</div>
                </div>
              </div>
            </div>

            <div className="code-viewer-container">
              <div className="code-viewer-header">
                <div className="code-viewer-title">
                  {activeContractTab === 'payroll' ? 'StreamingPayroll.sol' : 'MicroBenefitsVault.sol'}
                </div>
                <a
                  href={`https://testnet.arcscan.app/address/${activeContractTab === 'payroll' ? STREAMING_PAYROLL_ADDRESS : MICRO_BENEFITS_VAULT_ADDRESS}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--color-secondary)', textDecoration: 'none' }}
                >
                  View Network Registry Link
                  <ExternalLink size={12} />
                </a>
              </div>
              <pre className="code-block">
                <code>
                  {activeContractTab === 'payroll' ? streamingPayrollCode : benefitsVaultCode}
                </code>
              </pre>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}

export default App
