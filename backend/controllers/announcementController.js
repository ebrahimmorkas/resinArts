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

    if (isDefault) {
      await Announcement.updateMany({ _id: { $ne: id }, isDefault: true }, { isDefault: false });
    }

    const updatedAnnouncement = await Announcement.findByIdAndUpdate(id, { text, startDate, endDate, isDefault }, { new: true });

    if (!updatedAnnouncement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    res.status(200).json({ message: 'Announcement updated successfully', announcement: updatedAnnouncement });
  } catch (error) {
    res.status(500).json({ message: 'Error updating announcement', error: error.message });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findByIdAndDelete(id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    res.status(200).json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting announcement', error: error.message });
  }
};