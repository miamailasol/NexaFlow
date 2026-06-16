import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const apiKey = process.env.CIRCLE_API_KEY;
  const entitySecret = process.env.CIRCLE_ENTITY_SECRET;

  console.log('====================================================');
  console.log('🤖 NexaFlow Circle Integration Verification Tool');
  console.log('====================================================');

  if (!apiKey) {
    console.error('❌ Error: CIRCLE_API_KEY is not defined in the .env file.');
    process.exit(1);
  }

  if (!entitySecret) {
    console.error('❌ Error: CIRCLE_ENTITY_SECRET is not defined in the .env file.');
    process.exit(1);
  }

  console.log(`API Key: ${apiKey.substring(0, 20)}...`);
  console.log(`Entity Secret: ${entitySecret.substring(0, 10)}...`);
  console.log('\nInitializing Circle DCW Client...');

  try {
    const client = initiateDeveloperControlledWalletsClient({
      apiKey: apiKey,
      entitySecret: entitySecret
    });

    console.log('✅ Client successfully initialized.');
    console.log('Connecting to Circle API to fetch Wallet Sets...');

    // Attempt to list wallet sets to verify API Key and signature verification
    const response = await client.listWalletSets();

    console.log('\n🎉 SUCCESS! NexaFlow is successfully connected to the Circle API.');
    console.log('----------------------------------------------------');
    console.log('Wallet Sets Found:');
    if (response.data && response.data.walletSets) {
      response.data.walletSets.forEach((set, index) => {
        console.log(`  [${index + 1}] ID: ${set.id} | Name: ${set.name}`);
      });
    } else {
      console.log('No Wallet Sets found under this developer account.');
    }
    console.log('----------------------------------------------------');
  } catch (error) {
    console.error('\n❌ ERROR: Failed to connect to Circle APIs.');
    console.error('----------------------------------------------------');
    if (error.response) {
      console.error(`Status Code: ${error.response.status}`);
      console.error('Error Details:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error Message:', error.message || error);
    }
    console.log('----------------------------------------------------');
    process.exit(1);
  }
}

main();
