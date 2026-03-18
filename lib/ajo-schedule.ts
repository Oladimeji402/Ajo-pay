export type RotationFrequency = 'weekly' | 'biweekly' | 'monthly';

export type DuePhase = 'unscheduled' | 'scheduled' | 'due' | 'overdue';

function padDatePart(value: number) {
  return String(value).padStart(2, '0');
}

function toDateOnlyString(date: Date) {
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
}

function parseDateOnly(value: string) {
  const [year, month, day] = value.split('-').map(Number);

  if (!year || !month || !day) {
    throw new Error(`Invalid date value: ${value}`);
  }

  return new Date(Date.UTC(year, month - 1, day));
}

function formatDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addMonths(date: Date, months: number) {
  const targetYear = date.getUTCFullYear();
  const targetMonth = date.getUTCMonth() + months;
  const day = date.getUTCDate();
  const monthEnd = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();

  return new Date(Date.UTC(targetYear, targetMonth, Math.min(day, monthEnd)));
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export function isRotationFrequency(value: string): value is RotationFrequency {
  return value === 'weekly' || value === 'biweekly' || value === 'monthly';
}

export function getCycleDueDate(startDate: string | null | undefined, frequency: string, cycleNumber: number) {
  if (!startDate || !isRotationFrequency(frequency) || cycleNumber < 1) {
    return null;
  }

  const anchor = parseDateOnly(startDate);
  const offset = cycleNumber - 1;

  if (frequency === 'weekly') {
    return formatDateOnly(addDays(anchor, offset * 7));
  }

  if (frequency === 'biweekly') {
    return formatDateOnly(addDays(anchor, offset * 14));
  }

  return formatDateOnly(addMonths(anchor, offset));
}

export function getCurrentCycleDueDate(group: {
  start_date?: string | null;
  frequency: string;
  current_cycle: number;
}) {
  return getCycleDueDate(group.start_date, group.frequency, Number(group.current_cycle));
}

export function getDefaultPayoutDate(startDate: string | null | undefined, frequency: string, cycleNumber: number) {
  return getCycleDueDate(startDate, frequency, cycleNumber);
}

export function getEffectivePayoutDate(options: {
  scheduledFor?: string | null;
  startDate?: string | null;
  frequency: string;
  cycleNumber: number;
}) {
  if (options.scheduledFor) {
    return options.scheduledFor;
  }

  return getDefaultPayoutDate(options.startDate, options.frequency, options.cycleNumber);
}

export function getDueWindow(dueDate: string | null | undefined, referenceDate = new Date()) {
  if (!dueDate) {
    return {
      phase: 'unscheduled' as const,
      dueDate: null,
      daysUntilDue: null,
      daysOverdue: 0,
    };
  }

  const due = parseDateOnly(dueDate);
  const today = parseDateOnly(toDateOnlyString(referenceDate));
  const diffDays = Math.round((due.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));

  if (diffDays > 0) {
    return {
      phase: 'scheduled' as const,
      dueDate,
      daysUntilDue: diffDays,
      daysOverdue: 0,
    };
  }

  if (diffDays === 0) {
    return {
      phase: 'due' as const,
      dueDate,
      daysUntilDue: 0,
      daysOverdue: 0,
    };
  }

  return {
    phase: 'overdue' as const,
    dueDate,
    daysUntilDue: 0,
    daysOverdue: Math.abs(diffDays),
  };
}

export function formatScheduleDate(dateValue: string | null | undefined, locale = 'en-NG') {
  if (!dateValue) {
    return 'Not scheduled';
  }

  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parseDateOnly(dateValue));
}

export function getTodayDateInputValue(referenceDate = new Date()) {
  return toDateOnlyString(referenceDate);
}