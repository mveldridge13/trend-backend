const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteEducation() {
  try {
    console.log('🗑️  Deleting Education category...');
    
    // Find the Education category
    const educationCategory = await prisma.category.findFirst({
      where: { 
        name: 'Education',
        isSystem: true 
      },
      include: {
        subcategories: true
      }
    });
    
    if (!educationCategory) {
      console.log('❌ Education category not found');
      return;
    }
    
    // Delete subcategories first
    await prisma.category.deleteMany({
      where: {
        parentId: educationCategory.id
      }
    });
    console.log(`✅ Deleted ${educationCategory.subcategories.length} subcategories`);
    
    // Delete main category
    await prisma.category.delete({
      where: {
        id: educationCategory.id
      }
    });
    console.log('✅ Deleted Education main category');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteEducation();
