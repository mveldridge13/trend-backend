const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function reorderCategories() {
  try {
    console.log('🗑️  Deleting all system categories...');
    
    // Delete all subcategories first
    await prisma.category.deleteMany({
      where: {
        isSystem: true,
        parentId: { not: null }
      }
    });
    
    // Delete all main categories
    await prisma.category.deleteMany({
      where: {
        isSystem: true,
        parentId: null
      }
    });
    
    console.log('✅ All system categories deleted');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

reorderCategories();
