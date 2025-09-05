const Announcement = require('../models/Announcement');

exports.add = async (req, res) => {
  try {
    const { text, startDate, endDate, isDefault } = req.body;

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
    res.status(201).json({ message: 'Announcement added successfully', announcement: newAnnouncement });
  } catch (error) {
    res.status(500).json({ message: 'Error adding announcement', error: error.message });
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