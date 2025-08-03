// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0 <0.6.0;

contract ContributionScore {
    address public contributor;      // 贡献者
    string public contributionHash;  // 贡献文件的哈希或描述
    mapping(address => uint8) public scores; // 评分记录
    uint public totalScore;
    uint public scoreCount;
    uint public weight; // 贡献权重，默认为1
    uint public subtaskStartTime;
    uint public subtaskEndtime;
    uint public contributionTime;

    event Scored(address indexed scorer, uint8 score, uint256 timestamp);

    constructor(address _contributor, string memory _contributionHash, uint _weight, uint _subtaskStartTime, uint _subtaskEndtime) public {
        require(_contributor != address(0), "贡献者地址不能为空");
        require(bytes(_contributionHash).length > 0, "贡献哈希不能为空");
        require(_weight > 0, "权重必须大于0");
        require(_subtaskStartTime < _subtaskEndtime, "开始时间必须早于截止时间");

        contributor = _contributor;
        contributionHash = _contributionHash;
        weight = _weight;
        subtaskStartTime = _subtaskStartTime;
        subtaskEndtime = _subtaskEndtime;
        contributionTime = block.timestamp;
    }

    function score(uint8 _score) external {
        require(msg.sender != contributor, "不能给自己评分");
        require(_score >= 1 && _score <= 10, "分数范围1-10");
        require(scores[msg.sender] == 0, "你已经评分过了");
        require(block.timestamp <= subtaskEndtime, "项目已截止，无法评分");

        scores[msg.sender] = _score;
        totalScore += _score;
        scoreCount += 1;

        emit Scored(msg.sender, _score, block.timestamp);
    }

    function getAverageScore() public view returns (uint) {
        if (scoreCount == 0) return 0;
        return totalScore / scoreCount;
    }

    function getScorersCount() public view returns (uint) {
        return scoreCount;
    }

    function getTimeFactor() public view returns (uint) {
        if (contributionTime > subtaskEndtime) return 0;
        uint duration = subtaskEndtime - subtaskStartTime;
        if (duration == 0) return 1000;
        uint timeLeft = subtaskEndtime > contributionTime ? subtaskEndtime - contributionTime : 0;
        uint factor = 500 + 500 * timeLeft / duration;
        return factor > 1000 ? 1000 : factor; // 确保不超过1000
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

    function calculateContributionPoint() public view returns (uint) {
        if (scoreCount == 0) return 0;
        uint avg = totalScore / scoreCount;
        uint timeFactor = getTimeFactor();
        uint sqrtCount = sqrt(scoreCount + 1);
        uint baseScore = avg * sqrtCount;
        uint weightedScore = baseScore * weight;
        return (weightedScore * timeFactor) / 1000;
    }

    function getContractInfo() public view returns (
        address _contributor,
        string memory _contributionHash,
        uint _totalScore,
        uint _scoreCount,
        uint _weight,
        uint _subtaskEndtime
    ) {
        return (
            contributor,
            contributionHash,
            totalScore,
            scoreCount,
            weight,
            subtaskEndtime
        );
    }
}
