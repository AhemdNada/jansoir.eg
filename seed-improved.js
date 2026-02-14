const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');

// ----------------- MongoDB -----------------
const MONGODB_URI = 'mongodb+srv://jansoir:gin7cx3SVaXcqJGW@cluster0.axd2onf.mongodb.net/jansoir?retryWrites=true&w=majority';



// إعدادات Mongoose محسّنة
mongoose.set('strictQuery', false);

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ MongoDB connected successfully\n');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
}

// ----------------- Schemas -----------------
const categorySchema = new mongoose.Schema({
  name: String,
  image: String,
  description: String,
  status: String,
  productsCount: Number,
  slug: String
}, { timestamps: true });

const Category = mongoose.model('Category', categorySchema);

const variantSchema = new mongoose.Schema({
  size: String,
  color: String,
  quantity: Number
}, { _id: false });

const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  originalPrice: Number,
  discount: Number,
  category: String,
  brand: String,
  stock: Number,
  status: String,
  rating: Number,
  image: String,
  images: [String],
  keyFeatures: [String],
  sizes: [String],
  colors: [String],
  variants: [variantSchema],
  slug: String
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

// ----------------- Data -----------------
const CATEGORIES = [
  { name: 'Electronics', desc: 'Smartphones, laptops, and gadgets' },
  { name: 'Fashion', desc: 'Trendy clothing and accessories' },
  { name: 'Home & Kitchen', desc: 'Everything for your home' },
  { name: 'Sports', desc: 'Sports equipment and gear' },
  { name: 'Books', desc: 'Wide selection of books' },
  { name: 'Toys', desc: 'Fun toys for kids' },
  { name: 'Beauty', desc: 'Makeup and skincare' },
  { name: 'Automotive', desc: 'Car parts and accessories' },
  { name: 'Health', desc: 'Health and wellness' },
  { name: 'Jewelry', desc: 'Elegant jewelry and watches' }
];

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const COLORS = ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow'];
const BRANDS = ['Nike', 'Adidas', 'Samsung', 'Apple', 'Sony', 'LG', 'Zara'];

