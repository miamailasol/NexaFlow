import { spawn } from 'child_process';
import http from 'http';

console.log('Starting automated DCW service test...');

// Force mock mode by clearing any API keys
process.env.CIRCLE_API_KEY = '';
process.env.CIRCLE_ENTITY_SECRET = '';
process.env.PORT = '3829';

const child = spawn('node', ['scripts/circle-dcw-service.js'], {
  env: { ...process.env },
  shell: true
});

child.stdout.on('data', (data) => {
  console.log(`[SERVICE STDOUT] ${data.toString().trim()}`);
});

child.stderr.on('data', (data) => {
  console.error(`[SERVICE STDERR] ${data.toString().trim()}`);
});

child.on('error', (err) => {
  console.error('[SPAWN ERROR]', err);
});

child.on('exit', (code, signal) => {
  console.log(`[SERVICE EXITED] code: ${code}, signal: ${signal}`);
});

const makeRequest = (options, postData = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: JSON.parse(data)
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
};

const runTests = async () => {
  try {
    // 1. Wait for server to boot (dependencies load slow on Windows)
    await new Promise((resolve) => setTimeout(resolve, 6000));

    console.log('\n--- Testing GET /api/treasury/status ---');
    const statusResult = await makeRequest({
      hostname: 'localhost',
      port: 3829,
      path: '/api/treasury/status',
      method: 'GET'
    });
    console.log('Status Response:', statusResult.body);
    if (statusResult.statusCode !== 200) throw new Error('Status check failed');

    console.log('\n--- Testing POST /api/treasury/create-wallet ---');
    const walletResult = await makeRequest({
      hostname: 'localhost',
      port: 3829,
      path: '/api/treasury/create-wallet',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('Create Wallet Response:', walletResult.body);
    if (walletResult.statusCode !== 200 || !walletResult.body.success) {
      throw new Error('Create wallet failed');
    }

    console.log('\n--- Testing GET /api/treasury/balance ---');
    const balanceResult = await makeRequest({
      hostname: 'localhost',
      port: 3829,
      path: `/api/treasury/balance?address=${walletResult.body.address}`,
      method: 'GET'
    });
    console.log('Balance Response:', balanceResult.body);
    if (balanceResult.statusCode !== 200 || !balanceResult.body.success) {
      throw new Error('Balance check failed');
    }

    console.log('\n--- Testing POST /api/payroll/start-stream ---');
    const streamResult = await makeRequest({
      hostname: 'localhost',
      port: 3829,
      path: '/api/payroll/start-stream',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      employee: '0xTestEmployeeAddress77aa88bb99cc',
      flowRate: '5000',
      totalCap: '100000',
      contractAddress: '0xPayrollContractAddress55aa66bb77cc'
    });
    console.log('Start Stream Response:', streamResult.body);
    if (streamResult.statusCode !== 200 || !streamResult.body.success) {
      throw new Error('Start stream transaction failed');
    }

    console.log('\nAll DCW backend service tests passed successfully!');
    cleanup(0);
  } catch (err) {
    console.error('\nTest failed with error:', err);
    cleanup(1);
  }
};

const cleanup = (code) => {
  console.log('Shutting down service...');
  child.kill();
  process.exit(code);
};

runTests();
