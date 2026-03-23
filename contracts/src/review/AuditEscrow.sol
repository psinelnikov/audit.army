// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../access/RoleManager.sol";
import "../core/DAO.sol";

contract AuditEscrow is Ownable, ReentrancyGuard {
    address public dao;

    enum AuditStatus {
        PENDING,
        IN_REVIEW,
        COMPLETED,
        DISPUTED,
        REFUNDED
    }

    struct Audit {
        address requester;
        address assignedReviewer;
        uint256 amount;
        string ipfsHash;
        AuditStatus status;
        uint256 createdAt;
        uint256 completedAt;
        bool reviewerPaid;
        bool daoPaid;
    }

    struct ReviewerProfile {
        address reviewer;
        uint256 activeReviews;
        uint256 completedReviews;
        uint256 reputation;
        uint256 lastAssignment;
        bool isActive;
        uint256 maxConcurrentReviews;
    }

    struct RotationPool {
        address[] reviewers;
        uint256 currentIndex;
        mapping(address => bool) isInPool;
        mapping(address => uint256) lastAssigned;
    }

    Audit[] public audits;
    mapping(address => uint256[]) public requesterAudits;
    mapping(address => uint256[]) public reviewerAudits;
    mapping(address => ReviewerProfile) public reviewerProfiles;
    mapping(address => uint256) public reviewerActiveReviews;
    mapping(address => RotationPool) public daoRotationPools;

    uint256 public constant REVIEWER_SHARE = 80;
    uint256 public constant DAO_SHARE = 20;
    uint256 public constant DEFAULT_MAX_CONCURRENT_REVIEWS = 3;
    uint256 public constant ROTATION_COOLDOWN = 1 hours;

    // Events
    event AuditCreated(
        address indexed dao,
        address indexed requester,
        uint256 amount,
        string ipfsHash,
        uint256 timestamp
    );

    event AuditAssigned(
        address indexed dao,
        uint256 auditIndex,
        address indexed reviewer,
        uint256 timestamp
    );

    event ReviewClaimed(
        address indexed dao,
        uint256 auditIndex,
        address indexed reviewer,
        uint256 timestamp
    );

    event ReviewerAssigned(
        address indexed dao,
        uint256 auditIndex,
        address indexed reviewer
    );

    event ReviewerEligibilityUpdated(
        address indexed reviewer,
        uint256 activeReviews
    );

    event JoinedRotationPool(
        address indexed dao,
        address indexed reviewer
    );

    event LeftRotationPool(
        address indexed dao,
        address indexed reviewer
    );

    event AuditCompleted(
        address indexed dao,
        uint256 auditIndex,
        address indexed reviewer,
        uint256 timestamp
    );

    event AuditDisputed(
        address indexed dao,
        uint256 auditIndex,
        address indexed disputer,
        string reason,
        uint256 timestamp
    );

    event AuditRefunded(
        address indexed dao,
        uint256 auditIndex,
        address indexed requester,
        uint256 amount,
        uint256 timestamp
    );

    event PaymentReleased(
        address indexed dao,
        uint256 auditIndex,
        address indexed recipient,
        uint256 amount,
        string recipientType,
        uint256 timestamp
    );

    constructor(address _dao) Ownable(msg.sender) {
        dao = _dao;
    }

    // DAO-specific functions - no owner required
    function daoRefundAudit(uint256 _auditIndex) external {
        require(_auditIndex < audits.length, "Audit index out of bounds");
        Audit storage audit = audits[_auditIndex];
        require(audit.status == AuditStatus.DISPUTED, "Audit not disputed");
        require(msg.sender == dao, "Only DAO can refund its own audits");
        require(!audit.daoPaid && !audit.reviewerPaid, "Payments already released");

        audit.status = AuditStatus.REFUNDED;

        payable(audit.requester).transfer(audit.amount);

        emit AuditRefunded(dao, _auditIndex, audit.requester, audit.amount, block.timestamp);
    }

    function daoReleasePayment(uint256 _auditIndex) external {
        require(_auditIndex < audits.length, "Audit index out of bounds");
        Audit storage audit = audits[_auditIndex];
        require(audit.status == AuditStatus.COMPLETED, "Audit not completed");
        require(msg.sender == dao, "Only DAO can release payments for its audits");
        require(!audit.daoPaid && !audit.reviewerPaid, "Payments already released");

        uint256 reviewerAmount = (audit.amount * REVIEWER_SHARE) / 100;
        uint256 daoAmount = audit.amount - reviewerAmount;

        audit.reviewerPaid = true;
        audit.daoPaid = true;

        payable(audit.assignedReviewer).transfer(reviewerAmount);
        payable(dao).transfer(daoAmount);

        emit PaymentReleased(dao, _auditIndex, audit.assignedReviewer, reviewerAmount, "reviewer", block.timestamp);
        emit PaymentReleased(dao, _auditIndex, dao, daoAmount, "dao", block.timestamp);
    }

    // Owner functions for emergency scenarios only
    function emergencyRefundAudit(uint256 _auditIndex) external onlyOwner {
        require(_auditIndex < audits.length, "Audit index out of bounds");
        Audit storage audit = audits[_auditIndex];
        require(audit.status == AuditStatus.DISPUTED, "Audit not disputed");
        require(!audit.daoPaid && !audit.reviewerPaid, "Payments already released");

        audit.status = AuditStatus.REFUNDED;

        payable(audit.requester).transfer(audit.amount);

        emit AuditRefunded(dao, _auditIndex, audit.requester, audit.amount, block.timestamp);
    }

    function emergencyReleasePayment(uint256 _auditIndex) external onlyOwner {
        require(_auditIndex < audits.length, "Audit index out of bounds");
        Audit storage audit = audits[_auditIndex];
        require(audit.status == AuditStatus.COMPLETED, "Audit not completed");
        require(!audit.daoPaid && !audit.reviewerPaid, "Payments already released");

        uint256 reviewerAmount = (audit.amount * REVIEWER_SHARE) / 100;
        uint256 daoAmount = audit.amount - reviewerAmount;

        audit.reviewerPaid = true;
        audit.daoPaid = true;

        payable(audit.assignedReviewer).transfer(reviewerAmount);
        payable(dao).transfer(daoAmount);

        emit PaymentReleased(dao, _auditIndex, audit.assignedReviewer, reviewerAmount, "reviewer", block.timestamp);
        emit PaymentReleased(dao, _auditIndex, dao, daoAmount, "dao", block.timestamp);
    }

    // Optional: Allow contract owner to transfer ownership
    function transferOwnership(address newOwner) public override onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        _transferOwnership(newOwner);
    }

    // Modifiers
    modifier onlyDAO(address _dao) {
        require(msg.sender == _dao, "Only DAO can call this function");
        _;
    }

    modifier onlyReviewer(address _dao) {
        require(DAO(payable(dao)).reviewers(msg.sender), "Not a DAO reviewer");
        _;
    }

    modifier onlyEligibleReviewer() {
        require(isReviewerEligible(msg.sender), "Reviewer not eligible");
        _;
    }

    // Core Functions
    function createAudit(
        string memory _ipfsHash
    ) external payable nonReentrant returns (uint256) {
        require(msg.value > 0, "Must send payment");
        require(bytes(_ipfsHash).length > 0, "IPFS hash required");

        uint256 auditIndex = audits.length;

        audits.push(Audit({
            requester: msg.sender,
            assignedReviewer: address(0),
            amount: msg.value,
            ipfsHash: _ipfsHash,
            status: AuditStatus.PENDING,
            createdAt: block.timestamp,
            completedAt: 0,
            reviewerPaid: false,
            daoPaid: false
        }));

        requesterAudits[msg.sender].push(auditIndex);

        emit AuditCreated(dao, msg.sender, msg.value, _ipfsHash, block.timestamp);

        return auditIndex;
    }

    // NEW: Self-assignment function
    function claimReview(uint256 _auditIndex) 
        external 
        onlyReviewer(dao) 
        onlyEligibleReviewer 
        returns (bool) 
    {
        require(_auditIndex < audits.length, "Audit index out of bounds");
        Audit storage audit = audits[_auditIndex];
        
        // Debug: Add explicit checks with custom errors
        if (audit.status != AuditStatus.PENDING) {
            revert("Audit is not pending");
        }
        if (audit.assignedReviewer != address(0)) {
            revert("Audit already has reviewer");
        }

        // Assign the reviewer
        audit.assignedReviewer = msg.sender;
        audit.status = AuditStatus.IN_REVIEW;

        reviewerAudits[msg.sender].push(_auditIndex);
        
        // Update reviewer profile
        updateReviewerProfile(msg.sender, false);

        emit ReviewClaimed(dao, _auditIndex, msg.sender, block.timestamp);
        emit ReviewerAssigned(dao, _auditIndex, msg.sender);
        emit ReviewerEligibilityUpdated(msg.sender, reviewerActiveReviews[msg.sender]);

        return true;
    }

    // Existing: Admin assignment function (kept for compatibility)
    function assignReviewer(uint256 _auditIndex, address _reviewer) external {
        require(_auditIndex < audits.length, "Audit index out of bounds");
        Audit storage audit = audits[_auditIndex];
        require(audit.status == AuditStatus.PENDING, "Audit not pending");
        require(msg.sender == dao, "Only DAO can assign reviewer");
        require(_reviewer != address(0), "Invalid reviewer address");

        audit.assignedReviewer = _reviewer;
        audit.status = AuditStatus.IN_REVIEW;

        reviewerAudits[_reviewer].push(_auditIndex);
        
        // Update reviewer profile
        updateReviewerProfile(_reviewer, false);

        emit AuditAssigned(dao, _auditIndex, _reviewer, block.timestamp);
        emit ReviewerAssigned(dao, _auditIndex, _reviewer);
        emit ReviewerEligibilityUpdated(_reviewer, reviewerActiveReviews[_reviewer]);
    }

    // NEW: Rotation pool functions
    function joinRotationPool() external onlyReviewer(dao) {
        require(!daoRotationPools[dao].isInPool[msg.sender], "Already in pool");
        
        RotationPool storage pool = daoRotationPools[dao];
        pool.reviewers.push(msg.sender);
        pool.isInPool[msg.sender] = true;
        
        emit JoinedRotationPool(dao, msg.sender);
    }

    function leaveRotationPool() external onlyReviewer(dao) {
        require(daoRotationPools[dao].isInPool[msg.sender], "Not in pool");
        
        _removeFromRotationPool(dao, msg.sender);
        
        emit LeftRotationPool(dao, msg.sender);
    }

    function assignNextReviewer(uint256 _auditIndex) external onlyDAO(dao) {
        require(_auditIndex < audits.length, "Audit index out of bounds");
        Audit storage audit = audits[_auditIndex];
        require(audit.status == AuditStatus.PENDING, "Audit not pending");
        
        RotationPool storage pool = daoRotationPools[dao];
        require(pool.reviewers.length > 0, "No reviewers in pool");
        
        // Find next eligible reviewer
        for (uint i = 0; i < pool.reviewers.length; i++) {
            uint256 index = (pool.currentIndex + i) % pool.reviewers.length;
            address reviewer = pool.reviewers[index];
            
            if (isReviewerEligible(reviewer) && 
                block.timestamp >= pool.lastAssigned[reviewer] + ROTATION_COOLDOWN) {
                
                audit.assignedReviewer = reviewer;
                audit.status = AuditStatus.IN_REVIEW;
                pool.currentIndex = (index + 1) % pool.reviewers.length;
                pool.lastAssigned[reviewer] = block.timestamp;
                
                reviewerAudits[reviewer].push(_auditIndex);
                updateReviewerProfile(reviewer, false);
                
                emit ReviewerAssigned(dao, _auditIndex, reviewer);
                emit ReviewerEligibilityUpdated(reviewer, reviewerActiveReviews[reviewer]);
                return;
            }
        }
        
        revert("No eligible reviewers in pool");
    }

    // Reviewer management functions
    function updateReviewerProfile(address _reviewer, bool _isCompleting) internal {
        ReviewerProfile storage profile = reviewerProfiles[_reviewer];
        
        if (profile.reviewer == address(0)) {
            // Initialize profile if it doesn't exist
            profile.reviewer = _reviewer;
            profile.activeReviews = 0;
            profile.completedReviews = 0;
            profile.reputation = 100; // Start with base reputation
            profile.lastAssignment = 0;
            profile.isActive = true;
            profile.maxConcurrentReviews = DEFAULT_MAX_CONCURRENT_REVIEWS;
        }
        
        if (_isCompleting) {
            profile.activeReviews--;
            profile.completedReviews++;
            profile.reputation += 10; // Increase reputation for completed work
        } else {
            profile.activeReviews++;
            profile.lastAssignment = block.timestamp;
        }
        
        profile.isActive = true;
        reviewerActiveReviews[_reviewer] = profile.activeReviews;
    }

    function isReviewerEligible(address _reviewer) public view returns (bool) {
        ReviewerProfile storage profile = reviewerProfiles[_reviewer];
        
        // If profile doesn't exist, check if they're a reviewer and give default limits
        if (profile.reviewer == address(0)) {
            return true; // New reviewers are eligible by default
        }
        
        return profile.activeReviews < profile.maxConcurrentReviews && profile.isActive;
    }

    // View functions
    function getAudit(uint256 _auditIndex) external view returns (Audit memory) {
        require(_auditIndex < audits.length, "Audit index out of bounds");
        return audits[_auditIndex];
    }

    function getAuditCount() external view returns (uint256) {
        return audits.length;
    }

    function getAudits() external view returns (Audit[] memory) {
        return audits;
    }

    function getRequesterAudits(address _requester) external view returns (uint256[] memory) {
        return requesterAudits[_requester];
    }

    function getReviewerAudits(address _reviewer) external view returns (uint256[] memory) {
        return reviewerAudits[_reviewer];
    }

    function getRotationPool() external view returns (address[] memory) {
        return daoRotationPools[dao].reviewers;
    }

    function getReviewerProfile(address _reviewer) external view returns (ReviewerProfile memory) {
        return reviewerProfiles[_reviewer];
    }

    function setMaxConcurrentReviews(uint256 _max) external {
        ReviewerProfile storage profile = reviewerProfiles[msg.sender];
        require(profile.reviewer != address(0), "Reviewer profile not found");
        require(_max > 0 && _max <= 10, "Invalid max concurrent reviews");
        
        profile.maxConcurrentReviews = _max;
    }

    // Internal helper functions
    function _removeFromRotationPool(address _dao, address _reviewer) internal {
        RotationPool storage pool = daoRotationPools[_dao];
        
        for (uint i = 0; i < pool.reviewers.length; i++) {
            if (pool.reviewers[i] == _reviewer) {
                pool.reviewers[i] = pool.reviewers[pool.reviewers.length - 1];
                pool.reviewers.pop();
                break;
            }
        }
        
        pool.isInPool[_reviewer] = false;
    }

    // Existing functions (unchanged)
    function completeAudit(uint256 _auditIndex) external {
        require(_auditIndex < audits.length, "Audit index out of bounds");
        Audit storage audit = audits[_auditIndex];
        require(audit.status == AuditStatus.IN_REVIEW, "Audit not in review");
        require(msg.sender == audit.assignedReviewer, "Only assigned reviewer can complete");

        audit.status = AuditStatus.COMPLETED;
        audit.completedAt = block.timestamp;
        
        // Update reviewer profile
        updateReviewerProfile(msg.sender, true);

        emit AuditCompleted(dao, _auditIndex, audit.assignedReviewer, block.timestamp);
    }

    function disputeAudit(uint256 _auditIndex, string memory _reason) external {
        require(_auditIndex < audits.length, "Audit index out of bounds");
        Audit storage audit = audits[_auditIndex];
        require(audit.status == AuditStatus.IN_REVIEW, "Audit not in review");
        require(
            msg.sender == audit.requester || msg.sender == audit.assignedReviewer,
            "Only requester or reviewer can dispute"
        );

        audit.status = AuditStatus.DISPUTED;

        emit AuditDisputed(dao, _auditIndex, msg.sender, _reason, block.timestamp);
    }

}
