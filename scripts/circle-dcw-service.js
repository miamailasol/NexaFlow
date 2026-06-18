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

app.listen(PORT, () => {
  console.log(`NexaFlow Treasury DCW backend service running at http://localhost:${PORT}`);
});