// ----------------- Helpers -----------------
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateSlug(text) {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ----------------- إنشاء منتج واحد -----------------
function createProductData(categorySlug, index) {
  const productName = faker.commerce.productName();
  const basePrice = randomInt(100, 1000);
  const discount = randomInt(5, 30);
  const price = Math.floor(basePrice * (1 - discount / 100));
  
  const variants = [];
  for (let i = 0; i < randomInt(3, 6); i++) {
    variants.push({
      size: SIZES[randomInt(0, SIZES.length - 1)],
      color: COLORS[randomInt(0, COLORS.length - 1)],
      quantity: randomInt(10, 50)
    });
  }
  
  const stock = variants.reduce((sum, v) => sum + v.quantity, 0);
  const slug = generateSlug(productName) + '-' + index;

  return {
    name: productName,
    description: faker.commerce.productDescription(),
    price: price,
    originalPrice: basePrice,
    discount: discount,
    category: categorySlug,
    brand: BRANDS[randomInt(0, BRANDS.length - 1)],
    stock: stock,
    status: 'Active',
    rating: parseFloat((3 + Math.random() * 2).toFixed(1)),
    image: `https://picsum.photos/seed/${slug}/500/500`,
    images: [
      `https://picsum.photos/seed/${slug}-1/500/500`,
      `https://picsum.photos/seed/${slug}-2/500/500`,
      `https://picsum.photos/seed/${slug}-3/500/500`
    ],
    keyFeatures: [
      'High quality',
      faker.commerce.productMaterial(),
      'Best seller'
    ],
    sizes: [...new Set(variants.map(v => v.size))],
    colors: [...new Set(variants.map(v => v.color))],
    variants: variants,
    slug: slug
  };
}

// ----------------- Seed واحدة Category -----------------
async function seedOneCategory(catData, catIndex, numProducts) {
  const categorySlug = generateSlug(catData.name);
  
  console.log(`\n${'━'.repeat(60)}`);
  console.log(`📦 Category ${catIndex + 1}/${CATEGORIES.length}: ${catData.name}`);
  console.log(`   Target: ${numProducts} products`);
  console.log(`${'━'.repeat(60)}`);
  
  // 1. إنشاء Category
  const category = await Category.create({
    name: catData.name,
    image: `https://picsum.photos/seed/cat-${categorySlug}/600/400`,
    description: catData.desc,
    status: 'Active',
    productsCount: 0,
    slug: categorySlug
  });
  
  console.log(`✓ Category saved to database`);
  
  // 2. إنشاء المنتجات في دفعات صغيرة
  const BATCH_SIZE = 50;
  let totalCreated = 0;
  
  for (let i = 0; i < numProducts; i += BATCH_SIZE) {
    const batchProducts = [];
    const currentBatchSize = Math.min(BATCH_SIZE, numProducts - i);
    
    // تجهيز الـ batch
    for (let j = 0; j < currentBatchSize; j++) {
      batchProducts.push(createProductData(categorySlug, i + j));
    }
    
    // حفظ الـ batch
    try {
      const saved = await Product.insertMany(batchProducts, { ordered: false });
      totalCreated += saved.length;
      
      console.log(`   ✓ Batch ${Math.floor(i / BATCH_SIZE) + 1}: Added ${saved.length} products (Total: ${totalCreated}/${numProducts})`);
      
      // انتظار صغير بين الدفعات
      await sleep(100);
    } catch (err) {
      console.error(`   ✗ Error in batch:`, err.message);
    }
  }
  
  // 3. تحديث عدد المنتجات في Category
  category.productsCount = totalCreated;
  await category.save();
  
  // 4. التحقق من العدد الفعلي
  const actualCount = await Product.countDocuments({ category: categorySlug });
  
  console.log(`✅ Category "${catData.name}" completed!`);
  console.log(`   • Expected: ${numProducts} products`);
  console.log(`   • Created: ${totalCreated} products`);
  console.log(`   • In Database: ${actualCount} products`);
  
  if (actualCount !== numProducts) {
    console.log(`   ⚠️  Warning: Mismatch detected!`);
  }
  
  return actualCount;
}

// ----------------- Main Function -----------------
async function seedDatabase() {
  const startTime = Date.now();
  
  try {
    // الاتصال بالـ Database
    await connectDB();
    
    console.log('🗑️  Clearing old data...');
    const deletedCats = await Category.deleteMany({});
    const deletedProds = await Product.deleteMany({});
    console.log(`✓ Deleted ${deletedCats.deletedCount} categories`);
    console.log(`✓ Deleted ${deletedProds.deletedCount} products`);
    
    // الإعدادات
    const PRODUCTS_PER_CATEGORY = 200; // 👈 غيّر هنا
    
    console.log(`\n${'═'.repeat(60)}`);
    console.log('🚀 STARTING SEEDING PROCESS');
    console.log(`${'═'.repeat(60)}`);
    console.log(`📊 Configuration:`);
    console.log(`   • Categories: ${CATEGORIES.length}`);
    console.log(`   • Products per Category: ${PRODUCTS_PER_CATEGORY}`);
    console.log(`   • Total Products: ${CATEGORIES.length * PRODUCTS_PER_CATEGORY}`);
    console.log(`${'═'.repeat(60)}`);
    
    let totalProducts = 0;
    
    // معالجة كل Category
    for (let i = 0; i < CATEGORIES.length; i++) {
      const count = await seedOneCategory(CATEGORIES[i], i, PRODUCTS_PER_CATEGORY);
      totalProducts += count;
      
      // انتظار بين Categories
      await sleep(200);
    }
    
    // النتيجة النهائية
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`\n${'═'.repeat(60)}`);
    console.log('🎉 SEEDING COMPLETED!');
    console.log(`${'═'.repeat(60)}`);
    
    // التحقق النهائي
    const finalCatCount = await Category.countDocuments();
    const finalProdCount = await Product.countDocuments();
    
    console.log(`\n📊 Final Results:`);
    console.log(`   ✓ Categories in DB: ${finalCatCount}`);
    console.log(`   ✓ Products in DB: ${finalProdCount}`);
    console.log(`   ✓ Time Taken: ${duration} seconds`);
    console.log(`   ✓ Speed: ${Math.floor(finalProdCount / duration)} products/sec`);
    console.log(`${'═'.repeat(60)}\n`);
    
    // إغلاق الاتصال
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
    
  } catch (err) {
    console.error('\n❌ FATAL ERROR:', err);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// تشغيل
seedDatabase();