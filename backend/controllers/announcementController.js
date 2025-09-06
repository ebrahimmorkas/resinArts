const Announcement = require('../models/Announcement');

exports.add = async (req, res) => {
  try {
    const { text, startDate, endDate, isDefault } = req.body;

    // Validation 1: Start date should be less than end date
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ 
        message: 'Start date must be before end date' 
      });
    }

    // Validation 2: Check for overlapping announcements (only for non-default)
    if (!isDefault) {
      const overlappingAnnouncement = await Announcement.findOne({
        isDefault: false,
        $or: [
          // New announcement starts within existing range
          { 
            startDate: { $lte: new Date(startDate) }, 
            endDate: { $gte: new Date(startDate) } 
          },
          // New announcement ends within existing range
          { 
            startDate: { $lte: new Date(endDate) }, 
            endDate: { $gte: new Date(endDate) } 
          },
          // New announcement completely covers existing range
          { 
            startDate: { $gte: new Date(startDate) }, 
            endDate: { $lte: new Date(endDate) } 
          }
        ]
      });

      if (overlappingAnnouncement) {
        return res.status(400).json({ 
          message: 'Announcement dates overlap with existing announcement',
          conflictingDates: {
            start: overlappingAnnouncement.startDate,
            end: overlappingAnnouncement.endDate
          }
        });
      }
    }

    // Validation 3: Check if default announcement already exists
    if (isDefault) {
      const existingDefault = await Announcement.findOne({ isDefault: true });
      if (existingDefault) {
        return res.status(409).json({ 
          message: 'Default announcement already exists',
          existingDefault: existingDefault
        });
      }
    }

    // If all validations pass, create the announcement
    if (isDefault) {
      await Announcement.updateMany({ isDefault: true }, { isDefault: false });
    }

    const newAnnouncement = new Announcement({
      text,
      startDate,
      endDate,
      isDefault
    });

    await newAnnouncement.save();
    res.status(201).json({ 
      message: 'Announcement added successfully', 
      announcement: newAnnouncement 
    });

  } catch (error) {
    res.status(500).json({ 
      message: 'Error adding announcement', 
      error: error.message 
    });
  }
};

exports.addWithOverride = async (req, res) => {
  try {
    const { text, startDate, endDate, isDefault } = req.body;

    // Same date validation
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ 
        message: 'Start date must be before end date' 
      });
    }

    // Same overlap validation for non-default
    if (!isDefault) {
      const overlappingAnnouncement = await Announcement.findOne({
        isDefault: false,
        $or: [
          { startDate: { $lte: new Date(startDate) }, endDate: { $gte: new Date(startDate) } },
          { startDate: { $lte: new Date(endDate) }, endDate: { $gte: new Date(endDate) } },
          { startDate: { $gte: new Date(startDate) }, endDate: { $lte: new Date(endDate) } }
        ]
      });

      if (overlappingAnnouncement) {
        return res.status(400).json({ 
          message: 'Announcement dates overlap with existing announcement' 
        });
      }
    }

    // Force override existing default
    if (isDefault) {
      await Announcement.updateMany({ isDefault: true }, { isDefault: false });
    }

    const newAnnouncement = new Announcement({
      text,
      startDate,
      endDate,
      isDefault
    });

    await newAnnouncement.save();
    res.status(201).json({ 
      message: 'Announcement added successfully with override', 
      announcement: newAnnouncement 
    });

  } catch (error) {
    res.status(500).json({ 
      message: 'Error adding announcement with override', 
      error: error.message 
    });
  }
};

exports.fetchAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find({}).sort({ createdAt: -1 });
    res.status(200).json(announcements);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching announcements', error: error.message });
  }
};

exports.updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, startDate, endDate, isDefault } = req.body;

    // Get current announcement to check if it's default
    const currentAnnouncement = await Announcement.findById(id);
    if (!currentAnnouncement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Prepare update data
    let updateData = { text, isDefault };

    // If setting as default, skip date validations and don't update dates
    if (isDefault && !currentAnnouncement.isDefault) {
      // Just making it default, keep existing dates
      await Announcement.updateMany({ _id: { $ne: id }, isDefault: true }, { isDefault: false });
      updateData.startDate = currentAnnouncement.startDate;
      updateData.endDate = currentAnnouncement.endDate;
    } else if (!currentAnnouncement.isDefault) {
      // Only update dates if it's not currently a default announcement
      // Validate dates
      if (new Date(startDate) >= new Date(endDate)) {
        return res.status(400).json({ 
          message: 'Start date must be before end date' 
        });
      }
      
      // Check for overlapping announcements (only for non-default)
      if (!isDefault) {
        const overlappingAnnouncement = await Announcement.findOne({
          _id: { $ne: id }, // Exclude current announcement
          isDefault: false,
          $or: [
            { startDate: { $lte: new Date(startDate) }, endDate: { $gte: new Date(startDate) } },
            { startDate: { $lte: new Date(endDate) }, endDate: { $gte: new Date(endDate) } },
            { startDate: { $gte: new Date(startDate) }, endDate: { $lte: new Date(endDate) } }
          ]
        });

        if (overlappingAnnouncement) {
          return res.status(400).json({ 
            message: 'Announcement dates overlap with existing announcement',
            conflictingDates: {
              start: overlappingAnnouncement.startDate,
              end: overlappingAnnouncement.endDate,
              text: overlappingAnnouncement.text
            }
          });
        }
      }
      
      updateData.startDate = startDate;
      updateData.endDate = endDate;
    }

    // If setting as default (and wasn't default before), remove default from others
    if (isDefault && !currentAnnouncement.isDefault) {
      await Announcement.updateMany({ _id: { $ne: id }, isDefault: true }, { isDefault: false });
    }

    const updatedAnnouncement = await Announcement.findByIdAndUpdate(id, updateData, { new: true });

    res.status(200).json({ 
      message: 'Announcement updated successfully', 
      announcement: updatedAnnouncement 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error updating announcement', 
      error: error.message 
    });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if the announcement exists and if it's default
    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    
    // Prevent deletion of default announcement
    if (announcement.isDefault) {
      return res.status(400).json({ 
        message: 'Cannot delete the default announcement. Please set another announcement as default first.' 
      });
    }
    
    await Announcement.findByIdAndDelete(id);
    res.status(200).json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error deleting announcement', 
      error: error.message 
    });
  }
};