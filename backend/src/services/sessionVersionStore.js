import { createClient } from 'redis';

let client = null;
let connected = false;

const memoryVersions = new Map();

function keyForUser(username) {
    return `bce:sessver:${username}`;
}

/**
 * 启动时连接 Redis；未配置 REDIS_URL 时退回进程内 Map（仅适合单机开发）。
 */
export async function initSessionVersionStore() {
    const url = process.env.REDIS_URL;
    if (!url) {
        console.warn(
            'REDIS_URL 未设置：会话版本使用内存存储，多实例或重启后会话状态不一致。生产环境请配置 Redis。'
        );
        return;
    }
    client = createClient({ url });
    client.on('error', (err) => console.error('Redis (session version):', err));
    await client.connect();
    connected = true;
    console.log('会话版本存储：已连接 Redis');
}

/**
 * 递增用户会话版本（登录、登出、改密后调用），使旧 JWT 立即失效。
 * @returns {Promise<number>}
 */
export async function bumpSessionVersion(username) {
    if (!username) {
        throw new Error('username required for bumpSessionVersion');
    }
    const k = keyForUser(username);
    if (client && connected) {
        return client.incr(k);
    }
    const next = (memoryVersions.get(username) || 0) + 1;
    memoryVersions.set(username, next);
    return next;
}

/**
 * @returns {Promise<number>}
 */
export async function getSessionVersion(username) {
    if (!username) return 0;
    const k = keyForUser(username);
    if (client && connected) {
        const v = await client.get(k);
        return v ? parseInt(v, 10) : 0;
    }
    return memoryVersions.get(username) || 0;
}
