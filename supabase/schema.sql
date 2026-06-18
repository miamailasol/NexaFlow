-- Database Setup for NexaFlow Audit & State Mirroring
-- Target Database: PostgreSQL / Supabase

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table 1: Employers Configuration
CREATE TABLE IF NOT EXISTS employers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    address VARCHAR(42) UNIQUE NOT NULL,
    company_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 2: Employees Configuration
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    address VARCHAR(42) UNIQUE NOT NULL,
    name VARCHAR(255),
    email VARCHAR(255),
    country_code VARCHAR(10) NOT NULL DEFAULT 'SG',
    tax_id VARCHAR(50),
    is_registered_benefits BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 3: Salary Streams Audit Logging
CREATE TABLE IF NOT EXISTS streams_audit (
    stream_id VARCHAR(66) PRIMARY KEY, -- Bytes32 Keccak hash as Hex
    employer_address VARCHAR(42) NOT NULL,
    employee_address VARCHAR(42) NOT NULL,
    flow_rate NUMERIC(20, 6) NOT NULL, -- USDC per second (stored in 6 decimals format)
    total_cap NUMERIC(20, 6) NOT NULL, -- Max milestone limit
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL,
    accrued_paid NUMERIC(20, 6) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    country_code VARCHAR(10) DEFAULT 'SG',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 4: Micro-Benefits Vault Allocation & State
CREATE TABLE IF NOT EXISTS benefits_allocation (
    member_address VARCHAR(42) PRIMARY KEY,
    health_split INTEGER NOT NULL DEFAULT 0, -- Basis points (e.g., 2000 = 20%)
    retirement_split INTEGER NOT NULL DEFAULT 0,
    emergency_split INTEGER NOT NULL DEFAULT 0,
    health_balance NUMERIC(20, 6) DEFAULT 0,
    retirement_shares NUMERIC(20, 6) DEFAULT 0,
    emergency_shares NUMERIC(20, 6) DEFAULT 0,
    total_contributed NUMERIC(20, 6) DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 5: AI-Verifier Claims Log
CREATE TABLE IF NOT EXISTS claims_audit (
    claim_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_address VARCHAR(42) NOT NULL,
    service_provider_address VARCHAR(42) NOT NULL,
    amount NUMERIC(20, 6) NOT NULL, -- USDC amount in 6 decimals
    claim_type VARCHAR(20) NOT NULL, -- HEALTH, PENSION, EMERGENCY
    claim_hash VARCHAR(66) NOT NULL, -- IPFS hash or document SHA-256
    nonce NUMERIC(78, 0) NOT NULL,
    signature TEXT NOT NULL,
    tx_hash VARCHAR(66),
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 6: Treasury Status (Circle Developer-Controlled Wallets Cache)
CREATE TABLE IF NOT EXISTS treasury_status (
    id SERIAL PRIMARY KEY,
    wallet_id VARCHAR(255) UNIQUE NOT NULL,
    address VARCHAR(42) UNIQUE NOT NULL,
    wallet_set_id VARCHAR(255) NOT NULL,
    is_live_mode BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance & query optimizations
CREATE INDEX IF NOT EXISTS idx_streams_employer ON streams_audit(employer_address);
CREATE INDEX IF NOT EXISTS idx_streams_employee ON streams_audit(employee_address);
CREATE INDEX IF NOT EXISTS idx_claims_member ON claims_audit(member_address);

-- Automatically update timestamps trigger function
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for tables
CREATE TRIGGER update_employers_modtime BEFORE UPDATE ON employers FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_employees_modtime BEFORE UPDATE ON employees FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_streams_modtime BEFORE UPDATE ON streams_audit FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_claims_modtime BEFORE UPDATE ON claims_audit FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_treasury_modtime BEFORE UPDATE ON treasury_status FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- Table 7: DAO Governance Suggestions
CREATE TABLE IF NOT EXISTS suggestions (
    id VARCHAR(255) PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Planned',
    impact VARCHAR(50) DEFAULT 'Medium',
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    submitter_address VARCHAR(42) NOT NULL,
    submitter_name VARCHAR(255) DEFAULT 'Anonymous',
    date VARCHAR(50) DEFAULT 'Just now',
    voted_users JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 8: DAO Governance Comments
CREATE TABLE IF NOT EXISTS comments (
    id VARCHAR(255) PRIMARY KEY,
    suggestion_id VARCHAR(255) NOT NULL REFERENCES suggestions(id) ON DELETE CASCADE,
    author_name VARCHAR(255),
    author_address VARCHAR(42),
    content TEXT NOT NULL,
    timestamp VARCHAR(50) DEFAULT 'Just now',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 9: Contributor Profiles
CREATE TABLE IF NOT EXISTS profiles (
    address VARCHAR(42) PRIMARY KEY,
    name VARCHAR(255),
    bio TEXT,
    reputation INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 10: Agent Logs
CREATE TABLE IF NOT EXISTS agent_logs (
    id SERIAL PRIMARY KEY,
    agent VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 11: x402 Ledger
CREATE TABLE IF NOT EXISTS x402_ledger (
    payment_id VARCHAR(255) PRIMARY KEY,
    sender VARCHAR(42) NOT NULL,
    recipient VARCHAR(42) NOT NULL,
    amount NUMERIC(20, 6) NOT NULL,
    nonce VARCHAR(255) NOT NULL,
    signature TEXT NOT NULL,
    tx_hash VARCHAR(66),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 12: x402 Balances
CREATE TABLE IF NOT EXISTS x402_balances (
    address VARCHAR(42) PRIMARY KEY,
    balance NUMERIC(20, 6) DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Triggers for profiles and x402_balances
CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_x402_balances_modtime BEFORE UPDATE ON x402_balances FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
