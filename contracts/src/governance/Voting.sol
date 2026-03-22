// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract Voting is Ownable, AccessControl {
    bytes32 public constant DAO_MEMBER_ROLE = keccak256("DAO_MEMBER_ROLE");

    uint256 public proposalCount;

    enum ProposalType {
        AUDIT_APPROVAL,
        REVIEWER_APPLICATION,
        PARAMETER_CHANGE,
        FUND_ALLOCATION
    }

    enum VoteChoice {
        ABSTAIN,
        YES,
        NO
    }

    enum ProposalStatus {
        ACTIVE,
        PASSED,
        REJECTED,
        EXECUTED,
        CANCELLED
    }

    struct Proposal {
        uint256 id;
        uint256 relatedId;
        ProposalType proposalType;
        string title;
        string description;
        address proposer;
        uint256 yesVotes;
        uint256 noVotes;
        uint256 totalVotes;
        uint256 quorumRequired;
        uint256 endTime;
        ProposalStatus status;
        mapping(address => bool) hasVoted;
        mapping(address => VoteChoice) votes;
    }

    mapping(uint256 => Proposal) public proposals;
    mapping(address => uint256[]) public voterProposals;
    mapping(uint256 => uint256[]) public relatedProposals;

    uint256 public constant DEFAULT_QUORUM = 51;
    uint256 public constant DEFAULT_VOTING_PERIOD = 3 days;

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        ProposalType proposalType,
        uint256 relatedId,
        uint256 timestamp
    );

    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        VoteChoice choice,
        uint256 timestamp
    );

    event ProposalExecuted(
        uint256 indexed proposalId,
        address indexed executor,
        uint256 timestamp
    );

    event ProposalCancelled(
        uint256 indexed proposalId,
        address indexed canceller,
        uint256 timestamp
    );

    constructor(address _initialOwner) Ownable(_initialOwner) {
        _grantRole(DEFAULT_ADMIN_ROLE, _initialOwner);
        _grantRole(DAO_MEMBER_ROLE, _initialOwner);
    }

    function createProposal(
        uint256 _relatedId,
        ProposalType _proposalType,
        string memory _title,
        string memory _description,
        uint256 _votingPeriod
    ) external returns (uint256) {
        require(hasRole(DAO_MEMBER_ROLE, msg.sender), "Not a DAO member");
        require(bytes(_title).length > 0, "Title required");
        require(_votingPeriod >= 1 hours && _votingPeriod <= 30 days, "Invalid voting period");

        proposalCount++;
        uint256 proposalId = proposalCount;

        Proposal storage proposal = proposals[proposalId];
        proposal.id = proposalId;
        proposal.relatedId = _relatedId;
        proposal.proposalType = _proposalType;
        proposal.title = _title;
        proposal.description = _description;
        proposal.proposer = msg.sender;
        proposal.yesVotes = 0;
        proposal.noVotes = 0;
        proposal.totalVotes = 0;
        proposal.quorumRequired = DEFAULT_QUORUM;
        proposal.endTime = block.timestamp + _votingPeriod;
        proposal.status = ProposalStatus.ACTIVE;

        voterProposals[msg.sender].push(proposalId);
        relatedProposals[_relatedId].push(proposalId);

        emit ProposalCreated(proposalId, msg.sender, _proposalType, _relatedId, block.timestamp);

        return proposalId;
    }

    function castVote(uint256 _proposalId, VoteChoice _choice) external {
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.id == _proposalId, "Proposal not found");
        require(proposal.status == ProposalStatus.ACTIVE, "Proposal not active");
        require(hasRole(DAO_MEMBER_ROLE, msg.sender), "Not a DAO member");
        require(!proposal.hasVoted[msg.sender], "Already voted");
        require(block.timestamp < proposal.endTime, "Voting period ended");

        proposal.hasVoted[msg.sender] = true;
        proposal.votes[msg.sender] = _choice;
        proposal.totalVotes++;

        if (_choice == VoteChoice.YES) {
            proposal.yesVotes++;
        } else if (_choice == VoteChoice.NO) {
            proposal.noVotes++;
        }

        voterProposals[msg.sender].push(_proposalId);

        emit VoteCast(_proposalId, msg.sender, _choice, block.timestamp);

        _checkProposalStatus(_proposalId);
    }

    function executeProposal(uint256 _proposalId) external {
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.id == _proposalId, "Proposal not found");
        require(proposal.status == ProposalStatus.PASSED, "Proposal not passed");
        require(block.timestamp >= proposal.endTime, "Voting period not ended");
        require(hasRole(DAO_MEMBER_ROLE, msg.sender), "Not a DAO member");

        proposal.status = ProposalStatus.EXECUTED;

        emit ProposalExecuted(_proposalId, msg.sender, block.timestamp);
    }

    function cancelProposal(uint256 _proposalId) external {
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.id == _proposalId, "Proposal not found");
        require(proposal.status == ProposalStatus.ACTIVE, "Proposal not active");
        require(
            msg.sender == proposal.proposer || msg.sender == owner(),
            "Not authorized to cancel"
        );

        proposal.status = ProposalStatus.CANCELLED;

        emit ProposalCancelled(_proposalId, msg.sender, block.timestamp);
    }

    function _checkProposalStatus(uint256 _proposalId) internal {
        Proposal storage proposal = proposals[_proposalId];

        if (block.timestamp >= proposal.endTime) {
            uint256 totalVoters = proposal.totalVotes;
            uint256 yesPercentage = totalVoters > 0
                ? (proposal.yesVotes * 100) / totalVoters
                : 0;

            if (yesPercentage >= proposal.quorumRequired) {
                proposal.status = ProposalStatus.PASSED;
            } else {
                proposal.status = ProposalStatus.REJECTED;
            }
        }
    }

    function getProposal(uint256 _proposalId) external view returns (
        uint256 id,
        uint256 relatedId,
        ProposalType proposalType,
        string memory title,
        string memory description,
        address proposer,
        uint256 yesVotes,
        uint256 noVotes,
        uint256 totalVotes,
        uint256 quorumRequired,
        uint256 endTime,
        ProposalStatus status
    ) {
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.id == _proposalId, "Proposal not found");

        return (
            proposal.id,
            proposal.relatedId,
            proposal.proposalType,
            proposal.title,
            proposal.description,
            proposal.proposer,
            proposal.yesVotes,
            proposal.noVotes,
            proposal.totalVotes,
            proposal.quorumRequired,
            proposal.endTime,
            proposal.status
        );
    }

    function hasVoted(uint256 _proposalId, address _voter) external view returns (bool) {
        return proposals[_proposalId].hasVoted[_voter];
    }

    function getVoterProposals(address _voter) external view returns (uint256[] memory) {
        return voterProposals[_voter];
    }

    function getRelatedProposals(uint256 _relatedId) external view returns (uint256[] memory) {
        return relatedProposals[_relatedId];
    }

    function grantDAOMemberRole(address _member) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(DAO_MEMBER_ROLE, _member);
    }

    function revokeDAOMemberRole(address _member) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(DAO_MEMBER_ROLE, _member);
    }

    function getProposalCount() external view returns (uint256) {
        return proposalCount;
    }
}
