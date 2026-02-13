const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config({ path: __dirname + '/../.env' });


const createAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'admin@shopera.eg' });
        if (existingAdmin) {
            console.log('Admin user already exists');
            await mongoose.connection.close();
            return;
        }

        // Create admin user
        const admin = await User.create({
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@shopera.eg',
            password: 'admin@shopera.eg', // Will be hashed automatically
            role: 'admin'
        });

        console.log('✅ Admin user created successfully!');
        console.log('Email: admin@shopera.eg');
        console.log('Password: admin123');
        console.log('Please change the password after first login!');

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error creating admin:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
};

createAdmin();

