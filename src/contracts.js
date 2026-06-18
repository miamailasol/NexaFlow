// Deployed smart contract configurations on Arc Testnet
export const STREAMING_PAYROLL_ADDRESS = '0xDb671f29A8A95099F2546C6862680134737Fe178';
export const MICRO_BENEFITS_VAULT_ADDRESS = '0x14624dCDf725B10A04763Dd503DC6f26Da295771';
export const USDC_TOKEN_ADDRESS = '0x3600000000000000000000000000000000000000';
export const EURC_TOKEN_ADDRESS = '0x89b50855aa3be2f677cd6303cec089b5f319d72a';
export const TREASURY_BUFFER_MANAGER_ADDRESS = '0x304c6282246229eAD2df763Be789FdA076BD799d';
export const PAYMASTER_RULES_MANAGER_ADDRESS = '0x5057Ed983efEa1904B55aF36c37557584184F125';

// ERC-8004 Agentic Economy Contracts (Arc Testnet)
export const IDENTITY_REGISTRY_ADDRESS = '0x8004a818bfb912233c491871b3d84c89a494bd9e';
export const REPUTATION_REGISTRY_ADDRESS = '0x8004b663056a597dffe9eccc1965a193b7388713';
export const VALIDATION_REGISTRY_ADDRESS = '0x8004cb1bf31daf7788923b405b754f57aceb4272';

// ERC-8183 AgenticCommerce Contract (Arc Testnet)
export const AGENTIC_COMMERCE_ADDRESS = '0x0747eef0706327138c69792bf28cd525089e4583';
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
      { name: 'totalCap', type: 'uint256' },
      { name: 'country', type: 'string' }
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
      { name: 'totalCaps', type: 'uint256[]' },
      { name: 'countries', type: 'string[]' }
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
  },
  {
    inputs: [
      { name: 'employee', type: 'address' },
      { name: 'commitmentHash', type: 'bytes32' },
      { name: 'totalCap', type: 'uint256' },
      { name: 'country', type: 'string' }
    ],
    name: 'createPrivateStream',
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'streamId', type: 'bytes32' },
      { name: 'claimableAmount', type: 'uint256' },
      { name: 'flowRate', type: 'uint256' },
      { name: 'salt', type: 'bytes32' },
      { name: 'signature', type: 'bytes' }
    ],
    name: 'withdrawPrivateFunds',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: '', type: 'bytes32' }],
    name: 'privateStreams',
    outputs: [
      { name: 'employer', type: 'address' },
      { name: 'employee', type: 'address' },
      { name: 'commitmentHash', type: 'bytes32' },
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
    inputs: [{ name: '', type: 'bytes32' }],
    name: 'streamCountries',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: 'streamId', type: 'bytes32' },
      { name: 'fiat', type: 'string' }
    ],
    name: 'setStreamFiatPeg',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: '', type: 'bytes32' }],
    name: 'fiatPegs',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: '', type: 'string' }],
    name: 'priceFeeds',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: 'fiat', type: 'string' },
      { name: 'feed', type: 'address' }
    ],
    name: 'setPriceFeed',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: '', type: 'uint256' }],
    name: 'proposals',
    outputs: [
      { name: 'actionType', type: 'string' },
      { name: 'streamId', type: 'bytes32' },
      { name: 'targetAddress', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'executed', type: 'bool' },
      { name: 'confirmationCount', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: '', type: 'uint256' },
      { name: '', type: 'address' }
    ],
    name: 'confirmations',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'proposalId', type: 'uint256' }],
    name: 'confirmProposal',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'proposalId', type: 'uint256' }],
    name: 'executeProposal',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'streamId', type: 'bytes32' }],
    name: 'proposeCancelStream',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'proposeWithdrawLeftover',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'newOracle', type: 'address' }],
    name: 'proposeSetPayrollOracle',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getProposalsCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: '', type: 'address' }],
    name: 'isMultiSigSigner',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
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
      {
        components: [
          { name: 'member', type: 'address' },
          { name: 'serviceProvider', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'claimType', type: 'string' },
          { name: 'claimHash', type: 'bytes32' },
          { name: 'nonce', type: 'uint256' }
        ],
        name: 'details',
        type: 'tuple'
      },
      { name: 'signature', type: 'bytes' }
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
      { name: 'retirementShares', type: 'uint256' },
      { name: 'emergencyShares', type: 'uint256' },
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
  },
  {
    inputs: [],
    name: 'yieldVault',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  }
];

