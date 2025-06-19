import { PrismaClient, CategoryType } from "@prisma/client";

const prisma = new PrismaClient();

const hierarchicalCategories = [
  // ==============================================
  // MAIN CATEGORIES (8 main categories)
  // ==============================================

  // 1. FOOD (Main Category)
  {
    name: "Food",
    description: "Food and dining expenses",
    type: CategoryType.EXPENSE,
    icon: "restaurant-outline",
    color: "#FF6B6B",
    isMain: true,
    subcategories: [
      {
        name: "Coffee",
        description: "Coffee shops, cafes, beverages",
        type: CategoryType.EXPENSE,
        icon: "cafe-outline",
        color: "#FF6B6B",
      },
      {
        name: "Dining Out",
        description: "Restaurants, sit-down dining",
        type: CategoryType.EXPENSE,
        icon: "restaurant",
        color: "#FF6B6B",
      },
      {
        name: "Groceries",
        description: "Food and household essentials",
        type: CategoryType.EXPENSE,
        icon: "basket-outline",
        color: "#FF6B6B",
      },
      {
        name: "Take Out",
        description: "Takeout, delivery, fast food",
        type: CategoryType.EXPENSE,
        icon: "bag-outline",
        color: "#FF6B6B",
      },
    ],
  },

  // 2. TRANSPORT (Main Category)
  {
    name: "Transport",
    description: "Transportation and travel expenses",
    type: CategoryType.EXPENSE,
    icon: "car-outline",
    color: "#4ECDC4",
    isMain: true,
    subcategories: [
      {
        name: "Fuel",
        description: "Gas, petrol, electric charging",
        type: CategoryType.EXPENSE,
        icon: "battery-charging-outline",
        color: "#4ECDC4",
      },
      {
        name: "Car Insurance",
        description: "Vehicle insurance coverage",
        type: CategoryType.EXPENSE,
        icon: "shield-outline",
        color: "#4ECDC4",
      },
      {
        name: "Maintenance",
        description: "Car repairs, servicing, parts",
        type: CategoryType.EXPENSE,
        icon: "construct-outline",
        color: "#4ECDC4",
      },
      {
        name: "Parking",
        description: "Parking fees, tolls, permits",
        type: CategoryType.EXPENSE,
        icon: "location-outline",
        color: "#4ECDC4",
      },
      {
        name: "Public Transport",
        description: "Bus, train, taxi, rideshare",
        type: CategoryType.EXPENSE,
        icon: "train-outline",
        color: "#4ECDC4",
      },
      {
        name: "Registration",
        description: "Vehicle registration, license fees",
        type: CategoryType.EXPENSE,
        icon: "document-text-outline",
        color: "#4ECDC4",
      },
    ],
  },

  // 3. BILLS (Main Category) - UPDATED SUBCATEGORIES
  {
    name: "Bills",
    description: "Regular bills and essential expenses",
    type: CategoryType.EXPENSE,
    icon: "receipt-outline",
    color: "#45B7D1",
    isMain: true,
    subcategories: [
      {
        name: "Rent/Mortgage",
        description: "Rent, mortgage, property expenses",
        type: CategoryType.EXPENSE,
        icon: "home-outline",
        color: "#45B7D1",
      },
      {
        name: "Home Insurance",
        description: "Home, property, and contents insurance",
        type: CategoryType.EXPENSE,
        icon: "shield-outline",
        color: "#45B7D1",
      },
      {
        name: "Internet",
        description: "Internet and broadband services",
        type: CategoryType.EXPENSE,
        icon: "wifi-outline",
        color: "#45B7D1",
      },
      {
        name: "Phone",
        description: "Mobile and landline phone services",
        type: CategoryType.EXPENSE,
        icon: "call-outline",
        color: "#45B7D1",
      },
      {
        name: "Water",
        description: "Water and sewer services",
        type: CategoryType.EXPENSE,
        icon: "water-outline",
        color: "#45B7D1",
      },
    ],
  },

  // 4. HEALTH (Main Category)
  {
    name: "Health",
    description: "Health and wellness expenses",
    type: CategoryType.EXPENSE,
    icon: "fitness-outline",
    color: "#96CEB4",
    isMain: true,
    subcategories: [
      {
        name: "Health & Fitness",
        description: "Gym, healthcare, pharmacy",
        type: CategoryType.EXPENSE,
        icon: "heart-outline",
        color: "#96CEB4",
      },
    ],
  },

  // 5. SHOPPING (Main Category)
  {
    name: "Shopping",
    description: "General shopping and purchases",
    type: CategoryType.EXPENSE,
    icon: "bag-handle-outline",
    color: "#FECA57",
    isMain: true,
    subcategories: [
      {
        name: "Beauty & Personal Care",
        description: "Cosmetics, skincare, toiletries, personal hygiene",
        type: CategoryType.EXPENSE,
        icon: "flower-outline",
        color: "#FECA57",
      },
      {
        name: "Buy Now, Pay Later (BNPL)",
        description: "Afterpay, Klarna, ZIP, installment purchases",
        type: CategoryType.EXPENSE,
        icon: "card-outline",
        color: "#FECA57",
      },
      {
        name: "Clothing",
        description: "Clothes, shoes, accessories, fashion",
        type: CategoryType.EXPENSE,
        icon: "shirt-outline",
        color: "#FECA57",
      },
      {
        name: "Electronics",
        description: "Gadgets, tech accessories, electronics",
        type: CategoryType.EXPENSE,
        icon: "phone-portrait-outline",
        color: "#FECA57",
      },
      {
        name: "Home & Furniture",
        description: "Furniture, home decor, household items",
        type: CategoryType.EXPENSE,
        icon: "home-outline",
        color: "#FECA57",
      },
    ],
  },

  // 6. ENTERTAINMENT (Main Category)
  {
    name: "Entertainment",
    description: "Entertainment and leisure expenses",
    type: CategoryType.EXPENSE,
    icon: "musical-notes-outline",
    color: "#FF9FF3",
    isMain: true,
    subcategories: [
      {
        name: "Hobby",
        description: "Hobbies, crafts, personal interests",
        type: CategoryType.EXPENSE,
        icon: "color-palette-outline",
        color: "#FF9FF3",
      },
      {
        name: "Movies",
        description: "Cinema, movie rentals, streaming movies",
        type: CategoryType.EXPENSE,
        icon: "film-outline",
        color: "#FF9FF3",
      },
      {
        name: "Social Event",
        description: "Concerts, sporting events, live entertainment",
        type: CategoryType.EXPENSE,
        icon: "people-outline",
        color: "#FF9FF3",
      },
      {
        name: "Subscriptions",
        description: "Streaming services, memberships, recurring entertainment",
        type: CategoryType.EXPENSE,
        icon: "refresh-outline",
        color: "#FF9FF3",
      },
    ],
  },

  // 7. OTHER (Main Category)
  {
    name: "Other",
    description: "Other financial activities",
    type: CategoryType.EXPENSE,
    icon: "ellipsis-horizontal-outline",
    color: "#A8A8A8",
    isMain: true,
    subcategories: [
      {
        name: "Account Transfer",
        description: "Money transfers between accounts",
        type: CategoryType.TRANSFER,
        icon: "repeat-outline",
        color: "#A8A8A8",
      },
      {
        name: "Debt Payment",
        description: "Loan payments, credit cards",
        type: CategoryType.EXPENSE,
        icon: "card-outline",
        color: "#A8A8A8",
      },
      {
        name: "Goal Contribution",
        description: "Contributions to savings goals",
        type: CategoryType.TRANSFER,
        icon: "flag-outline",
        color: "#A8A8A8",
      },
      {
        name: "Investments",
        description: "Stocks, bonds, retirement funds",
        type: CategoryType.INVESTMENT,
        icon: "stats-chart-outline",
        color: "#A8A8A8",
      },
      {
        name: "Savings",
        description: "Emergency fund, general savings",
        type: CategoryType.EXPENSE,
        icon: "storefront-outline",
        color: "#A8A8A8",
      },
    ],
  },

  // ==============================================
  // INCOME CATEGORIES (Separate main categories)
  // ==============================================

  {
    name: "Income",
    description: "Income sources",
    type: CategoryType.INCOME,
    icon: "cash-outline",
    color: "#10B981",
    isMain: true,
    subcategories: [
      {
        name: "Business Income",
        description: "Business revenue and profits",
        type: CategoryType.INCOME,
        icon: "business-outline",
        color: "#10B981",
      },
      {
        name: "Freelance",
        description: "Freelance and contract work",
        type: CategoryType.INCOME,
        icon: "briefcase-outline",
        color: "#10B981",
      },
      {
        name: "Investment Income",
        description: "Dividends, interest, capital gains",
        type: CategoryType.INCOME,
        icon: "trending-up-outline",
        color: "#10B981",
      },
      {
        name: "Other Income",
        description: "Miscellaneous income sources",
        type: CategoryType.INCOME,
        icon: "add-circle-outline",
        color: "#10B981",
      },
      {
        name: "Salary",
        description: "Regular employment income",
        type: CategoryType.INCOME,
        icon: "wallet-outline",
        color: "#10B981",
      },
    ],
  },
];

