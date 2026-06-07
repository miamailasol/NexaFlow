// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title WebAuthnVerifier
 * @dev Verifies SECP256R1 (P-256) signatures used by WebAuthn/Passkeys.
 * Uses the RIP-7212 precompile at 0x100 on chains that support it,
 * falling back to an ecrecover-based workaround for testing environments.
 *
 * In production on Arc (which supports RIP-7212), the precompile provides
 * native P-256 verification at low gas cost.
 */
contract WebAuthnVerifier {

    /// @notice RIP-7212 precompile address for P-256 signature verification
    address constant P256_VERIFIER = address(0x100);

    /// @notice Whether to use the precompile (set false for testing on Hardhat)
    bool public usePrecompile;

    constructor(bool _usePrecompile) {
        usePrecompile = _usePrecompile;
    }

    /**
     * @notice Verify a WebAuthn P-256 signature.
     * @param messageHash The hash of the challenge data that was signed.
     * @param r The r component of the ECDSA signature.
     * @param s The s component of the ECDSA signature.
     * @param pubKeyX The x-coordinate of the signer's P-256 public key.
     * @param pubKeyY The y-coordinate of the signer's P-256 public key.
     * @return valid True if the signature is valid for the given key and message.
     */
    function verifySignature(
        bytes32 messageHash,
        uint256 r,
        uint256 s,
        uint256 pubKeyX,
        uint256 pubKeyY
    ) external view returns (bool valid) {
        if (usePrecompile) {
            return _verifyViaPrecompile(messageHash, r, s, pubKeyX, pubKeyY);
        } else {
            return _verifyViaSoftware(messageHash, r, s, pubKeyX, pubKeyY);
        }
    }

    /**
     * @dev Calls the RIP-7212 precompile for native P-256 verification.
     */
    function _verifyViaPrecompile(
        bytes32 messageHash,
        uint256 r,
        uint256 s,
        uint256 pubKeyX,
        uint256 pubKeyY
    ) internal view returns (bool) {
        bytes memory input = abi.encode(messageHash, r, s, pubKeyX, pubKeyY);
        (bool success, bytes memory result) = P256_VERIFIER.staticcall(input);
        if (!success || result.length < 32) return false;
        return abi.decode(result, (uint256)) == 1;
    }

    /**
     * @dev Software-based P-256 verification for testing.
     * In test mode, we use a simplified scheme: the "signature" is actually
     * an ECDSA secp256k1 signature from the account owner, and we verify
     * that the recovered address matches the derived address from the public key.
     * This allows full end-to-end testing without a P-256 precompile.
     */
    function _verifyViaSoftware(
        bytes32 messageHash,
        uint256 r,
        uint256 s,
        uint256 pubKeyX,
        uint256 pubKeyY
    ) internal pure returns (bool) {
        // In software test mode: pubKeyX stores the expected signer address as uint256.
        // r and s encode a standard secp256k1 signature.
        // We try both v=27 and v=28 since v varies per message.
        // pubKeyY is unused in test mode — production uses real P-256 coordinates.
        address expectedSigner = address(uint160(pubKeyX));
        bytes32 rBytes = bytes32(r);
        bytes32 sBytes = bytes32(s);
        bytes32 ethHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));

        address recovered27 = ecrecover(ethHash, 27, rBytes, sBytes);
        if (recovered27 == expectedSigner) return true;

        address recovered28 = ecrecover(ethHash, 28, rBytes, sBytes);
        return recovered28 == expectedSigner;
    }
}
