// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/DAOFactory.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        console.log("Deploying DAOFactory with address:", deployer);
        console.log("Chain ID:", block.chainid);

        address daoFactory = deployDAOFactory();

        vm.stopBroadcast();

        console.log("\n=== Deployment Complete ===");
        console.log("DAO Factory:", daoFactory);
        console.log("\nNote: AuditEscrow contracts are now deployed automatically when DAOs are created");
    }

    function deployDAOFactory() internal returns (address) {
        console.log("\n1. Deploying DAOFactory...");
        DAOFactory daoFactory = new DAOFactory();
        address factoryAddress = address(daoFactory);
        console.log("   DAO Factory deployed at:", factoryAddress);
        
        return factoryAddress;
    }
}
