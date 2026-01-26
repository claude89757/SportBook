/**
 * 将日期格式化为 "MM-DD 周X" 格式（不含年份，带星期）
 * @param dateStr 日期字符串，如 "2024-01-26"
 * @returns 格式化后的字符串，如 "01-26 周五"
 */
export function formatDateWithWeekday(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr

  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const weekday = weekdays[date.getDay()]

  return `${month}-${day} ${weekday}`
}

/**
 * 格式化时间戳为 "MM-DD 周X HH:MM" 格式（不含年份，带星期）
 * @param timestamp 时间戳（秒或毫秒）或已格式化的字符串
 * @returns 格式化后的字符串
 */
export function formatTimestampWithWeekday(timestamp: number | string): string {
  if (!timestamp) return ''

  let date: Date

  if (typeof timestamp === 'string') {
    // 如果是字符串，尝试解析
    const ts = parseInt(timestamp)
    if (isNaN(ts)) {
      // 如果不是数字字符串，尝试直接解析日期字符串
      date = new Date(timestamp)
    } else {
      timestamp = ts
      date = ts > 1000000000000 ? new Date(ts) : new Date(ts * 1000)
    }
  } else {
    // 数字时间戳
    date = timestamp > 1000000000000 ? new Date(timestamp) : new Date(timestamp * 1000)
  }

  if (isNaN(date.getTime())) return String(timestamp)

  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const weekday = weekdays[date.getDay()]
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${month}-${day} ${weekday} ${hours}:${minutes}`
}
