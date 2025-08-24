// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0 <0.6.0;

// 极简 GitHub 贡献度合约：
// - 存基础分明细（0..100）与 baseNorm（0..100）
// - 维护评审者与被评者集合
// - 互评规则：预算=100；至少2人；单人<=50；不能投自己；目标不得重复
// - 评审者权重 w_r = BaseNorm_r / ΣBaseNorm
// - PeerRaw_i = Σ_r (w_r × votes_{r→i})，MinMax 归一到 [0,100] 得 peerNorm
// - 最终贡献点 Final = 60% 基础 + 40% 互评 ∈ [0,100]
contract GitHubContribution {
    address public admin;

    struct BaseDetail {
        uint16 code;    // 0..100
        uint16 pr;      // 0..100
        uint16 review;  // 0..100
        uint16 issue;   // 0..100
        uint16 base;    // 0..100（已离线归一化的基础分）
    }

    mapping(address => BaseDetail) public baseDetails;
    mapping(address => uint256) public baseNorm;  // 0..100
    uint256 public baseNormSum;                   // ΣBaseNorm

    // 评审者（可投票者）与被评者（候选人）
    address[] public raters;
    address[] public targets;
    mapping(address => bool) public isRater;
    mapping(address => bool) public isTarget;
    uint256 public totalRaters;
    uint256 public votedCount;

    // 每个评审者仅允许投票一次
    mapping(address => bool) public hasVoted;

    // 互评累计（WAD 精度）与归一化结果
    uint256 private constant WAD = 10**18;
    mapping(address => uint256) public peerRawWad;
    mapping(address => uint256) public peerNorm;   // 0..100
    bool public finalized;
    uint256 public minRaw;
    uint256 public maxRaw;

    // 基础/互评合成占比（百分比），默认 60/40
    uint16 public baseSharePercent = 60; // 0..100

    event SetBaseDetail(address indexed user, uint16 code, uint16 pr, uint16 review, uint16 issue, uint16 base);
    event SetRaters(address[] raters);
    event SetTargets(address[] targets);
    event Voted(address indexed reviewer);
    event AllVoted(uint256 votedCount, uint256 totalRaters);
    event Finalized(uint256 minRaw, uint256 maxRaw);
    event SetBaseShare(uint16 percent);

    modifier onlyAdmin() {
        require(msg.sender == admin, "only admin");
        _;
    }

    constructor(address _admin) public {
        admin = _admin == address(0) ? msg.sender : _admin;
    }

    // 批量设置基础分明细与 baseNorm（建议 0..100）。
    // 注意：如果同一地址既是 rater 也是 target，不冲突。
    function setBaseDetails(
        address[] memory users,
        uint16[] memory code,
        uint16[] memory pr,
        uint16[] memory review,
        uint16[] memory issue,
        uint16[] memory baseVal,
        uint256[] memory baseNormVal
    ) public onlyAdmin {
        require(!finalized, "finalized");
        require(
            users.length == code.length &&
            users.length == pr.length &&
            users.length == review.length &&
            users.length == issue.length &&
            users.length == baseVal.length &&
            users.length == baseNormVal.length,
            "len mismatch"
        );

        for (uint256 i = 0; i < users.length; i++) {
            require(baseVal[i] <= 100, "base>100");
            require(code[i] <= 100 && pr[i] <= 100 && review[i] <= 100 && issue[i] <= 100, "detail>100");
            require(baseNormVal[i] <= 100, "norm>100");

            BaseDetail memory d = BaseDetail(code[i], pr[i], review[i], issue[i], baseVal[i]);
            baseDetails[users[i]] = d;

            // 调整 baseNormSum（先扣旧值再加新值）
            if (baseNorm[users[i]] > 0) {
                baseNormSum = baseNormSum - baseNorm[users[i]];
            }
            baseNorm[users[i]] = baseNormVal[i];
            baseNormSum = baseNormSum + baseNormVal[i];

            emit SetBaseDetail(users[i], d.code, d.pr, d.review, d.issue, d.base);
        }
        require(baseNormSum > 0, "sum baseNorm=0");
    }

    function setRaters(address[] memory _raters) public onlyAdmin {
        require(!finalized, "finalized");
        // 清空再设置
        for (uint256 i = 0; i < raters.length; i++) {
            isRater[raters[i]] = false;
        }
        delete raters;

        for (uint256 j = 0; j < _raters.length; j++) {
            address r = _raters[j];
            require(!isRater[r], "dup rater");
            isRater[r] = true;
            raters.push(r);
        }
        totalRaters = raters.length;
        votedCount = 0;
        emit SetRaters(_raters);
    }

    function setTargets(address[] memory _targets) public onlyAdmin {
        require(!finalized, "finalized");
        // 清空再设置
        for (uint256 i = 0; i < targets.length; i++) {
            isTarget[targets[i]] = false;
        }
        delete targets;

        for (uint256 j = 0; j < _targets.length; j++) {
            address t = _targets[j];
            require(!isTarget[t], "dup target");
            isTarget[t] = true;
            targets.push(t);
        }
        emit SetTargets(_targets);
    }

    // 互评投票（一次性提交）：预算=100；
    // - 当总评审者>=3：至少投2人，单人<=50
    // - 当总评审者<3：至少投1人，单人<=100（两人互评场景）
    function submitVotes(address[] memory to, uint256[] memory pts) public {
        require(!finalized, "finalized");
        require(isRater[msg.sender], "not rater");
        require(baseNormSum > 0, "baseNorm not set");
        require(!hasVoted[msg.sender], "already voted");
        require(to.length == pts.length, "len mismatch");
        uint256 minTargets = totalRaters >= 3 ? 2 : 1;
        require(to.length >= minTargets, "too few targets");

        uint256 sum = 0;
        for (uint256 i = 0; i < to.length; i++) {
            require(isTarget[to[i]], "not target");
            require(to[i] != msg.sender, "self vote");
            uint256 singleLimit = totalRaters >= 3 ? 50 : 100;
            require(pts[i] <= singleLimit, "single>limit");

            // 防重复（O(n^2) 足够小规模使用）
            for (uint256 j = i + 1; j < to.length; j++) {
                require(to[i] != to[j], "dup target");
            }
            sum += pts[i];
        }
        require(sum == 100, "budget=100");

        // 计算评审者权重 w_r = BaseNorm_r / ΣBaseNorm（WAD 精度）
        uint256 wrWad = baseNorm[msg.sender] * WAD / baseNormSum;
        require(wrWad > 0, "weight=0");

        // 累计 PeerRaw
        for (uint256 k = 0; k < to.length; k++) {
            peerRawWad[to[k]] = peerRawWad[to[k]] + (wrWad * pts[k]);
        }

        hasVoted[msg.sender] = true;
        votedCount = votedCount + 1;
        emit Voted(msg.sender);
        if (votedCount == totalRaters && totalRaters > 0) {
            emit AllVoted(votedCount, totalRaters);
        }
    }

    // MinMax 归一化到 [0,100]
    function finalize() public onlyAdmin {
        require(!finalized, "already finalized");
        require(votedCount == totalRaters && totalRaters > 0, "not all voted");
        require(targets.length > 0, "no targets");

        minRaw = peerRawWad[targets[0]];
        maxRaw = minRaw;

        for (uint256 i = 1; i < targets.length; i++) {
            uint256 v = peerRawWad[targets[i]];
            if (v < minRaw) minRaw = v;
            if (v > maxRaw) maxRaw = v;
        }

        if (maxRaw == minRaw) {
            for (uint256 j = 0; j < targets.length; j++) {
                peerNorm[targets[j]] = 0; // 全相等则全部 0
            }
        } else {
            uint256 range = maxRaw - minRaw; // WAD 精度
            for (uint256 k = 0; k < targets.length; k++) {
                uint256 v2 = peerRawWad[targets[k]];
                uint256 delta = v2 - minRaw;
                uint256 norm = delta * 100 / range; // 0..100（整数）
                peerNorm[targets[k]] = norm;
            }
        }

        finalized = true;
        emit Finalized(minRaw, maxRaw);
    }

    // 配置基础分占比（百分比），剩余为互评占比；最终分严格为 0..100
    function setBaseSharePercent(uint16 p) public onlyAdmin {
        require(p <= 100, "p>100");
        baseSharePercent = p;
        emit SetBaseShare(p);
    }

    // —— 查询工具 ——
    function ratersLength() external view returns (uint256) { return raters.length; }
    function targetsLength() external view returns (uint256) { return targets.length; }
    function getRater(uint256 i) external view returns (address) { return raters[i]; }
    function getTarget(uint256 i) external view returns (address) { return targets[i]; }
    function weightOf(address rater) external view returns (uint256 wrWad) {
        if (baseNormSum == 0) return 0;
        return baseNorm[rater] * WAD / baseNormSum; // WAD 精度
    }
    function finalPeerOf(address user) external view returns (uint256) {
        return peerNorm[user]; // 0..100（需 finalize 后生效）
    }
    function finalScoreOf(address user) external view returns (uint256) {
        uint256 b = baseDetails[user].base; // 0..100
        uint256 p = peerNorm[user];         // 0..100（若未 finalize 可能为 0）
        return (b * baseSharePercent + p * (100 - baseSharePercent)) / 100; // 0..100
    }
}


