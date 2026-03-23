// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/DAOFactory.sol";

contract CreateTestDAO is Script {
    DAOFactory public daoFactory;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address daoFactoryAddress = 0xCf17B8C46D9C765871019A383Bf7D7086485CD08; // Use the deployed DAOFactory

        vm.startBroadcast(deployerPrivateKey);

        daoFactory = DAOFactory(daoFactoryAddress);

        console.log("DAO Factory Address:", daoFactoryAddress);
        console.log("Current DAO Count:", daoFactory.daoCount());

        // Create a new DAO for testing
        string memory daoName = "Audit Army DAO";
        string memory daoSymbol = "AUDIT";
        string memory description = "DAO for audit.army platform with automatic AuditEscrow deployment";
        address[] memory initialReviewers = new address[](1);
        initialReviewers[0] = vm.addr(deployerPrivateKey);

        console.log("Creating new DAO:", daoName);
        address newDAO = daoFactory.createDAO(daoName, daoSymbol, initialReviewers, description);
        
        uint256 newDaoId = daoFactory.daoCount();
        address auditEscrowAddress = daoFactory.getAuditEscrowAddress(newDAO);

        console.log("New DAO deployed at:", newDAO);
        console.log("New DAO Address:", newDAO);
        console.log("AuditEscrow Address:", auditEscrowAddress);

        vm.stopBroadcast();

        console.log("\n=== DAO Creation Complete ===");
        console.log("Register this DAO in your database:");
        console.log("Name:", daoName);
        console.log("Symbol:", daoSymbol);
        console.log("DAO Address:", newDAO);
        console.log("AuditEscrow Address:", auditEscrowAddress);
        console.log("Creator:", vm.addr(deployerPrivateKey));
    }
}
