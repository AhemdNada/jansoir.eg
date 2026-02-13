const ActivityHistory = require('../models/ActivityHistory');

// @desc Get activity history with pagination, filtering, and search
// @route GET /api/history
// @access Private/Admin
const getHistory = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
        const search = req.query.search ? String(req.query.search).trim() : '';
        const type = req.query.type && req.query.type !== 'all' ? req.query.type : null;

        const query = {};
        if (type) {
            query.type = type;
        }
        if (search) {
            query.$text = { $search: search };
        }

        const total = await ActivityHistory.countDocuments(query);
        const totalPages = Math.ceil(total / limit) || 1;

        const history = await ActivityHistory.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.status(200).json({
            success: true,
            data: history,
            page,
            limit,
            total,
            totalPages,
            count: history.length
        });
    } catch (error) {
        console.error('Error fetching activity history:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching activity history'
        });
    }
};

// @desc Delete all activity history
// @route DELETE /api/history
// @access Private/Admin
const clearAllHistory = async (req, res) => {
    try {
        const result = await ActivityHistory.deleteMany({});
        
        res.status(200).json({
            success: true,
            message: 'All activity history cleared successfully',
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Error clearing activity history:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while clearing activity history'
        });
    }
};

module.exports = {
    getHistory,
    clearAllHistory
};