export const YIELD_VAULT_ADDRESS = '0xd8b934580fc4259bbd8a1cdb21bf9c1c71ef4242';
export const YIELD_VAULT_ABI = [
  {
    inputs: [{ name: 'shares', type: 'uint256' }],
    name: 'convertToAssets',
    outputs: [{ name: 'assets', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'asset',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  }
];

export const COMPLIANCE_REGISTRY_ADDRESS = '0x2b8916bd1Ba674097444C280aB78Debb866D46E3';
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

export const CROSS_CHAIN_TREASURY_ADDRESS = '0x5F2052E6C92A6C71A1b6a65749A24356ACD06505';
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

export const PASSKEY_ACCOUNT_FACTORY_ADDRESS = '0x99dE14b4d6c965416ad717f679F6C526c9bd1c04';
export const PASSKEY_ACCOUNT_FACTORY_ABI = [
  {
    inputs: [
      { name: 'credentialId', type: 'bytes32' },
      { name: 'pubKeyX', type: 'uint256' },
      { name: 'pubKeyY', type: 'uint256' }
    ],
    name: 'deployWallet',
    outputs: [{ name: 'account', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: '', type: 'bytes32' }],
    name: 'accountsByCredential',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: 'credentialId', type: 'bytes32' },
      { name: 'pubKeyX', type: 'uint256' },
      { name: 'pubKeyY', type: 'uint256' }
    ],
    name: 'getAddress',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  }
];

export const NEXA_PAYMASTER_ADDRESS = '0x75f2fF935B94FFe6835A0ACdFAAA038c19897384';
export const NEXA_PAYMASTER_ABI = [
  {
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'depositSponsor',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: '', type: 'address' }],
    name: 'sponsorBalances',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: 'smartAccount', type: 'address' },
      { name: 'target', type: 'address' },
      { name: 'data', type: 'bytes' },
      { name: 'streamId', type: 'bytes32' }
    ],
    name: 'sponsorWithdrawal',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
];

export const PASSKEY_ACCOUNT_ABI = [
  {
    inputs: [],
    name: 'nonce',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'credentialId',
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: 'target', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'data', type: 'bytes' },
      { name: 'sigR', type: 'uint256' },
      { name: 'sigS', type: 'uint256' }
    ],
    name: 'executeWithPasskey',
    outputs: [{ name: '', type: 'bytes' }],
    stateMutability: 'nonpayable',
    type: 'function'
  }
];

export const TREASURY_BUFFER_MANAGER_ABI = [
  {
    inputs: [{ name: 'employer', type: 'address' }],
    name: 'employerBuffers',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'employer', type: 'address' }],
    name: 'totalMonthlyCommitment',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'employer', type: 'address' }],
    name: 'isWarningState',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'employer', type: 'address' }],
    name: 'getDaysCovered',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'depositBuffer',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'withdrawBuffer',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'streamId', type: 'bytes32' },
      { name: 'priority', type: 'uint256' }
    ],
    name: 'setStreamPriority',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: '', type: 'bytes32' }],
    name: 'streamPriorities',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
];

export const PAYMASTER_RULES_MANAGER_ABI = [
  {
    inputs: [
      { name: 'worker', type: 'address' },
      { name: 'maxTxPerMonth', type: 'uint256' },
      { name: 'maxGasPrice', type: 'uint256' }
    ],
    name: 'setWorkerRule',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'worker', type: 'address' }],
    name: 'resetMonthlyUsage',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: '', type: 'address' }],
    name: 'workerRules',
    outputs: [
      { name: 'maxTxPerMonth', type: 'uint256' },
      { name: 'maxGasPrice', type: 'uint256' },
      { name: 'totalGasPaidUSDC', type: 'uint256' },
      { name: 'txCountThisMonth', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getConfiguredWorkers',
    outputs: [{ name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function'
  }
];




