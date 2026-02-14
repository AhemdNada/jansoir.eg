const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://jansoir:gin7cx3SVaXcqJGW@cluster0.axd2onf.mongodb.net/jansoir?retryWrites=true&w=majority';

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
