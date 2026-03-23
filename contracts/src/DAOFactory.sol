// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./core/DAO.sol";
import "./review/AuditEscrow.sol";

interface IDAO {
    function reviewers(address) external view returns (bool);
    function reviewerList() external view returns (address[] memory);
}

contract DAOFactory {
    uint256 public daoCount;
    address[] public daoList;
    mapping(uint256 => address) public daoIdToAddress;
    mapping(address => address) public daoToAuditEscrow;
    mapping(address => bool) public isDAO;

    event DAOCreated(
        uint256 indexed daoId,
        address indexed daoAddress,
        string name,
        address indexed creator,
        uint256 timestamp
    );

    event AuditEscrowDeployed(
        address indexed daoAddress,
        address indexed auditEscrowAddress,
        uint256 timestamp
    );

    function createDAO(
        string memory _name,
        string memory _symbol,
        address[] memory _initialReviewers,
        string memory _description
    ) external returns (address) {
        require(bytes(_name).length > 0, "Empty name");
        require(bytes(_symbol).length > 0, "Empty symbol");
        require(_initialReviewers.length > 0, "Need reviewers");

        daoCount++;
        
        DAO newDAO = new DAO(
            _name,
            _symbol,
            _initialReviewers,
            _description,
            msg.sender,
            daoCount
        );

        address daoAddress = address(newDAO);
        daoIdToAddress[daoCount] = daoAddress;
        daoList.push(daoAddress);
        isDAO[daoAddress] = true;

        AuditEscrow newAuditEscrow = new AuditEscrow(daoAddress);
        daoToAuditEscrow[daoAddress] = address(newAuditEscrow);

        emit DAOCreated(daoCount, daoAddress, _name, msg.sender, block.timestamp);
        emit AuditEscrowDeployed(daoAddress, address(newAuditEscrow), block.timestamp);
        
        return daoAddress;
    }

    function getDAOAddress(uint256 _daoId) external view returns (address) {
        return daoIdToAddress[_daoId];
    }

    function getAuditEscrowAddress(address _daoAddress) external view returns (address) {
        return daoToAuditEscrow[_daoAddress];
    }

    function getAllDAOs() external view returns (address[] memory) {
        return daoList;
    }

    function getDAOCount() external view returns (uint256) {
        return daoCount;
    }

//    function isReviewer(address _dao, address _reviewer) external view returns (bool) {
//        return IDAO(_dao).reviewers(_reviewer);
//    }

//    function getReviewers(address _dao) external view returns (address[] memory) {
//        return IDAO(_dao).reviewerList();
//    }
}
