import Web3 from 'web3';
import { WEB3_PROVIDER } from '../config/config.js';
import { ContributionScoreABI } from '../utils/contracts.js';
import { pool } from '../../config/database.js';
import { AccountService } from './accountService.js';
import { TransactionService } from './transactionService.js';

export class ScoreService {

    static async getMemberContributions(projectId, username) {
        const [result] = await pool.execute(
            `SELECT * FROM project_members WHERE projectId = ? AND username = ?`,
            [projectId, username]
        );
        return result[0].contributionPoint;
    }

    static async getProjectContributions(projectId) {
        // 获取项目中所有成员的贡献统计
        const [result] = await pool.execute(
            `SELECT 
                pm.username,
                COALESCE(pm.contributionPoint, 0) as score,
                COUNT(s.subtaskId) as tasks
            FROM project_members pm
            LEFT JOIN subtasks s ON pm.username = s.assignedTo 
                AND s.milestoneId IN (
                    SELECT milestoneId FROM milestones WHERE projectId = ?
                )
            WHERE pm.projectId = ?
            GROUP BY pm.username, pm.contributionPoint
            ORDER BY pm.contributionPoint DESC`,
            [projectId, projectId]
        );
        
        return result;
    }

    // 检查是否所有人都评分完了
    static async shouldUpdateContributionPoint(contractAddress) {

        
        const web3 = new Web3(WEB3_PROVIDER);
        const contract = new web3.eth.Contract(ContributionScoreABI, contractAddress);
        
        // 获取当前评分者数量
        const scoreCount = await contract.methods.scoreCount().call();

        
        // 获取合约中的贡献者地址用于验证
        const contractContributor = await contract.methods.contributor().call();

        
        // 获取文件信息，确定项目ID和子任务ID
        const [fileInfo] = await pool.execute(
            `SELECT f.subtaskId, f.username, s.milestoneId, m.projectId 
             FROM files f 
             JOIN subtasks s ON f.subtaskId = s.subtaskId 
             JOIN milestones m ON s.milestoneId = m.milestoneId 
             WHERE f.address = ?`,
            [contractAddress]
        );
        
        if (fileInfo.length === 0) {
    
            return false;
        }
        
        const projectId = fileInfo[0].projectId;
        const subtaskId = fileInfo[0].subtaskId;
        const contributorUsername = fileInfo[0].username;

        
        // 获取所有项目成员信息（用于调试）
        const [allMembers] = await pool.execute(
            `SELECT username, role, contributionPoint 
             FROM project_members 
             WHERE projectId = ?`,
            [projectId]
        );

        
        // 获取项目成员数量（排除贡献者自己）
        const [members] = await pool.execute(
            `SELECT COUNT(*) as memberCount 
             FROM project_members 
             WHERE projectId = ? AND username != ?`,
            [projectId, contributorUsername]
        );
        
        const memberCount = members[0].memberCount;

        
        // 只有当评分者数量等于成员数量时，说明所有人都评分完了
        const shouldUpdate = parseInt(scoreCount) === memberCount;

        
        return shouldUpdate;
    }

    //更新项目成员表里sender的贡献点
    static async updateContributionPoint(contractAddress) {

        
        // 首先获取文件信息，确定项目ID和贡献者
        const [fileInfo] = await pool.execute(
            `SELECT f.subtaskId, f.username, s.milestoneId, m.projectId 
             FROM files f 
             JOIN subtasks s ON f.subtaskId = s.subtaskId 
             JOIN milestones m ON s.milestoneId = m.milestoneId 
             WHERE f.address = ?`,
            [contractAddress]
        );
        
        if (fileInfo.length === 0) {
            throw new Error(`找不到合约地址 ${contractAddress} 对应的文件信息`);
        }
        
        const projectId = fileInfo[0].projectId;
        const contributor = fileInfo[0].username;

        
        // 从合约获取贡献点
        const web3 = new Web3(WEB3_PROVIDER);
        const contract = new web3.eth.Contract(ContributionScoreABI, contractAddress);
        const contributionPoint = await contract.methods.calculateContributionPoint().call();

        
        // 更新指定项目的贡献点（累加，因为每个文件都有独立的贡献点）
        const [result] = await pool.execute(
            `UPDATE project_members SET contributionPoint = contributionPoint + ? WHERE username = ? AND projectId = ?`,
            [contributionPoint, contributor, projectId]
        );
        

        
        if (result.affectedRows === 0) {
            throw new Error(`未找到用户 ${contributor} 在项目 ${projectId} 中的记录`);
        }
        
        return result;
    }

