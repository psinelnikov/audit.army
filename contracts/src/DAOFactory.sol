// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./core/DAO.sol";

contract DAOFactory is Ownable {
    uint256 public daoCount;
    address[] public daoList;

    mapping(uint256 => address) public daoIdToAddress;
    mapping(address => bool) public isDAO;

    event DAOCreated(
        uint256 indexed daoId,
        address indexed daoAddress,
        string name,
        address indexed creator,
        uint256 createdAt
    );

    constructor(address _initialOwner) Ownable(_initialOwner) {}

    function createDAO(
        string memory _name,
        string memory _symbol,
        address[] memory _initialReviewers,
        string memory _description
    ) external returns (address daoAddress) {
        require(bytes(_name).length > 0, "DAO name cannot be empty");
        require(bytes(_symbol).length > 0, "DAO symbol cannot be empty");
        require(_initialReviewers.length > 0, "At least one reviewer required");

        daoCount++;
        uint256 daoId = daoCount;

        daoAddress = address(new DAO(
            _name,
            _symbol,
            _initialReviewers,
            _description,
            msg.sender,
            daoId
        ));

        daoIdToAddress[daoId] = daoAddress;
        daoList.push(daoAddress);
        isDAO[daoAddress] = true;

        emit DAOCreated(daoId, daoAddress, _name, msg.sender, block.timestamp);
    }

    function getDAOAddress(uint256 _daoId) external view returns (address) {
        require(_daoId > 0 && _daoId <= daoCount, "Invalid DAO ID");
        return daoIdToAddress[_daoId];
    }

    function getAllDAOs() external view returns (address[] memory) {
        return daoList;
    }

    function getDAOCount() external view returns (uint256) {
        return daoCount;
    }
}
