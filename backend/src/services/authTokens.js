import jwt from 'jsonwebtoken';
import { bumpSessionVersion, getSessionVersion } from './sessionVersionStore.js';

/**
 * 签发新的访问令牌（会递增会话版本，顶掉其它端旧 token）。
 */
export async function issueAccessToken(username, address) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET 未配置');
    }
    const sv = await bumpSessionVersion(username);
    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
    return jwt.sign({ username, address, sv }, secret, { expiresIn });
}

/**
 * JWT 已通过验签后，检查 sv 是否与当前服务端一致。
 */
export async function isAccessTokenSessionActive(decoded) {
    if (!decoded?.username) return false;
    if (decoded.sv === undefined || decoded.sv === null) return false;
    const current = await getSessionVersion(decoded.username);
    return Number(decoded.sv) === Number(current);
}
