import { PrismaClient, CategoryType } from "@prisma/client";

const prisma = new PrismaClient();

const systemCategories = [
  // Income Categories
  {
    name: "Salary",
    description: "Regular employment income",
    type: CategoryType.INCOME,
    icon: "wallet-outline",
    color: "#10B981",
  },
  {
    name: "Freelance",
    description: "Freelance and contract work",
    type: CategoryType.INCOME,
    icon: "briefcase-outline",
    color: "#059669",
  },
  {
    name: "Investment Income",
    description: "Dividends, interest, capital gains",
    type: CategoryType.INCOME,
    icon: "trending-up-outline",
    color: "#047857",
  },
  {
    name: "Business Income",
    description: "Business revenue and profits",
    type: CategoryType.INCOME,
    icon: "business-outline",
    color: "#065F46",
  },
  {
    name: "Other Income",
    description: "Miscellaneous income sources",
    type: CategoryType.INCOME,
    icon: "cash-outline",
    color: "#064E3B",
  },

  // Expense Categories - Essentials
  {
    name: "Housing",
    description: "Rent, mortgage, utilities",
    type: CategoryType.EXPENSE,
    icon: "home-outline",
    color: "#DC2626",
  },
  {
    name: "Utilities",
    description: "Electricity, gas, water, internet",
    type: CategoryType.EXPENSE,
    icon: "flash-outline",
    color: "#B91C1C",
  },
  {
    name: "Groceries",
    description: "Food and household essentials",
    type: CategoryType.EXPENSE,
    icon: "basket-outline",
    color: "#991B1B",
  },
  {
    name: "Transportation",
    description: "Gas, public transit, car payments",
    type: CategoryType.EXPENSE,
    icon: "car-outline",
    color: "#7F1D1D",
  },
  {
    name: "Insurance",
    description: "Health, auto, home insurance",
    type: CategoryType.EXPENSE,
    icon: "shield-outline",
    color: "#450A0A",
  },

  // Expense Categories - Lifestyle
  {
    name: "Dining Out",
    description: "Restaurants, takeout, delivery",
    type: CategoryType.EXPENSE,
    icon: "restaurant-outline",
    color: "#EA580C",
  },
  {
    name: "Entertainment",
    description: "Movies, games, hobbies",
    type: CategoryType.EXPENSE,
    icon: "musical-notes-outline",
    color: "#C2410C",
  },
  {
    name: "Shopping",
    description: "Clothes, electronics, general purchases",
    type: CategoryType.EXPENSE,
    icon: "bag-handle-outline",
    color: "#9A3412",
  },
  {
    name: "Health & Fitness",
    description: "Gym, healthcare, pharmacy",
    type: CategoryType.EXPENSE,
    icon: "fitness-outline",
    color: "#7C2D12",
  },
  {
    name: "Education",
    description: "Books, courses, training",
    type: CategoryType.EXPENSE,
    icon: "library-outline",
    color: "#431407",
  },

  // Expense Categories - Financial
  {
    name: "Debt Payment",
    description: "Loan payments, credit cards",
    type: CategoryType.EXPENSE,
    icon: "card-outline",
    color: "#7C3AED",
  },
  {
    name: "Savings",
    description: "Emergency fund, general savings",
    type: CategoryType.EXPENSE,
    icon: "storefront-outline",
    color: "#6D28D9",
  },
  {
    name: "Investments",
    description: "Stocks, bonds, retirement funds",
    type: CategoryType.INVESTMENT,
    icon: "stats-chart-outline",
    color: "#5B21B6",
  },

  // Transfer Categories
  {
    name: "Account Transfer",
    description: "Money transfers between accounts",
    type: CategoryType.TRANSFER,
    icon: "repeat-outline",
    color: "#0891B2",
  },
  {
    name: "Goal Contribution",
    description: "Contributions to savings goals",
    type: CategoryType.TRANSFER,
    icon: "flag-outline",
    color: "#0E7490",
  },
];

async function seedSystemCategories() {
  console.log("Seeding system categories...");

  for (const category of systemCategories) {
    try {
      await prisma.category.create({
        data: {
          ...category,
          isSystem: true,
          isActive: true,
        },
      });
      console.log(`✅ Created: ${category.name}`);
    } catch (error: any) {
      if (error.code === "P2002") {
        console.log(`⚠️  Already exists: ${category.name}`);
      } else {
        console.error(`❌ Error creating ${category.name}:`, error.message);
      }
    }
  }

  console.log("System categories seeding completed!");
}

seedSystemCategories()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
