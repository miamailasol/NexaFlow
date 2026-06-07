// Deployed smart contract configurations on Arc Testnet
export const STREAMING_PAYROLL_ADDRESS = '0xE366FC3cd96AFbDE41B0Fd8a3096178FaC2d1cDF';
export const MICRO_BENEFITS_VAULT_ADDRESS = '0x712F4a25c5c02574B56B0b4F9F1b76960a9Ea5E6';
export const USDC_TOKEN_ADDRESS = '0x3600000000000000000000000000000000000000';

export const USDC_ABI = [
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' }
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' }
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' }
    ],
    name: 'transferFrom',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  }
];

export const STREAMING_PAYROLL_ABI = [
  {
    inputs: [{ name: '_usdcToken', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'constructor'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'streamId', type: 'bytes32' },
      { indexed: true, name: 'employer', type: 'address' },
      { indexed: true, name: 'employee', type: 'address' },
      { indexed: false, name: 'flowRate', type: 'uint256' },
      { indexed: false, name: 'totalCap', type: 'uint256' }
    ],
    name: 'StreamCreated',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'streamId', type: 'bytes32' },
      { indexed: false, name: 'newFlowRate', type: 'uint256' }
    ],
    name: 'StreamUpdated',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'streamId', type: 'bytes32' },
      { indexed: false, name: 'remainingRefunded', type: 'uint256' }
    ],
    name: 'StreamCancelled',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'streamId', type: 'bytes32' },
      { indexed: true, name: 'employee', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' }
    ],
    name: 'FundsWithdrawn',
    type: 'event'
  },
  {
    inputs: [
      { name: 'employee', type: 'address' },
      { name: 'flowRate', type: 'uint256' },
      { name: 'totalCap', type: 'uint256' }
    ],
    name: 'createStream',
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'streamId', type: 'bytes32' }],
    name: 'getClaimableAmount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'streamId', type: 'bytes32' }],
    name: 'withdrawFunds',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'streamId', type: 'bytes32' }],
    name: 'cancelStream',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: '', type: 'bytes32' }],
    name: 'streams',
    outputs: [
      { name: 'employer', type: 'address' },
      { name: 'employee', type: 'address' },
      { name: 'flowRate', type: 'uint256' },
      { name: 'startTime', type: 'uint256' },
      { name: 'lastUpdated', type: 'uint256' },
      { name: 'accruedPaid', type: 'uint256' },
      { name: 'totalCap', type: 'uint256' },
      { name: 'isActive', type: 'bool' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: '', type: 'address' },
      { name: '', type: 'uint256' }
    ],
    name: 'employeeStreams',
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: '', type: 'address' },
      { name: '', type: 'uint256' }
    ],
    name: 'employerStreams',
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'usdcToken',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: 'employees', type: 'address[]' },
      { name: 'flowRates', type: 'uint256[]' },
      { name: 'totalCaps', type: 'uint256[]' }
    ],
    name: 'createStreamsBatch',
    outputs: [{ name: '', type: 'bytes32[]' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'streamIds', type: 'bytes32[]' }],
    name: 'pauseStreamsBatch',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'streamIds', type: 'bytes32[]' }],
    name: 'resumeStreamsBatch',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'streamIds', type: 'bytes32[]' }],
    name: 'withdrawFundsBatch',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: '', type: 'address' }],
    name: 'employerBalances',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: 'employer', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'creditEmployerBalance',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
];

export const MICRO_BENEFITS_VAULT_ABI = [
  {
    inputs: [
      { name: '_usdcToken', type: 'address' },
      { name: '_verifierAgent', type: 'address' }
    ],
    stateMutability: 'nonpayable',
    type: 'constructor'
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, name: 'member', type: 'address' }],
    name: 'MemberRegistered',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'member', type: 'address' },
      { indexed: false, name: 'health', type: 'uint256' },
      { indexed: false, name: 'retirement', type: 'uint256' },
      { indexed: false, name: 'emergency', type: 'uint256' }
    ],
    name: 'ContributionDeposited',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'member', type: 'address' },
      { indexed: true, name: 'serviceProvider', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
      { indexed: false, name: 'claimType', type: 'string' }
    ],
    name: 'ClaimPaid',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, name: 'newVerifier', type: 'address' }],
    name: 'VerifierAgentUpdated',
    type: 'event'
  },
  {
    inputs: [{ name: 'member', type: 'address' }],
    name: 'registerMember',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'member', type: 'address' },
      { name: 'health', type: 'uint256' },
      { name: 'retirement', type: 'uint256' },
      { name: 'emergency', type: 'uint256' }
    ],
    name: 'depositContribution',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'member', type: 'address' },
      { name: 'serviceProvider', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'claimType', type: 'string' },
      { name: 'claimHash', type: 'bytes32' }
    ],
    name: 'processClaim',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'member', type: 'address' }],
    name: 'members',
    outputs: [
      { name: 'healthInsuranceBalance', type: 'uint256' },
      { name: 'retirementBalance', type: 'uint256' },
      { name: 'emergencyFundBalance', type: 'uint256' },
      { name: 'totalContributed', type: 'uint256' },
      { name: 'isRegistered', type: 'bool' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'insuranceCoopTreasury',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'usdcToken',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'verifierAgent',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  }
];

export const COMPLIANCE_REGISTRY_ADDRESS = '0x2Be357876a3D286C3a0d183861270a48bF2d377b';
export const COMPLIANCE_REGISTRY_ABI = [
  {
    inputs: [],
    stateMutability: 'nonpayable',
    type: 'constructor'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'guardian', type: 'address' },
      { indexed: false, name: 'status', type: 'bool' }
    ],
    name: 'GuardianStatusUpdated',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'target', type: 'address' },
      { indexed: false, name: 'status', type: 'bool' }
    ],
    name: 'SanctionStatusUpdated',
    type: 'event'
  },
  {
    inputs: [{ name: 'guardian', type: 'address' }],
    name: 'isGuardian',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'target', type: 'address' }],
    name: 'isSanctioned',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: 'guardian', type: 'address' },
      { name: 'status', type: 'bool' }
    ],
    name: 'setGuardianStatus',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'target', type: 'address' },
      { name: 'status', type: 'bool' }
    ],
    name: 'setSanctionStatus',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
];

export const CROSS_CHAIN_TREASURY_ADDRESS = '0xb41FA5B3cCD28d7F3d4203A2B78D12dE42eE5019';
export const CROSS_CHAIN_TREASURY_ABI = [
  {
    inputs: [
      { name: 'message', type: 'bytes' },
      { name: 'attestation', type: 'bytes' }
    ],
    name: 'claimUSDCFromBridge',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
];


