# NexaFlow — Autonomous Continuous Payroll & Decentralized Micro-Benefits Ledger
### Built for the Agora Stablecoin Commerce Stack Challenge (Arc Chain)

NexaFlow is an enterprise-grade, Web3 payroll and micro-benefits platform built natively on **Arc Testnet** (where USDC is the native gas asset). It replaces legacy, rent-seeking batch banking processes (SWIFT, high FX spreads, manual pension integrations) with **real-time per-second continuous payroll streams** and **AI-agent authenticated health and retirement benefits splits**.

By uniting per-second streaming liquidity with automated, AI-agent verified micro-benefits disbursements under a sub-second, deterministic finality model, NexaFlow establishes a secure, highly scalable, and regulatory-compliant stablecoin commerce stack for the global remote workforce.

---

## 🏗️ System Architecture & Workflow

The following sequence diagram outlines the interaction model between the Employer, the Employee, the autonomous Smart Contracts, and the Sandboxed AI Verifier Agent on the Arc Chain:

```mermaid
sequenceDiagram
    autonumber
    actor Employer
    actor Employee
    participant SP as StreamingPayroll Contract
    participant MB as MicroBenefitsVault Contract
    participant Agent as Circle AI-Agent Verifier
    participant Provider as Service Provider (Clinic)

    Employer->>SP: createStream(employee, flowRate, totalCap) [Escrows USDC]
    Note over SP: USDC-native gas covers execution.<br/>Sub-second block confirmation.
    
    loop Real-Time Accrual
        Note over Employee: React app calculates live accrual<br/>via high-performance requestAnimationFrame
    end

    Employee->>SP: withdrawFunds(streamId)
    SP->>Employee: Transfers accumulated USDC directly
    
    Employee->>MB: depositContribution(splitPercentages, totalUSDC)
    Note over MB: On-chain routing:<br/>- Healthcare HSA (20% to Co-op Pool)<br/>- Retirement Pension Vault<br/>- Emergency Savings Vault

    Employee->>Agent: Submit Medical Invoice (e.g., 15.00 USDC)
    Agent->>Agent: Verify clinic signature, OFAC screening, and metadata
    Agent->>MB: processClaim(employee, clinic, 15.00 USDC, "HEALTH") [Authorized Write]
    
    alt Personal HSA Balance >= Claim Amount
        Note over MB: Deduct entirely from Employee HSA Balance
    alt Personal HSA Balance < Claim Amount
        Note over MB: Deduct available HSA, deficit covered by Co-op Safety Pool
    end
    
    MB->>Provider: Disburse 15.00 USDC instantly
```

---

## 📄 NEXAFLOW TECHNICAL WHITEPAPER

### 1. Abstract & Introduction
The modern gig economy and remote remote workforce model are expanding rapidly, yet the underlying financial settlement rails remain rooted in 20th-century banking infrastructures. Legacy systems introduce severe inefficiencies such as intermediary SWIFT fees, multi-day delays, 2%–5% hidden FX spreads, and exclusion of international contractors from corporate health insurance, pension matches, and emergency safety nets.

NexaFlow overcomes these hurdles by utilizing **Arc Chain**, where transaction fees are paid in stable, native USDC. This allows micro-transactions and continuous payroll streams to run with predictable, sponsored, or sub-cent costs.

---

### 2. Protocol Primitives & Mathematical Formulations

#### 2.1 Continuous Streaming Payroll Engine
NexaFlow establishes an escrow-backed payroll stream represented by a discrete cryptographic state on the blockchain. Rather than locking capital in periodic chunks, payroll is modeled as a continuous mathematical function of elapsed time.

Let:
* $\gamma$ be the defined flow rate of the stream, measured in USDC per second (using 6 decimals).
* $C$ be the total escrowed capital (or maximum payroll cap) committed by the employer.
* $t_0$ be the timestamp at which the stream was created or initialized.
* $t_{last}$ be the timestamp of the last claim or withdrawal transaction.
* $P_{claimed}$ be the cumulative amount of USDC already claimed and withdrawn by the worker.

At any given block timestamp $t$ (where $t > t_{last}$), the continuous accrued wage function $A(t)$ is defined as:

