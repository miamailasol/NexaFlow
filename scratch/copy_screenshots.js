const fs = require('fs');
const path = require('path');

const srcDir = 'e:\\Airdrop ARC\\Agora Hackathon - 50k USDC\\NexaFlow\\screen';
const destDir = 'e:\\Airdrop ARC\\Agora Hackathon - 50k USDC\\NexaFlow\\public\\screenshots';

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const mapping = {
  'localhost_3000_ (27).png': 'landing_page.png',
  'localhost_3000_ (28).png': 'overview_dashboard.png',
  'localhost_3000_app_agents.png': 'agent_command_center.png',
  'localhost_3000_app_agents (1).png': 'agent_verification_run.png',
  'localhost_3000_app_agents (2).png': 'agent_compliance_check.png',
  'localhost_3000_app_agents (3).png': 'agent_payout_settlement.png',
  'localhost_3000_app_agents (4).png': 'agent_flow_detail_1.png',
  'localhost_3000_app_agents (5).png': 'agent_flow_detail_2.png',
  'localhost_3000_app_agents (6).png': 'agent_flow_detail_3.png',
  'localhost_3000_app_agents (7).png': 'agent_flow_detail_4.png'
};

Object.entries(mapping).forEach(([srcName, destName]) => {
  const srcPath = path.join(srcDir, srcName);
  const destPath = path.join(destDir, destName);

  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied: ${srcName} -> ${destName} (${fs.statSync(destPath).size} bytes)`);
  } else {
    console.error(`Source file not found: ${srcName}`);
  }
});
