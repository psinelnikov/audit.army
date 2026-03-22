// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/DAOFactory.sol";
import "../src/core/DAO.sol";
import "../src/review/AuditEscrow.sol";
import "../src/review/ReviewSubmission.sol";
import "../src/governance/Voting.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        console.log("Deploying contracts with address:", deployer);
        console.log("Chain ID:", block.chainid);

        DeployContracts memory deployed = deployContracts(deployer);

        vm.stopBroadcast();

        console.log("\n=== Deployment Complete ===");
        console.log("DAO Factory:", deployed.daoFactory);
        console.log("Audit Escrow:", deployed.auditEscrow);
        console.log("Review Submission:", deployed.reviewSubmission);
        console.log("Voting:", deployed.voting);
    }

    struct DeployContracts {
        address daoFactory;
        address auditEscrow;
        address reviewSubmission;
        address voting;
    }

    function deployContracts(address _deployer) internal returns (DeployContracts memory) {
        DeployContracts memory deployed;

        console.log("\n1. Deploying DAOFactory...");
        DAOFactory daoFactory = new DAOFactory(_deployer);
        deployed.daoFactory = address(daoFactory);
        console.log("   DAO Factory deployed at:", deployed.daoFactory);

        console.log("\n2. Deploying AuditEscrow...");
        AuditEscrow auditEscrow = new AuditEscrow(deployed.daoFactory, _deployer);
        deployed.auditEscrow = address(auditEscrow);
        console.log("   Audit Escrow deployed at:", deployed.auditEscrow);

        console.log("\n3. Deploying ReviewSubmission...");
        ReviewSubmission reviewSubmission = new ReviewSubmission(deployed.auditEscrow, _deployer);
        deployed.reviewSubmission = address(reviewSubmission);
        console.log("   Review Submission deployed at:", deployed.reviewSubmission);

        console.log("\n4. Deploying Voting...");
        Voting voting = new Voting(_deployer);
        deployed.voting = address(voting);
        console.log("   Voting deployed at:", deployed.voting);

        return deployed;
    }
}
