import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';
import { createPublicClient, http } from 'viem';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storePath = path.join(__dirname, 'dcw-store.json');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3011;

// Load store
let store = { walletId: '', address: '', walletSetId: '' };
if (fs.existsSync(storePath)) {
  try {
    store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
  } catch (e) {
    console.error('Failed to load store:', e);
  }
}

const saveStore = () => {
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2));
};

// Circle SDK initialization
let circleClient = null;
const isLiveMode = !!(process.env.CIRCLE_API_KEY && process.env.CIRCLE_ENTITY_SECRET);

if (isLiveMode) {
  console.log('Initializing Circle Developer-Controlled Wallets in LIVE mode.');
  try {
    circleClient = initiateDeveloperControlledWalletsClient({
      apiKey: process.env.CIRCLE_API_KEY,
      entitySecret: process.env.CIRCLE_ENTITY_SECRET,
    });
  } catch (err) {
    console.error('Failed to initialize Circle Client:', err);
  }
} else {
  console.log('No Circle API Key or Entity Secret found. Running in DEMO/MOCK mode.');
}

// Arc Testnet public client for reading balances or status
const publicClient = createPublicClient({
  chain: {
    id: 5042002,
    name: 'Arc Testnet',
    network: 'arc-testnet',
    nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 6 },
    rpcUrls: {
      default: { http: ['https://rpc.arc.network'] },
      public: { http: ['https://rpc.arc.network'] },
    },
  },
  transport: http(),
});

// Endpoint to fetch DCW status
app.get('/api/treasury/status', (req, res) => {
  res.json({
    isLiveMode,
    walletId: store.walletId,
    address: store.address,
    walletSetId: store.walletSetId,
  });
});

