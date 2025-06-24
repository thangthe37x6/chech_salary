import express from "express";
const routesUser = express.Router()
import { authMiddleware } from "../middleware/auth.js";
import Salary from '../models/model_salary.js'

routesUser.get('/user',authMiddleware, (req, res) => {
  res.render('user');
});
routesUser.get('/api/pay-periods',authMiddleware, async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) {
      return res.status(400).json({ error: 'Thiếu month hoặc year' });
    }

    const periods = await Salary.find({ 'payPeriod.month': +month, 'payPeriod.year': +year })
      .distinct('payPeriod.batch');

    res.json(periods.sort((a, b) => a - b));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});
routesUser.get('/api/salary',authMiddleware, async (req, res) => {
  try {
    const username_ = req.user.username;
    const { month, year, batch, name } = req.query;
    if (!month || !year || !batch || !name) {
      return res.status(400).json({ error: 'Thiếu dữ liệu' });
    }

    const lowerName = name.trim().toLowerCase();

    // Tìm trực tiếp trong MongoDB theo tên lowercase
    const salary = await Salary.findOne({
      'payPeriod.month': +month,
      'payPeriod.year': +year,
      'payPeriod.batch': +batch,
      'salaryDetails.Họ và tên': lowerName  // 👈 Tên cột chính xác từ Excel
    });

    if (!salary) return res.json({ salary: null});

    res.json({ salary , username:username_ });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

routesUser.post('/logout', (req, res) => {
  res.clearCookie('token'); // hoặc tên cookie chứa JWT bạn dùng
  res.redirect('/login');   // hoặc bất kỳ trang nào sau khi đăng xuất
});


export default routesUser