const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const registerUser = async (req, res) => {
    try {
        const { username, email, password, full_name, contact_number, address } = req.body;

        const hashed = await bcrypt.hash(password, 10);

        const user = await User.create({ 
          username, 
          email, 
          password: hashed, 
          full_name, 
          contact_number, 
          address 
        });
        res.status(201).json({ success: true, message: 'Registered successfully', user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email, is_active: 1 } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    await user.update({ token });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({ attributes: { exclude: ['password'] } });
        res.json({ success: true, users });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        await User.update({ role }, { where: { user_id: req.params.id } });
        res.json({ success: true, message: 'Role updated' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const deactivateUser = async (req, res) => {
    try {
        await User.update({ is_active: 0 }, { where: { user_id: req.params.id } });
        res.json({ success: true, message: 'User deactivated' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const restoreUser = async (req, res) => {
    try {
        await User.update(
            { is_active: 1 },
            { where: { user_id: req.params.id } }
        );

        res.json({ success: true, message: 'User restored' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const logoutUser = async (req, res) => {
  try {
    const userId = req.user.user_id;

    await User.update(
      { token: null },
      { where: { user_id: userId } }
    );

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.user_id, {
            attributes: { exclude: ['password', 'token'] }
        });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { full_name, contact_number, address, current_password, new_password } = req.body;
        const user = await User.findByPk(req.user.user_id);

        const updateData = { full_name, contact_number, address };

        // Update profile picture if uploaded
        if (req.file) {
            updateData.profile_picture = req.file.filename;
        }

        // Update password if provided
        if (current_password && new_password) {
            const match = await bcrypt.compare(current_password, user.password);
            if (!match) {
                return res.status(401).json({ success: false, message: 'Current password is incorrect!' });
            }
            updateData.password = await bcrypt.hash(new_password, 10);
        }

        await user.update(updateData);

        res.json({ success: true, message: 'Profile updated successfully!' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const checkUsername = async (req, res) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({ where: { username } });
        res.json({ exists: !!user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const checkEmail = async (req, res) => {
    try {
        const { email } = req.params;
        const user = await User.findOne({ where: { email } });
        res.json({ exists: !!user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getAllUsers,
    updateUserRole,
    deactivateUser,
    restoreUser,
    logoutUser,
    getProfile,
    updateProfile,
    checkUsername,
    checkEmail
};

