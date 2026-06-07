// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockPriceFeed {
    int256 private price;
    uint8 private ptsDecimals;
    string private ptsDescription;

    constructor(string memory _description, int256 _initialPrice, uint8 _decimals) {
        ptsDescription = _description;
        price = _initialPrice;
        ptsDecimals = _decimals;
    }

    function updatePrice(int256 _newPrice) external {
        price = _newPrice;
    }

    function decimals() external view returns (uint8) {
        return ptsDecimals;
    }

    function description() external view returns (string memory) {
        return ptsDescription;
    }

    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        return (1, price, block.timestamp, block.timestamp, 1);
    }
}
