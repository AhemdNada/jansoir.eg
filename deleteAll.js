const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shopera';

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected');

    // استدعاء الموديلز
    const Category = mongoose.model('Category', new mongoose.Schema({}, { strict: false }));
    const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

    // مسح كل البيانات
    await Category.deleteMany({});
    await Product.deleteMany({});

    console.log('All Categories and Products deleted!');

    mongoose.connection.close();
  })
  .catch(err => console.log(err));
