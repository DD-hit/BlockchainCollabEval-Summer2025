/**
 * 时间处理工具函数
 * 解决时区偏移问题
 */

/**
 * 将日期字符串转换为本地时间字符串，避免时区偏移
 * @param {string} dateStr - 日期字符串 (YYYY-MM-DD)
 * @returns {string} - 格式化的日期时间字符串 (YYYY-MM-DD HH:mm:ss)
 */
export function formatDateToLocalString(dateStr) {
  if (!dateStr) return null;
  
  // 创建一个本地日期对象，避免时区转换
  const [year, month, day] = dateStr.split('-').map(Number);
  const localDate = new Date(year, month - 1, day, 0, 0, 0);
  
  // 格式化为 YYYY-MM-DD HH:mm:ss
  const yearStr = localDate.getFullYear();
  const monthStr = String(localDate.getMonth() + 1).padStart(2, '0');
  const dayStr = String(localDate.getDate()).padStart(2, '0');
  const hoursStr = String(localDate.getHours()).padStart(2, '0');
  const minutesStr = String(localDate.getMinutes()).padStart(2, '0');
  const secondsStr = String(localDate.getSeconds()).padStart(2, '0');
  
  return `${yearStr}-${monthStr}-${dayStr} ${hoursStr}:${minutesStr}:${secondsStr}`;
}

/**
 * 将日期时间字符串转换为日期输入框格式
 * @param {string} datetimeStr - 日期时间字符串
 * @returns {string} - 日期字符串 (YYYY-MM-DD)
 */
export function formatDateTimeForInput(datetimeStr) {
  if (!datetimeStr) return "";
  
  try {
    const date = new Date(datetimeStr);
    if (isNaN(date.getTime())) return "";
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('日期格式化错误:', error);
    return "";
  }
}

/**
 * 格式化日期显示
 * @param {string} datetimeStr - 日期时间字符串
 * @returns {string} - 格式化的日期字符串
 */
export function formatDateForDisplay(datetimeStr) {
  if (!datetimeStr) return "未设置";
  
  try {
    const date = new Date(datetimeStr);
    if (isNaN(date.getTime())) return "无效日期";
    
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (error) {
    console.error('日期显示格式化错误:', error);
    return "无效日期";
  }
}