    static async Scored(contractAddress, address, score, privateKey) {
        const web3 = new Web3(WEB3_PROVIDER);

        // 用私钥创建账户
        const account = web3.eth.accounts.privateKeyToAccount(privateKey);

        // 验证地址与私钥是否匹配
        if (account.address.toLowerCase() !== address.toLowerCase()) {
            throw new Error('提供的地址与私钥不匹配');
        }

        web3.eth.accounts.wallet.add(account); // 将账户添加到 Web3 钱包

        const contract = new web3.eth.Contract(ContributionScoreABI, contractAddress);

        try {
            // 在发送交易前检查合约条件，避免无意义的交易回滚
            const contributor = await contract.methods.contributor().call();
            const currentScore = await contract.methods.scores(address).call();
            const endTime = await contract.methods.subtaskEndtime().call();
            const currentTime = Math.floor(Date.now() / 1000);

            // 检查各种失败条件
            if (address.toLowerCase() === contributor.toLowerCase()) {
                throw new Error('不能给自己评分');
            }

            if (score < 1 || score > 10) {
                throw new Error('分数范围必须在1-10之间');
            }

            if (parseInt(currentScore) > 0) {
                throw new Error('您已经评过分了，每个地址只能评分一次');
            }

            if (currentTime > parseInt(endTime)) {
                throw new Error('项目已截止，无法评分');
            }

    

            // 获取当前gas价格
            const gasPrice = await web3.eth.getGasPrice();
            const gasLimit = 200000;

            // 检查账户余额是否足够支付gas费用
            const balance = await web3.eth.getBalance(address);
            const requiredAmount = BigInt(gasPrice) * BigInt(gasLimit);

            

            if (BigInt(balance) < requiredAmount) {
                throw new Error(`余额不足。当前余额: ${web3.utils.fromWei(balance, 'ether')} ETH，需要: ${web3.utils.fromWei(requiredAmount.toString(), 'ether')} ETH`);
            }

            const receipt = await contract.methods.score(score)
                .send({
                    from: address,
                    gas: gasLimit,
                    gasPrice: gasPrice
                });
            
            // 记录评分交易
            try {
                const scoreData = {
                    score: score,
                    contractAddress: contractAddress,
                    scorer: address,
                    username: await this.getUsernameByAddress(address)
                };
                
                await TransactionService.recordScore(
                    scoreData,
                    receipt.transactionHash,
                    receipt.blockNumber,
                    receipt.gasUsed
                );
            } catch (error) {
                console.error('记录评分交易失败:', error);
                // 不影响评分的主要流程
            }
            
            // 检查是否所有人都评分完了，如果是，才更新贡献点
            try {
                const shouldUpdate = await ScoreService.shouldUpdateContributionPoint(contractAddress);
                if (shouldUpdate) {
                    await ScoreService.updateContributionPoint(contractAddress);
            
                }
            } catch (error) {
                console.error(`❌ 贡献点更新检查失败: ${error.message}`);
                // 不抛出错误，因为评分已经成功，贡献点更新失败不应该影响评分结果
            }
            
            return receipt;
        } catch (error) {
            console.error("交易失败:", error);
            throw error;
        }
    }

    /**
     * 获取平均分
     * @param {string} contractAddress - 合约地址
     * @returns {Promise<number>} - 平均分（保留小数）
     */
    static async getAverageScore(contractAddress) {
        const web3 = new Web3(WEB3_PROVIDER);
        const contract = new web3.eth.Contract(ContributionScoreABI, contractAddress);

        // 直接从合约获取总分和评分数量，在JavaScript中计算精确平均值
        const totalScore = await contract.methods.totalScore().call();
        const scoreCount = await contract.methods.scoreCount().call();

        if (parseInt(scoreCount) === 0) return 0;

        // 使用JavaScript的浮点运算得到精确平均值
        const average = parseInt(totalScore) / parseInt(scoreCount);

        // 保留两位小数
        return Math.round(average * 100) / 100;
    }

    /**
     * 获取评分者数量
     * @param {string} contractAddress - 合约地址
     * @returns {Promise<number>} - 评分者数量
     */
    static async getScorersCount(contractAddress) {
        const web3 = new Web3(WEB3_PROVIDER);
        const contract = new web3.eth.Contract(ContributionScoreABI, contractAddress);
        const count = await contract.methods.getScorersCount().call();
        return parseInt(count);
    }

    /**
     * 获取时间因子
     * @param {string} contractAddress - 合约地址
     * @returns {Promise<number>} - 时间因子 (0-1000)
     */
    static async getTimeFactor(contractAddress) {
        const web3 = new Web3(WEB3_PROVIDER);
        const contract = new web3.eth.Contract(ContributionScoreABI, contractAddress);
        const factor = await contract.methods.getTimeFactor().call();
        return parseInt(factor);
    }

    /**
     * 计算贡献点数
     * @param {string} contractAddress - 合约地址
     * @returns {Promise<number>} - 贡献点数
     */
    static async calculateContributionPoint(contractAddress) {
        const web3 = new Web3(WEB3_PROVIDER);
        const contract = new web3.eth.Contract(ContributionScoreABI, contractAddress);
        const points = await contract.methods.calculateContributionPoint().call();
        return parseInt(points);
    }

