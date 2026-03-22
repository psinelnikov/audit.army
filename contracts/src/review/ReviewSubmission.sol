// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract ReviewSubmission is Ownable, ReentrancyGuard {
    uint256 public reviewCount;
    address public auditEscrow;

    enum ReviewStatus {
        SUBMITTED,
        APPROVED,
        REJECTED,
        DISPUTED
    }

    struct Review {
        uint256 id;
        uint256 auditId;
        address reviewer;
        string ipfsHash;
        ReviewStatus status;
        uint256 approvalCount;
        uint256 rejectionCount;
        uint256 submittedAt;
        uint256 approvedAt;
    }

    mapping(uint256 => Review) public reviews;
    mapping(uint256 => uint256[]) public auditReviews;
    mapping(address => uint256[]) public reviewerReviews;

    address public auditEscrowAddress;

    event ReviewSubmitted(
        uint256 indexed reviewId,
        uint256 indexed auditId,
        address indexed reviewer,
        string ipfsHash,
        uint256 timestamp
    );

    event ReviewApproved(
        uint256 indexed reviewId,
        uint256 approvalCount,
        uint256 timestamp
    );

    event ReviewRejected(
        uint256 indexed reviewId,
        uint256 rejectionCount,
        uint256 timestamp
    );

    event ReviewDisputed(
        uint256 indexed reviewId,
        address indexed disputer,
        uint256 timestamp
    );

    modifier onlyValidAudit(uint256 _auditId) {
        require(_auditId > 0, "Invalid audit ID");
        _;
    }

    constructor(address _auditEscrowAddress, address _initialOwner) Ownable(_initialOwner) {
        auditEscrowAddress = _auditEscrowAddress;
    }

    function submitReview(
        uint256 _auditId,
        string memory _ipfsHash
    ) external onlyValidAudit(_auditId) nonReentrant returns (uint256) {
        require(bytes(_ipfsHash).length > 0, "IPFS hash required");

        reviewCount++;
        uint256 reviewId = reviewCount;

        reviews[reviewId] = Review({
            id: reviewId,
            auditId: _auditId,
            reviewer: msg.sender,
            ipfsHash: _ipfsHash,
            status: ReviewStatus.SUBMITTED,
            approvalCount: 0,
            rejectionCount: 0,
            submittedAt: block.timestamp,
            approvedAt: 0
        });

        auditReviews[_auditId].push(reviewId);
        reviewerReviews[msg.sender].push(reviewId);

        emit ReviewSubmitted(reviewId, _auditId, msg.sender, _ipfsHash, block.timestamp);

        return reviewId;
    }

    function voteOnReview(uint256 _reviewId, bool _approve) external {
        Review storage review = reviews[_reviewId];
        require(review.id == _reviewId, "Review not found");
        require(review.status == ReviewStatus.SUBMITTED, "Review already processed");
        require(msg.sender != review.reviewer, "Reviewer cannot vote on own review");

        if (_approve) {
            review.approvalCount++;
            emit ReviewApproved(_reviewId, review.approvalCount, block.timestamp);
        } else {
            review.rejectionCount++;
            emit ReviewRejected(_reviewId, review.rejectionCount, block.timestamp);
        }
    }

    function approveReview(uint256 _reviewId) external onlyOwner {
        Review storage review = reviews[_reviewId];
        require(review.id == _reviewId, "Review not found");
        require(review.status == ReviewStatus.SUBMITTED, "Review already processed");
        require(review.approvalCount > review.rejectionCount, "Review does not have majority approval");

        review.status = ReviewStatus.APPROVED;
        review.approvedAt = block.timestamp;
    }

    function rejectReview(uint256 _reviewId) external onlyOwner {
        Review storage review = reviews[_reviewId];
        require(review.id == _reviewId, "Review not found");
        require(review.status == ReviewStatus.SUBMITTED, "Review already processed");

        review.status = ReviewStatus.REJECTED;
    }

    function disputeReview(uint256 _reviewId) external {
        Review storage review = reviews[_reviewId];
        require(review.id == _reviewId, "Review not found");
        require(review.status == ReviewStatus.SUBMITTED || review.status == ReviewStatus.APPROVED, "Review cannot be disputed");

        review.status = ReviewStatus.DISPUTED;

        emit ReviewDisputed(_reviewId, msg.sender, block.timestamp);
    }

    function getReview(uint256 _reviewId) external view returns (Review memory) {
        require(reviews[_reviewId].id == _reviewId, "Review not found");
        return reviews[_reviewId];
    }

    function getAuditReviews(uint256 _auditId) external view returns (uint256[] memory) {
        return auditReviews[_auditId];
    }

    function getReviewerReviews(address _reviewer) external view returns (uint256[] memory) {
        return reviewerReviews[_reviewer];
    }

    function getReviewCount() external view returns (uint256) {
        return reviewCount;
    }

    function updateAuditEscrow(address _newAuditEscrow) external onlyOwner {
        auditEscrowAddress = _newAuditEscrow;
    }
}
