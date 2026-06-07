// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
}

contract MockMessageTransmitter {
    address public usdc;

    constructor(address _usdc) {
        usdc = _usdc;
    }

    function receiveMessage(bytes calldata message, bytes calldata /* attestation */) external returns (bool) {
        // Parse mintRecipient (bytes32) at offset 152
        bytes32 recipientBytes;
        // Parse amount (uint256) at offset 184
        uint256 amount;

        assembly {
            recipientBytes := calldataload(add(message.offset, 152))
            amount := calldataload(add(message.offset, 184))
        }

        address recipient = address(uint160(uint256(recipientBytes)));
        require(IERC20(usdc).transfer(recipient, amount), "USDC transfer failed");
        return true;
    }
}
