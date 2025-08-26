// models/Discount.js
const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema({
    startDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    endDate: {
        type: Date,
        required: true
    },
    discountPercentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    applicableToAll: {
        type: Boolean,
        default: false
    },
    selectedMainCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    },
    selectedSubCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Add indexes for better query performance
discountSchema.index({ startDate: 1, endDate: 1 });
discountSchema.index({ applicableToAll: 1 });
discountSchema.index({ selectedMainCategory: 1 });
discountSchema.index({ selectedSubCategory: 1 });
discountSchema.index({ isActive: 1 });

// Virtual to check if discount is currently active
discountSchema.virtual('isCurrentlyActive').get(function() {
    const now = new Date();
    return this.isActive && this.startDate <= now && this.endDate >= now;
});

// Virtual to check if discount is expired
discountSchema.virtual('isExpired').get(function() {
    const now = new Date();
    return this.endDate < now;
});

// Virtual to check if discount is upcoming
discountSchema.virtual('isUpcoming').get(function() {
    const now = new Date();
    return this.startDate > now;
});

// Instance method to get discount status
discountSchema.methods.getDiscountStatus = function() {
    const now = new Date();
    
    if (!this.isActive) {
        return 'inactive';
    }
    
    if (this.startDate > now) {
        return 'upcoming';
    }
    
    if (this.endDate < now) {
        return 'expired';
    }
    
    return 'active';
};

// Static method to find active discounts
discountSchema.statics.findActiveDiscounts = function(categoryId = null) {
    const now = new Date();
    const query = {
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now }
    };
    
    if (categoryId) {
        query.$or = [
            { applicableToAll: true },
            { selectedMainCategory: categoryId },
            { selectedSubCategory: categoryId }
        ];
    }
    
    return this.find(query);
};

// Static method to find overlapping discounts
discountSchema.statics.findOverlappingDiscounts = function(startDate, endDate, categoryId = null, excludeId = null) {
    const query = {
        isActive: true,
        $or: [
            {
                startDate: { $lte: endDate },
                endDate: { $gte: startDate }
            }
        ]
    };

    if (excludeId) {
        query._id = { $ne: excludeId };
    }

    if (categoryId) {
        query.$and = [
            {
                $or: [
                    { applicableToAll: true },
                    { selectedMainCategory: categoryId },
                    { selectedSubCategory: categoryId }
                ]
            }
        ];
    } else {
        // If no specific category, check for "applicable to all" discounts
        query.applicableToAll = true;
    }

    return this.find(query);
};

// Pre-save middleware to validate dates
discountSchema.pre('save', function(next) {
    // Ensure end date is after start date
    if (this.endDate <= this.startDate) {
        return next(new Error('End date must be after start date'));
    }
    
    // If not applicable to all, ensure at least main category is selected
    if (!this.applicableToAll && !this.selectedMainCategory) {
        return next(new Error('Main category is required when not applicable to all products'));
    }
    
    next();
});

// Pre-update middleware to validate dates
discountSchema.pre('findOneAndUpdate', function(next) {
    const update = this.getUpdate();
    
    if (update.startDate && update.endDate) {
        if (new Date(update.endDate) <= new Date(update.startDate)) {
            return next(new Error('End date must be after start date'));
        }
    }
    
    next();
});

const Discount = mongoose.model('Discount', discountSchema);

module.exports = Discount;