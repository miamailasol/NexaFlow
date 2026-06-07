// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./PasskeyAccount.sol";

/**
 * @title PasskeyAccountFactory
 * @dev Factory contract for deploying counterfactual PasskeyAccount clones.
 * Each worker registers their WebAuthn credential to receive a deterministic
 * smart account address, enabling gasless salary claims via FaceID/TouchID.
 */
contract PasskeyAccountFactory {
    /// @notice The WebAuthn verifier contract used by all deployed accounts
    address public immutable verifier;

    /// @notice Default entrypoint (paymaster) for new accounts
    address public defaultEntrypoint;

    /// @notice Contract owner
    address public owner;

    /// @notice Mapping from credential ID to deployed account address
    mapping(bytes32 => address) public accountsByCredential;

    /// @notice Mapping from account address to credential ID
    mapping(address => bytes32) public credentialsByAccount;

    /// @notice Total number of accounts deployed
    uint256 public totalAccounts;

    event AccountDeployed(
        address indexed account,
        bytes32 indexed credentialId,
        uint256 pubKeyX,
        uint256 pubKeyY,
        address entrypoint
    );

    event DefaultEntrypointUpdated(address indexed newEntrypoint);

    modifier onlyOwner() {
        require(msg.sender == owner, "PasskeyAccountFactory: only owner");
        _;
    }

    constructor(address _verifier, address _defaultEntrypoint) {
        verifier = _verifier;
        defaultEntrypoint = _defaultEntrypoint;
        owner = msg.sender;
    }

    /**
     * @notice Deploy a new PasskeyAccount bound to a WebAuthn credential.
     * @param credentialId The WebAuthn credential ID hash.
     * @param pubKeyX The P-256 public key X coordinate.
     * @param pubKeyY The P-256 public key Y coordinate.
     * @return account The address of the newly deployed smart account.
     */
    function deployWallet(
        bytes32 credentialId,
        uint256 pubKeyX,
        uint256 pubKeyY
    ) external returns (address account) {
        require(
            accountsByCredential[credentialId] == address(0),
            "PasskeyAccountFactory: credential already registered"
        );

        // Deploy a new PasskeyAccount using CREATE2 for deterministic addresses
        bytes32 salt = keccak256(abi.encode(credentialId, pubKeyX, pubKeyY));

        PasskeyAccount newAccount = new PasskeyAccount{salt: salt}(verifier);

        // Initialize the account with passkey data
        newAccount.initialize(
            credentialId,
            pubKeyX,
            pubKeyY,
            defaultEntrypoint
        );

        account = address(newAccount);

        // Register the credential-to-account mapping
        accountsByCredential[credentialId] = account;
        credentialsByAccount[account] = credentialId;
        totalAccounts++;

        emit AccountDeployed(account, credentialId, pubKeyX, pubKeyY, defaultEntrypoint);
    }

    /**
     * @notice Compute the counterfactual address of an account before deployment.
     * @param credentialId The WebAuthn credential ID hash.
     * @param pubKeyX The P-256 public key X coordinate.
     * @param pubKeyY The P-256 public key Y coordinate.
     * @return The predicted address of the smart account.
     */
    function getAddress(
        bytes32 credentialId,
        uint256 pubKeyX,
        uint256 pubKeyY
    ) external view returns (address) {
        bytes32 salt = keccak256(abi.encode(credentialId, pubKeyX, pubKeyY));
        bytes32 bytecodeHash = keccak256(
            abi.encodePacked(
                type(PasskeyAccount).creationCode,
                abi.encode(verifier)
            )
        );

        return address(
            uint160(
                uint256(
                    keccak256(
                        abi.encodePacked(
                            bytes1(0xff),
                            address(this),
                            salt,
                            bytecodeHash
                        )
                    )
                )
            )
        );
    }

    /**
     * @notice Check if a credential has already been registered.
     */
    function isCredentialRegistered(bytes32 credentialId) external view returns (bool) {
        return accountsByCredential[credentialId] != address(0);
    }

    /**
     * @notice Update the default entrypoint for newly created accounts.
     */
    function setDefaultEntrypoint(address _newEntrypoint) external onlyOwner {
        defaultEntrypoint = _newEntrypoint;
        emit DefaultEntrypointUpdated(_newEntrypoint);
    }
}
