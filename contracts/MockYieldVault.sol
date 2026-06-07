// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract MockYieldVault {
    address public immutable asset;
    uint256 public immutable deploymentTime;
    
    string public constant name = "Yield USDC Vault";
    string public constant symbol = "yUSDC";
    uint8 public constant decimals = 6;
    
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Deposit(address indexed sender, address indexed owner, uint256 assets, uint256 shares);
    event Withdraw(address indexed sender, address indexed receiver, address indexed owner, uint256 assets, uint256 shares);

    constructor(address _asset) {
        asset = _asset;
        deploymentTime = block.timestamp;
    }
    
    function getMultiplier() public view returns (uint256) {
        uint256 elapsed = block.timestamp - deploymentTime;
        // 5% APY is 0.05 * 1e18 per year
        // We use 31536000 seconds in a year
        return 1e18 + (elapsed * 5e16) / 31536000;
    }
    
    function convertToAssets(uint256 shares) public view returns (uint256) {
        return (shares * getMultiplier()) / 1e18;
    }
    
    function convertToShares(uint256 assets) public view returns (uint256) {
        return (assets * 1e18) / getMultiplier();
    }
    
    function totalAssets() external view returns (uint256) {
        return convertToAssets(totalSupply);
    }
    
    function deposit(uint256 assets, address receiver) external returns (uint256 shares) {
        shares = convertToShares(assets);
        require(shares > 0, "Zero shares minted");
        
        require(IERC20(asset).transferFrom(msg.sender, address(this), assets), "Transfer failed");
        
        totalSupply += shares;
        balanceOf[receiver] += shares;
        
        emit Transfer(address(0), receiver, shares);
        emit Deposit(msg.sender, receiver, assets, shares);
    }
    
    function withdraw(uint256 assets, address receiver, address owner) external returns (uint256 shares) {
        shares = convertToShares(assets);
        require(shares > 0, "Zero shares burned");
        
        if (msg.sender != owner) {
            uint256 allowed = allowance[owner][msg.sender];
            if (allowed != type(uint256).max) {
                require(allowed >= shares, "Allowance exceeded");
                allowance[owner][msg.sender] = allowed - shares;
            }
        }
        
        require(balanceOf[owner] >= shares, "Insufficient shares");
        balanceOf[owner] -= shares;
        totalSupply -= shares;
        
        require(IERC20(asset).transfer(receiver, assets), "Transfer failed");
        
        emit Transfer(owner, address(0), shares);
        emit Withdraw(msg.sender, receiver, owner, assets, shares);
    }
    
    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }
    
    function transfer(address to, uint256 value) external returns (bool) {
        require(balanceOf[msg.sender] >= value, "Insufficient balance");
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            require(allowed >= value, "Allowance exceeded");
            allowance[from][msg.sender] = allowed - value;
        }
        require(balanceOf[from] >= value, "Insufficient balance");
        balanceOf[from] -= value;
        balanceOf[to] += value;
        emit Transfer(from, to, value);
        return true;
    }
}
