// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract RoleManager is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant REVIEWER_ROLE = keccak256("REVIEWER_ROLE");
    bytes32 public constant DAO_MEMBER_ROLE = keccak256("DAO_MEMBER_ROLE");

    constructor(address initialAdmin) {
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(ADMIN_ROLE, initialAdmin);
    }

    function grantReviewerRole(address account) external onlyRole(ADMIN_ROLE) {
        _grantRole(REVIEWER_ROLE, account);
        emit RoleGranted(REVIEWER_ROLE, account, msg.sender);
    }

    function revokeReviewerRole(address account) external onlyRole(ADMIN_ROLE) {
        _revokeRole(REVIEWER_ROLE, account);
        emit RoleRevoked(REVIEWER_ROLE, account, msg.sender);
    }

    function grantDAOMemberRole(address account) external onlyRole(ADMIN_ROLE) {
        _grantRole(DAO_MEMBER_ROLE, account);
        emit RoleGranted(DAO_MEMBER_ROLE, account, msg.sender);
    }

    function revokeDAOMemberRole(address account) external onlyRole(ADMIN_ROLE) {
        _revokeRole(DAO_MEMBER_ROLE, account);
        emit RoleRevoked(DAO_MEMBER_ROLE, account, msg.sender);
    }

    function isReviewer(address account) external view returns (bool) {
        return hasRole(REVIEWER_ROLE, account);
    }

    function isDAOMember(address account) external view returns (bool) {
        return hasRole(DAO_MEMBER_ROLE, account);
    }
}
