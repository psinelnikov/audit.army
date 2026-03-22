// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../access/RoleManager.sol";

contract DAO is Ownable {
    string public name;
    string public symbol;
    string public description;
    uint256 public daoId;
    address public creator;
    uint256 public createdAt;

    RoleManager public roleManager;

    mapping(address => bool) public reviewers;
    address[] public reviewerList;

    uint256 public totalAuditsCompleted;
    uint256 public treasuryBalance;

    event ReviewerAdded(address indexed reviewer, address indexed addedBy, uint256 timestamp);
    event ReviewerRemoved(address indexed reviewer, address indexed removedBy, uint256 timestamp);
    event TreasuryDeposit(address indexed from, uint256 amount, uint256 timestamp);
    event TreasuryWithdrawal(address indexed to, uint256 amount, uint256 timestamp);

    modifier onlyAdmin() {
        require(msg.sender == owner() || roleManager.hasRole(roleManager.ADMIN_ROLE(), msg.sender), "Not admin");
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        address[] memory _initialReviewers,
        string memory _description,
        address _creator,
        uint256 _daoId
    ) Ownable(_creator) {
        name = _name;
        symbol = _symbol;
        description = _description;
        creator = _creator;
        daoId = _daoId;
        createdAt = block.timestamp;

        roleManager = new RoleManager(address(this));

        for (uint256 i = 0; i < _initialReviewers.length; i++) {
            reviewers[_initialReviewers[i]] = true;
            reviewerList.push(_initialReviewers[i]);
            roleManager.grantReviewerRole(_initialReviewers[i]);
        }
    }

    function addReviewer(address _reviewer) external onlyAdmin {
        require(!reviewers[_reviewer], "Reviewer already exists");
        require(_reviewer != address(0), "Invalid address");

        reviewers[_reviewer] = true;
        reviewerList.push(_reviewer);
        roleManager.grantReviewerRole(_reviewer);

        emit ReviewerAdded(_reviewer, msg.sender, block.timestamp);
    }

    function removeReviewer(address _reviewer) external onlyAdmin {
        require(reviewers[_reviewer], "Reviewer not found");

        reviewers[_reviewer] = false;
        roleManager.revokeReviewerRole(_reviewer);

        emit ReviewerRemoved(_reviewer, msg.sender, block.timestamp);
    }

    function isReviewer(address _address) external view returns (bool) {
        return reviewers[_address];
    }

    function getReviewerCount() external view returns (uint256) {
        return reviewerList.length;
    }

    function getAllReviewers() external view returns (address[] memory) {
        return reviewerList;
    }

    function depositTreasury() external payable {
        require(msg.value > 0, "Must deposit ETH");
        treasuryBalance += msg.value;
        emit TreasuryDeposit(msg.sender, msg.value, block.timestamp);
    }

    function withdrawTreasury(address payable _to, uint256 _amount) external onlyAdmin {
        require(_amount > 0 && _amount <= treasuryBalance, "Invalid amount");
        require(_to != address(0), "Invalid address");

        treasuryBalance -= _amount;
        _to.transfer(_amount);
        emit TreasuryWithdrawal(_to, _amount, block.timestamp);
    }

    function incrementAuditCount() external {
        require(msg.sender == owner(), "Only owner can increment audit count");
        totalAuditsCompleted++;
    }

    receive() external payable {
        treasuryBalance += msg.value;
        emit TreasuryDeposit(msg.sender, msg.value, block.timestamp);
    }
}
