const { PrismaClient, CategoryType } = require('@prisma/client');
const prisma = new PrismaClient();

const hierarchicalCategories = [
  {
    name: "Bills & Utilities",
    description: "Regular bills and utilities",
    type: "EXPENSE",
    icon: "receipt-outline",
    color: "#AA96DA",
    isMain: true,
    subcategories: [
      { name: "Electricity", description: "Power bills", type: "EXPENSE", icon: "flash-outline", color: "#AA96DA" },
      { name: "Home Maintenance", description: "Home repairs and maintenance", type: "EXPENSE", icon: "hammer-outline", color: "#AA96DA" },
      { name: "Internet", description: "Internet service", type: "EXPENSE", icon: "wifi-outline", color: "#AA96DA" },
      { name: "Phone", description: "Mobile phone bills", type: "EXPENSE", icon: "call-outline", color: "#AA96DA" },
      { name: "Rent/Mortgage", description: "Rent or mortgage payments", type: "EXPENSE", icon: "home-outline", color: "#AA96DA" },
      { name: "Water", description: "Water bills", type: "EXPENSE", icon: "water-outline", color: "#AA96DA" },
    ],
  },
  {
    name: "Entertainment",
    description: "Fun and leisure activities",
    type: "EXPENSE",
    icon: "game-controller-outline",
    color: "#4A90E2",
    isMain: true,
    subcategories: [
      { name: "Events", description: "Concerts, events, shows", type: "EXPENSE", icon: "ticket-outline", color: "#4A90E2" },
      { name: "Games", description: "Video games, board games", type: "EXPENSE", icon: "game-controller-outline", color: "#4A90E2" },
      { name: "Movies & Shows", description: "Cinema, streaming services", type: "EXPENSE", icon: "film-outline", color: "#4A90E2" },
      { name: "Music", description: "Concerts, music streaming", type: "EXPENSE", icon: "musical-notes-outline", color: "#4A90E2" },
      { name: "Subscriptions", description: "Streaming, memberships", type: "EXPENSE", icon: "card-outline", color: "#4A90E2" },
    ],
  },
  {
    name: "Food",
    description: "Food and dining expenses",
    type: "EXPENSE",
    icon: "restaurant-outline",
    color: "#FF6B6B",
    isMain: true,
    subcategories: [
      { name: "Coffee", description: "Coffee shops, cafes, beverages", type: "EXPENSE", icon: "cafe-outline", color: "#FF6B6B" },
      { name: "Dining Out", description: "Restaurants, sit-down dining", type: "EXPENSE", icon: "restaurant", color: "#FF6B6B" },
      { name: "Groceries", description: "Food and household essentials", type: "EXPENSE", icon: "basket-outline", color: "#FF6B6B" },
      { name: "Take Out", description: "Takeout, delivery, fast food", type: "EXPENSE", icon: "bag-outline", color: "#FF6B6B" },
    ],
  },
  {
    name: "Healthcare",
    description: "Medical and health expenses",
    type: "EXPENSE",
    icon: "medical-outline",
    color: "#FCBAD3",
    isMain: true,
    subcategories: [
      { name: "Dental", description: "Dental care", type: "EXPENSE", icon: "fitness-outline", color: "#FCBAD3" },
      { name: "Doctor", description: "Doctor visits, consultations", type: "EXPENSE", icon: "person-outline", color: "#FCBAD3" },
      { name: "Insurance", description: "Health insurance", type: "EXPENSE", icon: "shield-checkmark-outline", color: "#FCBAD3" },
      { name: "Optometrist", description: "Eye care, glasses, contacts", type: "EXPENSE", icon: "glasses-outline", color: "#FCBAD3" },
      { name: "Pharmacy", description: "Medications, prescriptions", type: "EXPENSE", icon: "medkit-outline", color: "#FCBAD3" },
      { name: "Veterinary", description: "Pet healthcare", type: "EXPENSE", icon: "paw-outline", color: "#FCBAD3" },
    ],
  },
  {
    name: "Income",
    description: "All income sources",
    type: "INCOME",
    icon: "cash-outline",
    color: "#A8E6CF",
    isMain: true,
    subcategories: [
      { name: "Freelance", description: "Contract work, gig economy", type: "INCOME", icon: "laptop-outline", color: "#A8E6CF" },
      { name: "Investments", description: "Returns from investments", type: "INCOME", icon: "trending-up-outline", color: "#A8E6CF" },
      { name: "Other Income", description: "Misc income sources", type: "INCOME", icon: "wallet-outline", color: "#A8E6CF" },
      { name: "Salary", description: "Regular employment income", type: "INCOME", icon: "briefcase-outline", color: "#A8E6CF" },
    ],
  },
  {
    name: "Shopping",
    description: "Retail and online shopping",
    type: "EXPENSE",
    icon: "cart-outline",
    color: "#FF9500",
    isMain: true,
    subcategories: [
      { name: "Buy-now, Pay-Later (BNPL)", description: "Afterpay, Klarna, installments", type: "EXPENSE", icon: "time-outline", color: "#FF9500" },
      { name: "Clothing", description: "Clothes, shoes, accessories", type: "EXPENSE", icon: "shirt-outline", color: "#FF9500" },
      { name: "Electronics", description: "Gadgets, tech accessories", type: "EXPENSE", icon: "phone-portrait-outline", color: "#FF9500" },
      { name: "Home & Garden", description: "Furniture, decor, garden supplies", type: "EXPENSE", icon: "home-outline", color: "#FF9500" },
      { name: "Personal Care", description: "Toiletries, cosmetics", type: "EXPENSE", icon: "sparkles-outline", color: "#FF9500" },
    ],
  },
  {
    name: "Transport",
    description: "Transportation and travel",
    type: "EXPENSE",
    icon: "car-outline",
    color: "#4ECDC4",
    isMain: true,
    subcategories: [
      { name: "Car Insurance", description: "Vehicle insurance", type: "EXPENSE", icon: "shield-outline", color: "#4ECDC4" },
      { name: "Fuel", description: "Gasoline, diesel", type: "EXPENSE", icon: "water-outline", color: "#4ECDC4" },
      { name: "Maintenance", description: "Car servicing, repairs", type: "EXPENSE", icon: "construct-outline", color: "#4ECDC4" },
      { name: "Parking", description: "Parking fees", type: "EXPENSE", icon: "location-outline", color: "#4ECDC4" },
      { name: "Public Transport", description: "Buses, trains, trams", type: "EXPENSE", icon: "train-outline", color: "#4ECDC4" },
      { name: "Registration", description: "Vehicle registration", type: "EXPENSE", icon: "document-text-outline", color: "#4ECDC4" },
      { name: "Ride Share", description: "Uber, Lyft, taxis", type: "EXPENSE", icon: "car-sport-outline", color: "#4ECDC4" },
      { name: "Toll Fees", description: "Road tolls", type: "EXPENSE", icon: "cash-outline", color: "#4ECDC4" },
    ],
  },
];

async function seedCategories() {
  console.log('🌱 Starting category seeding...');

  try {
    for (const mainCategory of hierarchicalCategories) {
      const { subcategories, isMain, ...mainCategoryData } = mainCategory;

      const existing = await prisma.category.findFirst({
        where: { name: mainCategoryData.name, isSystem: true }
      });

      if (existing) {
        console.log(`⏭️  Category "${mainCategoryData.name}" already exists, skipping...`);
        continue;
      }

      const parent = await prisma.category.create({
        data: {
          ...mainCategoryData,
          isSystem: true,
          isActive: true,
        },
      });

      console.log(`✅ Created main category: ${parent.name}`);

      if (subcategories) {
        for (const subcat of subcategories) {
          await prisma.category.create({
            data: {
              ...subcat,
              parentId: parent.id,
              isSystem: true,
              isActive: true,
            },
          });
          console.log(`  ✅ Created subcategory: ${subcat.name}`);
        }
      }
    }

    console.log('🎉 Category seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedCategories();
