# Contributing to NexaFlow

Thank you for your interest in contributing to NexaFlow! This guide will help you set up your local development environment and guide you through our standard pull request workflow.

## 🚀 Quick Start (Development Setup)

### 1. Prerequisites
Ensure you have the following installed:
* [Node.js](https://nodejs.org/) (v18.0.0 or higher)
* [git](https://git-scm.com/)

### 2. Installation
Clone the repository and install all dependencies:
```bash
git clone https://github.com/your-username/NexaFlow.git
cd NexaFlow
npm install
```

### 3. Environment Setup
Copy the template environment file and fill in your secrets:
```bash
cp .env.example .env
```
Ensure you provide a valid `CIRCLE_API_KEY`, `CIRCLE_APP_ID`, and `PRIVATE_KEY` to test the Web3 wallets and smart contract sponsorship capabilities.

### 4. Running the Dev Servers
Start all layers (Frontend, AI Agent Coordinator, and Circle Treasury Service) concurrently:
```bash
npm run dev:all
```
Your local services will run at:
* Frontend App: `http://localhost:3000` or `http://localhost:3001`
* Circle DCW/UCW Treasury Service: `http://localhost:3011`
* Coordinator Agent Server: `http://localhost:3012`

---

## 🛠 Development Guidelines

### Code Quality & Linting
Run the ESLint compiler checks to make sure your changes align with formatting standards:
```bash
npm run lint
```
Before submitting a pull request, ensure your code compiles for production successfully:
```bash
npm run build
```

### Git Hygiene
* Never commit `.env` or `.env.*` configuration files containing active secrets.
* Ensure all files are tracked properly and conform to the rules in `.gitignore`.

### Architecture Structure
* **`src/`**: React components and context layers.
* **`server/`**: LangGraph AI agent definitions and tool integrations.
* **`contracts/`**: Smart contracts (Solidity).
* **`scripts/`**: Circle DCW and UCW API integrations.
