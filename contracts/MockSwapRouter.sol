// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

struct ExactInputSingleParams {
    address tokenIn;
    address tokenOut;
    uint24 fee;
    address recipient;
    uint256 deadline;
    uint256 amountIn;
    uint256 amountOutMinimum;
    uint160 sqrtPriceLimitX96;
}

interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 value) external returns (bool);
}

interface IMintable {
    function mint(address to, uint256 amount) external;
}

contract MockSwapRouter {
    // 1 USDC = 0.92 EURC
    uint256 public rateNumerator = 92;
    uint256 public rateDenominator = 100;
    
    address public eurcToken;

    constructor(address _eurcToken) {
        eurcToken = _eurcToken;
    }

    function exactInputSingle(ExactInputSingleParams calldata params) external returns (uint256 amountOut) {
        require(params.amountIn > 0, "AmountIn must be positive");
        
        // Transfer tokenIn (USDC) from sender to this contract
        require(
            IERC20(params.tokenIn).transferFrom(msg.sender, address(this), params.amountIn),
            "USDC transfer failed"
        );

        // Calculate amountOut of tokenOut (EURC)
        amountOut = (params.amountIn * rateNumerator) / rateDenominator;
        
        // Try to mint directly to the recipient, fallback to standard transfer if prefunded
        try IMintable(params.tokenOut).mint(params.recipient, amountOut) {
            // Success
        } catch {
            require(
                IERC20(params.tokenOut).transfer(params.recipient, amountOut),
                "EURC transfer failed"
            );
        }
    }
}
