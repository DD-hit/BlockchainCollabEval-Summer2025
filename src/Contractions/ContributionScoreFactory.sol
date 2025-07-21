// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0 <0.6.0;

import "./ContributionScore.sol";

contract ContributionScoreFactory {
    address[] public allScores;
    mapping(address => address[]) public userContributions;

    event ScoreContractCreated(address indexed contributor, address scoreContract, string contributionHash);

    function createScoreContract(address _contributor, string memory _contributionHash, uint _weight, uint _projectStartTime, uint _projectDeadline) public returns (address) {
        ContributionScore scoreContract = new ContributionScore(_contributor, _contributionHash, _weight, _projectStartTime, _projectDeadline);
        allScores.push(address(scoreContract));
        userContributions[_contributor].push(address(scoreContract));
        emit ScoreContractCreated(_contributor, address(scoreContract), _contributionHash);
        return address(scoreContract);
    }

    function getAllScoreContracts() public view returns (address[] memory) {
        return allScores;
    }

    function getUserContributions(address user) public view returns (address[] memory) {
        return userContributions[user];
    }
}
