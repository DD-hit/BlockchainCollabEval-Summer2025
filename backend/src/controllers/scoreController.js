// controllers/scoreController.js - 评分控制层
import { ScoreService } from '../services/scoreService.js';

/**
 * 提交评分
 */
export const submitScore = async (req, res) => {
    try {
        const { contractAddress, score, privateKey } = req.body;
        let address = req.user.address; // 从token中获取用户地址

        // 如果token中没有address，则从数据库查询
        if (!address) {
            console.log('Token中没有address，从数据库查询用户:', req.user.username);
            const { getAddress } = await import('../utils/eth.js');
            address = await getAddress(req.user.username);
        }

        console.log('用户地址:', address);
        console.log('合约地址:', contractAddress);

        // 验证请求参数
        if (!contractAddress) {
            return res.status(400).json({
                success: false,
                message: '合约地址不能为空'
            });
        }

        if (!score || score < 1 || score > 10) {
            return res.status(400).json({
                success: false,
                message: '评分必须在1-10之间'
            });
        }

        if (!privateKey) {
            return res.status(400).json({
                success: false,
                message: '私钥不能为空'
            });
        }

        // 提交评分（合约会自动处理权限检查）
        const receipt = await ScoreService.Scored(contractAddress, address, score, privateKey);

        res.json({
            success: true,
            message: '评分成功',
            data: {
                transactionHash: receipt.transactionHash,
                gasUsed: receipt.gasUsed ? receipt.gasUsed.toString() : '0',
                blockNumber: receipt.blockNumber ? receipt.blockNumber.toString() : '0'
            }
        });
    } catch (error) {
        console.error('提交评分失败:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * 获取合约详细信息
 */
export const getContractInfo = async (req, res) => {
    try {
        const { contractAddress } = req.params;

        if (!contractAddress) {
            return res.status(400).json({
                success: false,
                message: '合约地址不能为空'
            });
        }

        const contractInfo = await ScoreService.getContractInfo(contractAddress);
        const averageScore = await ScoreService.getAverageScore(contractAddress);
        const contributionPoints = await ScoreService.calculateContributionPoint(contractAddress);
        const timeFactor = await ScoreService.getTimeFactor(contractAddress);

        res.json({
            success: true,
            message: '获取合约信息成功',
            data: {
                ...contractInfo,
                averageScore,
                contributionPoints,
                timeFactor
            }
        });
    } catch (error) {
        console.error('获取合约信息失败:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * 获取平均分
 */
export const getAverageScore = async (req, res) => {
    try {
        const { contractAddress } = req.params;

        if (!contractAddress) {
            return res.status(400).json({
                success: false,
                message: '合约地址不能为空'
            });
        }

        const averageScore = await ScoreService.getAverageScore(contractAddress);

        res.json({
            success: true,
            message: '获取平均分成功',
            data: { averageScore }
        });
    } catch (error) {
        console.error('获取平均分失败:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * 获取评分者数量
 */
export const getScorersCount = async (req, res) => {
    try {
        const { contractAddress } = req.params;

        if (!contractAddress) {
            return res.status(400).json({
                success: false,
                message: '合约地址不能为空'
            });
        }

        const scorersCount = await ScoreService.getScorersCount(contractAddress);

        res.json({
            success: true,
            message: '获取评分者数量成功',
            data: { scorersCount }
        });
    } catch (error) {
        console.error('获取评分者数量失败:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * 计算贡献点数
 */
export const getContributionPoints = async (req, res) => {
    try {
        const { contractAddress } = req.params;

        if (!contractAddress) {
            return res.status(400).json({
                success: false,
                message: '合约地址不能为空'
            });
        }

        const points = await ScoreService.calculateContributionPoint(contractAddress);
        const timeFactor = await ScoreService.getTimeFactor(contractAddress);
        const averageScore = await ScoreService.getAverageScore(contractAddress);
        const scorersCount = await ScoreService.getScorersCount(contractAddress);
        const weight = await ScoreService.getWeight(contractAddress);

        res.json({
            success: true,
            message: '获取贡献点数成功',
            data: {
                contributionPoints: points,
                timeFactor,
                averageScore,
                scorersCount,
                weight
            }
        });
    } catch (error) {
        console.error('获取贡献点数失败:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * 获取用户的评分
 */
export const getUserScore = async (req, res) => {
    try {
        const { contractAddress } = req.params;
        const { userAddress } = req.query;
        let currentUserAddress = req.user.address;

        // 如果token中没有address，则从数据库查询
        if (!currentUserAddress) {
            const { getAddress } = await import('../utils/eth.js');
            currentUserAddress = await getAddress(req.user.username);
        }

        if (!contractAddress) {
            return res.status(400).json({
                success: false,
                message: '合约地址不能为空'
            });
        }

        // 如果没有指定用户地址，则查询当前用户的评分
        const targetAddress = userAddress || currentUserAddress;

        const score = await ScoreService.getScoreByAddress(contractAddress, targetAddress);

        res.json({
            success: true,
            message: '获取用户评分成功',
            data: {
                userAddress: targetAddress,
                score,
                hasScored: score > 0
            }
        });
    } catch (error) {
        console.error('获取用户评分失败:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * 获取时间因子
 */
export const getTimeFactor = async (req, res) => {
    try {
        const { contractAddress } = req.params;

        if (!contractAddress) {
            return res.status(400).json({
                success: false,
                message: '合约地址不能为空'
            });
        }

        const timeFactor = await ScoreService.getTimeFactor(contractAddress);
        const startTime = await ScoreService.getSubtaskStartTime(contractAddress);
        const endTime = await ScoreService.getSubtaskEndtime(contractAddress);
        const contributionTime = await ScoreService.getContributionTime(contractAddress);

        res.json({
            success: true,
            message: '获取时间因子成功',
            data: {
                timeFactor,
                startTime,
                endTime,
                contributionTime,
                currentTime: Math.floor(Date.now() / 1000)
            }
        });
    } catch (error) {
        console.error('获取时间因子失败:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


