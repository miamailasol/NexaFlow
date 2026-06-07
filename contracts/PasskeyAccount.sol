// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PasskeyAccount
 * @dev Minimal smart account controlled by a WebAuthn passkey.
 * The account can execute arbitrary calls when a valid passkey signature is provided,
 * and also supports delegated execution via an authorized entrypoint (e.g. Paymaster).
 *
 * Each account is bound to a single passkey credential identified by:
 * - credentialId: The WebAuthn credential ID hash
 * - pubKeyX / pubKeyY: The P-256 public key coordinates
 */

interface IWebAuthnVerifier {
    function verifySignature(
        bytes32 messageHash,
        uint256 r,
        uint256 s,
        uint256 pubKeyX,
        uint256 pubKeyY
    ) external view returns (bool);
}

contract PasskeyAccount {
    /// @notice The WebAuthn credential ID hash bound to this account
    bytes32 public credentialId;

    /// @notice P-256 public key X coordinate
    uint256 public pubKeyX;

    /// @notice P-256 public key Y coordinate
    uint256 public pubKeyY;

    /// @notice WebAuthn signature verifier contract
    address public immutable verifier;

    /// @notice Factory that deployed this account
    address public immutable factory;

    /// @notice Authorized entrypoint for gasless UserOperation execution
    address public entrypoint;

    /// @notice Replay protection nonce
    uint256 public nonce;

    /// @notice Whether the account has been initialized
    bool public initialized;

    event Executed(address indexed target, uint256 value, bytes data);
    event EntrypointUpdated(address indexed newEntrypoint);

    modifier onlyAuthorized() {
        require(
            msg.sender == address(this) || msg.sender == entrypoint,
            "PasskeyAccount: unauthorized caller"
        );
        _;
    }

    constructor(address _verifier) {
        verifier = _verifier;
        factory = msg.sender;
    }

    /**
     * @notice Initialize the account with passkey credentials. Can only be called once by the factory.
     * @param _credentialId The WebAuthn credential ID hash.
     * @param _pubKeyX The P-256 public key X coordinate.
     * @param _pubKeyY The P-256 public key Y coordinate.
     * @param _entrypoint The authorized entrypoint/paymaster address.
     */
    function initialize(
        bytes32 _credentialId,
        uint256 _pubKeyX,
        uint256 _pubKeyY,
        address _entrypoint
    ) external {
        require(msg.sender == factory, "PasskeyAccount: only factory");
        require(!initialized, "PasskeyAccount: already initialized");

        credentialId = _credentialId;
        pubKeyX = _pubKeyX;
        pubKeyY = _pubKeyY;
        entrypoint = _entrypoint;
        initialized = true;
    }

    /**
     * @notice Execute a call with passkey signature verification.
     * @param target The contract to call.
     * @param value The ETH/native value to send.
     * @param data The calldata for the target function.
     * @param sigR The r component of the P-256 signature.
     * @param sigS The s component of the P-256 signature.
     */
    function executeWithPasskey(
        address target,
        uint256 value,
        bytes calldata data,
        uint256 sigR,
        uint256 sigS
    ) external returns (bytes memory) {
        // Build the message hash from the operation parameters
        bytes32 operationHash = keccak256(
            abi.encode(address(this), target, value, data, nonce)
        );

        // Verify the passkey signature
        bool valid = IWebAuthnVerifier(verifier).verifySignature(
            operationHash,
            sigR,
            sigS,
            pubKeyX,
            pubKeyY
        );
        require(valid, "PasskeyAccount: invalid passkey signature");

        nonce++;

        // Execute the call
        (bool success, bytes memory result) = target.call{value: value}(data);
        require(success, "PasskeyAccount: execution failed");

        emit Executed(target, value, data);
        return result;
    }

    /**
     * @notice Execute a call via the authorized entrypoint (gasless/sponsored).
     * @dev Called by the Paymaster after it verifies the UserOperation.
     * @param target The contract to call.
     * @param value The ETH/native value to send.
     * @param data The calldata for the target function.
     */
    function executeFromEntrypoint(
        address target,
        uint256 value,
        bytes calldata data
    ) external onlyAuthorized returns (bytes memory) {
        nonce++;

        (bool success, bytes memory result) = target.call{value: value}(data);
        require(success, "PasskeyAccount: execution failed");

        emit Executed(target, value, data);
        return result;
    }

    /**
     * @notice Update the entrypoint address. Requires passkey signature.
     */
    function setEntrypoint(address _newEntrypoint, uint256 sigR, uint256 sigS) external {
        bytes32 operationHash = keccak256(
            abi.encode(address(this), "setEntrypoint", _newEntrypoint, nonce)
        );

        bool valid = IWebAuthnVerifier(verifier).verifySignature(
            operationHash,
            sigR,
            sigS,
            pubKeyX,
            pubKeyY
        );
        require(valid, "PasskeyAccount: invalid passkey signature");

        nonce++;
        entrypoint = _newEntrypoint;
        emit EntrypointUpdated(_newEntrypoint);
    }

    /**
     * @notice Verify a passkey signature against a message hash (view function).
     * @dev Useful for off-chain signature pre-validation by the Paymaster.
     */
    function isValidSignature(
        bytes32 messageHash,
        uint256 sigR,
        uint256 sigS
    ) external view returns (bool) {
        return IWebAuthnVerifier(verifier).verifySignature(
            messageHash,
            sigR,
            sigS,
            pubKeyX,
            pubKeyY
        );
    }

    /// @notice Allow receiving native tokens
    receive() external payable {}
}
