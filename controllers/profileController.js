const { User, WebsiteAnalysis } = require('../models');
const bcrypt = require('bcryptjs');

const updateProfile = async (req, res) => {
  try {
    const { username } = req.body;
    const userId = req.user.id;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Check if username is taken by another user
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser && existingUser.id !== userId) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    await User.update({ username }, { where: { id: userId } });

    res.json({ message: 'Username updated successfully', user: { username } });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid current password' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.update({ password: hashedPassword }, { where: { id: userId } });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update Password Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const avatarUrl = `/uploads/${req.file.filename}`;
    await User.update({ avatar: avatarUrl }, { where: { id: req.user.id } });

    res.json({ message: 'Avatar uploaded successfully', avatar: avatarUrl });
  } catch (error) {
    console.error('Upload Avatar Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Delete user's analyses first (optional if DB cascade is set, but good practice)
    await WebsiteAnalysis.destroy({ where: { userId } });
    await User.destroy({ where: { id: userId } });

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete Account Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = { updateProfile, updatePassword, uploadAvatar, deleteAccount };