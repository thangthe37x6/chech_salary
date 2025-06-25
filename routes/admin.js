import express from "express";
const routesAdmin = express.Router();
import multer from "multer";
import XlsxPopulate from 'xlsx-populate';
import Salary from '../models/model_salary.js'
import Users from '../models/Users.js'
import { authMiddleware, requireAdmin } from "../middleware/auth.js";
import fs from 'fs'


const upload = multer({ dest: 'public/uploads/' });
routesAdmin.get('/admin',authMiddleware, requireAdmin,  async (req, res) => {
  res.render('admin', { message: null })
})

routesAdmin.get('/admin/salary',authMiddleware, requireAdmin,  async (req, res) => {
  try {
    const { month, year, batch } = req.query;
    if (!month || !year || !batch) {
      return res.status(400).json({ error: 'Thiếu dữ liệu' });
    }

    const salary = await Salary.find({
      'payPeriod.month': +month,
      'payPeriod.year': +year,
      'payPeriod.batch': +batch,
    });

    if (!salary) return res.json({ salary: null });

    res.json({ salary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});
routesAdmin.get('/admin/pay-periods',authMiddleware, requireAdmin,  async (req, res) => {
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
routesAdmin.post('/import', authMiddleware, requireAdmin, upload.single('excelFile'), async (req, res) => {
  try {
    const now = new Date();
    const year = parseInt(req.body.year);
    const month = parseInt(req.body.month);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      throw new Error("Dữ liệu tháng/năm không hợp lệ");
    }

    const latestBatch = await Salary
      .findOne({ 'payPeriod.year': year, 'payPeriod.month': month })
      .sort({ 'payPeriod.batch': -1 })
      .select('payPeriod.batch');

    const batch = latestBatch ? latestBatch.payPeriod.batch + 1 : 1;

    const workbook = await XlsxPopulate.fromFileAsync(req.file.path);
    const sheet = workbook.sheet(0);
    const data = sheet.usedRange().value();
    const [header, ...rows] = data;

    const nameIndex = header.findIndex(h => typeof h === 'string' && h.trim().toLowerCase() === 'họ và tên');
    if (nameIndex === -1) throw new Error("Không tìm thấy cột 'họ và tên' trong file Excel");

    const sanitizeKey = (key) => key.trim().replace(/\./g, '_');

    const docs = [];

    for (const row of rows) {
      const nameCell = row[nameIndex];
      if (typeof nameCell !== 'string' || nameCell.trim() === '') continue;

      const salaryDetails = {};

      for (let i = 0; i < header.length; i++) {
        const key = header[i];
        if (typeof key !== 'string') continue;

        const cleanedKey = sanitizeKey(key);
        const value = row[i];
        salaryDetails[cleanedKey] = (typeof value === 'number') ? Math.round(value) : (value ?? null);
      }

      docs.push({
        payPeriod: { year, month, batch },
        createdAt: now,
        salaryDetails
      });
    }

    if (docs.length > 0) {
      await Salary.insertMany(docs);
    }

    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.log("===> File upload:", req.file.path);
    res.redirect("/admin");

  } catch (error) {
    console.error(error);
    res.status(500).render('admin', {
      message: 'Lỗi khi tải dữ liệu',
      latestSalaries: []
    });
  }
});


routesAdmin.post('/logout', (req, res) => {
  res.clearCookie('token'); // hoặc tên cookie chứa JWT bạn dùng
  res.redirect('/login');   // hoặc bất kỳ trang nào sau khi đăng xuất
});
routesAdmin.post('/admin/delete-salary',authMiddleware, requireAdmin,  async (req, res) => {
  const { month, year, batch } = req.body;
  try {
    await Salary.deleteMany({
      'payPeriod.month': parseInt(month),
      'payPeriod.year': parseInt(year),
      'payPeriod.batch': parseInt(batch),
    });
    res.redirect('/admin?message=Đã xóa bảng lương đợt đó');
  } catch (error) {
    console.error(error);
    res.redirect('/admin?message=Lỗi khi xóa bảng lương');
  }
});

routesAdmin.get('/m-account', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const search = req.query.search || '';
    const accounts = await Users.find({ username: { $regex: search, $options: 'i' } });
    res.render('manager_account', { accounts, search });
  } catch (error) {
    res.json("lỗi hệ thống");
    console.log(error)
  }
})

routesAdmin.post('/m-account/add', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { code, password } = req.body;
    const newAccount = new Users({ username: code, password });
    await newAccount.save();
    res.redirect('/m-account');
  } catch (error) {
    res.json("lỗi hệ thống");
    console.log(error)
  }
})

routesAdmin.post('/m-account/delete/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    await Users.findByIdAndDelete(req.params.id);
    res.redirect('/m-account');
  } catch (error) {
    res.json("lỗi hệ thống");
    console.log(error)
  }
})

export default routesAdmin;