const mongoose = require('mongoose');

const courseEnrollmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  courseName: {
    type: String,
    required: true,
  },
  courseAmount: {
    type: Number,
    required: true,
  },
  registrationAmount: {
    type: Number,
    required: true,
  },
  enrolledAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('CourseEnrollment', courseEnrollmentSchema);
