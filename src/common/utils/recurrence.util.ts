/**
 * Pure helpers for expanding a Transaction's free-text `recurrence` string
 * (bills) into future occurrence dates. No DI required — imported directly.
 */

const MAX_RECURRENCE_OCCURRENCES = 60;

/** Advances a single date by one occurrence of the given recurrence pattern. */
export function advanceByBillRecurrence(date: Date, recurrence: string): Date {
  const nextDate = new Date(date);

  switch (recurrence) {
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'fortnightly':
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case 'sixmonths':
      nextDate.setMonth(nextDate.getMonth() + 6);
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    default:
      // If unknown recurrence, default to monthly
      nextDate.setMonth(nextDate.getMonth() + 1);
  }

  return nextDate;
}

/**
 * Expands a recurring bill forward from `seedDate` up to `horizonEnd`,
 * returning every occurrence date in range (seedDate included if it falls
 * within the horizon). Capped by maxOccurrences as a safety bound against
 * malformed data producing a runaway loop.
 */
export function expandBillRecurrence(
  seedDate: Date,
  recurrence: string,
  horizonEnd: Date,
  maxOccurrences: number = MAX_RECURRENCE_OCCURRENCES,
): Date[] {
  const occurrences: Date[] = [];
  let current = new Date(seedDate);
  let count = 0;

  while (current <= horizonEnd && count < maxOccurrences) {
    occurrences.push(new Date(current));
    current = advanceByBillRecurrence(current, recurrence);
    count++;
  }

  return occurrences;
}
