import { PrismaClient, TransactionType } from "@prisma/client";
import { DateService } from "../src/common/services/date.service";

const prisma = new PrismaClient();
const dateService = new DateService();

// Safety cap on how many historical periods to walk back per user, in case
// of bad data (e.g. createdAt in the far future/past).
const MAX_PERIODS_PER_USER = 500;

async function main() {
  const users = await prisma.user.findMany({
    where: {
      income: { not: null },
      incomeFrequency: { not: null },
      nextPayDate: { not: null },
    },
  });

  console.log(`Found ${users.length} user(s) with a configured pay period.`);

  let totalCreated = 0;

  for (const user of users) {
    const baseIncome = user.income ? Number(user.income) : 0;
    if (baseIncome <= 0 || !user.incomeFrequency || !user.nextPayDate) {
      continue;
    }

    const createdAt = new Date(user.createdAt);
    const now = new Date();

    // Existing primary-income dates for this user, to keep the script
    // idempotent across re-runs.
    const existing = await prisma.transaction.findMany({
      where: { userId: user.id, isPrimaryIncome: true },
      select: { date: true },
    });
    const existingDateKeys = new Set(
      existing.map((t) => t.date.toISOString().slice(0, 10)),
    );

    // Walk backwards from the upcoming (not-yet-due) nextPayDate through
    // every already-completed payday, down to account creation.
    const payDates: Date[] = [];
    let cursor = new Date(user.nextPayDate);
    let iterations = 0;

    while (iterations < MAX_PERIODS_PER_USER) {
      const previous = dateService.calculatePreviousPayDate(
        cursor,
        user.incomeFrequency,
      );
      if (previous < createdAt || previous > now) {
        break;
      }
      payDates.push(previous);
      cursor = previous;
      iterations++;
    }

    let createdForUser = 0;
    for (const payDate of payDates) {
      const key = payDate.toISOString().slice(0, 10);
      if (existingDateKeys.has(key)) {
        continue;
      }

      await prisma.transaction.create({
        data: {
          userId: user.id,
          description: "Primary Income",
          amount: baseIncome,
          date: payDate,
          type: TransactionType.INCOME,
          recurrence: "none",
          isPrimaryIncome: true,
          notes: "Backfilled from historical pay periods",
        },
      });
      createdForUser++;
    }

    if (createdForUser > 0) {
      console.log(
        `User ${user.id} (${user.email}): created ${createdForUser} primary-income transaction(s).`,
      );
    }
    totalCreated += createdForUser;
  }

  console.log(`Done. Created ${totalCreated} primary-income transaction(s) total.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
