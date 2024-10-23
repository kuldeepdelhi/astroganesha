// const express = require('express');
// const User = require('../models/User');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const router = express.Router();

// const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';


// router.post('/signup', async (req, res) => {
//   const { fullName, email, password } = req.body;

//   const existingUser = await User.findOne({ email });
//   if (existingUser) {
//     return res.status(400).json({ message: 'User already exists' });
//   }

//   try {
//     const newUser = new User({ fullName, email, password });
//     await newUser.save();
//     res.status(201).json({ message: 'User created successfully' });
//   } catch (error) {
//     res.status(500).json({ message: 'Error creating user', error });
//   }
// });

// router.post('/login', async (req, res) => {
//   const { email, password } = req.body;

//   const user = await User.findOne({ email });
//   if (!user) {
//     return res.status(400).json({ message: 'User not found' });
//   }

//   const isMatch = await user.comparePassword(password);
//   if (!isMatch) {
//     return res.status(400).json({ message: 'Invalid credentials' });
//   }

//   const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
//   res.status(200).json({ message: 'Login successful', token });
// });
const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer'); // For sending emails
const router = express.Router();
const CourseEnrollment = require('../models/CourseEnrollment'); 
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const RESET_TOKEN_SECRET = process.env.RESET_TOKEN_SECRET || 'your_reset_token_secret';


const transporter = nodemailer.createTransport({
  service: 'Gmail', 
  auth: {
    user: "raman12106@gmail.com",
    pass: "qhbeozoppsqxxett"
  },
});

router.post('/signup', async (req, res) => {
  const { fullName, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: 'User already exists' });
  }

  try {
    const newUser = new User({ fullName, email, password });
    await newUser.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error });
  }
});


router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: 'User not found' });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
  res.status(200).json({ message: 'Login successful', token });
});


router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; 

  
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = resetTokenExpiry;
    await user.save();

    
    const resetLink = `https://astropathways.com/resetPassword?token=${resetToken}`;
    const mailOptions = {
      to: email,
      from: 'raman12106@gmail.com',
      subject: 'Password Reset Request',
      text: `You requested a password reset. Please use the following link to reset your password: ${resetLink}`,
    };
    
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Password reset link sent to email' });
  } catch (error) {
    res.status(500).json({ message: 'Error generating reset link', error });
  }
});

router.post('/resetPassword', async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    // Find user with the token and check expiry
    const user = await User.findOne({
      resetPasswordToken: token,  // Ensure this token matches
      resetPasswordExpiry: { $gt: Date.now() }, // Ensure the token has not expired
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Hash new password and save the user
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    // Clear the reset token fields after resetting the password
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error("Error resetting password:", error);  // Log the error for debugging
    res.status(500).json({ message: 'Error resetting password', error });
  }
});

// ENROLLMENT CHECK AND SAVE
router.post('/enroll', async (req, res) => {
  const { name, email, phone, courseName, courseAmount, registrationAmount } = req.body;

  try {
    // Check if the user already exists
    let user = await User.findOne({ email });

    if (!user) {
      // If the user doesn't exist, create a new user
      const hashedPassword = await bcrypt.hash('default-password', 10); // Hash a default password
      user = new User({ fullName: name, email, phone, password: hashedPassword });
      await user.save();
    }

    // Check if the user is already enrolled in the same course
    const existingEnrollment = await CourseEnrollment.findOne({ userId: user._id, courseName });
    if (existingEnrollment) {
      return res.status(400).json({ message: 'User is already enrolled in this course' });
    }

    // Save course enrollment details in CourseEnrollment collection
    const newEnrollment = new CourseEnrollment({
      userId: user._id,
      courseName,
      courseAmount,
      registrationAmount,
    });
    await newEnrollment.save();

    // Log the user in (create a JWT token)
    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

    return res.status(200).json({
      message: 'Enrollment successful, proceed to payment',
      token,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error enrolling user', error });
  }
});
// Check if user already exists by email
router.get('/enroll', async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const user = await User.findOne({ email });
    if (user) {
      return res.status(200).json({ exists: true }); // User exists
    } else {
      return res.status(404).json({ exists: false }); // User does not exist
    }
  } catch (error) {
    console.error('Error checking user existence:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});



module.exports = router;