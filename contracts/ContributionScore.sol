// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0 <0.6.0;

contract ContributionScore {
    address public contributor;      // 贡献者
    string public contributionHash;  // 贡献文件的哈希或描述
    mapping(address => uint8) public scores; // 评分记录
    address[] public scorers;        // 评分人列表
    uint public totalScore;
    uint public scoreCount;
    uint public contributionPoint; // 贡献度积分
    uint public weight; // 贡献权重，默认为1
    uint public projectStartTime;
    uint public projectDeadline;
    uint public contributionTime;

    event Scored(address indexed scorer, uint8 score);

    constructor(address _contributor, string memory _contributionHash, uint _weight, uint _projectStartTime, uint _projectDeadline) {
        contributor = _contributor;
        contributionHash = _contributionHash;
        weight = _weight;
        projectStartTime = _projectStartTime;
        projectDeadline = _projectDeadline;
        contributionTime = block.timestamp;
    }

    function score(uint8 _score) external {
        require(msg.sender != contributor, "不能给自己评分");
        require(_score >= 1 && _score <= 10, "分数范围1-10");
        require(scores[msg.sender] == 0, "你已经评分过了");

        scores[msg.sender] = _score;
        scorers.push(msg.sender);
        totalScore += _score;
        scoreCount += 1;

        // 新增：自动更新贡献度
        contributionPoint = calculateContributionPoint();

        emit Scored(msg.sender, _score);
    }

    function getAverageScore() public view returns (uint) {
        if (scoreCount == 0) return 0;
        return totalScore / scoreCount;
    }

    function getScorers() public view returns (address[] memory) {
        return scorers;
    }

    function sqrt(uint x) internal pure returns (uint y) {
        if (x == 0) return 0;
        uint z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x + x / z) / 2;
        }
    }

    function getTimeFactor() public view returns (uint) {
        if (contributionTime > projectDeadline) return 0;
        uint duration = projectDeadline - projectStartTime;
        if (duration == 0) return 1000;
        uint timeLeft = projectDeadline > contributionTime ? projectDeadline - contributionTime : 0;
        uint factor = 500 + 500 * timeLeft / duration;
        return factor; // 0~1000，代表0~1
    }

    function calculateContributionPoint() public view returns (uint) {
        if (scoreCount == 0) return 0;
        uint avg = totalScore / scoreCount;
        uint sqrtCount = sqrt(scoreCount + 1);
        uint timeFactor = getTimeFactor(); // 0~1000
        return avg * sqrtCount * weight * timeFactor / 1000;
    }
}
