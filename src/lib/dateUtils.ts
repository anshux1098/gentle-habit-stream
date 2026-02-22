// Date utilities with 4AM day boundary logic
// A day runs from 4:00 AM → 3:59 AM next day

const DAY_BOUNDARY_HOUR = 4; // 4 AM

/**
 * Get the effective date based on 4AM boundary
 * Before 4AM counts as previous day
 */
export function getEffectiveDate(date: Date = new Date()): string {
  const adjusted = new Date(date);
  
  // If before 4 AM, count as previous day
  if (adjusted.getHours() < DAY_BOUNDARY_HOUR) {
    adjusted.setDate(adjusted.getDate() - 1);
  }
  
  return formatDateToYYYYMMDD(adjusted);
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse YYYY-MM-DD to Date object
 */
export function parseYYYYMMDD(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Get day of week (0 = Sunday, 6 = Saturday)
 */
export function getDayOfWeek(dateStr: string): number {
  return parseYYYYMMDD(dateStr).getDay();
}

/**
 * Check if date is weekend (Saturday or Sunday)
 */
export function isWeekend(dateStr: string): boolean {
  const day = getDayOfWeek(dateStr);
  return day === 0 || day === 6;
}

/**
 * Check if date is weekday (Monday-Friday)
 */
export function isWeekday(dateStr: string): boolean {
  return !isWeekend(dateStr);
}

/**
 * Check if today is Sunday (for Weekly Review)
 */
export function isSunday(dateStr: string = getEffectiveDate()): boolean {
  return getDayOfWeek(dateStr) === 0;
}

/**
 * Get the Monday of the week for a given date
 */
export function getWeekStart(dateStr: string): string {
  const date = parseYYYYMMDD(dateStr);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Adjust for Sunday
  date.setDate(date.getDate() + diff);
  return formatDateToYYYYMMDD(date);
}

/**
 * Get last N days as YYYY-MM-DD strings
 */
export function getLastNDays(n: number, fromDate: string = getEffectiveDate()): string[] {
  const dates: string[] = [];
  const start = parseYYYYMMDD(fromDate);
  
  for (let i = 0; i < n; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() - i);
    dates.push(formatDateToYYYYMMDD(date));
  }
  
  return dates;
}

/**
 * Get days since a date
 */
export function daysSince(dateStr: string, fromDate: string = getEffectiveDate()): number {
  const from = parseYYYYMMDD(fromDate);
  const to = parseYYYYMMDD(dateStr);
  const diffTime = from.getTime() - to.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Format date for display based on user preference
 */
export function formatDateForDisplay(
  dateStr: string,
  format: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD'
): string {
  const [year, month, day] = dateStr.split('-');
  
  switch (format) {
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'YYYY-MM-DD':
    default:
      return dateStr;
  }
}

/**
 * Get day name
 */
export function getDayName(dateStr: string, short = false): string {
  const days = short 
    ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[getDayOfWeek(dateStr)];
}

/**
 * Get month name
 */
export function getMonthName(dateStr: string, short = false): string {
  const months = short
    ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const [, month] = dateStr.split('-').map(Number);
  return months[month - 1];
}

/**
 * Check if it's after 8 PM (for tomorrow preview)
 */
export function isAfter8PM(): boolean {
  return new Date().getHours() >= 20;
}

/**
 * Get tomorrow's date
 */
export function getTomorrow(fromDate: string = getEffectiveDate()): string {
  const date = parseYYYYMMDD(fromDate);
  date.setDate(date.getDate() + 1);
  return formatDateToYYYYMMDD(date);
}

/**
 * Check if a habit is scheduled for a specific date
 */
export function isHabitScheduledForDate(
  habitType: 'daily' | 'weekday' | 'weekend',
  dateStr: string
): boolean {
  const weekend = isWeekend(dateStr);
  
  switch (habitType) {
    case 'daily':
      return true;
    case 'weekday':
      return !weekend;
    case 'weekend':
      return weekend;
    default:
      return false;
  }
}

/**
 * Get current month as YYYY-MM
 */
export function getCurrentMonth(dateStr: string = getEffectiveDate()): string {
  const [year, month] = dateStr.split('-');
  return `${year}-${month}`;
}

/**
 * Get first day of a month
 */
export function getMonthStart(monthStr: string): string {
  return `${monthStr}-01`;
}

/**
 * Get last day of a month
 */
export function getMonthEnd(monthStr: string): string {
  const [year, month] = monthStr.split('-').map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return `${monthStr}-${String(lastDay).padStart(2, '0')}`;
}

/**
 * Check if it's the last day of the month
 */
export function isLastDayOfMonth(dateStr: string = getEffectiveDate()): boolean {
  const date = parseYYYYMMDD(dateStr);
  const nextDay = new Date(date);
  nextDay.setDate(date.getDate() + 1);
  return nextDay.getMonth() !== date.getMonth();
}

/**
 * Get all days in a month
 */
export function getDaysInMonth(monthStr: string): string[] {
  const [year, month] = monthStr.split('-').map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  const days: string[] = [];
  
  for (let day = 1; day <= lastDay; day++) {
    days.push(`${monthStr}-${String(day).padStart(2, '0')}`);
  }
  
  return days;
}

/**
 * Get previous month
 */
export function getPreviousMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-').map(Number);
  if (month === 1) {
    return `${year - 1}-12`;
  }
  return `${year}-${String(month - 1).padStart(2, '0')}`;
}
