// Helper function to create slug from name
const createSlug = (name) => {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .replace(/(^-|-$)/g, ''); // Remove leading/trailing hyphens
};

// Helper function to calculate active product counts per category
const calculateCategoryProductCounts = async (Product, Category) => {
    try {
        // Get all active categories
        const activeCategories = await Category.find({ status: 'Active' }).select('slug _id');
        const categorySlugs = activeCategories.map(cat => cat.slug);

        // Aggregate product counts by category
        const productCounts = await Product.aggregate([
            {
                $match: {
                    status: 'Active',
                    category: { $in: categorySlugs }
                }
            },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Create a map of category slug to count
        const countMap = {};
        productCounts.forEach(item => {
            countMap[item._id] = item.count;
        });

        // Return counts mapped to category IDs
        const result = {};
        activeCategories.forEach(cat => {
            result[cat._id.toString()] = countMap[cat.slug] || 0;
        });

        return result;
    } catch (error) {
        console.error('Error calculating category product counts:', error);
        return {};
    }
};

// Helper function to get active category slugs
const getActiveCategorySlugs = async (Category) => {
    try {
        const activeCategories = await Category.find({ status: 'Active' }).select('slug');
        return activeCategories.map(cat => cat.slug);
    } catch (error) {
        console.error('Error fetching active category slugs:', error);
        return [];
    }
};

module.exports = {
    createSlug,
    calculateCategoryProductCounts,
    getActiveCategorySlugs
};

