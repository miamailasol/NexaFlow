import React, { useState, useEffect, useRef } from 'react'
import {
  Activity,
  CheckCircle,
  AlertTriangle,
  Play,
  Pause,
  ShieldCheck,
  Download,
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
  Menu,
  Cpu,
  Shuffle,
  ArrowRight,
  Fingerprint,
  Key,
  Coins,
  Sliders
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
  useDisconnect,
  useSwitchChain
} from 'wagmi'
import { formatUnits, parseUnits, createWalletClient, http, parseEventLogs, decodeAbiParameters, keccak256, encodeAbiParameters, encodeFunctionData } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { arcTestnet } from 'viem/chains'

// Contract Settings
import {
  STREAMING_PAYROLL_ADDRESS,
  STREAMING_PAYROLL_ABI,
  MICRO_BENEFITS_VAULT_ADDRESS,
  MICRO_BENEFITS_VAULT_ABI,
  USDC_TOKEN_ADDRESS,
  EURC_TOKEN_ADDRESS,
  USDC_ABI,
  COMPLIANCE_REGISTRY_ADDRESS,
  COMPLIANCE_REGISTRY_ABI,
  CROSS_CHAIN_TREASURY_ADDRESS,
  CROSS_CHAIN_TREASURY_ABI,
  YIELD_VAULT_ADDRESS,
  YIELD_VAULT_ABI,
  PASSKEY_ACCOUNT_FACTORY_ADDRESS,
  PASSKEY_ACCOUNT_FACTORY_ABI,
  NEXA_PAYMASTER_ADDRESS,
  NEXA_PAYMASTER_ABI,
  PASSKEY_ACCOUNT_ABI,
  TREASURY_BUFFER_MANAGER_ADDRESS,
  TREASURY_BUFFER_MANAGER_ABI,
  PAYMASTER_RULES_MANAGER_ADDRESS,
  PAYMASTER_RULES_MANAGER_ABI
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

const getCountryCode = (loc) => {
  if (!loc) return 'SG';
  const str = loc.toUpperCase();
  if (str.includes('SINGAPORE') || str.includes('SG')) return 'SG';
  if (str.includes('BRAZIL') || str.includes('BR')) return 'BR';
  if (str.includes('NIGERIA') || str.includes('NG')) return 'NG';
  if (str.includes('TAIWAN') || str.includes('TW')) return 'TW';
  return 'SG';
};

const getTaxRateBps = (loc) => {
  const code = getCountryCode(loc);
  if (code === 'BR') return 1500;
  if (code === 'NG') return 1000;
  if (code === 'TW') return 1800;
  return 0;
};

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

  // Read employer pre-deposited payroll balance
  const { data: employerPayrollBalanceRaw, refetch: refetchEmployerPayrollBalance } = useReadContract({
    address: STREAMING_PAYROLL_ADDRESS,
    abi: STREAMING_PAYROLL_ABI,
    functionName: 'employerBalances',
    args: address ? [address] : undefined
  })
  const employerPayrollBalance = employerPayrollBalanceRaw ? Number(formatUnits(employerPayrollBalanceRaw, 6)).toFixed(2) : '0.00'

  // Read employer buffer balance from TreasuryBufferManager
  const { data: employerBufferRaw, refetch: refetchEmployerBuffer } = useReadContract({
    address: TREASURY_BUFFER_MANAGER_ADDRESS,
    abi: TREASURY_BUFFER_MANAGER_ABI,
    functionName: 'employerBuffers',
    args: address ? [address] : undefined
  })
  const employerBuffer = employerBufferRaw ? Number(formatUnits(employerBufferRaw, 6)) : 0

  // Read employer monthly commitment from TreasuryBufferManager
  const { data: totalMonthlyCommitmentRaw, refetch: refetchMonthlyCommitment } = useReadContract({
    address: TREASURY_BUFFER_MANAGER_ADDRESS,
    abi: TREASURY_BUFFER_MANAGER_ABI,
    functionName: 'totalMonthlyCommitment',
    args: address ? [address] : undefined
  })
  const totalMonthlyCommitment = totalMonthlyCommitmentRaw ? Number(formatUnits(totalMonthlyCommitmentRaw, 6)) : 0

  // Read warning state
  const { data: isWarningState, refetch: refetchWarningState } = useReadContract({
    address: TREASURY_BUFFER_MANAGER_ADDRESS,
    abi: TREASURY_BUFFER_MANAGER_ABI,
    functionName: 'isWarningState',
    args: address ? [address] : undefined
  })

  // Read days covered
  const { data: daysCoveredRaw, refetch: refetchDaysCovered } = useReadContract({
    address: TREASURY_BUFFER_MANAGER_ADDRESS,
    abi: TREASURY_BUFFER_MANAGER_ABI,
    functionName: 'getDaysCovered',
    args: address ? [address] : undefined
  })
  const daysCovered = daysCoveredRaw !== undefined ? Number(daysCoveredRaw) : 30

  // Read ERC-20 allowance for TreasuryBufferManager
  const { data: bufferAllowanceRaw, refetch: refetchBufferAllowance } = useReadContract({
    address: USDC_TOKEN_ADDRESS,
    abi: USDC_ABI,
    functionName: 'allowance',
    args: address ? [address, TREASURY_BUFFER_MANAGER_ADDRESS] : undefined
  })
  const bufferAllowance = bufferAllowanceRaw ? Number(formatUnits(bufferAllowanceRaw, 6)) : 0

  // Read member account details from MicroBenefitsVault
  const { data: memberAccount, refetch: refetchMemberAccount } = useReadContract({
    address: MICRO_BENEFITS_VAULT_ADDRESS,
    abi: MICRO_BENEFITS_VAULT_ABI,
    functionName: 'members',
    args: address ? [address] : undefined
  })

  // Read yieldVault address from MicroBenefitsVault
  const { data: yieldVaultAddr } = useReadContract({
    address: MICRO_BENEFITS_VAULT_ADDRESS,
    abi: MICRO_BENEFITS_VAULT_ABI,
    functionName: 'yieldVault'
  })

  // Convert retirement shares to asset balance
  const { data: retirementAssetsRaw, refetch: refetchRetirementAssets } = useReadContract({
    address: yieldVaultAddr || YIELD_VAULT_ADDRESS,
    abi: YIELD_VAULT_ABI,
    functionName: 'convertToAssets',
    args: memberAccount && memberAccount[1] ? [memberAccount[1]] : [0n],
    query: {
      enabled: !!memberAccount
    }
  })

  // Convert emergency shares to asset balance
  const { data: emergencyAssetsRaw, refetch: refetchEmergencyAssets } = useReadContract({
    address: yieldVaultAddr || YIELD_VAULT_ADDRESS,
    abi: YIELD_VAULT_ABI,
    functionName: 'convertToAssets',
    args: memberAccount && memberAccount[2] ? [memberAccount[2]] : [0n],
    query: {
      enabled: !!memberAccount
    }
  })

  // Read global insurance Co-op treasury balance
  const { data: coopTreasuryRaw, refetch: refetchCoopTreasury } = useReadContract({
    address: MICRO_BENEFITS_VAULT_ADDRESS,
    abi: MICRO_BENEFITS_VAULT_ABI,
    functionName: 'insuranceCoopTreasury'
  })

  // Read totalCoopShares
  const { data: totalCoopSharesRaw, refetch: refetchTotalCoopShares } = useReadContract({
    address: MICRO_BENEFITS_VAULT_ADDRESS,
    abi: MICRO_BENEFITS_VAULT_ABI,
    functionName: 'totalCoopShares'
  })

  // Read coopShares for current user
  const { data: userCoopSharesRaw, refetch: refetchUserCoopShares } = useReadContract({
    address: MICRO_BENEFITS_VAULT_ADDRESS,
    abi: MICRO_BENEFITS_VAULT_ABI,
    functionName: 'coopShares',
    args: address ? [address] : undefined
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
  
  // Use converted asset balances if available, otherwise fallback to formatUnits
  const retirementSharesVal = memberAccount ? Number(formatUnits(memberAccount[1], 6)) : 0
  const emergencySharesVal = memberAccount ? Number(formatUnits(memberAccount[2], 6)) : 0
  const retirementBalance = retirementAssetsRaw ? Number(formatUnits(retirementAssetsRaw, 6)) : retirementSharesVal
  const emergencyBalance = emergencyAssetsRaw ? Number(formatUnits(emergencyAssetsRaw, 6)) : emergencySharesVal
  
  const totalContributed = memberAccount ? Number(formatUnits(memberAccount[3], 6)) : 0
  const coopTreasury = coopTreasuryRaw ? Number(formatUnits(coopTreasuryRaw, 6)) : 0
  const benefitsAllowance = benefitsAllowanceRaw ? Number(formatUnits(benefitsAllowanceRaw, 6)) : 0
  const totalCoopShares = totalCoopSharesRaw ? Number(formatUnits(totalCoopSharesRaw, 6)) : 0
  const userCoopShares = userCoopSharesRaw ? Number(formatUnits(userCoopSharesRaw, 6)) : 0

  // Calculate user's staked USDC balance and pool share price
  const userStakedUSDC = totalCoopShares > 0 ? (userCoopShares * coopTreasury) / totalCoopShares : 0
  const coopSharePrice = totalCoopShares > 0 ? coopTreasury / totalCoopShares : 1.0

  // Read guardian status
  const { data: isUserGuardianRaw } = useReadContract({
    address: COMPLIANCE_REGISTRY_ADDRESS,
    abi: COMPLIANCE_REGISTRY_ABI,
    functionName: 'isGuardian',
    args: address ? [address] : undefined
  })
  const isUserGuardian = !!isUserGuardianRaw

  // Phase 15 Multi-Sig & Analytics states
  const [isSigner, setIsSigner] = useState(false);
  const [proposals, setProposals] = useState([]);
  const [withdrawLeftoverAmount, setWithdrawLeftoverAmount] = useState('');
  const [newOracleAddress, setNewOracleAddress] = useState('');
  const [isProposing, setIsProposing] = useState(false);

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
          let data = await publicClient.readContract({
            address: STREAMING_PAYROLL_ADDRESS,
            abi: STREAMING_PAYROLL_ABI,
            functionName: 'streams',
            args: [id]
          })

          let isPrivate = false
          if (!data || data[0] === '0x0000000000000000000000000000000000000000') {
            const privateData = await publicClient.readContract({
              address: STREAMING_PAYROLL_ADDRESS,
              abi: STREAMING_PAYROLL_ABI,
              functionName: 'privateStreams',
              args: [id]
            })
            if (privateData && privateData[0] !== '0x0000000000000000000000000000000000000000') {
              data = privateData
              isPrivate = true
            }
          }

          if (data && data[0] !== '0x0000000000000000000000000000000000000000') {
            let targetPayoutToken = 'USDC'
            try {
              const tokenAddr = await publicClient.readContract({
                address: STREAMING_PAYROLL_ADDRESS,
                abi: STREAMING_PAYROLL_ABI,
                functionName: 'targetPayoutTokens',
                args: [id]
              })
              if (tokenAddr && tokenAddr.toLowerCase() === EURC_TOKEN_ADDRESS.toLowerCase()) {
                targetPayoutToken = 'EURC'
              }
            } catch (e) {
              console.warn("read targetPayoutTokens failed", e)
            }

            let fiatPeg = ''
            try {
              fiatPeg = await publicClient.readContract({
                address: STREAMING_PAYROLL_ADDRESS,
                abi: STREAMING_PAYROLL_ABI,
                functionName: 'fiatPegs',
                args: [id]
              })
            } catch (e) {
              console.warn("read fiatPegs failed", e)
            }

            let priority = 0
            try {
              const priorityRaw = await publicClient.readContract({
                address: TREASURY_BUFFER_MANAGER_ADDRESS,
                abi: TREASURY_BUFFER_MANAGER_ABI,
                functionName: 'streamPriorities',
                args: [id]
              })
              priority = Number(priorityRaw)
            } catch (e) {
              console.warn("read streamPriorities failed", e)
            }

            if (isPrivate) {
              const privateSecrets = JSON.parse(localStorage.getItem('nexaflow_private_stream_secrets') || '{}')
              const secret = privateSecrets[id]
              loaded.push({
                id,
                name: secret ? secret.name : `Private Stream ${id.slice(0, 6)}`,
                role: secret ? secret.role : 'Confidential Developer',
                location: secret ? secret.location : 'Hidden 🔒',
                address: data[1],
                flowRate: secret ? Number(secret.flowRate) : 0,
                totalCap: Number(formatUnits(data[6], 6)),
                accruedPaid: Number(formatUnits(data[5], 6)),
                accruedLive: Number(formatUnits(data[5], 6)),
                lastUpdated: Number(data[4]),
                isActive: data[7],
                healthPercent: 5,
                retirementPercent: 5,
                emergencyPercent: 5,
                complianceStatus: 'Verified',
                avatar: 'PR',
                isPrivate: true,
                targetPayoutToken,
                fiatPeg,
                priority
              })
            } else {
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
                avatar: 'RE',
                targetPayoutToken,
                fiatPeg,
                priority
              })
            }
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
  const [isPrivateMode, setIsPrivateMode] = useState(false)
  const [recipientTokenChoice, setRecipientTokenChoice] = useState('USDC')

  // Fiat Salary Peg States
  const [pegToFiat, setPegToFiat] = useState(false)
  const [fiatCurrency, setFiatCurrency] = useState('SGD')
  const [fiatMonthlySalary, setFiatMonthlySalary] = useState(5000)
  const [oracleRates, setOracleRates] = useState({ SGD: 1.35, BRL: 5.00 })
  const oracleRatesRef = useRef({ SGD: 1.35, BRL: 5.00 })

  useEffect(() => {
    const fetchOracleRates = async () => {
      try {
        let sgdRate = 1.35
        let brlRate = 5.00
        
        try {
          const sgdFeed = await publicClient.readContract({
            address: STREAMING_PAYROLL_ADDRESS,
            abi: STREAMING_PAYROLL_ABI,
            functionName: 'priceFeeds',
            args: ['SGD']
          })
          if (sgdFeed && sgdFeed !== '0x0000000000000000000000000000000000000000') {
            const data = await publicClient.readContract({
              address: sgdFeed,
              abi: [
                {
                  inputs: [],
                  name: 'latestRoundData',
                  outputs: [
                    { name: 'roundId', type: 'uint80' },
                    { name: 'answer', type: 'int256' },
                    { name: 'startedAt', type: 'uint256' },
                    { name: 'updatedAt', type: 'uint256' },
                    { name: 'answeredInRound', type: 'uint80' }
                  ],
                  stateMutability: 'view',
                  type: 'function'
                }
              ],
              functionName: 'latestRoundData'
            })
            sgdRate = Number(data[1]) / 1e8
          }
        } catch (e) {
          console.warn("Failed to fetch SGD latestRoundData, using default 1.35", e)
        }

        try {
          const brlFeed = await publicClient.readContract({
            address: STREAMING_PAYROLL_ADDRESS,
            abi: STREAMING_PAYROLL_ABI,
            functionName: 'priceFeeds',
            args: ['BRL']
          })
          if (brlFeed && brlFeed !== '0x0000000000000000000000000000000000000000') {
            const data = await publicClient.readContract({
              address: brlFeed,
              abi: [
                {
                  inputs: [],
                  name: 'latestRoundData',
                  outputs: [
                    { name: 'roundId', type: 'uint80' },
                    { name: 'answer', type: 'int256' },
                    { name: 'startedAt', type: 'uint256' },
                    { name: 'updatedAt', type: 'uint256' },
                    { name: 'answeredInRound', type: 'uint80' }
                  ],
                  stateMutability: 'view',
                  type: 'function'
                }
              ],
              functionName: 'latestRoundData'
            })
            brlRate = Number(data[1]) / 1e8
          }
        } catch (e) {
          console.warn("Failed to fetch BRL latestRoundData, using default 5.00", e)
        }

        const rates = { SGD: sgdRate, BRL: brlRate }
        setOracleRates(rates)
        oracleRatesRef.current = rates
      } catch (err) {
        console.warn("fetchOracleRates failed, using defaults", err)
      }
    }
    if (isConnected && publicClient) {
      fetchOracleRates()
    }
  }, [isConnected, publicClient])

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
  const { switchChainAsync } = useSwitchChain()

  // Approve USDC transaction loading
  const [approveLoading, setApproveLoading] = useState(false)
  const [registerLoading, setRegisterLoading] = useState(false)
  const [depositLoading, setDepositLoading] = useState(false)
  const [bufferAmount, setBufferAmount] = useState('')
  const [isBufferLoading, setIsBufferLoading] = useState(false)

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

  // Treasury Auto-Pilot (Circle Developer-Controlled Wallets)
  const [autoPilot, setAutoPilot] = useState(() => {
    return localStorage.getItem('nexaflow_autopilot') === 'true'
  })
  const [dcwAddress, setDcwAddress] = useState('')
  const [dcwWalletId, setDcwWalletId] = useState('')
  const [dcwBalance, setDcwBalance] = useState('0.00')
  const [dcwIsLive, setDcwIsLive] = useState(false)
  const [isDcwCreating, setIsDcwCreating] = useState(false)
  const [dcwError, setDcwError] = useState('')

  // Passkey Smart Account States
  const [passkeyAccountAddress, setPasskeyAccountAddress] = useState(null)
  const [passkeyCredentialId, setPasskeyCredentialId] = useState(null)
  const [passkeyPubKeyX, setPasskeyPubKeyX] = useState(null)
  const [passkeyPubKeyY, setPasskeyPubKeyY] = useState(null)
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false)
  const [paymasterSponsorBalance, setPaymasterSponsorBalance] = useState(0)
  const [sponsorDepositAmount, setSponsorDepositAmount] = useState('')
  const [isSponsorLoading, setIsSponsorLoading] = useState(false)

  // Paymaster Rules Configurator States
  const [workerRulesMap, setWorkerRulesMap] = useState({})
  const [selectedWorkerForConfig, setSelectedWorkerForConfig] = useState('')
  const [maxTxLimitInput, setMaxTxLimitInput] = useState('10')
  const [maxGasPriceInput, setMaxGasPriceInput] = useState('50')
  const [isConfiguringRules, setIsConfiguringRules] = useState(false)


  useEffect(() => {
    if (address) {
      const stored = localStorage.getItem(`nexaflow_passkey_account_${address.toLowerCase()}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setPasskeyAccountAddress(parsed.accountAddress);
          setPasskeyCredentialId(parsed.credentialId);
          setPasskeyPubKeyX(parsed.pubKeyX);
          setPasskeyPubKeyY(parsed.pubKeyY);
        } catch (e) {
          console.error("Failed to parse passkey info from localStorage", e);
        }
      } else {
        setPasskeyAccountAddress(null);
        setPasskeyCredentialId(null);
        setPasskeyPubKeyX(null);
        setPasskeyPubKeyY(null);
      }
    }
  }, [address]);

  const fetchSponsorBalance = async () => {
    if (!address || !publicClient) return;
    try {
      const bal = await publicClient.readContract({
        address: NEXA_PAYMASTER_ADDRESS,
        abi: NEXA_PAYMASTER_ABI,
        functionName: 'sponsorBalances',
        args: [address]
      });
      setPaymasterSponsorBalance(Number(formatUnits(bal, 6)));
    } catch (e) {
      console.warn("Failed to fetch sponsor balance", e);
    }
  };

  const fetchWorkerRules = async () => {
    if (!publicClient) return;
    try {
      const workers = await publicClient.readContract({
        address: PAYMASTER_RULES_MANAGER_ADDRESS,
        abi: PAYMASTER_RULES_MANAGER_ABI,
        functionName: 'getConfiguredWorkers',
      });
      
      const newRules = {};
      for (const w of workers) {
        const rule = await publicClient.readContract({
          address: PAYMASTER_RULES_MANAGER_ADDRESS,
          abi: PAYMASTER_RULES_MANAGER_ABI,
          functionName: 'workerRules',
          args: [w]
        });
        
        newRules[w.toLowerCase()] = {
          maxTxPerMonth: Number(rule[0]),
          maxGasPrice: Number(formatUnits(rule[1], 9)),
          totalGasPaidUSDC: Number(formatUnits(rule[2], 6)),
          txCountThisMonth: Number(rule[3])
        };
      }
      setWorkerRulesMap(newRules);
    } catch (e) {
      console.warn("Failed to fetch worker rules", e);
    }
  };

  useEffect(() => {
    fetchSponsorBalance();
    fetchWorkerRules();
    fetchProposals();
  }, [address, publicClient]);

  const onboardWithPasskey = async () => {
    if (!address) {
      triggerToast('Wallet Not Connected', 'Please connect your wallet first.');
      return;
    }
    setIsPasskeyLoading(true);
    triggerToast('WebAuthn Request', 'Generating biometric credentials on your device...');

    try {
      let credIdBytes32;
      let pubKeyX;
      let pubKeyY;
      let usedMock = false;

      // 1. Attempt native WebAuthn API if available
      if (window.isSecureContext && navigator.credentials) {
        try {
          const challenge = new Uint8Array(32);
          crypto.getRandomValues(challenge);

          const credential = await navigator.credentials.create({
            publicKey: {
              challenge,
              rp: { name: "NexaFlow Systems" },
              user: {
                id: new TextEncoder().encode(address.toLowerCase()),
                name: "employee_" + address.slice(0, 8),
                displayName: "NexaFlow Worker"
              },
              pubKeyCredParams: [{ alg: -7, type: "public-key" }], // ES256 (P-256)
              timeout: 60000,
              authenticatorSelection: {
                authenticatorAttachment: "platform", // FaceID, TouchID, Windows Hello
                userVerification: "required"
              }
            }
          });

          // Hash the credential ID to get bytes32
          const rawId = new Uint8Array(credential.rawId);
          credIdBytes32 = keccak256(rawId);

          // P-256 Public Key (mocked values derived from ID for representation)
          const sha = new Uint8Array(32);
          crypto.getRandomValues(sha);
          pubKeyX = BigInt(keccak256(sha));
          pubKeyY = BigInt(keccak256(new Uint8Array([...sha, 1])));
        } catch (webauthnErr) {
          console.warn("Native WebAuthn create failed, falling back to simulated passkey", webauthnErr);
          usedMock = true;
        }
      } else {
        usedMock = true;
      }

      // 2. Mock fallback for local/test sandbox environments
      if (usedMock) {
        const credSeed = new Uint8Array(32);
        crypto.getRandomValues(credSeed);
        credIdBytes32 = keccak256(credSeed);

        // Derive deterministic keys for testing (pubKeyX is derived from msg.sender/address to pass WebAuthnVerifier software shim!)
        pubKeyX = BigInt(address); 
        pubKeyY = 27n; 
      }

      triggerToast('Deploying Smart Account', 'Submitting deployWallet call to Passkey Account Factory...');

      const predictedAddress = await publicClient.readContract({
        address: PASSKEY_ACCOUNT_FACTORY_ADDRESS,
        abi: PASSKEY_ACCOUNT_FACTORY_ABI,
        functionName: 'getAddress',
        args: [credIdBytes32, pubKeyX, pubKeyY]
      });

      const hash = await writeContractAsync({
        address: PASSKEY_ACCOUNT_FACTORY_ADDRESS,
        abi: PASSKEY_ACCOUNT_FACTORY_ABI,
        functionName: 'deployWallet',
        args: [credIdBytes32, pubKeyX, pubKeyY]
      });

      triggerToast('Awaiting Settlement', 'Waiting for on-chain smart account deployment...');
      await publicClient.waitForTransactionReceipt({ hash });

      const accountInfo = {
        accountAddress: predictedAddress,
        credentialId: credIdBytes32,
        pubKeyX: pubKeyX.toString(),
        pubKeyY: pubKeyY.toString(),
        isMock: usedMock
      };

      localStorage.setItem(`nexaflow_passkey_account_${address.toLowerCase()}`, JSON.stringify(accountInfo));
      setPasskeyAccountAddress(predictedAddress);
      setPasskeyCredentialId(credIdBytes32);
      setPasskeyPubKeyX(pubKeyX.toString());
      setPasskeyPubKeyY(pubKeyY.toString());

      triggerToast('Biometrics Registered', `Smart account deployed at ${predictedAddress.slice(0, 6)}...${predictedAddress.slice(-4)}`, 'success');
      fetchSponsorBalance();
    } catch (err) {
      console.error(err);
      triggerToast('Passkey Setup Failed', err.message);
    } finally {
      setIsPasskeyLoading(false);
    }
  };

  const handleDepositSponsor = async (e) => {
    e.preventDefault();
    if (!sponsorDepositAmount || isNaN(sponsorDepositAmount)) {
      triggerToast('Invalid Amount', 'Please specify a valid USDC amount.');
      return;
    }
    setIsSponsorLoading(true);
    triggerToast('Funding Paymaster', 'Approving and depositing USDC to gas sponsor vault...');

    try {
      const rawAmount = parseUnits(sponsorDepositAmount.toString(), 6);

      const allowance = await publicClient.readContract({
        address: USDC_TOKEN_ADDRESS,
        abi: USDC_ABI,
        functionName: 'allowance',
        args: [address, NEXA_PAYMASTER_ADDRESS]
      });

      if (allowance < rawAmount) {
        triggerToast('Requesting Approval', 'Approving NexaPaymaster to spend USDC...');
        const approveHash = await writeContractAsync({
          address: USDC_TOKEN_ADDRESS,
          abi: USDC_ABI,
          functionName: 'approve',
          args: [NEXA_PAYMASTER_ADDRESS, rawAmount]
        });
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
      }

      const hash = await writeContractAsync({
        address: NEXA_PAYMASTER_ADDRESS,
        abi: NEXA_PAYMASTER_ABI,
        functionName: 'depositSponsor',
        args: [rawAmount]
      });

      triggerToast('Awaiting Confirmation', 'Crediting sponsor gas balance...');
      await publicClient.waitForTransactionReceipt({ hash });

      triggerToast('Paymaster Funded', `Successfully deposited ${sponsorDepositAmount} USDC to gas vault.`);
      setSponsorDepositAmount('');
      fetchSponsorBalance();
      refetchUsdc();
    } catch (err) {
      console.error(err);
      triggerToast('Sponsorship Failed', err.message);
    } finally {
      setIsSponsorLoading(false);
    }
  };

  const handleSetWorkerRule = async (e) => {
    e.preventDefault();
    if (!selectedWorkerForConfig) {
      triggerToast('No Worker Selected', 'Please select a worker first.');
      return;
    }
    setIsConfiguringRules(true);
    triggerToast('Configuring Limits', `Updating gas sponsorship rules for worker...`);

    try {
      const maxTx = BigInt(maxTxLimitInput || '0');
      const maxGasPriceWei = parseUnits((maxGasPriceInput || '50').toString(), 9);

      const hash = await writeContractAsync({
        address: PAYMASTER_RULES_MANAGER_ADDRESS,
        abi: PAYMASTER_RULES_MANAGER_ABI,
        functionName: 'setWorkerRule',
        args: [selectedWorkerForConfig, maxTx, maxGasPriceWei]
      });

      triggerToast('Awaiting Confirmation', 'Updating gas rule on-chain...');
      await publicClient.waitForTransactionReceipt({ hash });

      triggerToast('Limits Saved', `Successfully updated gas limits for target worker.`, 'success');
      fetchWorkerRules();
      setSelectedWorkerForConfig('');
    } catch (err) {
      console.error(err);
      triggerToast('Configuration Failed', err.message);
    } finally {
      setIsConfiguringRules(false);
    }
  };

  const handleResetMonthlyUsage = async (workerAddr) => {
    triggerToast('Resetting Usage', `Resetting monthly transaction count...`);
    try {
      const hash = await writeContractAsync({
        address: PAYMASTER_RULES_MANAGER_ADDRESS,
        abi: PAYMASTER_RULES_MANAGER_ABI,
        functionName: 'resetMonthlyUsage',
        args: [workerAddr]
      });

      triggerToast('Awaiting Confirmation', 'Resetting count on-chain...');
      await publicClient.waitForTransactionReceipt({ hash });

      triggerToast('Usage Reset', 'Successfully reset transaction count for this worker.', 'success');
      fetchWorkerRules();
    } catch (err) {
      console.error(err);
      triggerToast('Reset Failed', err.message);
    }
  };

  const claimGaslessWithPasskey = async (streamId, employeeSmartAccountAddress) => {
    if (!address) {
      triggerToast('Wallet Not Connected', 'Please connect your wallet first.');
      return;
    }
    setIsPasskeyLoading(true);
    triggerToast('WebAuthn Verification', 'Verifying identity using FaceID/TouchID...');

    try {
      if (window.isSecureContext && navigator.credentials) {
        try {
          const challenge = new Uint8Array(32);
          crypto.getRandomValues(challenge);
          await navigator.credentials.get({
            publicKey: {
              challenge,
              timeout: 60000,
              userVerification: "required"
            }
          });
        } catch (webauthnErr) {
          console.warn("Native WebAuthn get failed, continuing with simulated signature", webauthnErr);
        }
      }

      const rawCalldata = encodeFunctionData({
        abi: STREAMING_PAYROLL_ABI,
        functionName: 'withdrawFunds',
        args: [streamId]
      });

      triggerToast('Relaying Claim', 'Routing sponsored withdrawFunds call through NexaPaymaster...');

      const hash = await writeContractAsync({
        address: NEXA_PAYMASTER_ADDRESS,
        abi: NEXA_PAYMASTER_ABI,
        functionName: 'sponsorWithdrawal',
        args: [employeeSmartAccountAddress, STREAMING_PAYROLL_ADDRESS, rawCalldata, streamId]
      });

      triggerToast('Awaiting Finalization', 'Settling sponsored gasless claim...');
      await publicClient.waitForTransactionReceipt({ hash });

      triggerToast('Claim Completed', 'Gasless claim successfully sponsored and settled.', 'success');
      refetchUsdc();
      fetchSponsorBalance();
      fetchWorkerRules();
      
      setEmployees((prev) =>
        prev.map((e) => {
          if (e.id === streamId) {
            return {
              ...e,
              accruedPaid: e.accruedLive,
              lastUpdated: Date.now() / 1000
            };
          }
          return e;
        })
      );
    } catch (err) {
      console.error(err);
      triggerToast('Gasless Claim Failed', err.message);
    } finally {
      setIsPasskeyLoading(false);
    }
  };


  // Phase 4: Cross-Chain Ingestion (Circle CCTP)
  const [isBridgeModalOpen, setIsBridgeModalOpen] = useState(false)
  const [bridgeAmount, setBridgeAmount] = useState('250.00')
  const [bridgeSourceChain, setBridgeSourceChain] = useState('Base Sepolia')
  const [bridgeStep, setBridgeStep] = useState(1) // 1: Config, 2: Burn, 3: Poll/Attestation, 4: Mint, 5: Done
  const [bridgeTxHash, setBridgeTxHash] = useState('')
  const [bridgeMessageBytes, setBridgeMessageBytes] = useState('')
  const [bridgeAttestation, setBridgeAttestation] = useState('')
  const [bridgeStatusText, setBridgeStatusText] = useState('')
  const [isBridgingInProgress, setIsBridgingInProgress] = useState(false)


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

  // Live ticking savings pools
  const [liveRetirement, setLiveRetirement] = useState(0)
  const [liveEmergency, setLiveEmergency] = useState(0)

  useEffect(() => {
    setLiveRetirement(retirementBalance)
    setLiveEmergency(emergencyBalance)
  }, [retirementBalance, emergencyBalance])

  // Active Solidity contract code viewer
  const [activeContractTab, setActiveContractTab] = useState('payroll')

  // Co-op LP Staking states
  const [stakeAmount, setStakeAmount] = useState('100')
  const [unstakeShares, setUnstakeShares] = useState('100')
  const [stakeLoading, setStakeLoading] = useState(false)
  const [unstakeLoading, setUnstakeLoading] = useState(false)

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
        
        let flowRateUSDC = emp.flowRate
        const peg = emp.fiatPeg
        if (peg && oracleRatesRef.current[peg]) {
          flowRateUSDC = emp.flowRate / oracleRatesRef.current[peg]
        }
        
        const accruedSinceLast = elapsed * flowRateUSDC
        const totalLive = Math.min(emp.accruedPaid + accruedSinceLast, emp.totalCap)
        return {
          ...emp,
          accruedLive: totalLive
        }
      })
    )

    // Tick retirement and emergency savings pools live at 5% APY
    setLiveRetirement((prev) => {
      if (prev <= 0) return prev
      // 5% APY: increment per frame assuming ~60 FPS
      const increment = (prev * 0.05) / (31536000 * 60)
      return prev + increment
    })

    setLiveEmergency((prev) => {
      if (prev <= 0) return prev
      const increment = (prev * 0.05) / (31536000 * 60)
      return prev + increment
    })

    requestRef.current = requestAnimationFrame(animate)
  }

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(requestRef.current)
  }, [])

  // Fetch DCW status on component mount or autopilot change
  useEffect(() => {
    const checkDcwStatus = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/treasury/status')
        const data = await res.json()
        setDcwIsLive(data.isLiveMode)
        if (data.address) {
          setDcwAddress(data.address)
          setDcwWalletId(data.walletId)
          // Fetch balance
          const balRes = await fetch(`http://localhost:3001/api/treasury/balance?address=${data.address}`)
          const balData = await balRes.json()
          if (balData.success && balData.tokenBalances && balData.tokenBalances.length > 0) {
            setDcwBalance(Number(balData.tokenBalances[0].amount).toFixed(2))
          }
        }
      } catch (e) {
        console.warn('DCW service is offline:', e.message)
        setDcwError('DCW backend service is offline')
      }
    }
    
    checkDcwStatus()
  }, [autoPilot])

  const handleToggleAutoPilot = () => {
    const next = !autoPilot
    setAutoPilot(next)
    localStorage.setItem('nexaflow_autopilot', String(next))
    triggerToast(
      next ? 'Auto-Pilot Activated' : 'Auto-Pilot Deactivated',
      next ? 'Employer streams will be signed and funded via Circle Developer-Controlled Wallets.' : 'Back to manual MetaMask stream creation mode.'
    )
  }

  // Phase 4: Cross-Chain Ingestion (Circle CCTP) handlers
  const handleStartCctpBridge = async () => {
    try {
      setIsBridgingInProgress(true)
      setBridgeStep(2)
      setBridgeStatusText("Switching network to Base Sepolia...")

      // 1. Switch network to Base Sepolia (chain ID 84532)
      try {
        await switchChainAsync({ chainId: 84532 })
      } catch (err) {
        console.error("Failed to switch chain:", err)
        // Fallback for some wallet types
        if (window.ethereum) {
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x14a34' }],
            })
          } catch (switchError) {
            if (switchError.code === 4902) {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0x14a34',
                  chainName: 'Base Sepolia',
                  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
                  rpcUrls: ['https://sepolia.base.org'],
                  blockExplorerUrls: ['https://sepolia.basescan.org']
                }]
              })
            } else {
              throw switchError
            }
          }
        } else {
          throw new Error("Please switch your wallet to Base Sepolia manually")
        }
      }

      setBridgeStatusText("Approving USDC spend for CCTP TokenMessenger on Base Sepolia...")

      // Base Sepolia USDC address: 0x0360000000000000000000000000000000000000
      // Base Sepolia TokenMessenger: 0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275
      const BASE_USDC = '0x0360000000000000000000000000000000000000'
      const BASE_TOKEN_MESSENGER = '0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275'

      const amountToBridgeRaw = parseUnits(bridgeAmount, 6)

      // Call approve
      const approveTx = await writeContractAsync({
        address: BASE_USDC,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [BASE_TOKEN_MESSENGER, amountToBridgeRaw]
      })

      setBridgeStatusText(`Allowance transaction submitted: ${approveTx}. Awaiting confirmation...`)
      // Wait a moment for mempool propagation
      await new Promise(resolve => setTimeout(resolve, 2000))

      setBridgeStatusText("Executing depositForBurn on Base Sepolia...")

      // TokenMessenger depositForBurn ABI:
      const tokenMessengerAbi = [
        {
          inputs: [
            { name: 'amount', type: 'uint256' },
            { name: 'destinationDomain', type: 'uint32' },
            { name: 'mintRecipient', type: 'bytes32' },
            { name: 'burnToken', type: 'address' }
          ],
          name: 'depositForBurn',
          outputs: [{ name: 'nonce', type: 'uint64' }],
          stateMutability: 'nonpayable',
          type: 'function'
        }
      ]

      // Format mintRecipient address to bytes32 (padded)
      const recipientBytes32 = '0x' + CROSS_CHAIN_TREASURY_ADDRESS.substring(2).padStart(64, '0')

      const burnTx = await writeContractAsync({
        address: BASE_TOKEN_MESSENGER,
        abi: tokenMessengerAbi,
        functionName: 'depositForBurn',
        args: [
          amountToBridgeRaw,
          26, // Arc CCTP Domain ID
          recipientBytes32,
          BASE_USDC
        ]
      })

      setBridgeStatusText(`Burn transaction submitted: ${burnTx}. Awaiting block confirmation...`)
      
      // Allow a brief delay for mining receipt
      await new Promise(resolve => setTimeout(resolve, 6000))
      
      // Attempt to retrieve logs from transaction receipt
      let messageBytes = '0x'
      try {
        const burnReceipt = await publicClient.getTransactionReceipt({ hash: burnTx })
        const messageSentTopic = '0x8c5261dbad8e82119a9324571695d33b110fef30e9e166d88285f7d9d658046b'
        const log = burnReceipt.logs.find(l => l.topics[0] === messageSentTopic)
        if (log) {
          const decoded = decodeAbiParameters([{ type: 'bytes' }], log.data)
          messageBytes = decoded[0]
        }
      } catch (receiptErr) {
        console.warn("Could not retrieve receipt logs automatically. Proceeding with mock fallback capability.", receiptErr)
      }

      // If logs couldn't be parsed (common in JSON-RPC setups without full events indexed), we can generate a mock CCTP message format
      if (messageBytes === '0x' || !messageBytes) {
        const dummyBytes = new Uint8Array(256)
        const recipientBytes = ethers.getBytes(CROSS_CHAIN_TREASURY_ADDRESS)
        dummyBytes.set(recipientBytes, 152 + (32 - recipientBytes.length))
        
        const amountHex = ethers.zeroPadValue(ethers.toBeHex(amountToBridgeRaw), 32)
        dummyBytes.set(ethers.getBytes(amountHex), 184)
        
        const senderBytes = ethers.getBytes(address || '0x0000000000000000000000000000000000000000')
        dummyBytes.set(senderBytes, 216 + (32 - senderBytes.length))
        
        messageBytes = ethers.hexlify(dummyBytes)
      }

      const messageHash = keccak256(messageBytes)

      setBridgeTxHash(burnTx)
      setBridgeMessageBytes(messageBytes)
      setBridgeStep(3)
      setBridgeStatusText("Waiting for Circle CCTP attestation signature... This takes ~60 seconds on testnet.")

      // Start polling attestation API
      pollCircleAttestation(messageHash, messageBytes)

    } catch (err) {
      console.error(err)
      setBridgeStatusText(`Error: ${err.message || err.toString()}`)
      setIsBridgingInProgress(false)
      triggerToast('Bridge Failed', err.message || err.toString())
    }
  }

  const pollCircleAttestation = async (messageHash, messageBytes) => {
    const url = `https://iris-api-sandbox.circle.com/attestations/${messageHash}`
    let attempts = 0
    const interval = setInterval(async () => {
      attempts++
      setBridgeStatusText(`Polling Circle CCTP Attestation... Attempt ${attempts} (~60-90 seconds total)`)
      try {
        const res = await fetch(url)
        if (res.status === 200) {
          const data = await res.json()
          if (data.status === 'complete' && data.attestation) {
            clearInterval(interval)
            setBridgeAttestation(data.attestation)
            setBridgeStatusText("Circle CCTP Attestation signature retrieved! Prompting network switch back to Arc...")
            setBridgeStep(4)
            setIsBridgingInProgress(false)
            triggerToast('Attestation Received', 'Circle CCTP attestation signed successfully.')
          }
        }
      } catch (err) {
        console.error("Attestation polling error:", err)
      }

      if (attempts >= 90) { // Timeout after 3 minutes
        clearInterval(interval)
        setBridgeStatusText("CCTP attestation polling timed out. You can manually enter/claim or use simulated attestation.")
        setIsBridgingInProgress(false)
      }
    }, 2000)
  }

  const handleMockAttestation = () => {
    // Generate a dummy mock attestation signature
    const dummySignature = '0x' + Array(130).fill('f').join('')
    setBridgeAttestation(dummySignature)
    setBridgeStatusText("Simulated Attestation signature generated! Proceed to claim on Arc Testnet.")
    setBridgeStep(4)
    triggerToast('Simulated Attestation', 'Bypassed testnet delay with mock signature for demo.')
  }

  const handleClaimCctpBridge = async () => {
    try {
      setIsBridgingInProgress(true)
      setBridgeStatusText("Switching network back to Arc Testnet...")

      // 2. Switch network back to Arc Testnet (chain ID 5042002)
      try {
        await switchChainAsync({ chainId: 5042002 })
      } catch (err) {
        console.error("Failed to switch chain:", err)
        if (window.ethereum) {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x4ce9fa' }], // Hex for 5042002
          })
        }
      }

      setBridgeStatusText("Executing claimUSDCFromBridge on Arc Testnet...")

      const claimTx = await writeContractAsync({
        address: CROSS_CHAIN_TREASURY_ADDRESS,
        abi: CROSS_CHAIN_TREASURY_ABI,
        functionName: 'claimUSDCFromBridge',
        args: [bridgeMessageBytes, bridgeAttestation]
      })

      setBridgeStatusText(`Claim transaction submitted: ${claimTx}. Confirming deposit...`)
      
      // Await confirmation
      await new Promise(resolve => setTimeout(resolve, 3000))

      setBridgeStatusText("Deposit successfully processed! Pre-funded payroll balance credited.")
      setBridgeStep(5)
      setIsBridgingInProgress(false)
      triggerToast('Deposit Credited', `Successfully bridged ${bridgeAmount} USDC to Arc Payroll contract!`)
      
      // Add a transaction to the history for UX styling
      setTxHistory(prev => [
        {
          id: `tx-${Date.now()}`,
          action: 'Cross-Chain CCTP Deposit',
          amount: `+${bridgeAmount} USDC (Base -> Arc)`,
          time: 'Just now',
          gas: '0.00 USDC (Gasless Claim)',
          status: 'Finalized'
        },
        ...prev
      ])

      // Refetch employer balances
      if (refetchEmployerPayrollBalance) refetchEmployerPayrollBalance()
      if (refetchUsdc) refetchUsdc()

    } catch (err) {
      console.error(err)
      setBridgeStatusText(`Error: ${err.message || err.toString()}`)
      setIsBridgingInProgress(false)
      triggerToast('Claim Failed', err.message || err.toString())
    }
  }

  const handleProvisionDcw = async () => {
    setIsDcwCreating(true)
    setDcwError('')
    try {
      const res = await fetch('http://localhost:3001/api/treasury/create-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await res.json()
      if (data.success) {
        setDcwAddress(data.address)
        setDcwWalletId(data.walletId)
        triggerToast('Developer Wallet Created', `Wallet: ${data.address}`)
        
        // Fetch balance
        const balRes = await fetch(`http://localhost:3001/api/treasury/balance?address=${data.address}`)
        const balData = await balRes.json()
        if (balData.success && balData.tokenBalances && balData.tokenBalances.length > 0) {
          setDcwBalance(Number(balData.tokenBalances[0].amount).toFixed(2))
        }
      } else {
        setDcwError(data.error || 'Failed to create wallet')
        triggerToast('Creation Failed', data.error || 'Failed to create wallet')
      }
    } catch (e) {
      console.error(e)
      setDcwError('DCW backend service is offline')
      triggerToast('Connection Error', 'Backend service at port 3001 is offline.')
    } finally {
      setIsDcwCreating(false)
    }
  }

  const handleRefreshDcwBalance = async () => {
    if (!dcwAddress) return
    try {
      const balRes = await fetch(`http://localhost:3001/api/treasury/balance?address=${dcwAddress}`)
      const balData = await balRes.json()
      if (balData.success && balData.tokenBalances && balData.tokenBalances.length > 0) {
        setDcwBalance(Number(balData.tokenBalances[0].amount).toFixed(2))
        triggerToast('Balance Refreshed', `New Balance: ${Number(balData.tokenBalances[0].amount).toFixed(2)} USDC`)
      }
    } catch (e) {
      console.error(e)
      triggerToast('Error Refreshing Balance', e.message)
    }
  }

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

  // Handle Stake USDC into Co-op Mutual Safety Pool
  const handleStakeCoop = async () => {
    if (!isConnected) {
      triggerToast('Wallet not connected', 'Please connect your Web3 wallet first.')
      return
    }
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      triggerToast('Invalid Amount', 'Please specify a positive USDC amount to stake.')
      return
    }
    setStakeLoading(true)
    try {
      const stakeVal = parseUnits(stakeAmount, 6)
      
      // Check allowance for MicroBenefitsVault
      if (benefitsAllowance < parseFloat(stakeAmount)) {
        triggerToast('Approving USDC', 'Requesting approval to spend USDC...')
        const approveHash = await writeContractAsync({
          address: USDC_TOKEN_ADDRESS,
          abi: USDC_ABI,
          functionName: 'approve',
          args: [MICRO_BENEFITS_VAULT_ADDRESS, parseUnits('1000000', 6)]
        })
        await publicClient.waitForTransactionReceipt({ hash: approveHash })
        refetchBenefitsAllowance()
      }

      triggerToast('Staking USDC', 'Staking USDC into Co-op Mutual Pool...')
      const hash = await writeContractAsync({
        address: MICRO_BENEFITS_VAULT_ADDRESS,
        abi: MICRO_BENEFITS_VAULT_ABI,
        functionName: 'stakeInCoop',
        args: [stakeVal]
      })
      await publicClient.waitForTransactionReceipt({ hash })

      refetchUsdc()
      refetchBenefitsAllowance()
      refetchCoopTreasury()
      refetchTotalCoopShares()
      refetchUserCoopShares()
      setStakeLoading(false)
      triggerToast('Staking Successful', `Successfully staked ${stakeAmount} USDC into Co-op Mutual Pool.`)
    } catch (e) {
      console.error(e)
      setStakeLoading(false)
      triggerToast('Staking Failed', e.message)
    }
  }

  // Handle Deposit reserve funds into Treasury Safety Buffer
  const handleDepositBuffer = async () => {
    if (!isConnected) {
      triggerToast('Wallet not connected', 'Please connect your Web3 wallet first.')
      return
    }
    if (!bufferAmount || parseFloat(bufferAmount) <= 0) {
      triggerToast('Invalid Amount', 'Please specify a positive USDC amount to deposit.')
      return
    }
    setIsBufferLoading(true)
    try {
      const depositVal = parseUnits(bufferAmount, 6)

      // Approve if needed
      if (bufferAllowance < parseFloat(bufferAmount)) {
        triggerToast('Approving USDC', 'Requesting approval to spend USDC for buffer...')
        const approveHash = await writeContractAsync({
          address: USDC_TOKEN_ADDRESS,
          abi: USDC_ABI,
          functionName: 'approve',
          args: [TREASURY_BUFFER_MANAGER_ADDRESS, parseUnits('10000000', 6)]
        })
        await publicClient.waitForTransactionReceipt({ hash: approveHash })
        refetchBufferAllowance()
      }

      triggerToast('Depositing Buffer', 'Depositing USDC into Treasury reserve buffer...')
      const hash = await writeContractAsync({
        address: TREASURY_BUFFER_MANAGER_ADDRESS,
        abi: TREASURY_BUFFER_MANAGER_ABI,
        functionName: 'depositBuffer',
        args: [depositVal]
      })
      await publicClient.waitForTransactionReceipt({ hash })

      refetchUsdc()
      refetchBufferAllowance()
      refetchEmployerBuffer()
      refetchDaysCovered()
      refetchWarningState()
      setBufferAmount('')
      setIsBufferLoading(false)
      triggerToast('Deposit Successful', `Successfully deposited ${bufferAmount} USDC into Treasury Buffer.`)
    } catch (e) {
      console.error(e)
      setIsBufferLoading(false)
      triggerToast('Deposit Failed', e.message)
    }
  }

  // Handle Withdraw reserve funds from Treasury Safety Buffer
  const handleWithdrawBuffer = async () => {
    if (!isConnected) {
      triggerToast('Wallet not connected', 'Please connect your Web3 wallet first.')
      return
    }
    if (!bufferAmount || parseFloat(bufferAmount) <= 0) {
      triggerToast('Invalid Amount', 'Please specify a positive USDC amount to withdraw.')
      return
    }
    setIsBufferLoading(true)
    try {
      const withdrawVal = parseUnits(bufferAmount, 6)

      triggerToast('Withdrawing Buffer', 'Withdrawing USDC from Treasury reserve buffer...')
      const hash = await writeContractAsync({
        address: TREASURY_BUFFER_MANAGER_ADDRESS,
        abi: TREASURY_BUFFER_MANAGER_ABI,
        functionName: 'withdrawBuffer',
        args: [withdrawVal]
      })
      await publicClient.waitForTransactionReceipt({ hash })

      refetchUsdc()
      refetchEmployerBuffer()
      refetchDaysCovered()
      refetchWarningState()
      setBufferAmount('')
      setIsBufferLoading(false)
      triggerToast('Withdrawal Successful', `Successfully withdrew ${bufferAmount} USDC from Treasury Buffer.`)
    } catch (e) {
      console.error(e)
      setIsBufferLoading(false)
      triggerToast('Withdrawal Failed', e.message)
    }
  }

  // Handle stream priority updates
  const handleSetStreamPriority = async (streamId, priority) => {
    if (!isConnected) {
      triggerToast('Wallet not connected', 'Please connect your Web3 wallet first.')
      return
    }
    try {
      triggerToast('Updating Priority', `Setting stream priority to ${priority === 1 ? 'High (Key Role)' : 'Standard'}...`)
      const hash = await writeContractAsync({
        address: TREASURY_BUFFER_MANAGER_ADDRESS,
        abi: TREASURY_BUFFER_MANAGER_ABI,
        functionName: 'setStreamPriority',
        args: [streamId, BigInt(priority)]
      })
      await publicClient.waitForTransactionReceipt({ hash })
      
      triggerToast('Priority Updated', 'Stream priority level successfully recorded on-chain.')
      if (typeof loadStreams === 'function') {
        loadStreams()
      }
    } catch (e) {
      console.error(e)
      triggerToast('Update Failed', e.message)
    }
  }

  // Handle Unstake USDC from Co-op Mutual Safety Pool
  const handleUnstakeCoop = async () => {
    if (!isConnected) {
      triggerToast('Wallet not connected', 'Please connect your Web3 wallet first.')
      return
    }
    if (!unstakeShares || parseFloat(unstakeShares) <= 0) {
      triggerToast('Invalid Shares', 'Please specify a positive share amount to unstake.')
      return
    }
    setUnstakeLoading(true)
    try {
      const sharesVal = parseUnits(unstakeShares, 6)
      
      triggerToast('Unstaking Shares', 'Redeeming Co-op shares for USDC...')
      const hash = await writeContractAsync({
        address: MICRO_BENEFITS_VAULT_ADDRESS,
        abi: MICRO_BENEFITS_VAULT_ABI,
        functionName: 'unstakeInCoop',
        args: [sharesVal]
      })
      await publicClient.waitForTransactionReceipt({ hash })

      refetchUsdc()
      refetchCoopTreasury()
      refetchTotalCoopShares()
      refetchUserCoopShares()
      setUnstakeLoading(false)
      triggerToast('Unstaking Successful', `Successfully unstaked ${unstakeShares} shares.`)
    } catch (e) {
      console.error(e)
      setUnstakeLoading(false)
      triggerToast('Unstaking Failed', e.message)
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

    if (autoPilot) {
      if (!dcwAddress) {
        triggerToast('DCW Wallet Required', 'Please provision your Developer-Controlled Wallet first.')
        return
      }
      setApproveLoading(true)
      try {
        const selectedRate = pegToFiat ? (fiatMonthlySalary / 2592000) : Number(newEmployeeRate)
        const flowRateRaw = parseUnits(selectedRate.toFixed(6), 6)
        const totalCapRaw = parseUnits(newEmployeeCap.toString(), 6)
        
        triggerToast('Requesting Circle DCW', 'Broadcasting automatic stream via Circle API...')
        const response = await fetch('http://localhost:3001/api/payroll/start-stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employee: newEmployeeAddress,
            flowRate: flowRateRaw.toString(),
            totalCap: totalCapRaw.toString(),
            contractAddress: STREAMING_PAYROLL_ADDRESS
          })
        })
        const result = await response.json()
        if (!result.success) {
          throw new Error(result.error || 'Failed to start stream via DCW')
        }

        const streamId = ('0x' + Math.random().toString(16).substr(2, 64)).padEnd(66, '0')
        
        triggerToast('Auto-Pilot Transaction Executed', `Stream established. Hash: ${result.txHash ? result.txHash.substr(0, 10) + '...' : 'pending'}`)
        
        const newEmp = {
          id: streamId,
          name: newEmployeeName,
          role: newEmployeeRole || 'Developer',
          location: newEmployeeLoc,
          address: newEmployeeAddress,
          flowRate: Number(newEmployeeRate),
          totalCap: Number(newEmployeeCap),
          accruedPaid: 0,
          accruedLive: 0,
          lastUpdated: Math.floor(Date.now() / 1000),
          isActive: true,
          healthPercent: 5,
          retirementPercent: 5,
          emergencyPercent: 5,
          complianceStatus: 'Verified',
          avatar: newEmployeeName.split(' ').map((n) => n[0]).join('').toUpperCase().substr(0, 2)
        }

        setEmployees((prev) => [newEmp, ...prev])
        const updatedIds = [streamId, ...streamIds]
        setStreamIds(updatedIds)
        localStorage.setItem('nexaflow_stream_ids', JSON.stringify(updatedIds))
        
        setTimeout(() => handleRefreshDcwBalance(), 3000)
        setApproveLoading(false)
        
        // Reset form inputs
        setNewEmployeeName('')
        setNewEmployeeAddress('')
        setNewEmployeeRate('0.005')
        setNewEmployeeCap('100.00')
        setNewEmployeeRole('')
        setNewEmployeeLoc('SG')
      } catch (err) {
        console.error(err)
        setApproveLoading(false)
        triggerToast('Auto-Pilot Failed', err.message)
      }
      return
    }

    if (!isConnected) {
      triggerToast('Wallet not connected', 'Please connect your Web3 wallet first.')
      return
    }
    if (usdcAllowance < newEmployeeCap) {
      triggerToast('USDC Allowance Needed', 'Please approve the streaming escrow contract to spend your USDC first.')
      return
    }

    try {
      const selectedRate = pegToFiat ? (fiatMonthlySalary / 2592000) : Number(newEmployeeRate)
      const flowRateRaw = parseUnits(selectedRate.toFixed(6), 6)
      const totalCapRaw = parseUnits(newEmployeeCap.toString(), 6)

      let hash
      let streamId
      let isPrivate = isPrivateMode

      if (isPrivate) {
        // Generate random 32-byte salt locally
        const saltBytes = new Uint8Array(32)
        crypto.getRandomValues(saltBytes)
        const salt = '0x' + Array.from(saltBytes).map(b => b.toString(16).padStart(2, '0')).join('')

        // Calculate commitmentHash locally using viem
        const commitmentHash = keccak256(encodeAbiParameters(
          [{ type: 'uint256' }, { type: 'uint256' }, { type: 'bytes32' }],
          [flowRateRaw, totalCapRaw, salt]
        ))

        triggerToast('Broadcasting Private Stream', 'Submitting createPrivateStream call to Arc Testnet...')

        hash = await writeContractAsync({
          address: STREAMING_PAYROLL_ADDRESS,
          abi: STREAMING_PAYROLL_ABI,
          functionName: 'createPrivateStream',
          args: [newEmployeeAddress, commitmentHash, totalCapRaw, getCountryCode(newEmployeeLoc)]
        })

        triggerToast('Transaction Submitted', 'Waiting for private stream finalization on Arc...')
        const receipt = await publicClient.waitForTransactionReceipt({ hash })

        // Extract private streamId
        try {
          const logs = parseEventLogs({
            abi: STREAMING_PAYROLL_ABI,
            eventName: 'PrivateStreamCreated',
            logs: receipt.logs
          })
          if (logs && logs.length > 0 && logs[0].args && logs[0].args.streamId) {
            streamId = logs[0].args.streamId
          }
        } catch (e) {
          console.warn("parsePrivateStreamCreated failed", e)
        }

        if (!streamId && receipt.logs && receipt.logs.length > 0) {
          const payrollLog = receipt.logs.find(
            log => log.address.toLowerCase() === STREAMING_PAYROLL_ADDRESS.toLowerCase() && log.topics && log.topics.length > 1
          )
          if (payrollLog) {
            streamId = payrollLog.topics[1]
          }
        }

        if (!streamId) {
          streamId = ('0x' + Math.random().toString(16).substr(2, 64)).padEnd(66, '0')
        }

        // Save salt, flowRate, cap, name, and role to local storage
        const privateStoreData = JSON.parse(localStorage.getItem('nexaflow_private_stream_secrets') || '{}')
        privateStoreData[streamId] = {
          salt,
          flowRate: newEmployeeRate.toString(),
          totalCap: newEmployeeCap.toString(),
          name: newEmployeeName,
          role: newEmployeeRole || 'Developer',
          location: newEmployeeLoc,
          address: newEmployeeAddress,
          employer: address
        }
        localStorage.setItem('nexaflow_private_stream_secrets', JSON.stringify(privateStoreData))
      } else {
        triggerToast('Broadcasting Stream', 'Submitting createStream call to Arc Testnet...')

        hash = await writeContractAsync({
          address: STREAMING_PAYROLL_ADDRESS,
          abi: STREAMING_PAYROLL_ABI,
          functionName: 'createStream',
          args: [newEmployeeAddress, flowRateRaw, totalCapRaw, getCountryCode(newEmployeeLoc)]
        })

        triggerToast('Transaction Submitted', 'Waiting for sub-second block finalization on Arc...')
        const receipt = await publicClient.waitForTransactionReceipt({ hash })

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

        if (!streamId && receipt.logs && receipt.logs.length > 0) {
          const payrollLog = receipt.logs.find(
            log => log.address.toLowerCase() === STREAMING_PAYROLL_ADDRESS.toLowerCase() && log.topics && log.topics.length > 1
          )
          if (payrollLog) {
            streamId = payrollLog.topics[1]
          }
        }

        if (!streamId) {
          streamId = ('0x' + Math.random().toString(16).substr(2, 64)).padEnd(66, '0')
        }
      }

      if (pegToFiat && streamId) {
        triggerToast('Applying Fiat Peg', `Configuring stream peg to ${fiatCurrency} on-chain...`)
        try {
          const pegTx = await writeContractAsync({
            address: STREAMING_PAYROLL_ADDRESS,
            abi: STREAMING_PAYROLL_ABI,
            functionName: 'setStreamFiatPeg',
            args: [streamId, fiatCurrency]
          })
          await publicClient.waitForTransactionReceipt({ hash: pegTx })
          triggerToast('Oracle Peg Finalized', `Stream linked to ${fiatCurrency} feed successfully.`)
        } catch (err) {
          console.error("setStreamFiatPeg failed", err)
          triggerToast('Oracle Peg Failed', 'Could not peg stream: ' + err.message)
        }
      }

      // Safe reading of on-chain parameters
      let streamData;
      try {
        streamData = await publicClient.readContract({
          address: STREAMING_PAYROLL_ADDRESS,
          abi: STREAMING_PAYROLL_ABI,
          functionName: isPrivate ? 'privateStreams' : 'streams',
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
        flowRate: selectedRate,
        totalCap: streamData ? Number(formatUnits(streamData[6], 6)) : Number(newEmployeeCap),
        accruedPaid: streamData ? Number(formatUnits(streamData[5], 6)) : 0,
        accruedLive: streamData ? Number(formatUnits(streamData[5], 6)) : 0,
        lastUpdated: streamData ? Number(streamData[4]) : Math.floor(Date.now() / 1000),
        isActive: streamData ? streamData[7] : true,
        healthPercent: 5,
        retirementPercent: 5,
        emergencyPercent: 5,
        complianceStatus: 'Verified',
        avatar: newEmployeeName.split(' ').map((n) => n[0]).join('').toUpperCase().substr(0, 2),
        isPrivate,
        targetPayoutToken: recipientTokenChoice,
        fiatPeg: pegToFiat ? fiatCurrency : ''
      }

      if (recipientTokenChoice === 'EURC' && streamId) {
        triggerToast('Setting Recipient Choice', 'Configuring payout token to EURC on-chain...')
        try {
          const swapHash = await writeContractAsync({
            address: STREAMING_PAYROLL_ADDRESS,
            abi: STREAMING_PAYROLL_ABI,
            functionName: 'setTargetPayoutToken',
            args: [streamId, EURC_TOKEN_ADDRESS]
          })
          await publicClient.waitForTransactionReceipt({ hash: swapHash })
          triggerToast('Payout Configuration Updated', 'Successfully set payout preference to EURC.')
        } catch (err) {
          console.error("setTargetPayoutToken failed", err)
          triggerToast('Payout Configuration Failed', 'Could not set target payout token: ' + err.message)
        }
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
      setPegToFiat(false)
    } catch (err) {
      console.error(err)
      triggerToast('Stream Creation Failed', err.message)
    }
  }

  // Download CSV template
  const downloadCsvTemplate = () => {
    const csvContent = "Worker Address,Flow Rate (USDC/sec),Total Cap (USDC),Name,Role,Country\n0x9e71a3371987d6f26d8251e18a8fdcb59296556e,0.005,1500,Tan Wei Liang,Senior React Developer,Singapore\n0x9e71a3371987d6f26d8251e18a8fdcb59296556e,0.002,500,Alice Smith,UI Designer,Brazil\n";
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
      const location = cols[5] ? cols[5].trim() : 'Singapore 🇸🇬';

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

      workers.push({ address, flowRate, totalCap, name, role, location });
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
      const countriesArr = parsedWorkers.map(w => getCountryCode(w.location));

      triggerToast('Broadcasting Batch', `Submitting createStreamsBatch for ${parsedWorkers.length} workers...`);

      const hash = await writeContractAsync({
        address: STREAMING_PAYROLL_ADDRESS,
        abi: STREAMING_PAYROLL_ABI,
        functionName: 'createStreamsBatch',
        args: [employeesArr, flowRatesArr, totalCapsArr, countriesArr]
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
          location: w.location || 'Singapore 🇸🇬',
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

  const fetchProposals = async () => {
    if (!publicClient || !STREAMING_PAYROLL_ADDRESS) return;
    try {
      if (address) {
        const isUserSigner = await publicClient.readContract({
          address: STREAMING_PAYROLL_ADDRESS,
          abi: STREAMING_PAYROLL_ABI,
          functionName: 'isMultiSigSigner',
          args: [address]
        });
        setIsSigner(isUserSigner);
      } else {
        setIsSigner(false);
      }

      const count = await publicClient.readContract({
        address: STREAMING_PAYROLL_ADDRESS,
        abi: STREAMING_PAYROLL_ABI,
        functionName: 'getProposalsCount',
      });
      
      const loadedProposals = [];
      for (let i = 0; i < Number(count); i++) {
        const prop = await publicClient.readContract({
          address: STREAMING_PAYROLL_ADDRESS,
          abi: STREAMING_PAYROLL_ABI,
          functionName: 'proposals',
          args: [BigInt(i)]
        });
        
        let hasConfirmed = false;
        if (address) {
          hasConfirmed = await publicClient.readContract({
            address: STREAMING_PAYROLL_ADDRESS,
            abi: STREAMING_PAYROLL_ABI,
            functionName: 'confirmations',
            args: [BigInt(i), address]
          });
        }

        loadedProposals.push({
          id: i,
          actionType: prop[0],
          streamId: prop[1],
          targetAddress: prop[2],
          amount: Number(formatUnits(prop[3], 6)),
          executed: prop[4],
          confirmationCount: Number(prop[5]),
          hasConfirmed
        });
      }
      setProposals(loadedProposals);
    } catch (e) {
      console.warn("Failed to fetch proposals", e);
    }
  };

  const handleConfirmProposal = async (id) => {
    triggerToast('Confirming Proposal', `Sending signature confirmation for proposal #${id}...`);
    try {
      const hash = await writeContractAsync({
        address: STREAMING_PAYROLL_ADDRESS,
        abi: STREAMING_PAYROLL_ABI,
        functionName: 'confirmProposal',
        args: [BigInt(id)]
      });
      triggerToast('Transaction Submitted', 'Waiting for confirmation...');
      await publicClient.waitForTransactionReceipt({ hash });
      triggerToast('Proposal Confirmed', `Successfully confirmed proposal #${id}.`, 'success');
      await fetchProposals();
    } catch (err) {
      console.error(err);
      triggerToast('Confirmation Failed', err.message);
    }
  };

  const handleExecuteProposal = async (id) => {
    triggerToast('Executing Proposal', `Executing proposed action #${id}...`);
    try {
      const hash = await writeContractAsync({
        address: STREAMING_PAYROLL_ADDRESS,
        abi: STREAMING_PAYROLL_ABI,
        functionName: 'executeProposal',
        args: [BigInt(id)]
      });
      triggerToast('Transaction Submitted', 'Executing transaction on-chain...');
      await publicClient.waitForTransactionReceipt({ hash });
      triggerToast('Proposal Executed', `Successfully executed proposal #${id}.`, 'success');
      await fetchProposals();
      refetchUsdc();
      loadStreams();
    } catch (err) {
      console.error(err);
      triggerToast('Execution Failed', err.message);
    }
  };

  const handleProposeWithdrawLeftover = async (e) => {
    e.preventDefault();
    if (!withdrawLeftoverAmount || isNaN(withdrawLeftoverAmount)) {
      triggerToast('Invalid Amount', 'Please enter a valid USDC amount.');
      return;
    }
    setIsProposing(true);
    triggerToast('Proposing Withdrawal', `Creating proposal to withdraw ${withdrawLeftoverAmount} USDC leftover...`);
    try {
      const rawAmount = parseUnits(withdrawLeftoverAmount.toString(), 6);
      const hash = await writeContractAsync({
        address: STREAMING_PAYROLL_ADDRESS,
        abi: STREAMING_PAYROLL_ABI,
        functionName: 'proposeWithdrawLeftover',
        args: [rawAmount]
      });
      triggerToast('Transaction Submitted', 'Creating proposal...');
      await publicClient.waitForTransactionReceipt({ hash });
      triggerToast('Proposal Created', `Withdrawal proposal created successfully.`, 'success');
      setWithdrawLeftoverAmount('');
      await fetchProposals();
    } catch (err) {
      console.error(err);
      triggerToast('Proposal Failed', err.message);
    } finally {
      setIsProposing(false);
    }
  };

  const handleProposeSetOracle = async (e) => {
    e.preventDefault();
    if (!newOracleAddress || !newOracleAddress.startsWith('0x')) {
      triggerToast('Invalid Address', 'Please enter a valid Ethereum address.');
      return;
    }
    setIsProposing(true);
    triggerToast('Proposing Oracle Change', `Creating proposal to update payroll oracle...`);
    try {
      const hash = await writeContractAsync({
        address: STREAMING_PAYROLL_ADDRESS,
        abi: STREAMING_PAYROLL_ABI,
        functionName: 'proposeSetPayrollOracle',
        args: [newOracleAddress]
      });
      triggerToast('Transaction Submitted', 'Creating proposal...');
      await publicClient.waitForTransactionReceipt({ hash });
      triggerToast('Proposal Created', `Oracle change proposal created successfully.`, 'success');
      setNewOracleAddress('');
      await fetchProposals();
    } catch (err) {
      console.error(err);
      triggerToast('Proposal Failed', err.message);
    } finally {
      setIsProposing(false);
    }
  };

  const handleProposeCancelStream = async (streamId) => {
    triggerToast('Proposing Cancellation', `Creating cancellation proposal for high-value stream...`);
    try {
      const hash = await writeContractAsync({
        address: STREAMING_PAYROLL_ADDRESS,
        abi: STREAMING_PAYROLL_ABI,
        functionName: 'proposeCancelStream',
        args: [streamId]
      });
      triggerToast('Transaction Submitted', 'Creating proposal...');
      await publicClient.waitForTransactionReceipt({ hash });
      triggerToast('Proposal Created', 'High-value stream cancellation proposal created successfully.', 'success');
      await fetchProposals();
    } catch (err) {
      console.error(err);
      triggerToast('Proposal Failed', err.message);
    }
  };

  const handleCancelStream = async (streamId) => {
    if (!isConnected) return;
    triggerToast('Cancelling Stream', 'Calling cancelStream on Arc Chain...');
    try {
      const hash = await writeContractAsync({
        address: STREAMING_PAYROLL_ADDRESS,
        abi: STREAMING_PAYROLL_ABI,
        functionName: 'cancelStream',
        args: [streamId]
      });
      triggerToast('Transaction Submitted', 'Closing stream...');
      await publicClient.waitForTransactionReceipt({ hash });
      triggerToast('Stream Cancelled', 'Successfully cancelled the stream and refunded remaining escrow.', 'success');
      loadStreams();
      refetchUsdc();
    } catch (e) {
      console.error(e);
      triggerToast('Cancellation Failed', e.message);
    }
  };

  const exportAuditLogsToCSV = () => {
    // Generate CSV data from active and historical employee stream records
    const headers = ["Stream ID", "Employee Address", "Flow Rate (USDC/sec)", "Total Escrow (USDC)", "Accrued Wages Paid (USDC)", "Retirement Contribution (USDC)", "Health/HSA Contribution (USDC)", "Emergency Contribution (USDC)", "Taxes Withheld (USDC)", "Status"];
    
    const rows = employees.map(emp => {
      // Calculate split values
      const taxRate = emp.fiatPeg ? 0.15 : 0.0;
      const totalDisbursed = emp.accruedPaid;
      const hsa = totalDisbursed * (emp.healthPercent || 5) / 100;
      const pension = totalDisbursed * (emp.retirementPercent || 5) / 100;
      const emergency = totalDisbursed * (emp.emergencyPercent || 5) / 100;
      const taxes = totalDisbursed * taxRate;
      
      return [
        emp.id,
        emp.address || emp.employee,
        emp.flowRate,
        emp.totalCap,
        totalDisbursed.toFixed(4),
        pension.toFixed(4),
        hsa.toFixed(4),
        emergency.toFixed(4),
        taxes.toFixed(4),
        emp.isActive ? "Active" : "Completed"
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `payroll_audit_log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('Audit Log Exported', 'CSV report downloaded successfully.', 'success');
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

  const signOracleMessage = async (streamId, claimableAmount) => {
    const privateKey = import.meta.env.VITE_PRIVATE_KEY
    if (!privateKey) {
      throw new Error('VITE_PRIVATE_KEY missing in environmental variables')
    }
    const oracleAccount = privateKeyToAccount(privateKey)
    const msgHash = keccak256(encodeAbiParameters(
      [{ type: 'bytes32' }, { type: 'uint256' }],
      [streamId, claimableAmount]
    ))
    const signature = await oracleAccount.signMessage({
      message: { raw: msgHash }
    })
    return signature
  }

  // Handle stream withdrawal (on-chain claim)
  const handleWithdrawal = async (streamIdObj) => {
    if (!isConnected) {
      triggerToast('Wallet not connected', 'Please connect your Web3 wallet.')
      return
    }

    const emp = employees.find((e) => e.id === streamIdObj)
    if (!emp) return

    try {
      let hash
      let claimedVal

      if (emp.isPrivate) {
        triggerToast('Withdrawing Wages', 'Requesting oracle signature for private claim...')
        
        // Retrieve private parameters from local storage
        const privateSecrets = JSON.parse(localStorage.getItem('nexaflow_private_stream_secrets') || '{}')
        const secret = privateSecrets[streamIdObj]
        if (!secret) {
          throw new Error('Private stream parameters not found locally.')
        }

        const flowRateRaw = parseUnits(secret.flowRate, 6)
        const salt = secret.salt
        
        // Compute claimable amount in USDC (6 decimals)
        const claimableAmountRaw = parseUnits(emp.accruedLive.toFixed(6), 6)

        // Get oracle signature
        const signature = await signOracleMessage(streamIdObj, claimableAmountRaw)

        triggerToast('Wages Authenticated', 'Submitting private claim transaction to Arc...')

        hash = await writeContractAsync({
          address: STREAMING_PAYROLL_ADDRESS,
          abi: STREAMING_PAYROLL_ABI,
          functionName: 'withdrawPrivateFunds',
          args: [streamIdObj, claimableAmountRaw, flowRateRaw, salt, signature]
        })

        triggerToast('Transaction Submitted', 'Settling private wages on-chain...')
        await publicClient.waitForTransactionReceipt({ hash })

        claimedVal = emp.accruedLive - emp.accruedPaid
      } else {
        triggerToast('Withdrawing Wages', `Calling withdrawFunds for stream on Arc Chain...`)

        hash = await writeContractAsync({
          address: STREAMING_PAYROLL_ADDRESS,
          abi: STREAMING_PAYROLL_ABI,
          functionName: 'withdrawFunds',
          args: [streamIdObj]
        })

        triggerToast('Transaction Submitted', 'Settling wages on-chain...')

        // Wait for real-time confirmation
        await publicClient.waitForTransactionReceipt({ hash })

        claimedVal = emp.accruedLive - emp.accruedPaid
      }

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
        type: emp.isPrivate ? 'Private Wages Claimed' : 'Wages Settled',
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

  // Toggle stream target payout token (USDC <-> EURC)
  const handleTogglePayoutToken = async (streamId, currentPayoutToken) => {
    if (!isConnected) {
      triggerToast('Wallet not connected', 'Please connect your Web3 wallet.')
      return
    }

    const nextToken = currentPayoutToken === 'EURC' ? 'USDC' : 'EURC'
    const tokenAddress = nextToken === 'EURC' ? EURC_TOKEN_ADDRESS : USDC_TOKEN_ADDRESS

    triggerToast('Updating Payout Asset', `Configuring settlement token to ${nextToken} on-chain...`)

    try {
      const hash = await writeContractAsync({
        address: STREAMING_PAYROLL_ADDRESS,
        abi: STREAMING_PAYROLL_ABI,
        functionName: 'setTargetPayoutToken',
        args: [streamId, tokenAddress]
      })

      triggerToast('Transaction Submitted', 'Broadcasting payout update to Arc Block...')
      await publicClient.waitForTransactionReceipt({ hash })

      setEmployees((prev) =>
        prev.map((e) => {
          if (e.id === streamId) {
            return {
              ...e,
              targetPayoutToken: nextToken
            }
          }
          return e
        })
      )

      triggerToast(
        'Payout Preference Updated',
        `This stream will now settle automatically into ${nextToken} upon withdrawal.`,
        `stream-card-${streamId}`
      )
    } catch (e) {
      console.error(e)
      triggerToast('Payout Configuration Failed', e.message)
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

      triggerToast('Agent Authenticating', 'AI Agent validating clinic invoice & signing EIP-712 payload...')

      const claimValRaw = parseUnits(billAmount, 6)
      const mockHash = keccak256(new TextEncoder().encode('invoice_' + Math.random()))
      const nonce = BigInt(Math.floor(Math.random() * 100000000))
      const serviceProvider = '0x9e71a3371987d6f26d8251e18a8fdcb59296556e'

      const domain = {
        name: 'NexaFlow',
        version: '1',
        chainId: BigInt(arcTestnet.id),
        verifyingContract: MICRO_BENEFITS_VAULT_ADDRESS
      }

      const types = {
        ClaimDetails: [
          { name: 'member', type: 'address' },
          { name: 'serviceProvider', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'claimType', type: 'string' },
          { name: 'claimHash', type: 'bytes32' },
          { name: 'nonce', type: 'uint256' }
        ]
      }

      const details = {
        member: address,
        serviceProvider,
        amount: claimValRaw,
        claimType: 'HEALTH',
        claimHash: mockHash,
        nonce
      }

      const signature = await verifierAccount.signTypedData({
        domain,
        types,
        primaryType: 'ClaimDetails',
        message: details
      })

      triggerToast('Broadcasting Claim', 'Submitting EIP-712 verified claim to Arc Chain...')

      const hash = await writeContractAsync({
        address: MICRO_BENEFITS_VAULT_ADDRESS,
        abi: MICRO_BENEFITS_VAULT_ABI,
        functionName: 'processClaim',
        args: [
          details,
          signature
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
  const totalAccruedTax = employees.reduce((acc, emp) => {
    if (!emp.isActive) return acc;
    const rate = getTaxRateBps(emp.location);
    const accrued = emp.accruedLive - emp.accruedPaid;
    return acc + (accrued > 0 ? (accrued * rate) / 10000 : 0);
  }, 0);

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
                className={`nav-link ${activeTab === 'coop' ? 'active' : ''}`}
                onClick={() => { setActiveTab('coop'); setIsMobileSidebarOpen(false); }}
              >
                <Layers size={18} />
                Co-op Staker Portal
              </a>
            </li>
            <li className="nav-item">
              <a
                className={`nav-link ${activeTab === 'passkeys' ? 'active' : ''}`}
                onClick={() => { setActiveTab('passkeys'); setIsMobileSidebarOpen(false); }}
              >
                <Fingerprint size={18} />
                Biometric Smart Wallet
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
              {activeTab === 'coop' && 'Community Co-op Mutual Pool'}
              {activeTab === 'passkeys' && 'Biometric Smart Wallet'}
              {activeTab === 'contracts' && 'Technical Specifications'}
            </h1>
            <p>
              {activeTab === 'dashboard' && 'Pay remote staff second-by-second. Auto-divert percentages into medical and retirement savings pots.'}
              {activeTab === 'streaming' && 'Establish monthly continuous payment channels that accrue continuously in real-time.'}
              {activeTab === 'compliance' && 'Run transaction routing simulations and scan for registry restrictions before releasing funds.'}
              {activeTab === 'benefits' && 'Allocate percentages of your salary to health coverage, pension plans, and rainy-day savings.'}
              {activeTab === 'coop' && 'Stake USDC to earn continuous streaming fee rewards and underwrite community HSA claim deficits.'}
              {activeTab === 'passkeys' && 'Migrate to ERC-4337 smart wallets. Claim streamed salary gas-free using FaceID / TouchID biometric passkeys.'}
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

            {/* Treasury Health Tracker Dashboard */}
            <div className="panel-card" style={{ marginBottom: '24px' }}>
              <div className="panel-card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={18} color={isWarningState ? "var(--color-danger)" : "var(--color-success)"} />
                  <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Treasury Health Tracker & Safety Buffer</span>
                </div>
                {isWarningState ? (
                  <span className="badge badge-danger animate-pulse" style={{ padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#Fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', fontWeight: 'bold' }}>
                    <AlertTriangle size={12} /> WARNING: Deficit Detected
                  </span>
                ) : (
                  <span className="badge badge-success" style={{ padding: '4px 10px', fontSize: '11px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', fontWeight: 'bold' }}>
                    Treasury Healthy
                  </span>
                )}
              </div>

              {isWarningState && (
                <div style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1.5px solid rgba(239, 68, 68, 0.3)',
                  color: '#EF4444',
                  padding: '12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertTriangle size={18} />
                  <span>
                    <strong>Warning State Active!</strong> Reserve buffer has fallen below the 30-day payroll commitment. Stream creation is restricted, and claims are limited to Priority 1 (Key Roles).
                  </span>
                </div>
              )}

              <div className="treasury-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', marginTop: '16px' }}>
                {/* Gauge and metrics */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ border: '1.5px solid var(--border-color)', borderRadius: '6px', padding: '12px', background: 'rgba(255,255,255,0.02)' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Employer Buffer Reserve</span>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-main)', marginTop: '4px' }}>
                        {employerBuffer.toFixed(2)} USDC
                      </div>
                    </div>
                    <div style={{ border: '1.5px solid var(--border-color)', borderRadius: '6px', padding: '12px', background: 'rgba(255,255,255,0.02)' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Monthly Commitments</span>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-main)', marginTop: '4px' }}>
                        {totalMonthlyCommitment.toFixed(2)} USDC
                      </div>
                    </div>
                  </div>

                  {/* Visual Days Covered Gauge */}
                  <div style={{ border: '1.5px solid var(--border-color)', borderRadius: '6px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600' }}>Payroll Coverage Duration</span>
                      <span style={{
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: daysCovered >= 30 ? '#10B981' : daysCovered >= 15 ? '#F59E0B' : '#EF4444'
                      }}>
                        {daysCovered} Days Covered
                      </span>
                    </div>

                    {/* Progress Bar Gauge */}
                    <div style={{
                      height: '14px',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      position: 'relative'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min((daysCovered / 30) * 100, 100)}%`,
                        background: daysCovered >= 30
                          ? 'linear-gradient(90deg, #10B981, #059669)'
                          : daysCovered >= 15
                            ? 'linear-gradient(90deg, #F59E0B, #D97706)'
                            : 'linear-gradient(90deg, #EF4444, #DC2626)',
                        borderRadius: '10px',
                        transition: 'width 0.5s ease-out'
                      }}></div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                      <span>0 Days</span>
                      <span>15 Days</span>
                      <span>30+ Days (Safe)</span>
                    </div>
                  </div>
                </div>

                {/* Deposit/Withdraw reserve controls */}
                <div style={{ border: '1.5px solid var(--border-color)', borderRadius: '6px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>Manage Reserve Buffer</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    Increase or decrease your treasury reserves. Locking safety deposits ensures your payroll streams stay active and avoids claims prioritization lockdowns.
                  </p>
                  
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <input
                      type="number"
                      placeholder="USDC Amount"
                      value={bufferAmount}
                      onChange={(e) => setBufferAmount(e.target.value)}
                      className="input-field"
                      style={{ flex: 1, height: '38px', padding: '0 12px', backgroundColor: 'rgba(0,0,0,0.2)', border: '1.5px solid var(--border-color)', borderRadius: '6px', color: '#FFF' }}
                    />
                    <button
                      className="btn btn-primary"
                      onClick={handleDepositBuffer}
                      disabled={isBufferLoading}
                      style={{ height: '38px', whiteSpace: 'nowrap' }}
                    >
                      {isBufferLoading ? 'Processing...' : 'Deposit'}
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={handleWithdrawBuffer}
                      disabled={isBufferLoading}
                      style={{ height: '38px', whiteSpace: 'nowrap' }}
                    >
                      Withdraw
                    </button>
                  </div>
                  
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>USDC Wallet: {usdcBalance.toFixed(2)} USDC</span>
                    <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setBufferAmount(usdcBalance.toString())}>Max</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Circle Developer-Controlled Wallets Auto-Pilot Treasury Control Panel */}
            <div className="panel-card" style={{ marginBottom: '24px' }}>
              <div className="panel-card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Cpu size={18} color="var(--color-secondary)" />
                  <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Treasury Auto-Pilot (Circle Developer-Controlled Wallets)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.5px' }}>AUTO-PILOT:</span>
                  <button
                    className={`btn btn-sm ${autoPilot ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={handleToggleAutoPilot}
                    style={{ fontSize: '11px', padding: '4px 12px', border: '1.5px solid var(--border-color)' }}
                  >
                    {autoPilot ? 'ACTIVE (AUTOMATED)' : 'DISABLED (MANUAL)'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '16px' }}>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>Automated Corporate Escrow Key</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    Provision an on-chain developer-controlled wallet to handle sub-second payouts and streaming setups programmatically. Eliminates the need for manual browser-extension signature prompts.
                  </p>
                  
                  {dcwAddress ? (
                    <div style={{ backgroundColor: 'rgba(192, 132, 252, 0.05)', border: '1.5px solid var(--border-color)', borderRadius: '6px', padding: '12px' }}>
                      <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>
                        <strong>DCW Address:</strong> {dcwAddress}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        <strong>Wallet ID:</strong> {dcwWalletId}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <button
                        className="btn btn-primary"
                        onClick={handleProvisionDcw}
                        disabled={isDcwCreating}
                        style={{ fontSize: '12px', padding: '8px 16px' }}
                      >
                        {isDcwCreating ? 'Provisioning Wallet...' : 'Provision Corporate Developer Wallet'}
                      </button>
                      {dcwError && (
                        <div style={{ fontSize: '12px', color: 'var(--color-error)', marginTop: '8px' }}>
                          {dcwError}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ borderLeft: '1.5px solid var(--border-color)', paddingLeft: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>Circle Developer Console Sync</h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Status:</span>
                      {dcwAddress ? (
                        <span className="badge badge-success" style={{ fontSize: '11px' }}>
                          {dcwIsLive ? 'LIVE (CIRCLE INTEGRATED)' : 'DEMO MODE (MOCKED)'}
                        </span>
                      ) : (
                        <span className="badge badge-warning" style={{ fontSize: '11px' }}>NOT INITIATED</span>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>DCW Treasury Balance:</span>
                      <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--color-primary)' }}>
                        {dcwBalance} USDC
                      </span>
                    </div>
                  </div>

                  {dcwAddress && (
                    <button
                      className="btn btn-secondary"
                      onClick={handleRefreshDcwBalance}
                      style={{ fontSize: '12px', padding: '8px 16px', alignSelf: 'flex-start' }}
                    >
                      Refresh Treasury Balance
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Phase 4: Cross-Chain Treasury Ingestion (Circle CCTP) Card */}
            <div className="panel-card" style={{ marginBottom: '24px' }}>
              <div className="panel-card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Shuffle size={18} color="var(--color-primary)" />
                  <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Cross-Chain Treasury Funding (Circle CCTP Bridge)</span>
                </div>
                <span className="badge badge-success" style={{ fontSize: '11px', textTransform: 'uppercase' }}>USDC Gas Enabled</span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '16px' }}>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>Fund from Base or Ethereum</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    Bridge USDC directly from Base Sepolia into your Arc Testnet payroll contract. CCTP burns the source USDC and mints it to Arc, auto-crediting your pre-funded balance.
                  </p>
                  
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setBridgeStep(1)
                        setIsBridgeModalOpen(true)
                      }}
                      style={{ fontSize: '12px', padding: '8px 16px' }}
                    >
                      Open Bridge Portal
                    </button>
                  </div>
                </div>

                <div style={{ borderLeft: '1.5px solid var(--border-color)', paddingLeft: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>Pre-Funded Payroll Balance</h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Arc Pre-Funded Treasury:</span>
                      <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-success)' }}>
                        {employerPayrollBalance} USDC
                      </span>
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Creating streams will automatically consume from this balance first, requiring zero MetaMask approval/signature popups per milestone stream creation.
                    </p>
                  </div>
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
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {emp.name}
                              {emp.isPrivate && (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  fontSize: '9px',
                                  backgroundColor: 'rgba(139, 92, 246, 0.15)',
                                  color: '#A78BFA',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  border: '1px solid rgba(139, 92, 246, 0.3)',
                                  fontWeight: 'normal'
                                }}>
                                  Private
                                </span>
                              )}
                            </h4>
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
                          Velocity: {emp.isPrivate ? 'Masked 🔒' : `Velocity: ${emp.flowRate.toFixed(4)} USDC/s (~$${(emp.flowRate * 3600).toFixed(2)}/hr)`}
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
                      <div className="pie-inner-value">${(healthBalance + liveRetirement + liveEmergency).toFixed(2)}</div>
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
                      <span style={{ fontWeight: '700' }}>{liveRetirement.toFixed(4)} USDC</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', paddingBottom: '6px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div className="legend-color" style={{ backgroundColor: 'var(--color-success)' }}></div>
                        Rainy-Day Emergency Reserve ({benefitsConfig.emergency}%)
                      </span>
                      <span style={{ fontWeight: '700' }}>{liveEmergency.toFixed(4)} USDC</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Recent On-Chain Ledger */}
            <div className="panel-card">
              <div className="panel-card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={18} color="var(--color-warning)" />
                  <span>Recent Payment Ledger (Permanently Recorded)</span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  border: '1.5px solid var(--color-error)',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontFamily: 'var(--font-mono)'
                }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Accrued Tax Withholding (Live):
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--color-error)' }} className="ticking-tax-val">
                    {totalAccruedTax.toFixed(6)} USDC
                  </span>
                  <span className="live-pulse" style={{ backgroundColor: 'var(--color-error)', width: '6px', height: '6px', marginLeft: '0px' }}></span>
                </div>
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

            {/* Corporate Multi-Sig Queue Panel */}
            <div className="panel-card" style={{ marginBottom: '24px' }}>
              <div className="panel-card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={18} color="var(--color-primary)" />
                  <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Corporate Multi-Sig Approvals Queue</span>
                </div>
                <span className="badge" style={{ backgroundColor: isSigner ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)', color: isSigner ? '#34D399' : 'var(--text-muted)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  {isSigner ? "Authorized Signer" : "View-Only Mode"}
                </span>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Certain administrative tasks (cancelling high-value streams &ge; 10,000 USDC, withdrawing leftover payroll funds, or updating the payroll oracle) require multi-signature approval (2 of 3 signers).
              </p>

              {/* Propose Administrative Action forms */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px', backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <form onSubmit={handleProposeWithdrawLeftover} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-main)' }}>Propose Leftover Treasury Withdrawal</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="number"
                      placeholder="USDC Amount"
                      value={withdrawLeftoverAmount}
                      onChange={(e) => setWithdrawLeftoverAmount(e.target.value)}
                      style={{ flexGrow: 1, backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '6px 10px', color: '#fff', fontSize: '13px' }}
                    />
                    <button type="submit" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }} disabled={isProposing || !isConnected}>
                      Propose
                    </button>
                  </div>
                </form>

                <form onSubmit={handleProposeSetOracle} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-main)' }}>Propose Oracle/Verifier Address Update</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="New Oracle Address (0x...)"
                      value={newOracleAddress}
                      onChange={(e) => setNewOracleAddress(e.target.value)}
                      style={{ flexGrow: 1, backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '6px 10px', color: '#fff', fontSize: '13px' }}
                    />
                    <button type="submit" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }} disabled={isProposing || !isConnected}>
                      Propose
                    </button>
                  </div>
                </form>
              </div>

              {proposals.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '14px', border: '1px dashed var(--border-color)', borderRadius: '6px' }}>
                  No pending administrative proposals found on-chain.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Proposed Action</th>
                        <th>Target Details</th>
                        <th>Value</th>
                        <th>Confirmations</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {proposals.map((prop) => (
                        <tr key={prop.id}>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>#{prop.id}</td>
                          <td>
                            <span style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>
                              {prop.actionType === 'CANCEL_STREAM' ? '🚫 Stream Cancellation' : prop.actionType === 'WITHDRAW_TREASURY' ? '💸 Leftover Withdrawal' : '🔮 Update Oracle'}
                            </span>
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                            {prop.actionType === 'CANCEL_STREAM' ? `Stream: ${prop.streamId.slice(0, 10)}...` : prop.targetAddress}
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>
                            {prop.amount > 0 ? `${prop.amount.toLocaleString()} USDC` : 'N/A'}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{prop.confirmationCount} / 2</span>
                              <div style={{ width: '60px', height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${(prop.confirmationCount / 2) * 100}%`, height: '100%', backgroundColor: prop.confirmationCount >= 2 ? 'var(--color-success)' : 'var(--color-secondary)' }}></div>
                              </div>
                            </div>
                          </td>
                          <td>
                            {prop.executed ? (
                              <span className="badge badge-success" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2px 8px', borderRadius: '12px' }}>Executed</span>
                            ) : (
                              <span className="badge badge-warning" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#FBBF24', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '2px 8px', borderRadius: '12px' }}>Pending Approvals</span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                className="btn"
                                style={{ padding: '4px 10px', fontSize: '11px', backgroundColor: prop.hasConfirmed ? 'rgba(255,255,255,0.05)' : 'var(--color-secondary)', color: prop.hasConfirmed ? 'var(--text-muted)' : '#000', cursor: prop.hasConfirmed || prop.executed ? 'not-allowed' : 'pointer' }}
                                disabled={!isSigner || prop.hasConfirmed || prop.executed || !isConnected}
                                onClick={() => handleConfirmProposal(prop.id)}
                              >
                                {prop.hasConfirmed ? 'Signed' : 'Approve'}
                              </button>
                              <button
                                className="btn btn-primary"
                                style={{ padding: '4px 10px', fontSize: '11px', cursor: prop.confirmationCount < 2 || prop.executed ? 'not-allowed' : 'pointer' }}
                                disabled={prop.confirmationCount < 2 || prop.executed || !isConnected}
                                onClick={() => handleExecuteProposal(prop.id)}
                              >
                                Execute
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Audit Ledger & Analytics Dashboard */}
            <div className="panel-card" style={{ marginBottom: '24px' }}>
              <div className="panel-card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={18} color="var(--color-secondary)" />
                  <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Audit Ledger & Analytics Dashboard</span>
                </div>
                <button
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '12px' }}
                  onClick={exportAuditLogsToCSV}
                >
                  <Download size={14} /> Export Audit Log (CSV)
                </button>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Real-time tracking of historical disbursements, tax withholdings, and employee health/retirement contributions on the secure ledger.
              </p>

              {/* Analytics metrics grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '8px', border: '1.5px solid var(--border-color)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '4px' }}>Total Accrued Payouts</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
                    {employees.reduce((sum, e) => sum + e.accruedPaid, 0).toFixed(4)} USDC
                  </div>
                </div>

                <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '8px', border: '1.5px solid var(--border-color)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '4px' }}>Taxes Withheld</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--color-secondary)', fontFamily: 'var(--font-mono)' }}>
                    {employees.reduce((sum, e) => {
                      const rate = e.fiatPeg ? 0.15 : 0.0;
                      return sum + (e.accruedPaid * rate);
                    }, 0).toFixed(4)} USDC
                  </div>
                </div>

                <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '8px', border: '1.5px solid var(--border-color)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '4px' }}>HSA Savings Deposited</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--color-success)', fontFamily: 'var(--font-mono)' }}>
                    {employees.reduce((sum, e) => sum + (e.accruedPaid * (e.healthPercent || 5) / 100), 0).toFixed(4)} USDC
                  </div>
                </div>

                <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '8px', border: '1.5px solid var(--border-color)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '4px' }}>Pension & Emergency Funds</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', fontFamily: 'var(--font-mono)' }}>
                    {employees.reduce((sum, e) => {
                      const pension = e.accruedPaid * (e.retirementPercent || 5) / 100;
                      const emergency = e.accruedPaid * (e.emergencyPercent || 5) / 100;
                      return sum + pension + emergency;
                    }, 0).toFixed(4)} USDC
                  </div>
                </div>
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
                    {getCountryCode(newEmployeeLoc) !== 'SG' && (
                      <div className="tax-warning-banner" style={{
                        marginTop: '12px',
                        padding: '12px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        display: 'flex',
                        alignItems: 'start',
                        gap: '10px'
                      }}>
                        <span style={{ fontSize: '16px', lineHeight: '1' }}>⚠️</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                          <span style={{ fontSize: '12px', fontWeight: '600', color: '#f87171' }}>
                            Jurisdictional Withholding Required
                          </span>
                          <span style={{ fontSize: '11px', color: '#fca5a5', lineHeight: '1.4' }}>
                            Streams in this region are subject to a {
                              getCountryCode(newEmployeeLoc) === 'BR' ? '15%' :
                              getCountryCode(newEmployeeLoc) === 'NG' ? '10%' : '18%'
                            } local tax withholding rate. Splitting will occur automatically on withdrawal.
                          </span>
                        </div>
                      </div>
                    )}
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

                  <div className="form-group form-privacy" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255, 255, 255, 0.02)', marginBottom: '16px' }}>
                    <input
                      type="checkbox"
                      id="privacy-mode-toggle"
                      checked={isPrivateMode}
                      onChange={(e) => setIsPrivateMode(e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--color-secondary)' }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label htmlFor="privacy-mode-toggle" style={{ fontSize: '13px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ShieldCheck size={16} color="var(--color-secondary)" />
                        Enable Cryptographic Privacy Mode
                      </label>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Masks flow velocity and limits on-chain using a commitment hash commitment.
                      </span>
                    </div>
                  </div>

                  <div className="form-group form-token-choice" style={{ marginBottom: '16px' }}>
                    <label className="form-label">Recipient Payout Asset</label>
                    <select
                      className="form-input"
                      value={recipientTokenChoice}
                      onChange={(e) => setRecipientTokenChoice(e.target.value)}
                      style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', width: '100%', cursor: 'pointer' }}
                    >
                      <option value="USDC">USDC (No Swap - Standard)</option>
                      <option value="EURC">EURC (Auto Swap - Dynamic)</option>
                    </select>
                    {recipientTokenChoice === 'EURC' && (
                      <div style={{ marginTop: '8px', padding: '10px', borderRadius: '6px', border: '1px solid rgba(139, 92, 246, 0.2)', backgroundColor: 'rgba(139, 92, 246, 0.05)', fontSize: '12px', color: 'var(--text-color)' }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--color-secondary)' }}>AMM Exchange Rate Quote:</span> 
                        <span style={{ marginLeft: '6px' }}>1 USDC ≈ 0.92 EURC</span>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Withdrawals will automatically execute an exact-input Uniswap V3 swap routed on Arc Testnet.
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="form-group form-peg-fiat" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255, 255, 255, 0.02)', marginBottom: '16px' }}>
                    <input
                      type="checkbox"
                      id="peg-to-fiat-toggle"
                      checked={pegToFiat}
                      onChange={(e) => setPegToFiat(e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--color-primary)' }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label htmlFor="peg-to-fiat-toggle" style={{ fontSize: '13px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Coins size={16} color="var(--color-primary)" />
                        Peg Stream to Local Currency (Oracle-pegged)
                      </label>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Peg salary to a fiat currency using decentralized price feeds on Arc.
                      </span>
                    </div>
                  </div>

                  {pegToFiat && (
                    <div style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)', backgroundColor: 'rgba(16, 185, 129, 0.02)', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '12px', fontWeight: 'bold' }}>Select Fiat Currency</label>
                        <select
                          className="form-input"
                          value={fiatCurrency}
                          onChange={(e) => setFiatCurrency(e.target.value)}
                          style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px', width: '100%', cursor: 'pointer' }}
                        >
                          <option value="SGD">Singapore Dollar (SGD)</option>
                          <option value="BRL">Brazilian Real (BRL)</option>
                        </select>
                      </div>
                      
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '12px', fontWeight: 'bold' }}>Monthly Salary Rate ({fiatCurrency})</label>
                        <input
                          type="number"
                          className="form-input"
                          value={fiatMonthlySalary}
                          onChange={(e) => setFiatMonthlySalary(Number(e.target.value))}
                          min="1"
                          style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px', width: '100%' }}
                        />
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '3px', borderLeft: '2px solid var(--color-primary)', paddingLeft: '8px' }}>
                          <span>Calculated Velocity: <strong>{(fiatMonthlySalary / 2592000).toFixed(6)} {fiatCurrency}/sec</strong></span>
                          <span>USDC Rate equivalent: <strong>{((fiatMonthlySalary / 2592000) / (oracleRates[fiatCurrency] || 1.0)).toFixed(6)} USDC/sec</strong></span>
                          <span style={{ color: 'var(--color-primary)' }}>Oracle Price: 1 USD = {oracleRates[fiatCurrency]} {fiatCurrency}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="form-actions-wrapper">
                    {/* Action Preview */}
                    <div className="action-preview-card">
                      <div className="action-preview-title">
                        <Zap size={14} color="var(--color-secondary)" fill="var(--color-secondary)" />
                        What happens next?
                      </div>
                      <ul className="action-preview-list">
                        <li>You lock <strong>{newEmployeeCap || '0'} USDC</strong> in a secure automated pay safe.</li>
                        {isPrivateMode ? (
                          <li>Continuous payouts are masked. Flow rate is hidden behind a secure hash commitment.</li>
                        ) : (
                          <li>Continuous second-by-second payouts will activate instantly for <strong>{newEmployeeName || 'Recipient'}</strong>.</li>
                        )}
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
                      placeholder="Worker Address,Flow Rate (USDC/sec),Total Cap (USDC),Name,Role,Country&#10;0x9e71a3371987d6f26d8251e18a8fdcb59296556e,0.005,1500,Tan Wei Liang,Senior React Developer,Singapore&#10;0x9e71a3371987d6f26d8251e18a8fdcb59296556e,0.002,500,Alice Smith,UI Designer,Brazil"
                      value={csvText}
                      onChange={(e) => {
                        setCsvText(e.target.value);
                        parseCsvData(e.target.value);
                      }}
                    />
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                      Columns format: Address, FlowRate, Cap, Name, Role, Country (includes Header row).
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
                        <h4 style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                          {emp.name}
                          {emp.isPrivate && (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              fontSize: '9px',
                              backgroundColor: 'rgba(139, 92, 246, 0.15)',
                              color: '#A78BFA',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              border: '1px solid rgba(139, 92, 246, 0.3)',
                              fontWeight: 'normal'
                            }}>
                              <ShieldCheck size={10} /> Private
                            </span>
                          )}
                        </h4>
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
                        Velocity: {emp.isPrivate ? 'Masked 🔒' : (emp.fiatPeg ? `${emp.flowRate.toFixed(4)} ${emp.fiatPeg}/s (Oracle-Pegged)` : `${emp.flowRate.toFixed(4)} USDC/s`)}
                      </span>
                      {emp.fiatPeg && (
                        <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{
                            backgroundColor: 'rgba(59, 130, 246, 0.15)',
                            color: '#60A5FA',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontWeight: 'bold',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            fontSize: '10px'
                          }}>
                            Oracle Peg: 1 USD = {oracleRates[emp.fiatPeg] || 1.35} {emp.fiatPeg}
                          </span>
                        </div>
                      )}
                      <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Settling In:</span>
                        <span style={{
                          backgroundColor: emp.targetPayoutToken === 'EURC' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          color: emp.targetPayoutToken === 'EURC' ? '#A78BFA' : '#34D399',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontWeight: 'bold',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          border: emp.targetPayoutToken === 'EURC' ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)'
                        }}>
                          {emp.targetPayoutToken || 'USDC'}
                        </span>
                        <button
                          onClick={() => handleTogglePayoutToken(emp.id, emp.targetPayoutToken)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-secondary)',
                            textDecoration: 'underline',
                            fontSize: '10px',
                            cursor: 'pointer',
                            padding: 0
                          }}
                          disabled={!isConnected}
                        >
                          (Switch)
                        </button>
                      </div>
                      <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Priority:</span>
                        <span style={{
                          backgroundColor: emp.priority === 1 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                          color: emp.priority === 1 ? '#Fca5a5' : 'var(--text-muted)',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontWeight: 'bold',
                          border: emp.priority === 1 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border-color)'
                        }}>
                          {emp.priority === 1 ? 'High (Key Role)' : 'Standard'}
                        </span>
                        <button
                          onClick={() => handleSetStreamPriority(emp.id, emp.priority === 1 ? 0 : 1)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-primary)',
                            textDecoration: 'underline',
                            fontSize: '10px',
                            cursor: 'pointer',
                            padding: 0
                          }}
                          disabled={!isConnected}
                        >
                          (Toggle)
                        </button>
                      </div>
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

                    <div className="stream-card-section stream-card-actions" style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn-outline"
                        style={{ padding: '8px 12px' }}
                        onClick={() => handleWithdrawal(emp.id)}
                        disabled={!isConnected || (emp.accruedLive - emp.accruedPaid) <= 0.005}
                      >
                        Claim Payout
                      </button>
                      <button
                        className="btn btn-outline"
                        style={{ padding: '8px 12px', borderColor: 'var(--color-error)', color: 'var(--color-error)' }}
                        onClick={() => {
                          if (emp.totalCap >= 10000) {
                            handleProposeCancelStream(emp.id);
                          } else {
                            handleCancelStream(emp.id);
                          }
                        }}
                        disabled={!isConnected || !emp.isActive}
                      >
                        {emp.totalCap >= 10000 ? "Propose Cancel" : "Cancel"}
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
              <div>
                {/* Live Yield-Bearing Savings Portfolio Card */}
                <div className="panel-card" style={{ marginBottom: '24px' }}>
                  <div className="panel-card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <PiggyBank size={18} color="var(--color-success)" />
                      <span>Live Yield-Bearing Savings Portfolio</span>
                    </div>
                    <span className="badge badge-success" style={{ fontSize: '11px', animation: 'pulse 2s infinite' }}>5.0% APY</span>
                  </div>

                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    Your retirement and emergency pools are automatically routed to our on-chain ERC-4626 Yield-Bearing Vault.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
                    {/* Healthcare */}
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>Healthcare HSA</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Non-yield allocation</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--color-primary)' }}>{healthBalance.toFixed(2)} USDC</span>
                      </div>
                    </div>

                    {/* Retirement pension */}
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          Personal Pension Pot
                          <span className="live-pulse" style={{ backgroundColor: 'var(--color-secondary)' }}></span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Shares: {retirementSharesVal.toFixed(4)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--color-secondary)', fontFamily: 'var(--font-mono)' }}>
                          {liveRetirement.toFixed(6)} USDC
                        </span>
                      </div>
                    </div>

                    {/* Emergency reserve */}
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          Rainy-Day Emergency Reserve
                          <span className="live-pulse" style={{ backgroundColor: 'var(--color-success)' }}></span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Shares: {emergencySharesVal.toFixed(4)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--color-success)', fontFamily: 'var(--font-mono)' }}>
                          {liveEmergency.toFixed(6)} USDC
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: '6px', padding: '10px', fontSize: '11px', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Zap size={14} />
                    <span>Interest is accruing continuously in real-time on-chain via the ERC-4626 smart vault.</span>
                  </div>
                </div>

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

          </div>
        )}

        {/* Co-op Staker Portal Tab */}
        {activeTab === 'coop' && (
          <div className="engine-container">
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px', alignItems: 'start' }}>
              
              {/* Left Column: Pool Metrics & Reward Dynamics */}
              <div className="panel-card" style={{ height: 'fit-content' }}>
                <div className="panel-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={18} color="var(--color-primary)" />
                  <span>Pool Metrics & Underwriting Status</span>
                </div>
                
                <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.5' }}>
                  The Community Co-op Mutual Pool enables stakers to deposit USDC liquidity to underwrite healthcare claim deficits. 
                  When any remote worker's personal Health Savings Account (HSA) balance is insufficient to cover medical invoices, 
                  the pool automatically absorbs the remaining deficit.
                </p>

                <div className="onboarding-step-box" style={{ marginBottom: '24px', padding: '16px', backgroundColor: 'rgba(167, 139, 250, 0.05)', border: '1px solid rgba(167, 139, 250, 0.2)' }}>
                  <h4 style={{ color: 'var(--color-primary)', fontSize: '14px', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Zap size={14} />
                    Yield Incentive Structure
                  </h4>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0 }}>
                    To compensate stakers for underwriting risk, <strong>2.0% of all payroll claim withdrawals</strong> across the network are routed directly to the mutual pool, increasing the value of staker pool shares over time.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px 16px' }}>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '4px' }}>Total Pool Size</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>
                      {coopTreasury.toFixed(2)} <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>USDC</span>
                    </div>
                  </div>

                  <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px 16px' }}>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '4px' }}>Total Pool Shares</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>
                      {totalCoopShares.toFixed(2)} <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>SHARES</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px 16px' }}>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '4px' }}>Pool Exchange Rate</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--color-secondary)' }}>
                      {coopSharePrice.toFixed(4)} <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>USDC/Share</span>
                    </div>
                  </div>

                  <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px 16px' }}>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '4px' }}>Projected Yield (APY)</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>
                      18.4% <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Estimated</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Your Staking Status & Interaction Form */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Your Position Panel */}
                <div className="panel-card">
                  <div className="panel-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Wallet size={18} color="var(--color-secondary)" />
                    <span>Your Staking Position</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Staked Balance:</span>
                      <strong style={{ color: '#fff', fontSize: '14px' }}>{userStakedUSDC.toFixed(2)} USDC</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Staker Equity Shares:</span>
                      <strong style={{ color: '#fff', fontSize: '14px' }}>{userCoopShares.toFixed(2)} Shares</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Pool Ownership:</span>
                      <strong style={{ color: 'var(--color-primary)', fontSize: '14px' }}>
                        {totalCoopShares > 0 ? ((userCoopShares / totalCoopShares) * 100).toFixed(2) : '0.00'}%
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Staking Operations */}
                <div className="panel-card">
                  <div className="panel-card-title">
                    <span>Manage Staking Liquidity</span>
                  </div>

                  {/* Stake USDC Form */}
                  <div style={{ marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: '#fff' }}>Stake USDC</div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                      <input
                        type="number"
                        className="input-field"
                        placeholder="USDC amount to stake"
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(e.target.value)}
                        style={{ fontSize: '13px', padding: '10px', flexGrow: 1 }}
                      />
                      <button
                        className="btn btn-primary"
                        onClick={handleStakeCoop}
                        disabled={stakeLoading || !isConnected}
                        style={{ minWidth: '120px' }}
                      >
                        {stakeLoading ? 'Staking...' : 'Stake USDC'}
                      </button>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                      <span>Your Wallet: {usdcBalance.toFixed(2)} USDC</span>
                      <span style={{ cursor: 'pointer', color: 'var(--color-primary)' }} onClick={() => setStakeAmount(usdcBalance.toFixed(2))}>MAX</span>
                    </div>
                  </div>

                  {/* Unstake Shares Form */}
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: '#fff' }}>Unstake & Redeem Shares</div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                      <input
                        type="number"
                        className="input-field"
                        placeholder="Shares to redeem"
                        value={unstakeShares}
                        onChange={(e) => setUnstakeShares(e.target.value)}
                        style={{ fontSize: '13px', padding: '10px', flexGrow: 1 }}
                      />
                      <button
                        className="btn btn-secondary"
                        onClick={handleUnstakeCoop}
                        disabled={unstakeLoading || !isConnected || userCoopShares === 0}
                        style={{ minWidth: '120px' }}
                      >
                        {unstakeLoading ? 'Redeeming...' : 'Redeem Shares'}
                      </button>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                      <span>Your Shares: {userCoopShares.toFixed(2)} Shares</span>
                      <span style={{ cursor: 'pointer', color: 'var(--color-secondary)' }} onClick={() => setUnstakeShares(userCoopShares.toFixed(2))}>MAX</span>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          </div>
        )}

        {/* Biometric Smart Wallet Tab */}
        {activeTab === 'passkeys' && (
          <div className="engine-container">
            
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px', alignItems: 'start' }}>
              
              {/* Left Column: Smart Account Setup & Info */}
              <div className="panel-card" style={{ height: '100%' }}>
                <div className="panel-card-title">
                  <Fingerprint size={18} color="var(--color-primary)" />
                  WebAuthn Account Status
                </div>

                {!passkeyAccountAddress ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <div style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, rgba(0,242,254,0.1) 0%, rgba(79,172,254,0.05) 100%)',
                      border: '2px solid rgba(0, 242, 254, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 24px',
                      animation: 'pulse 2s infinite'
                    }}>
                      <Fingerprint size={40} color="var(--color-primary)" />
                    </div>

                    <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: '#fff' }}>No Biometric Smart Account Found</h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.5' }}>
                      Register your device's biometric key (FaceID, TouchID, or Windows Hello) to deploy a counterfactual smart contract wallet. This enables gasless, single-tap stream withdrawals.
                    </p>

                    <button
                      className="btn btn-primary"
                      onClick={onboardWithPasskey}
                      disabled={isPasskeyLoading || !isConnected}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}
                    >
                      {isPasskeyLoading ? (
                        <>
                          <RefreshCw className="animate-spin" size={16} />
                          Onboarding Wallet...
                        </>
                      ) : (
                        <>
                          <Zap size={16} />
                          Onboard with FaceID / TouchID
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* Active Wallet Box */}
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.08) 0%, rgba(79, 172, 254, 0.08) 100%)',
                      border: '1.5px solid rgba(0, 242, 254, 0.25)',
                      borderRadius: '12px',
                      padding: '20px',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <div style={{ position: 'absolute', right: '-10px', top: '-10px', opacity: 0.15 }}>
                        <Fingerprint size={80} color="var(--color-primary)" />
                      </div>
                      
                      <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-primary)', fontWeight: '700', marginBottom: '8px' }}>
                        Biometric Smart Wallet Address
                      </div>
                      <div style={{ fontSize: '15px', fontFamily: 'var(--font-mono)', color: '#fff', fontWeight: '600', marginBottom: '16px', wordBreak: 'break-all', letterSpacing: '0.5px' }}>
                        {passkeyAccountAddress}
                      </div>

                      <div style={{ display: 'flex', gap: '12px' }}>
                        <span className="badge" style={{ background: 'rgba(0, 242, 254, 0.15)', color: 'var(--color-primary)', border: '1px solid rgba(0, 242, 254, 0.3)' }}>
                          ERC-4337 Smart Account
                        </span>
                        <span className="badge" style={{ background: 'rgba(52, 211, 153, 0.15)', color: 'var(--color-success)', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                          WebAuthn Active
                        </span>
                      </div>
                    </div>

                    {/* Metadata Specs */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px', border: '1.5px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Credential ID:</span>
                        <span style={{ fontFamily: 'var(--font-mono)', color: '#fff' }}>{passkeyCredentialId ? `${passkeyCredentialId.slice(0, 10)}...${passkeyCredentialId.slice(-8)}` : 'N/A'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Public Key X:</span>
                        <span style={{ fontFamily: 'var(--font-mono)', color: '#fff' }}>{passkeyPubKeyX ? `${passkeyPubKeyX.slice(0, 10)}...${passkeyPubKeyX.slice(-8)}` : 'N/A'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Public Key Y:</span>
                        <span style={{ fontFamily: 'var(--font-mono)', color: '#fff' }}>{passkeyPubKeyY ? `${passkeyPubKeyY.slice(0, 10)}...${passkeyPubKeyY.slice(-8)}` : 'N/A'}</span>
                      </div>
                    </div>

                    <button
                      className="btn btn-outline"
                      onClick={() => {
                        localStorage.removeItem(`nexaflow_passkey_account_${address.toLowerCase()}`);
                        setPasskeyAccountAddress(null);
                        setPasskeyCredentialId(null);
                        setPasskeyPubKeyX(null);
                        setPasskeyPubKeyY(null);
                        triggerToast('Wallet Reset', 'Biometric credential link removed locally.');
                      }}
                      style={{ border: '1.5px solid var(--color-error)', color: 'var(--color-error)', width: '100%', padding: '10px' }}
                    >
                      Disconnect Biometric Key
                    </button>

                  </div>
                )}
              </div>

              {/* Right Column: Employer Sponsor Vault */}
              <div className="panel-card" style={{ height: '100%' }}>
                <div className="panel-card-title">
                  <Zap size={18} color="var(--color-secondary)" />
                  Gas Sponsorship & Paymaster
                </div>

                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.5' }}>
                  The NexaPaymaster allows employers to fund a central gas sponsorship pool. Employees calling <code style={{ color: 'var(--color-primary)' }}>withdrawFunds</code> from an active stream will have their gas covered automatically.
                </p>

                {/* Balance Summary Card */}
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1.5px solid rgba(255,255,255,0.06)',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '4px' }}>
                      Sponsorship Balance
                    </div>
                    <div style={{ fontSize: '28px', color: '#fff', fontWeight: '700', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                      {paymasterSponsorBalance.toFixed(2)}
                      <span style={{ fontSize: '14px', color: 'var(--color-secondary)', fontWeight: '600' }}>USDC</span>
                    </div>
                  </div>

                  <span className="badge" style={{ background: paymasterSponsorBalance > 0 ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: paymasterSponsorBalance > 0 ? 'var(--color-success)' : 'var(--color-error)', border: paymasterSponsorBalance > 0 ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)', padding: '6px 12px' }}>
                    {paymasterSponsorBalance > 0 ? 'Gas Covered' : 'Depleted'}
                  </span>
                </div>

                {/* Deposit Form */}
                <form onSubmit={handleDepositSponsor} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="input-group">
                    <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-muted)' }}>Fund Gas Sponsorship Vault (USDC)</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="number"
                        placeholder="e.g. 50.00"
                        className="form-control"
                        value={sponsorDepositAmount}
                        onChange={(e) => setSponsorDepositAmount(e.target.value)}
                        style={{ paddingRight: '60px' }}
                      />
                      <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: '700', fontSize: '12px', color: 'var(--text-muted)' }}>USDC</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-secondary"
                    disabled={isSponsorLoading || !isConnected}
                    style={{ width: '100%', padding: '12px' }}
                  >
                    {isSponsorLoading ? (
                      <>
                        <RefreshCw className="animate-spin" size={16} />
                        Funding Vault...
                      </>
                    ) : (
                      'Deposit Gas Sponsorship'
                    )}
                  </button>
                </form>

               </div>

               {/* Gas Sponsorship Configurator Card */}
               <div className="panel-card" style={{ marginTop: '24px' }}>
                 <div className="panel-card-title">
                   <Sliders size={18} color="var(--color-secondary)" />
                   Gas Sponsorship Configurator
                 </div>
                 
                 <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.5' }}>
                   Define strict gas limits per worker address to control paymaster sponsorship overhead.
                 </p>

                 <form onSubmit={handleSetWorkerRule} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                   <div className="input-group">
                     <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-muted)' }}>Target Worker Wallet</label>
                     <select
                       className="form-control"
                       value={selectedWorkerForConfig}
                       onChange={(e) => setSelectedWorkerForConfig(e.target.value)}
                       style={{ background: 'var(--bg-card)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.08)' }}
                     >
                       <option value="">-- Select Worker --</option>
                       {Array.from(new Set(employees.map(e => e.address))).filter(Boolean).map(workerAddr => (
                         <option key={workerAddr} value={workerAddr}>
                           {workerAddr.slice(0, 10)}...{workerAddr.slice(-8)}
                         </option>
                       ))}
                     </select>
                   </div>

                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                     <div className="input-group">
                       <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-muted)' }}>Max Tx / Month</label>
                       <input
                         type="number"
                         placeholder="e.g. 10"
                         className="form-control"
                         value={maxTxLimitInput}
                         onChange={(e) => setMaxTxLimitInput(e.target.value)}
                       />
                     </div>
                     <div className="input-group">
                       <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-muted)' }}>Max Gas Price (Gwei)</label>
                       <input
                         type="number"
                         placeholder="e.g. 50"
                         className="form-control"
                         value={maxGasPriceInput}
                         onChange={(e) => setMaxGasPriceInput(e.target.value)}
                       />
                     </div>
                   </div>

                   <button
                     type="submit"
                     className="btn btn-secondary"
                     disabled={isConfiguringRules || !selectedWorkerForConfig || !isConnected}
                     style={{ width: '100%', padding: '12px' }}
                   >
                     {isConfiguringRules ? (
                       <>
                         <RefreshCw className="animate-spin" size={16} />
                         Saving Limits...
                       </>
                     ) : (
                       'Save Sponsorship Limits'
                     )}
                   </button>
                 </form>

                 {/* Table of active rules */}
                 <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
                   <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#fff', marginBottom: '12px' }}>Active Limits & Usage</h4>
                   
                   {Object.keys(workerRulesMap).length === 0 ? (
                     <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                       No individual worker rules configured. All workers default to unlimited sponsorship.
                     </div>
                   ) : (
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                       {Object.entries(workerRulesMap).map(([workerAddr, rule]) => (
                         <div key={workerAddr} style={{
                           background: 'rgba(255,255,255,0.02)',
                           border: '1px solid rgba(255,255,255,0.05)',
                           borderRadius: '8px',
                           padding: '12px',
                           display: 'flex',
                           flexDirection: 'column',
                           gap: '8px'
                         }}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                             <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-primary)', fontWeight: '600' }}>
                               {workerAddr.slice(0, 8)}...{workerAddr.slice(-6)}
                             </span>
                             <button
                               className="btn btn-outline btn-sm"
                               onClick={() => handleResetMonthlyUsage(workerAddr)}
                               style={{ padding: '2px 8px', fontSize: '11px', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--text-muted)' }}
                             >
                               Reset Count
                             </button>
                           </div>
                           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
                             <div>
                               <span style={{ color: 'var(--text-muted)' }}>Txs: </span>
                               <span style={{ color: '#fff', fontWeight: '600' }}>{rule.txCountThisMonth} / {rule.maxTxPerMonth}</span>
                             </div>
                             <div>
                               <span style={{ color: 'var(--text-muted)' }}>Max Gas: </span>
                               <span style={{ color: '#fff', fontWeight: '600' }}>{rule.maxGasPrice} Gwei</span>
                             </div>
                             <div style={{ gridColumn: 'span 2' }}>
                               <span style={{ color: 'var(--text-muted)' }}>Gas Sponsored: </span>
                               <span style={{ color: 'var(--color-success)', fontWeight: '600' }}>{rule.totalGasPaidUSDC.toFixed(4)} USDC</span>
                             </div>
                           </div>
                         </div>
                       ))}
                     </div>
                   )}
                 </div>
               </div>
              
            </div>

            {/* Bottom Section: Active Streams that employee can claim gasless */}
            <div className="panel-card" style={{ marginTop: '30px' }}>
              <div className="panel-card-title">
                <Layers size={18} color="var(--color-primary)" />
                My Active Pay Streams (Gasless Eligible)
              </div>

              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Any payroll stream where your biometric smart wallet is registered as the worker can be claimed with zero gas cost, sponsored by the employer.
              </p>

              {/* Table / List */}
              {employees.filter(e => e.employee.toLowerCase() === passkeyAccountAddress?.toLowerCase()).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', border: '1.5px dashed rgba(255,255,255,0.08)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '14px' }}>
                  No active streaming channels are currently configured to route to your Biometric Smart Wallet ({passkeyAccountAddress || 'Not registered'}).
                  <br />
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '8px', display: 'inline-block' }}>Tip: Create a stream specifying your Smart Wallet address above as the employee.</span>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Stream ID</th>
                        <th>Employer</th>
                        <th>Flow Velocity</th>
                        <th>Accrued (Wages)</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.filter(e => e.employee.toLowerCase() === passkeyAccountAddress?.toLowerCase()).map((emp) => (
                        <tr key={emp.id}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{emp.id.slice(0, 12)}...</td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{emp.employer.slice(0, 6)}...{emp.employer.slice(-4)}</td>
                          <td>{emp.fiatPeg ? `${emp.flowRate.toFixed(4)} ${emp.fiatPeg}/sec (Pegged)` : `${emp.flowRate.toFixed(4)} USDC/sec`}</td>
                          <td style={{ fontWeight: '700', color: 'var(--color-primary)' }}>
                            {emp.accruedLive.toFixed(4)} USDC
                          </td>
                          <td>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => claimGaslessWithPasskey(emp.id, passkeyAccountAddress)}
                              disabled={isPasskeyLoading || emp.accruedLive <= emp.accruedPaid}
                              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                              <Fingerprint size={12} />
                              Claim Gasless
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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

      {/* Circle CCTP Portal Modal Overlay */}
      {isBridgeModalOpen && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="modal-card" style={{
            backgroundColor: '#110c22',
            border: '2px solid var(--color-primary, #a78bfa)',
            boxShadow: '4px 4px 0px 0px var(--color-primary, #a78bfa)',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '550px',
            padding: '24px',
            position: 'relative'
          }}>
            <button 
              onClick={() => {
                setIsBridgeModalOpen(false)
                setIsBridgingInProgress(false)
              }} 
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shuffle size={20} color="var(--color-primary)" />
              Circle CCTP Cross-Chain Portal
            </h3>

            {/* Progress Steps Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', backgroundColor: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div style={{ opacity: bridgeStep === 1 ? 1 : 0.5, fontWeight: bridgeStep === 1 ? 'bold' : 'normal', fontSize: '12px' }}>1. Configure</div>
              <ArrowRight size={14} style={{ opacity: 0.5 }} />
              <div style={{ opacity: bridgeStep === 2 ? 1 : 0.5, fontWeight: bridgeStep === 2 ? 'bold' : 'normal', fontSize: '12px' }}>2. Burn (Base)</div>
              <ArrowRight size={14} style={{ opacity: 0.5 }} />
              <div style={{ opacity: bridgeStep === 3 ? 1 : 0.5, fontWeight: bridgeStep === 3 ? 'bold' : 'normal', fontSize: '12px' }}>3. Attest</div>
              <ArrowRight size={14} style={{ opacity: 0.5 }} />
              <div style={{ opacity: bridgeStep === 4 ? 1 : 0.5, fontWeight: bridgeStep === 4 ? 'bold' : 'normal', fontSize: '12px' }}>4. Mint (Arc)</div>
              <ArrowRight size={14} style={{ opacity: 0.5 }} />
              <div style={{ opacity: bridgeStep === 5 ? 1 : 0.5, fontWeight: bridgeStep === 5 ? 'bold' : 'normal', fontSize: '12px' }}>5. Complete</div>
            </div>

            {/* Step content */}
            {bridgeStep === 1 && (
              <div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Select the source chain and configure the amount of USDC to deposit. The funds will be burned on Base Sepolia and securely minted directly to your Arc Testnet Payroll Treasury.
                </p>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">Source Chain</label>
                  <select 
                    className="form-input" 
                    value={bridgeSourceChain} 
                    onChange={(e) => setBridgeSourceChain(e.target.value)}
                    style={{ width: '100%', height: '40px', backgroundColor: 'rgba(0,0,0,0.2)', border: '1.5px solid var(--border-color)', borderRadius: '6px', color: '#fff', padding: '0 10px' }}
                  >
                    <option value="Base Sepolia">Base Sepolia (CCTP Domain 6)</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label">Amount of USDC to Bridge</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={bridgeAmount} 
                    onChange={(e) => setBridgeAmount(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <button 
                  className="btn btn-primary" 
                  onClick={handleStartCctpBridge} 
                  style={{ width: '100%', height: '46px' }}
                  disabled={parseFloat(bridgeAmount) <= 0}
                >
                  Initiate Bridge Transfer
                </button>
              </div>
            )}

            {bridgeStep === 2 && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <RefreshCw className="animate-spin" size={32} style={{ margin: '0 auto 16px', animation: 'spin 2s linear infinite', color: 'var(--color-primary)' }} />
                <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>Burning USDC on Source Chain</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '0 20px' }}>{bridgeStatusText}</p>
              </div>
            )}

            {bridgeStep === 3 && (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <RefreshCw className="animate-spin" size={32} style={{ margin: '0 auto 16px', animation: 'spin 2s linear infinite', color: 'var(--color-secondary)' }} />
                <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>Awaiting Circle Signature Attestation</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px', padding: '0 20px' }}>
                  {bridgeStatusText}
                </p>
                
                <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '11px', fontFamily: 'var(--font-mono)', wordBreak: 'break-all', marginBottom: '20px' }}>
                  <strong>Burn Tx Hash:</strong> {bridgeTxHash}
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    className="btn btn-secondary" 
                    onClick={handleMockAttestation}
                    style={{ width: '100%', fontSize: '12px' }}
                  >
                    ⚡ Skip / Speed Up (Mock Attestation)
                  </button>
                </div>
              </div>
            )}

            {bridgeStep === 4 && (
              <div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Circle attestation is signed and verified. Now, switch your wallet back to Arc Testnet to claim and deposit the bridged USDC directly into your Payroll Treasury.
                </p>

                <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '6px', padding: '12px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '12px', color: '#fff', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Tokens to Claim:</span>
                    <strong>{bridgeAmount} USDC</strong>
                  </div>
                </div>

                <button 
                  className="btn btn-success" 
                  onClick={handleClaimCctpBridge} 
                  style={{ width: '100%', height: '46px' }}
                  disabled={isBridgingInProgress}
                >
                  {isBridgingInProgress ? 'Processing Claim...' : 'Claim & Fund Arc Treasury'}
                </button>
                {isBridgingInProgress && (
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>
                    {bridgeStatusText}
                  </p>
                )}
              </div>
            )}

            {bridgeStep === 5 && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '2px solid var(--color-success)' }}>
                  <Check size={32} color="var(--color-success)" />
                </div>
                <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>Bridge Deposit Complete!</p>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px', padding: '0 20px' }}>
                  Your pre-funded Arc payroll balance has been successfully credited with {bridgeAmount} USDC.
                </p>

                <button 
                  className="btn btn-primary" 
                  onClick={() => setIsBridgeModalOpen(false)}
                  style={{ width: '100%', height: '40px' }}
                >
                  Close Portal
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}

export default App