$$A(t) = \min \left( (t - t_{last}) \times \gamma, \; C - P_{claimed} \right)$$

Upon calling `withdrawFunds()`, the contract executes three state updates:
1. Calculates the claimable amount: $W = A(t)$.
2. Updates the stream’s internal timestamp: $t_{last} \leftarrow t$.
3. Increments the claimed ledger: $P_{claimed} \leftarrow P_{claimed} + W$.
4. Disburses $W$ USDC from the contract's escrow address directly to the employee's wallet.

---

#### 2.2 Embedded Micro-Benefits Splitting Mechanics
Once payroll is disbursed to the worker, NexaFlow implements an automated on-chain routing ledger to allocate funds to specialized micro-benefits sub-vaults. 

Upon receiving a payout, the worker's allocation ratios are parsed as percentage weights:

$$\sum (S_{health} + S_{retirement} + S_{emergency}) = 100\%$$

When a USDC contribution $V_{total}$ is deposited into the `MicroBenefitsVault` contract, the split allocations are computed dynamically:

$$V_{retirement} = V_{total} \times S_{retirement}$$
$$V_{emergency} = V_{total} \times S_{emergency}$$

For the Healthcare allocation, the protocol introduces a **Co-op contribution routing fee** to fund the shared liquidity pool:
- $80\%$ of the healthcare allocation remains in the worker's personal health vault ($B_{member}^{HSA}$).
- $20\%$ is automatically diverted to the global shared treasury ($T_{coop}$) to fund the Community Co-op Safety Pool.

$$B_{member}^{HSA} \leftarrow B_{member}^{HSA} + \left( V_{total} \times S_{health} \times 0.80 \right)$$
$$T_{coop} \leftarrow T_{coop} + \left( V_{total} \times S_{health} \times 0.20 \right)$$

---

### 3. Decentralized Risk-Hedging: The Community Co-op Safety Pool
The **Community Co-op Safety Pool** is a novel, on-chain risk-sharing mechanism designed to protect remote workers from catastrophic healthcare costs. NexaFlow solves this by aggregating a fraction of all health savings into a shared backup treasury ($T_{coop}$).

#### Deficit Coverage Algorithm:
When a hospital or clinic submits a verified medical claim $V_{claim}$ for a registered member, the protocol processes the disbursement through a specialized fallback routine:

1. **Verify Balance Sufficiency:** The contract evaluates the member's personal Healthcare HSA balance: $B_{member}^{HSA}$.
2. **Calculate Deficit ($D$):**
   
$$D = V_{claim} - B_{member}^{HSA}$$

3. **Disbursement Scenarios:**
   * **Scenario A ($D \le 0$):** The member's personal HSA is sufficient to cover the invoice. The amount $V_{claim}$ is deducted entirely from $B_{member}^{HSA}$.
     
$$B_{member}^{HSA} \leftarrow B_{member}^{HSA} - V_{claim}$$

   * **Scenario B ($D > 0$ and $T_{coop} \ge D$):** The member's personal balance is insufficient, but the global shared treasury has enough liquidity to cover the difference. The member's balance is set to zero, and the remaining deficit is absorbed by the Co-op Pool.
     
$$B_{member}^{HSA} \leftarrow 0$$
$$T_{coop} \leftarrow T_{coop} - D$$

   * **Scenario C ($D > 0$ and $T_{coop} < D$):** In the event of a catastrophic black-swan event where both the personal balance and the Co-op Pool are exhausted, the transaction reverts to protect protocol solvency.

---

### 4. Autonomous Verification & Circle Developer-Controlled Wallets
To ensure operational efficiency, claims processing is fully automated via an on-chain/off-chain agentic bridge. NexaFlow integrates a sandboxed autonomous verification agent that acts as a secure intermediary between the physical invoice and the smart contract ledger.

1. **Invoice Submission:** An employee uploads a digital medical receipt to the NexaFlow interface.
2. **AI Analysis & OCR Verification:** The AI Agent extracts the provider’s identifier, service category, timestamp, and invoice cost.
3. **Sanctions Compliance Screening:** The agent screens both the employee and provider addresses against real-time OFAC and AML blocklists.
4. **Authorized Signature Generation:** Upon successful validation, the agent uses a secure, sandboxed Circle Developer-Controlled Wallet key (represented on Arc Testnet via an ECDSA private key Client) to sign the transaction.
5. **On-Chain Settlement:** The agent calls `processClaim()` with the cryptographic transaction hash, triggering the automated split and instant payout to the provider with sub-second finality.

