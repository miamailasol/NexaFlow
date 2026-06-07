// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function approve(address spender, uint256 value) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 value) external returns (bool);
}

interface IMessageTransmitter {
    function receiveMessage(bytes calldata message, bytes calldata attestation) external returns (bool);
}

interface IStreamingPayroll {
    function creditEmployerBalance(address employer, uint256 amount) external;
}

/**
 * @title CrossChainTreasury
 * @dev CCTP bridge receiver deployed on Arc Testnet.
 * Accepts incoming CCTP messages from Base/Ethereum, claims USDC, and credits StreamingPayroll.
 */
contract CrossChainTreasury {
    address public immutable usdc;
    address public immutable messageTransmitter;
    address public immutable streamingPayroll;

    event BridgeClaimed(address indexed employer, uint256 amount);

    constructor(address _usdc, address _messageTransmitter, address _streamingPayroll) {
        require(_usdc != address(0), "Invalid USDC address");
        require(_messageTransmitter != address(0), "Invalid transmitter address");
        require(_streamingPayroll != address(0), "Invalid payroll address");

        usdc = _usdc;
        messageTransmitter = _messageTransmitter;
        streamingPayroll = _streamingPayroll;

        // Pre-approve the StreamingPayroll contract to pull USDC from here
        IERC20(_usdc).approve(_streamingPayroll, type(uint256).max);
    }

    /**
     * @notice Submits the signed CCTP message to the MessageTransmitter.
     * Extracts the sender and credits their balance in StreamingPayroll.
     * @param message Raw message bytes from source chain CCTP.
     * @param attestation Signed attestation signature from Circle API.
     */
    function claimUSDCFromBridge(bytes calldata message, bytes calldata attestation) external {
        uint256 balanceBefore = IERC20(usdc).balanceOf(address(this));

        // Submit the signed CCTP message to Arc's Message Transmitter
        bool success = IMessageTransmitter(messageTransmitter).receiveMessage(message, attestation);
        require(success, "CCTP: receiveMessage failed");

        uint256 balanceAfter = IERC20(usdc).balanceOf(address(this));
        uint256 amountBridged = balanceAfter - balanceBefore;
        require(amountBridged > 0, "CCTP: No USDC received");

        // Parse messageSender from CCTP message body at offset 216
        address employer = _parseMessageSender(message);
        require(employer != address(0), "CCTP: Invalid employer address");

        // Credit employer balance in StreamingPayroll
        IStreamingPayroll(streamingPayroll).creditEmployerBalance(employer, amountBridged);

        emit BridgeClaimed(employer, amountBridged);
    }

    /**
     * @dev Parses the messageSender (caller of depositForBurn) from the BurnMessage
     * within the CCTP message. Absolute offset is 216 bytes.
     */
    function _parseMessageSender(bytes calldata message) internal pure returns (address) {
        require(message.length >= 248, "CCTP: Message too short");
        bytes32 senderBytes;
        assembly {
            senderBytes := calldataload(add(message.offset, 216))
        }
        return address(uint160(uint256(senderBytes)));
    }
}
