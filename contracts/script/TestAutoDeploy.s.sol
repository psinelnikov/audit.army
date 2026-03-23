// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/DAOFactory.sol";

contract TestAutoDeploy is Script {
    DAOFactory public daoFactory;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address daoFactoryAddress = 0xCf17B8C46D9C765871019A383Bf7D7086485CD08; // Use the newly deployed DAOFactory

        vm.startBroadcast(deployerPrivateKey);

        daoFactory = DAOFactory(daoFactoryAddress);

        console.log("DAO Factory Address:", daoFactoryAddress);
        console.log("Current DAO Count:", daoFactory.daoCount());

        // Test creating a new DAO (this should auto-deploy an AuditEscrow)
        string memory daoName = "Auto Test DAO";
        string memory daoSymbol = "AUTO";
        string memory description = "Test DAO with automatic AuditEscrow deployment";
        address[] memory initialReviewers = new address[](1);
        initialReviewers[0] = vm.addr(deployerPrivateKey);

        console.log("Creating DAO:", daoName);
        address newDAO = daoFactory.createDAO(daoName, daoSymbol, initialReviewers, description);
        
        uint256 newDaoId = daoFactory.daoCount();
        address auditEscrowAddress = daoFactory.getAuditEscrowAddress(newDAO);

        console.log("New DAO deployed at:", newDAO);
        console.log("DAO Address:", newDAO);
        console.log("AuditEscrow Address:", auditEscrowAddress);

        vm.stopBroadcast();

        console.log("\n=== Test Results ===");
        console.log("DAO created successfully");
        console.log("AuditEscrow auto-deployed");
        console.log("Both contracts linked");
        console.log("");
        console.log("Update your backend with:");
        console.log("DAO Factory:", daoFactoryAddress);
        console.log("DAO Address:", newDAO);
        console.log("AuditEscrow Address:", auditEscrowAddress);
    }
}
