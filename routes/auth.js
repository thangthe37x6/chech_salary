import express from "express";
import Users from "../models/Users.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

router.get('/login', (req, res) => {
  res.clearCookie('token');
  res.render('login', { message: "Nếu bạn quên mật khẩu liện hệ quản lý của bạn" });
});

router.get('/register', (req, res) => {
  res.clearCookie('token');
  res.render('register', { message: 'Lưu ý: mật khẩu chỉ được đặt một lần và sẽ không thể đổi' });
});

router.post('/register', async (req, res) => {
  const { username,  password } = req.body;
  try {
    const existingUser = await Users.findOne({ username });
    if (existingUser) {
      return res.render('register', { message: 'Username already exists' });
    }

    const user = new Users({ username, password });
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
    const user = await Users.findOne({ username });
    if (!user || !password) {
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


export default router;