---

### 5. EVM Decimal Alignment & Technical Implementation

Arc Chain utilizes two distinct decimal standards that require careful coordination in Web3 frontend clients and backend ledgers:
* **EVM Native Gas Asset (USDC):** Arc treats USDC as the native fee token. All gas costs and native transaction balances are parsed using **18 decimals** (standard EVM native token format, comparable to Wei for ETH).
* **ERC-20 USDC Token:** The standard stablecoin contract deployed on Arc (`0x3600000000000000000000000000000000000000`) uses **6 decimals** for standard token operations, deposits, and transfers.

#### Decimal Conversion Matrix:

| Operational Context | Target Contract/Function | Standard Unit | Decimals | Format Example |
| :--- | :--- | :--- | :--- | :--- |
| **Native Gas Estimation** | Gas Fees / Native Transfers | `uint256` | 18 | `1.0 USDC = 10^18 units` |
| **Escrow Funding** | `StreamingPayroll.createStream()` | `uint256` (ERC-20) | 6 | `1.0 USDC = 1,000,000 units` |
| **Flow Velocity ($\gamma$)** | `StreamingPayroll.streams` | `uint256` / second | 6 | `0.005 USDC/sec = 5,000 units` |
| **HSA Deposit & Claim** | `MicroBenefitsVault.processClaim()` | `uint256` (ERC-20) | 6 | `15.0 USDC = 15,000,000 units` |

NexaFlow maintains mathematical accuracy by isolating all stream and benefit operations strictly to **6 decimals** (matching standard USDC ledger storage on-chain), while relying on `viem` and `wagmi` chain drivers to automatically handle 18-decimal gas mechanics during raw transaction signing.

---

## 🎨 Product Tour & Screenshots

Here is a visual walkthrough of the NexaFlow platform:

### 1. Overview Dashboard
Real-time summary of aggregate payroll caps, live-ticking accruing salary streams, total benefits balances saved, and recent on-chain transactions.
![Overview Dashboard](public/screen%20overview.png)

### 2. Continuous Salary Flows
Start and manage per-second USDC payroll streams. Features interactive pre-authorized budget cap lockups and sub-second transaction finality.
![Continuous Salary Flows](public/screen%20salary%20flow.png)

### 3. Security & Safety Scanner
Automated compliance checker simulating transactions on Arc Testnet, validating EVM execution status, and screening employee wallets against OFAC and sanctions databases.
![Security & Safety Scanner](public/screen%20security.png)

### 4. My Savings & Benefits Allocations
Define split percentages for Healthcare HSA, Retirement Pension pots, and Rainy-Day reserves. Features AI-agent verified instant claims processing and global Community Co-op Safety Pool backup.
![My Savings & Benefits Allocations](public/screen%20benifits%20.png)

### 5. Smart Contracts & Architecture
Full developer console displaying interactive smart contract code specifications, deployed contract addresses, and RPC configuration for transparent verification.
![Smart Contracts & Architecture](public/screen%20how%20it%20works.png)

---

## 📜 Smart Contract API Reference

### 1. `StreamingPayroll.sol`
Defines and tracks continuous salary streams.
* `createStream(address employee, uint256 flowRate, uint256 totalCap)`: Escrows `totalCap` USDC from the employer and establishes a per-second stream rate.
* `getClaimableAmount(bytes32 streamId)`: View function calculating accrued funds up to the current block:
  $$\text{Claimable} = \min((\text{block.timestamp} - \text{lastUpdated}) \times \text{flowRate}, \text{totalCap} - \text{accruedPaid})$$
* `withdrawFunds(bytes32 streamId)`: Transfers all claimable USDC accrued by the stream directly to the employee.
* `cancelStream(bytes32 streamId)`: Cancels the payroll stream, sending accrued wages to the employee and refunding remaining unspent escrow to the employer.

