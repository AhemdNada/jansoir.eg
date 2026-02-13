const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');

// ----------------- MongoDB -----------------
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shopera';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

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

// ----------------- Helper -----------------
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateSlug(text) {
  return text.toLowerCase().replace(/\s+/g, '-');
}

// ----------------- Seed Data -----------------
async function seedCategoryWithProducts(categoryIndex, numProducts = 50, batchSize = 10) {
  // إنشاء اسم و slug للـ category
  const categoryName = faker.commerce.department() + " " + faker.word.adjective();
  const categorySlug = generateSlug(categoryName);

  // --------- إنشاء الـ Category أولًا بدون productsCount ----------
  const category = new Category({
    name: categoryName,
    image: `https://picsum.photos/seed/category${categoryIndex}/300/200`,
    description: faker.commerce.productDescription(),
    status: "Active",
    productsCount: 0,
    slug: categorySlug
  });
  await category.save();

  // --------- إنشاء المنتجات تدريجيًا ----------
  const sizes = ["S", "M", "L", "XL", "XXL"];
  const colors = ["black", "white", "red", "blue", "green", "yellow", "brown"];
  let insertedCount = 0;

  for (let j = 0; j < numProducts; j += batchSize) {
    const batch = [];
    for (let k = j; k < Math.min(j + batchSize, numProducts); k++) {
      const productName = faker.commerce.productName();
      const price = randomInt(50, 500);
      const variants = sizes.map(size => ({
        size,
        color: colors[randomInt(0, colors.length - 1)],
        quantity: randomInt(1, 20)
      }));
      const stock = variants.reduce((sum, v) => sum + v.quantity, 0);

      batch.push({
        name: productName,
        description: faker.commerce.productDescription(),
        price,
        originalPrice: price + randomInt(0, 50),
        discount: 0,
        category: categorySlug,
        brand: faker.company.name(),
        stock,
        status: "Active",
        rating: parseFloat((Math.random() * 5).toFixed(1)),
        image: `https://picsum.photos/seed/product${categoryIndex}-${k}/400/400`,
        images: [
          `https://picsum.photos/seed/product${categoryIndex}-${k}/400/400`,
          `https://picsum.photos/seed/product${categoryIndex}-${k}-1/400/400`,
          `https://picsum.photos/seed/product${categoryIndex}-${k}-2/400/400`
        ],
        keyFeatures: [
          faker.commerce.productAdjective(),
          faker.commerce.productMaterial(),
          faker.commerce.productDescription()
        ],
        sizes,
        colors,
        variants,
        slug: generateSlug(productName)
      });
    }

    const insertedBatch = await Product.insertMany(batch);
    insertedCount += insertedBatch.length;
    console.log(`Inserted ${insertedBatch.length} products for category "${categoryName}"`);
  }

  // --------- تحديث productsCount للـ category ----------
  category.productsCount = insertedCount;
  await category.save();

  console.log(`Category "${categoryName}" saved with total ${insertedCount} products.\n`);
}

// ----------------- Run Seed -----------------
async function seedAll() {
  try {
    await Category.deleteMany({});
    await Product.deleteMany({});
    console.log('Old data cleared.');

    const totalCategories = 50; // عدد categories
    const productsPerCategory = 200; // عدد المنتجات لكل category
    const batchSize = 20; // batch صغير لتجنب الضغط على الذاكرة

    for (let i = 0; i < totalCategories; i++) {
      await seedCategoryWithProducts(i, productsPerCategory, batchSize);
    }

    console.log('Seeding completed successfully!');
    mongoose.connection.close();
  } catch (err) {
    console.log(err);
  }
}

seedAll();
