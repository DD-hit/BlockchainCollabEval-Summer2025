import { ContribService } from '../services/contribService.js';

export const postBaseScores = async (req, res) => {
    try {
        const { roundId } = req.params;
        const items = Array.isArray(req.body?.items) ? req.body.items : [];
        if (!roundId) {
            return res.status(400).json({ success: false, message: '缺少 roundId' });
        }
        const result = await ContribService.insertBaseScores(Number(roundId), items);
        res.json({ success: true, message: '基础分写入成功', data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const postPeerVotes = async (req, res) => {
    try {
        const { roundId } = req.params;
        if (!roundId) {
            return res.status(400).json({ success: false, message: '缺少 roundId' });
        }
        const reviewer = req.user?.username;
        if (!reviewer) {
            return res.status(401).json({ success: false, message: '未登录' });
        }
        const votes = Array.isArray(req.body?.votes) ? req.body.votes : [];
        const result = await ContribService.submitPeerVotes(Number(roundId), reviewer, votes);
        res.json({ success: true, message: '互评分提交成功', data: result });
    } catch (error) {
        if (error.code === 'NOT_BOUND') {
            return res.status(403).json({ success: false, message: '请先在个人中心绑定GitHub账号' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};


