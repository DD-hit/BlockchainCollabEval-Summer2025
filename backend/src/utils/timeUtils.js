// 时间转换工具函数
export const formatTimestamp = (timestamp) => {
    if (!timestamp) return null;
    const date = new Date(timestamp * 1000); // Unix时间戳转毫秒
    return date.toISOString().slice(0, 19).replace('T', ' '); // 格式: YYYY-MM-DD HH:mm:ss
};

export const parseTimestamp = (mysqlDatetime) => {
    if (!mysqlDatetime) return null;
    return Math.floor(new Date(mysqlDatetime).getTime() / 1000); // 转为Unix时间戳
};