// POST /api/treasury/create-wallet
app.post('/api/treasury/create-wallet', async (req, res) => {
  try {
    if (store.walletId && store.address) {
      return res.json({
        success: true,
        message: 'Wallet already exists',
        walletId: store.walletId,
        address: store.address,
      });
    }

    if (isLiveMode && circleClient) {
      // 1. Create wallet set if not exists
      let walletSetId = store.walletSetId;
      if (!walletSetId) {
        console.log('Creating new Wallet Set...');
        const wsResponse = await circleClient.createWalletSet({
          name: 'NexaFlow Treasury Set',
        });
        walletSetId = wsResponse.data?.walletSet?.id;
        store.walletSetId = walletSetId;
        saveStore();
      }

      // 2. Create wallet on ARC-TESTNET
      console.log('Creating developer-controlled wallet on ARC-TESTNET...');
      const walletResponse = await circleClient.createWallets({
        blockchains: ['ARC-TESTNET'],
        count: 1,
        walletSetId: walletSetId,
        accountType: 'EOA',
      });

      const wallet = walletResponse.data?.wallets?.[0];
      if (!wallet) {
        throw new Error('Failed to create wallet from Circle SDK response');
      }

      store.walletId = wallet.id;
      store.address = wallet.address;
      saveStore();

      return res.json({
        success: true,
        message: 'Circle Developer-Controlled Wallet created successfully',
        walletId: wallet.id,
        address: wallet.address,
      });
    } else {
      // Demo/Mock mode: Generate a mock wallet
      console.log('Simulating wallet creation in demo mode...');
      store.walletId = 'mock-dcw-wallet-id-88aa-44bb';
      store.address = '0x1712aE39f8f2C18e59C4035652615967fB539b7F';
      saveStore();

      return res.json({
        success: true,
        message: 'Mock Developer-Controlled Wallet created successfully (Demo Mode)',
        walletId: store.walletId,
        address: store.address,
      });
    }
  } catch (err) {
    console.error('Error creating wallet:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/treasury/balance
app.get('/api/treasury/balance', async (req, res) => {
  try {
    const walletAddress = store.address || req.query.address;
    if (!walletAddress) {
      return res.status(400).json({ success: false, error: 'No wallet address available' });
    }

    if (isLiveMode && circleClient) {
      // Query balance using Circle SDK
      console.log('Fetching wallet token balances from Circle...');
      const balanceResponse = await circleClient.getWalletTokenBalance({
        id: store.walletId,
      });
      const tokenBalances = balanceResponse.data?.tokenBalances || [];
      return res.json({
        success: true,
        address: walletAddress,
        tokenBalances,
      });
    } else {
      // Demo/Mock balance
      return res.json({
        success: true,
        address: walletAddress,
        tokenBalances: [
          {
            token: {
              id: 'mock-usdc-token-id',
              address: '0x3600000000000000000000000000000000000000',
              blockchain: 'ARC-TESTNET',
              symbol: 'USDC',
              name: 'USD Coin',
              decimals: 6,
            },
            amount: '25000.000000',
            updateDate: new Date().toISOString(),
          },
        ],
      });
    }
  } catch (err) {
    console.error('Error fetching balance:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/payroll/start-stream
app.post('/api/payroll/start-stream', async (req, res) => {
  try {
    const { employee, flowRate, totalCap, contractAddress } = req.body;
    if (!employee || !flowRate || !totalCap || !contractAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing parameters: employee, flowRate, totalCap, contractAddress are required',
      });
    }

    if (!store.walletId) {
      return res.status(400).json({
        success: false,
        error: 'Developer-Controlled Wallet has not been created yet',
      });
    }

    if (isLiveMode && circleClient) {
      console.log(`Broadcasting createStream to contract ${contractAddress} via Circle DCW...`);
      const txResponse = await circleClient.createContractExecutionTransaction({
        walletId: store.walletId,
        contractAddress,
        abiFunctionSignature: 'createStream(address,uint256,uint256)',
        abiParameters: [employee, flowRate.toString(), totalCap.toString()],
        feeLevel: 'MEDIUM',
      });

      const txId = txResponse.data?.id;
      const txHash = txResponse.data?.txHash;

      return res.json({
        success: true,
        message: 'Stream creation transaction broadcasted via Circle DCW',
        txId,
        txHash,
      });
    } else {
      // Mock/Demo Mode
      console.log('Simulating contract transaction broadcast in demo mode...');
      const mockHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      return res.json({
        success: true,
        message: 'Mock stream transaction executed successfully (Demo Mode)',
        txId: 'mock-tx-id-99ff-88ee',
        txHash: mockHash,
      });
    }
  } catch (err) {
    console.error('Error executing contract transaction:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/treasury/transfer-dcw
app.post('/api/treasury/transfer-dcw', async (req, res) => {
  try {
    const { recipient, amount } = req.body;
    if (!recipient || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing parameters: recipient and amount are required',
      });
    }

    if (!store.walletId) {
      return res.status(400).json({
        success: false,
        error: 'Developer-Controlled Wallet has not been created yet',
      });
    }

    const amountRaw = Math.round(parseFloat(amount) * 1e6); // 6 decimals for USDC

    if (isLiveMode && circleClient) {
      console.log(`Executing USDC transfer of ${amount} to ${recipient} via Circle DCW...`);
      const txResponse = await circleClient.createContractExecutionTransaction({
        walletId: store.walletId,
        contractAddress: '0x3600000000000000000000000000000000000000', // USDC address on Arc
        abiFunctionSignature: 'transfer(address,uint256)',
        abiParameters: [recipient, amountRaw.toString()],
        feeLevel: 'MEDIUM',
      });

      const txId = txResponse.data?.id;
      const txHash = txResponse.data?.txHash;

      return res.json({
        success: true,
        message: 'USDC transfer transaction broadcasted via Circle DCW',
        txId,
        txHash,
      });
    } else {
      // Mock/Demo Mode
      console.log('Simulating USDC transfer in demo mode...');
      const mockHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      return res.json({
        success: true,
        message: 'Mock transfer executed successfully via Circle DCW (Demo Mode)',
        txId: 'mock-tx-transfer-id-2233',
        txHash: mockHash,
      });
    }
  } catch (err) {
    console.error('Error executing transfer transaction:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Circle User-Controlled Wallets (UCW) Endpoints ──────────────────
import crypto from 'crypto';

let resolvedCircleBaseUrl = 'https://api.circle.com';
const globalAppId = process.env.CIRCLE_APP_ID || 'mock-app-id-9988-7766';

const detectCircleBaseUrl = async () => {
  const apiKey = process.env.CIRCLE_API_KEY;
  if (!apiKey) return;

  if (apiKey.includes('sandbox') || apiKey.startsWith('SAND_')) {
    resolvedCircleBaseUrl = 'https://api-sandbox.circle.com';
    console.log('Circle environment auto-detected: SANDBOX (https://api-sandbox.circle.com)');
  } else {
    resolvedCircleBaseUrl = 'https://api.circle.com';
    console.log('Circle environment auto-detected: PRODUCTION/TESTNET (https://api.circle.com)');
  }

  console.log(`Using Circle environment URL: ${resolvedCircleBaseUrl}`);
};

// Auto-detect environment on module load
await detectCircleBaseUrl();

app.post('/api/ucw/session', async (req, res) => {
  const { userId, queryOnly = false } = req.body;
  if (!userId) {
    return res.status(400).json({ success: false, error: 'Missing userId parameter' });
  }

  const API_KEY = process.env.CIRCLE_API_KEY;
  const baseUrl = resolvedCircleBaseUrl;
  const appId = process.env.CIRCLE_APP_ID || 'mock-app-id-9988-7766';
  const circleServiceUrl = baseUrl.includes('sandbox') ? 'https://pw-auth-sandbox.circle.com' : 'https://pw-auth.circle.com';

  try {
    // 1. Try to register user
    console.log(`Registering Circle UCW user: ${userId}`);
    try {
      await fetch(`${baseUrl}/v1/w3s/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });
    } catch (regErr) {
      console.log('User registration call finished (may already exist).');
    }

    // 2. Generate user token & encryption key
    console.log(`Generating user session token for: ${userId}`);
    const tokenRes = await fetch(`${baseUrl}/v1/w3s/users/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId })
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      throw new Error(tokenData?.message || 'Failed to generate user token');
    }
    const { userToken, encryptionKey } = tokenData.data;

    // 3. Fetch existing wallets
    console.log(`Fetching wallets for: ${userId}`);
    const walletsRes = await fetch(`${baseUrl}/v1/w3s/wallets`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'X-User-Token': userToken
      }
    });
    const walletsData = await walletsRes.json();
    const wallets = walletsData?.data?.wallets || [];

    const arcWallet = wallets.find(w => w.blockchain.toUpperCase() === 'ARC-TESTNET');

    if (arcWallet) {
      return res.json({
        success: true,
        status: 'ACTIVE',
        wallets: [arcWallet],
        userToken,
        encryptionKey,
        appId,
        circleServiceUrl
      });
    }

    if (wallets.length > 0 && !arcWallet) {
      console.log(`User has wallets but none on ARC-TESTNET. Requesting wallet creation challenge...`);
      const walletRes = await fetch(`${baseUrl}/v1/w3s/user/wallets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'X-User-Token': userToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          idempotencyKey: crypto.randomUUID(),
          blockchains: ['ARC-TESTNET'],
          accountType: 'SCA'
        })
      });
      const walletData = await walletRes.json();
      if (!walletRes.ok) {
        throw new Error(walletData?.message || 'Failed to create wallet challenge');
      }
      return res.json({
        success: true,
        status: 'INITIALIZING',
        challengeId: walletData.data.challengeId,
        userToken,
        encryptionKey,
        appId,
        circleServiceUrl
      });
    }

    // If we only wanted to query status (e.g., during client-side polling)
    if (queryOnly) {
      return res.json({
        success: true,
        status: 'INITIALIZING',
        wallets: [],
        userToken,
        encryptionKey,
        appId,
        circleServiceUrl
      });
    }

    // 4. Request initialization (Create PIN & Wallet)
    console.log(`Initializing user for first-time wallet setup: ${userId}`);
    const initRes = await fetch(`${baseUrl}/v1/w3s/user/initialize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'X-User-Token': userToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        idempotencyKey: crypto.randomUUID(),
        blockchains: ['ARC-TESTNET'],
        accountType: 'SCA'
      })
    });
    const initData = await initRes.json();

    if (initRes.ok) {
      return res.json({
        success: true,
        status: 'INITIALIZING',
        challengeId: initData.data.challengeId,
        userToken,
        encryptionKey,
        appId,
        circleServiceUrl
      });
    }

    // Handle "User Already Initialized" error
    const isAlreadyInitialized = initData?.code === 155106 || 
      (initData?.message && initData.message.toLowerCase().includes('already initialized'));

    if (isAlreadyInitialized) {
      console.log(`User already initialized. Requesting direct wallet creation challenge...`);
      const walletRes = await fetch(`${baseUrl}/v1/w3s/user/wallets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'X-User-Token': userToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          idempotencyKey: crypto.randomUUID(),
          blockchains: ['ARC-TESTNET'],
          accountType: 'SCA'
        })
      });
      const walletData = await walletRes.json();
      if (!walletRes.ok) {
        throw new Error(walletData?.message || 'Failed to create wallet challenge');
      }
      return res.json({
        success: true,
        status: 'INITIALIZING',
        challengeId: walletData.data.challengeId,
        userToken,
        encryptionKey,
        appId,
        circleServiceUrl
      });
    }

    throw new Error(initData?.message || 'Failed to initialize session');

  } catch (err) {
    console.error('UCW Session error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/ucw/transfer', async (req, res) => {
  const { userId, walletId, destinationAddress, amount } = req.body;
  if (!userId || !walletId || !destinationAddress || !amount) {
    return res.status(400).json({ success: false, error: 'Missing required parameters' });
  }

  const API_KEY = process.env.CIRCLE_API_KEY;
  const baseUrl = resolvedCircleBaseUrl;
  const circleServiceUrl = baseUrl.includes('sandbox') ? 'https://pw-auth-sandbox.circle.com' : 'https://pw-auth.circle.com';

  try {
    const tokenRes = await fetch(`${baseUrl}/v1/w3s/users/token`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      throw new Error(tokenData?.message || 'Failed to generate user token');
    }
    const { userToken, encryptionKey } = tokenData.data;

    const txRes = await fetch(`${baseUrl}/v1/w3s/user/transactions/transfer`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'X-User-Token': userToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        idempotencyKey: crypto.randomUUID(),
        userId,
        walletId,
        destinationAddress,
        amounts: [amount.toString()],
        tokenId: 'USD-COIN-SEPOLIA',
        feeLevel: 'MEDIUM'
      })
    });
    const txData = await txRes.json();
    if (!txRes.ok) {
      throw new Error(txData?.message || 'Failed to create transfer challenge');
    }

    res.json({
      success: true,
      challengeId: txData.data.challengeId,
      txId: txData.data.id,
      userToken,
      encryptionKey,
      appId: globalAppId,
      circleServiceUrl
    });
  } catch (err) {
    console.error('UCW Transfer error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/ucw/contract-execution', async (req, res) => {
  const { userId, walletId, contractAddress, abiFunctionSignature, abiParameters } = req.body;
  if (!userId || !walletId || !contractAddress || !abiFunctionSignature) {
    return res.status(400).json({ success: false, error: 'Missing required parameters' });
  }

  const API_KEY = process.env.CIRCLE_API_KEY;
  const baseUrl = resolvedCircleBaseUrl;
  const circleServiceUrl = baseUrl.includes('sandbox') ? 'https://pw-auth-sandbox.circle.com' : 'https://pw-auth.circle.com';

  try {
    const tokenRes = await fetch(`${baseUrl}/v1/w3s/users/token`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      throw new Error(tokenData?.message || 'Failed to generate user token');
    }
    const { userToken, encryptionKey } = tokenData.data;

    const txRes = await fetch(`${baseUrl}/v1/w3s/user/transactions/contractExecution`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'X-User-Token': userToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        idempotencyKey: crypto.randomUUID(),
        userId,
        walletId,
        contractAddress,
        abiFunctionSignature,
        abiParameters: abiParameters || [],
        feeLevel: 'MEDIUM'
      })
    });
    const txData = await txRes.json();
    console.log('Contract execution txData:', JSON.stringify(txData));
    if (!txRes.ok) {
      throw new Error(txData?.message || 'Failed to create contract execution challenge');
    }

    res.json({
      success: true,
      challengeId: txData.data.challengeId,
      txId: txData.data.id,
      userToken,
      encryptionKey,
      appId: globalAppId,
      circleServiceUrl
    });
  } catch (err) {
    console.error('UCW Contract Execution error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/ucw/transaction-by-challenge', async (req, res) => {
  const { walletId, challengeId, since } = req.query;
  if (!walletId) {
    return res.status(400).json({ success: false, error: 'Missing walletId parameter' });
  }
  const API_KEY = process.env.CIRCLE_API_KEY;
  const baseUrl = resolvedCircleBaseUrl;
  try {
    console.log(`[UCW Log] Querying transactions for walletId: ${walletId}, since: ${since}`);
    const txRes = await fetch(`${baseUrl}/v1/w3s/transactions?walletIds=${walletId}&order=DESC&pageSize=10`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    const txData = await txRes.json();
    if (!txRes.ok) {
      throw new Error(txData?.message || 'Failed to list transactions');
    }
    
    // Find the transaction created after `since` (allow 15s clock drift)
    const sinceTime = since ? parseInt(since, 10) : Date.now() - 60000;
    const matchingTx = (txData.data?.transactions || []).find(tx => {
      const createTime = new Date(tx.createDate).getTime();
      return createTime >= (sinceTime - 15000);
    });
    
    res.json({
      success: true,
      transaction: matchingTx || null
    });
  } catch (err) {
    console.error('UCW query transaction by challenge error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/ucw/latest-transaction', async (req, res) => {
  const { walletId, blockchain = 'ARC-TESTNET' } = req.query;
  if (!walletId) {
    return res.status(400).json({ success: false, error: 'Missing walletId parameter' });
  }
  const API_KEY = process.env.CIRCLE_API_KEY;
  const baseUrl = resolvedCircleBaseUrl;
  try {
    console.log(`[UCW Log] Querying transactions at URL: ${baseUrl}/v1/w3s/transactions?walletIds=${walletId}&order=DESC&pageSize=5`);
    const txRes = await fetch(`${baseUrl}/v1/w3s/transactions?walletIds=${walletId}&order=DESC&pageSize=5`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    const txData = await txRes.json();
    console.log(`[UCW Log] Response Status: ${txRes.status}. Data:`, JSON.stringify(txData));
    if (!txRes.ok) {
      throw new Error(txData?.message || 'Failed to list transactions');
    }
    
    // Find the latest transaction that is recent (created within last 3 minutes) and matches the blockchain
    const now = Date.now();
    const recentTx = (txData.data?.transactions || []).find(tx => {
      const createTime = new Date(tx.createDate).getTime();
      const isBlockchainMatch = tx.blockchain.toUpperCase() === blockchain.toUpperCase();
      return isBlockchainMatch && (now - createTime) < 180000; // 3 minutes
    });

    res.json({
      success: true,
      transaction: recentTx || null
    });
  } catch (err) {
    console.error('UCW latest transaction error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});


app.listen(PORT, () => {
  console.log(`NexaFlow Treasury DCW/UCW backend service running at http://localhost:${PORT}`);
});