    /**
     * 获取合约完整信息
     * @param {string} contractAddress - 合约地址
     * @returns {Promise<Object>} - 合约信息对象
     */
    static async getContractInfo(contractAddress) {
        const web3 = new Web3(WEB3_PROVIDER);
        const contract = new web3.eth.Contract(ContributionScoreABI, contractAddress);
        const info = await contract.methods.getContractInfo().call();

        const totalScore = parseInt(info._totalScore);
        const scoreCount = parseInt(info._scoreCount);

        // 计算精确的平均分
        const averageScore = scoreCount === 0 ? 0 : Math.round((totalScore / scoreCount) * 100) / 100;

        return {
            contributor: info._contributor,
            contributionHash: info._contributionHash,
            totalScore,
            scoreCount,
            averageScore,
            weight: parseInt(info._weight),
            subtaskEndtime: parseInt(info._subtaskEndtime)
        };
    }

    /**
     * 获取贡献者地址
     * @param {string} contractAddress - 合约地址
     * @returns {Promise<string>} - 贡献者地址
     */
    static async getContributor(contractAddress) {
        const web3 = new Web3(WEB3_PROVIDER);
        const contract = new web3.eth.Contract(ContributionScoreABI, contractAddress);
        const contributor = await contract.methods.contributor().call();
        return contributor;
    }

    /**
     * 获取贡献哈希
     * @param {string} contractAddress - 合约地址
     * @returns {Promise<string>} - 贡献哈希
     */
    static async getContributionHash(contractAddress) {
        const web3 = new Web3(WEB3_PROVIDER);
        const contract = new web3.eth.Contract(ContributionScoreABI, contractAddress);
        const hash = await contract.methods.contributionHash().call();
        return hash;
    }

    /**
     * 获取总分
     * @param {string} contractAddress - 合约地址
     * @returns {Promise<number>} - 总分
     */
    static async getTotalScore(contractAddress) {
        const web3 = new Web3(WEB3_PROVIDER);
        const contract = new web3.eth.Contract(ContributionScoreABI, contractAddress);
        const total = await contract.methods.totalScore().call();
        return parseInt(total);
    }

    /**
     * 获取权重
     * @param {string} contractAddress - 合约地址
     * @returns {Promise<number>} - 权重
     */
    static async getWeight(contractAddress) {
        const web3 = new Web3(WEB3_PROVIDER);
        const contract = new web3.eth.Contract(ContributionScoreABI, contractAddress);
        const weight = await contract.methods.weight().call();
        return parseInt(weight);
    }

    /**
     * 获取子任务开始时间
     * @param {string} contractAddress - 合约地址
     * @returns {Promise<number>} - 开始时间戳
     */
    static async getSubtaskStartTime(contractAddress) {
        const web3 = new Web3(WEB3_PROVIDER);
        const contract = new web3.eth.Contract(ContributionScoreABI, contractAddress);
        const startTime = await contract.methods.subtaskStartTime().call();
        return parseInt(startTime);
    }

    /**
     * 获取子任务结束时间
     * @param {string} contractAddress - 合约地址
     * @returns {Promise<number>} - 结束时间戳
     */
    static async getSubtaskEndtime(contractAddress) {
        const web3 = new Web3(WEB3_PROVIDER);
        const contract = new web3.eth.Contract(ContributionScoreABI, contractAddress);
        const endTime = await contract.methods.subtaskEndtime().call();
        return parseInt(endTime);
    }

    /**
     * 获取贡献时间
     * @param {string} contractAddress - 合约地址
     * @returns {Promise<number>} - 贡献时间戳
     */
    static async getContributionTime(contractAddress) {
        const web3 = new Web3(WEB3_PROVIDER);
        const contract = new web3.eth.Contract(ContributionScoreABI, contractAddress);
        const contributionTime = await contract.methods.contributionTime().call();
        return parseInt(contributionTime);
    }

    /**
     * 获取特定地址的评分
     * @param {string} contractAddress - 合约地址
     * @param {string} scorerAddress - 评分者地址
     * @returns {Promise<number>} - 该地址给出的分数 (0表示未评分)
     */
    static async getScoreByAddress(contractAddress, scorerAddress) {
        const web3 = new Web3(WEB3_PROVIDER);
        const contract = new web3.eth.Contract(ContributionScoreABI, contractAddress);
        const score = await contract.methods.scores(scorerAddress).call();
        return parseInt(score);
    }

    /**
     * 根据地址获取用户名
     * @param {string} address - 区块链地址
     * @returns {Promise<string>} - 用户名
     */
    static async getUsernameByAddress(address) {
        try {
            const [result] = await pool.execute(
                'SELECT username FROM user WHERE address = ?',
                [address]
            );
            return result.length > 0 ? result[0].username : 'unknown';
        } catch (error) {
            console.error('根据地址获取用户名失败:', error);
            return 'unknown';
        }
    }

}