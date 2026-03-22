// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract AuditEscrow is Ownable, ReentrancyGuard {
    uint256 public auditCount;
    address public daoFactory;

    enum AuditStatus {
        PENDING,
        IN_REVIEW,
        COMPLETED,
        DISPUTED,
        REFUNDED
    }

    struct Audit {
        uint256 id;
        address dao;
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

    mapping(uint256 => Audit) public audits;
    mapping(address => uint256[]) public requesterAudits;
    mapping(address => uint256[]) public reviewerAudits;
    mapping(address => uint256[]) public daoAudits;

    uint256 public constant REVIEWER_SHARE = 80;
    uint256 public constant DAO_SHARE = 20;

    event AuditCreated(
        uint256 indexed auditId,
        address indexed dao,
        address indexed requester,
        uint256 amount,
        string ipfsHash,
        uint256 timestamp
    );

    event AuditAssigned(
        uint256 indexed auditId,
        address indexed reviewer,
        uint256 timestamp
    );

    event AuditCompleted(
        uint256 indexed auditId,
        address indexed reviewer,
        uint256 timestamp
    );

    event AuditDisputed(
        uint256 indexed auditId,
        address indexed disputer,
        string reason,
        uint256 timestamp
    );

    event AuditRefunded(
        uint256 indexed auditId,
        address indexed requester,
        uint256 amount,
        uint256 timestamp
    );

    event PaymentReleased(
        uint256 indexed auditId,
        address indexed recipient,
        uint256 amount,
        string recipientType,
        uint256 timestamp
    );

    constructor(address _daoFactory, address _initialOwner) Ownable(_initialOwner) {
        daoFactory = _daoFactory;
    }

    function createAudit(
        address _dao,
        string memory _ipfsHash
    ) external payable nonReentrant returns (uint256) {
        require(msg.value > 0, "Must send payment");
        require(bytes(_ipfsHash).length > 0, "IPFS hash required");

        auditCount++;
        uint256 auditId = auditCount;

        audits[auditId] = Audit({
            id: auditId,
            dao: _dao,
            requester: msg.sender,
            assignedReviewer: address(0),
            amount: msg.value,
            ipfsHash: _ipfsHash,
            status: AuditStatus.PENDING,
            createdAt: block.timestamp,
            completedAt: 0,
            reviewerPaid: false,
            daoPaid: false
        });

        requesterAudits[msg.sender].push(auditId);
        daoAudits[_dao].push(auditId);

        emit AuditCreated(auditId, _dao, msg.sender, msg.value, _ipfsHash, block.timestamp);

        return auditId;
    }

    function assignReviewer(uint256 _auditId, address _reviewer) external {
        Audit storage audit = audits[_auditId];
        require(audit.id == _auditId, "Audit not found");
        require(audit.status == AuditStatus.PENDING, "Audit not pending");
        require(msg.sender == audit.dao, "Only DAO can assign reviewer");
        require(_reviewer != address(0), "Invalid reviewer address");

        audit.assignedReviewer = _reviewer;
        audit.status = AuditStatus.IN_REVIEW;

        reviewerAudits[_reviewer].push(_auditId);

        emit AuditAssigned(_auditId, _reviewer, block.timestamp);
    }

    function completeAudit(uint256 _auditId) external {
        Audit storage audit = audits[_auditId];
        require(audit.id == _auditId, "Audit not found");
        require(audit.status == AuditStatus.IN_REVIEW, "Audit not in review");
        require(msg.sender == audit.assignedReviewer, "Only assigned reviewer can complete");

        audit.status = AuditStatus.COMPLETED;
        audit.completedAt = block.timestamp;

        emit AuditCompleted(_auditId, audit.assignedReviewer, block.timestamp);
    }

    function disputeAudit(uint256 _auditId, string memory _reason) external {
        Audit storage audit = audits[_auditId];
        require(audit.id == _auditId, "Audit not found");
        require(
            audit.status == AuditStatus.IN_REVIEW || audit.status == AuditStatus.COMPLETED,
            "Audit cannot be disputed"
        );
        require(
            msg.sender == audit.requester || msg.sender == audit.assignedReviewer,
            "Not authorized to dispute"
        );

        audit.status = AuditStatus.DISPUTED;

        emit AuditDisputed(_auditId, msg.sender, _reason, block.timestamp);
    }

    function refundAudit(uint256 _auditId) external onlyOwner {
        Audit storage audit = audits[_auditId];
        require(audit.id == _auditId, "Audit not found");
        require(
            audit.status == AuditStatus.DISPUTED || audit.status == AuditStatus.PENDING,
            "Audit cannot be refunded"
        );

        uint256 amount = audit.amount;
        address payable requester = payable(audit.requester);

        audit.status = AuditStatus.REFUNDED;

        requester.transfer(amount);

        emit AuditRefunded(_auditId, requester, amount, block.timestamp);
    }

    function releasePayment(uint256 _auditId) external onlyOwner nonReentrant {
        Audit storage audit = audits[_auditId];
        require(audit.id == _auditId, "Audit not found");
        require(audit.status == AuditStatus.COMPLETED, "Audit not completed");
        require(!audit.reviewerPaid || !audit.daoPaid, "Payments already released");

        uint256 reviewerAmount = (audit.amount * REVIEWER_SHARE) / 100;
        uint256 daoAmount = audit.amount - reviewerAmount;

        if (!audit.reviewerPaid) {
            payable(audit.assignedReviewer).transfer(reviewerAmount);
            audit.reviewerPaid = true;
            emit PaymentReleased(_auditId, audit.assignedReviewer, reviewerAmount, "reviewer", block.timestamp);
        }

        if (!audit.daoPaid) {
            payable(audit.dao).transfer(daoAmount);
            audit.daoPaid = true;
            emit PaymentReleased(_auditId, audit.dao, daoAmount, "dao", block.timestamp);
        }
    }

    function getAudit(uint256 _auditId) external view returns (Audit memory) {
        require(audits[_auditId].id == _auditId, "Audit not found");
        return audits[_auditId];
    }

    function getRequesterAudits(address _requester) external view returns (uint256[] memory) {
        return requesterAudits[_requester];
    }

    function getReviewerAudits(address _reviewer) external view returns (uint256[] memory) {
        return reviewerAudits[_reviewer];
    }

    function getDAOAudits(address _dao) external view returns (uint256[] memory) {
        return daoAudits[_dao];
    }

    function getAuditCount() external view returns (uint256) {
        return auditCount;
    }
}
