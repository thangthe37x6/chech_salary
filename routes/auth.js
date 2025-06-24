import express from "express";
import User from "../models/Users.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

router.get('/login', (req, res) => {
  res.clearCookie('token');
  res.render('login', { message: null });
});

router.get('/register', (req, res) => {
  res.clearCookie('token');
  res.render('register', { message: null });
});

router.post('/register', async (req, res) => {
  const { username,email,  password } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.render('register', { message: 'Username already exists' });
    }

    const user = new User({ username, email, password });
    await user.save();

    res.render('login', { message: 'Registration successful! Please login.' });
  } catch (error) {
    console.error(error);
    res.render('register', { message: 'Error during registration' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password))) {
      return res.render('login', { message: 'Invalid username or password' });
    }

    const isAdmin = user.username === "admin";

    const token = jwt.sign(
      {username: user.username, id: user._id, role: isAdmin ? "admin" : "user" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', 
      maxAge: 60 * 60 * 1000
    });

    res.redirect(isAdmin  ? "/admin" : "/user");
  } catch (error) {
    console.error(error);
    res.render('login', { message: 'Error during login' });
  }
});
router.get('/forgot', (req, res) => {
  res.render('forgot', { message: null });
});

router.post('/forgot', async (req, res) => {
  const { username,email, newPassword } = req.body;

  try {
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.render('forgot', { message: "Không tìm thấy tên người dùng này." });
    }
    if (user.email !== email) {
      res.render('forgot', { message: "bạn cần nhập đúng email đăng ký tài khoản" });
    } 
    user.password = newPassword;
    await user.save();

    res.redirect('/login');
  } catch (error) {
    console.error("❌ Lỗi khi reset mật khẩu:", error);
    res.render('forgot', { message: "Lỗi hệ thống." });
  }
});

export default router;