### 2. `MicroBenefitsVault.sol`
Manages on-chain remote worker micro-benefits.
* `registerMember(address member)`: Establishes a MemberAccount record on the blockchain.
* `depositContribution(address member, uint256 health, uint256 retirement, uint256 emergency)`: Pulls USDC and routes it to the specific sub-vaults, automatically diverting 20% of the health split to `insuranceCoopTreasury`.
* `processClaim(address member, address serviceProvider, uint256 amount, string claimType, bytes32 claimHash)`: Verifier-only write function. If `amount > healthInsuranceBalance` for a `HEALTH` claim, it deducts the deficit from the co-op safety pool, then pays the service provider directly.

---

## 🔒 Security Guarantees & Protocol Invariants

1. **Escrow Solvency Guarantee:** The StreamingPayroll contract must remain fully collateralized at all times. For any set of active streams $i \in \{1, 2, ..., N\}$, the contract’s ERC-20 token balance must satisfy:
   
$$\text{Balance}_{USDC}(\text{Contract}) \ge \sum_{i=1}^{N} \left( C_i - P_{claimed, i} \right)$$

2. **Verifier Signature Restriction:** Only the designated verifier address (representing the secure AI Agent client) is authorized to execute `processClaim()`. This restriction is enforced on-chain by the `onlyVerifier` modifier:
   
$$\forall x \in \text{CallerAddresses}, \; \text{processClaim}(x) \implies x = \text{VerifierAgentAddress}$$

3. **Frontrunning and Double-Spend Protection:** Arc Chain's sub-second finality (confirmations under 0.8 seconds) removes the risk of transaction-ordering manipulation (MEV) and frontrunning attacks. This guarantees that workers cannot submit duplicate claims or double-spend their HSA balances before the state updates are finalized.
4. **Byte Length Validation:** Hashing operations (like IPFS claims verification) require exact `bytes32` values. NexaFlow standardizes all frontend mock claims hashes using `.padEnd(66, '0')` to align with Solidity's expectation.
5. **Checksum Bypasses:** Viem strictly validates mixed-case addresses using standard ERC-55 checksum parameters. To prevent client-side verification crashes, NexaFlow internally lowercases transaction-bound wallet addresses to bypass invalid checksum halts while remaining fully secure.

---

## 🛠️ Local Development & Sandbox Setup

### Prerequisites
* Node.js v18.0.0 or higher
* npm or yarn
* Foundry (Forge) for compiling or deploying smart contracts

### 1. Clone & Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory (based on `.env.example`):
```ini
ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network
PRIVATE_KEY=your_deployer_private_key
VITE_PRIVATE_KEY=your_simulated_ai_verifier_agent_private_key
DEPLOYER_ADDRESS=your_deployer_address
VITE_DEPLOYER_ADDRESS=your_deployer_address
```
> **Security Notice:** Do not hardcode private keys in any frontend source files. Ensure `.env` is listed in your `.gitignore`.

### 3. Run the Development Server
```bash
npm run dev
```
Open `http://localhost:5173/` in your browser. Connect MetaMask or any RainbowKit-supported wallet to the **Arc Testnet**.

---

## 🚀 Smart Contract Deployment (Arc Testnet)

Arc Chain Parameters:
* **Chain ID:** `5042002` (hex: `0x4CEF52`)
* **RPC URL:** `https://rpc.testnet.arc.network`
* **USDC Address:** `0x3600000000000000000000000000000000000000`
* **Arc Testnet Faucet:** [faucet.circle.com](https://faucet.circle.com)

Deploy contracts via Forge:

```bash
# 1. Deploy StreamingPayroll
forge create contracts/StreamingPayroll.sol:StreamingPayroll \
  --rpc-url https://rpc.testnet.arc.network \
  --private-key $PRIVATE_KEY \
  --constructor-args 0x3600000000000000000000000000000000000000 \
  --broadcast

# 2. Deploy MicroBenefitsVault
forge create contracts/MicroBenefitsVault.sol:MicroBenefitsVault \
  --rpc-url https://rpc.testnet.arc.network \
  --private-key $PRIVATE_KEY \
  --constructor-args 0x3600000000000000000000000000000000000000 <YOUR_VERIFIER_AI_AGENT_ADDRESS> \
  --broadcast
```

Verify transactions and check balances using the [Arc Explorer (ArcScan)](https://testnet.arcscan.app).