async function seedHierarchicalCategories() {
  console.log("🌱 Seeding hierarchical categories...");

  // First, clear existing categories completely to ensure clean slate
  console.log("🧹 Clearing ALL existing categories...");
  await prisma.category.deleteMany({});

  for (const mainCategory of hierarchicalCategories) {
    try {
      // Create main category
      const createdMainCategory = await prisma.category.create({
        data: {
          name: mainCategory.name,
          description: mainCategory.description,
          type: mainCategory.type,
          icon: mainCategory.icon,
          color: mainCategory.color,
          isSystem: true,
          isActive: true,
          parentId: null, // This is a main category
        },
      });

      console.log(`✅ Created main category: ${mainCategory.name}`);

      // Create subcategories under this main category
      if (mainCategory.subcategories && mainCategory.subcategories.length > 0) {
        for (const subcategory of mainCategory.subcategories) {
          await prisma.category.create({
            data: {
              name: subcategory.name,
              description: subcategory.description,
              type: subcategory.type,
              icon: subcategory.icon,
              color: subcategory.color,
              isSystem: true,
              isActive: true,
              parentId: createdMainCategory.id, // Link to parent category
            },
          });

          console.log(`   ↳ Created subcategory: ${subcategory.name}`);
        }
      }
    } catch (error: any) {
      console.error(`❌ Error creating ${mainCategory.name}:`, error.message);
      throw error; // Re-throw to stop execution on any error
    }
  }

  console.log("🎉 Hierarchical categories seeding completed!");

  // Display summary
  const totalCategories = await prisma.category.count();
  const mainCategories = await prisma.category.count({
    where: { parentId: null },
  });
  const subcategories = await prisma.category.count({
    where: { parentId: { not: null } },
  });

  console.log(`📊 Summary:`);
  console.log(`   • Total categories: ${totalCategories}`);
  console.log(`   • Main categories: ${mainCategories}`);
  console.log(`   • Subcategories: ${subcategories}`);
}

seedHierarchicalCategories()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
