 const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const userSchema = new mongoose.Schema({
//   fullName: {
//     type: String,
//     required: true,
//   },
//   email: {
//     type: String,
//     required: true,
//     unique: true,
//   },
//   password: {
//     type: String,
//     required: true,
//   },
// });

// userSchema.pre('save', async function (next) {
//   if (this.isModified('password') || this.isNew) {
//     const salt = await bcrypt.genSalt(10);
//     this.password = await bcrypt.hash(this.password, salt);
//   }
//   next();
// });

// userSchema.methods.comparePassword = async function (password) {
//   return await bcrypt.compare(password, this.password);
// };

// module.exports = mongoose.model('User', userSchema);

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
});

// Remove bcrypt password hashing from the 'pre' save hook
// This will store the password directly in the database

// Method to compare password (you can now directly compare the raw passwords)
userSchema.methods.comparePassword = async function (password) {
  // No hashing involved, so just compare plain text
  return password === this.password;
};

module.exports = mongoose.model('User', userSchema);
