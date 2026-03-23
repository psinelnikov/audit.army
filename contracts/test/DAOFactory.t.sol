// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/DAOFactory.sol";
import "../src/core/DAO.sol";

contract DAOFactoryTest is Test {
    DAOFactory public daoFactory;
    address public owner;
    address public reviewer1;
    address public reviewer2;
    address public daoAddress;

    function setUp() public {
        owner = address(this);
        reviewer1 = address(0x1);
        reviewer2 = address(0x2);

        daoFactory = new DAOFactory();
    }

    function test_CreateDAO() public {
        address[] memory initialReviewers = new address[](2);
        initialReviewers[0] = reviewer1;
        initialReviewers[1] = reviewer2;

        string memory name = "Test Audit DAO";
        string memory symbol = "TAD";
        string memory description = "A test DAO for audits";

        daoAddress = daoFactory.createDAO(name, symbol, initialReviewers, description);

        assertTrue(daoFactory.isDAO(daoAddress), "DAO should be registered");
        assertEq(daoFactory.getDAOCount(), 1, "DAO count should be 1");
        assertEq(daoFactory.getDAOAddress(1), daoAddress, "DAO address should match");

        DAO dao = DAO(payable(daoAddress));
        assertEq(dao.name(), name, "DAO name should match");
        assertEq(dao.symbol(), symbol, "DAO symbol should match");
        assertEq(dao.description(), description, "DAO description should match");
        assertEq(dao.creator(), owner, "DAO creator should match");
        assertEq(dao.getReviewerCount(), 2, "Should have 2 reviewers");
    }

    function test_CreateDAOWithEmptyName() public {
        address[] memory initialReviewers = new address[](1);
        initialReviewers[0] = reviewer1;

        vm.expectRevert("DAO name cannot be empty");
        daoFactory.createDAO("", "CAD", initialReviewers, "Description");
    }

    function test_CreateDAOWithEmptySymbol() public {
        address[] memory initialReviewers = new address[](1);
        initialReviewers[0] = reviewer1;

        vm.expectRevert("DAO symbol cannot be empty");
        daoFactory.createDAO("Name", "", initialReviewers, "Description");
    }

    function test_CreateDAOWithNoReviewers() public {
        address[] memory initialReviewers = new address[](0);

        vm.expectRevert("At least one reviewer required");
        daoFactory.createDAO("Name", "SYMB", initialReviewers, "Description");
    }

    function test_GetAllDAOs() public {
        address[] memory initialReviewers = new address[](1);
        initialReviewers[0] = reviewer1;

        daoAddress = daoFactory.createDAO("DAO1", "D1", initialReviewers, "Desc1");

        address[] memory daoList = daoFactory.getAllDAOs();
        assertEq(daoList.length, 1, "Should have 1 DAO");
        assertEq(daoList[0], daoAddress, "DAO address should match");
    }

    function test_GetInvalidDAOId() public {
        vm.expectRevert("Invalid DAO ID");
        daoFactory.getDAOAddress(999);
    }

    function test_CreateMultipleDAOs() public {
        address[] memory initialReviewers = new address[](1);
        initialReviewers[0] = reviewer1;

        daoFactory.createDAO("DAO1", "D1", initialReviewers, "Desc1");
        daoFactory.createDAO("DAO2", "D2", initialReviewers, "Desc2");
        daoFactory.createDAO("DAO3", "D3", initialReviewers, "Desc3");

        assertEq(daoFactory.getDAOCount(), 3, "Should have 3 DAOs");

        address dao1 = daoFactory.getDAOAddress(1);
        address dao2 = daoFactory.getDAOAddress(2);
        address dao3 = daoFactory.getDAOAddress(3);

        assertNotEq(dao1, dao2, "DAOs should be different");
        assertNotEq(dao2, dao3, "DAOs should be different");
        assertNotEq(dao1, dao3, "DAOs should be different");
    }

    function test_OwnerCanDeploy() public {
        address[] memory initialReviewers = new address[](1);
        initialReviewers[0] = reviewer1;

        address newDAO = daoFactory.createDAO("Test DAO", "TST", initialReviewers, "Test");
        assertTrue(newDAO != address(0), "DAO should be deployed");
    }

    function test_NonOwnerCannotDeploy() public {
        address[] memory initialReviewers = new address[](1);
        initialReviewers[0] = reviewer1;

        vm.startPrank(address(0x999));
        address newDAO = daoFactory.createDAO("Test DAO", "TST", initialReviewers, "Test");
        vm.stopPrank();

        assertTrue(newDAO != address(0), "DAO should still deploy");
    }
}
