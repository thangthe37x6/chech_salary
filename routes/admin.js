import express from "express";
const routesAdmin = express.Router();
import multer from "multer";
import XlsxPopulate from 'xlsx-populate';
import Salary from '../models/model_salary.js'
import { authMiddleware, requireAdmin } from "../middleware/auth.js";
import fs from 'fs'


const upload = multer({ dest: 'public/uploads/' });

routesAdmin.get('/admin', async (req, res) => {
  try {
    // 🔍 Tìm bản ghi lương mới nhất
    const latest = await Salary
      .findOne()
      .sort({ 'payPeriod.year': -1, 'payPeriod.month': -1, 'payPeriod.batch': -1 })
      .lean();

    let latestSalaries = [];

    if (latest?.payPeriod) {
      const { year, month, batch } = latest.payPeriod;

      // 📦 Lấy toàn bộ bảng lương thuộc đợt đó
      const raw = await Salary.find({
        'payPeriod.year': year,
        'payPeriod.month': month,
        'payPeriod.batch': batch
      }).lean();

      latestSalaries = raw.map(entry => {
        const d = entry.salaryDetails;

        return {
          name: d.name,
          commission: d.commission,
          payout1: d.payout1,
          payout2: d.payout2,
          payout3: d.payout3,
          payout4: d.payout4,
          payout5: d.payout5,
          payout6: d.payout6,
          extracommission: d.extracommission,
          ebonusTCTy: d.ebonusTCTy,
          ebonusCT: d.ebonusCT,
          Compensation: d.Compensation,
          extrasalary: d.extrasalary,
          ebonusTCTy1: d.ebonusTCTy1,
          ebonusCT1: d.ebonusCT1,
          tax: d.tax,
          actualcost: d.actualcost,
        };
      });
    }

    res.render('admin', {
      latestSalaries,
      message: null
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('admin', {
      latestSalaries: [],
      message: 'Lỗi khi tải dữ liệu'
    });
  }
});

routesAdmin.post('/import', upload.single('excelFile'), async (req, res) => {
  try {
    
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const latestBatch = await Salary
      .findOne({ 'payPeriod.year': year, 'payPeriod.month': month })
      .sort({ 'payPeriod.batch': -1 })
      .select('payPeriod.batch');

    const batch = latestBatch ? latestBatch.payPeriod.batch + 1 : 1;

    const workbook = await XlsxPopulate.fromFileAsync(req.file.path);
    const sheet = workbook.sheet(0);
    const data = sheet.usedRange().value();
    const [header, ...rows] = data;
    console.log("🧪 Tổng số dòng:", rows.length);
    console.log("🧪 Dòng đầu tiên:", rows[0]);
    const docs = [];

    for (const row of rows) {
      const nameCell = row[1];
      if (typeof nameCell !== 'string' || nameCell.trim() === '') continue;

      const salaryDetails = {
        name: nameCell.trim().toLowerCase(),
        commission: Math.round(Number(row[2]) || 0),
        payout1: Math.round(Number(row[3]) || 0),
        payout2: Math.round(Number(row[4]) || 0),
        payout3: Math.round(Number(row[5]) || 0),
        payout4: Math.round(Number(row[6]) || 0),
        payout5: Math.round(Number(row[7]) || 0),
        payout6: Math.round(Number(row[8]) || 0),
        extracommission: Math.round(Number(row[9]) || 0),
        ebonusTCTy: Math.round(Number(row[10]) || 0),
        ebonusCT: Math.round(Number(row[11]) || 0),
        compensation: Math.round(Number(row[12]) || 0),
        extrasalary: Math.round(Number(row[13]) || 0),
        ebonusTCTy1: Math.round(Number(row[14]) || 0),
        ebonusCT1: Math.round(Number(row[15]) || 0),
        tax: Math.round(Number(row[16]) || 0),
        actualcost: Math.round(Number(row[17]) || 0),
      };
      console.log("🧪 salaryDetails:", salaryDetails);
      docs.push({
        payPeriod: { year, month, batch },
        createdAt: now,
        salaryDetails
      });
      console.log("🧪 Tổng số bản ghi chuẩn bị lưu:", docs.length);
    }
   
    if (docs.length > 0) {
      await Salary.insertMany(docs);
    }

    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.log("===> File upload:", req.file.path);
    res.redirect("/admin")

  } catch (error) {
    console.error(error);
    res.status(500).status(500).render('admin', {
      message: 'Lỗi khi tải dữ liệu',
      latestSalaries: []
    });;
  }

});

routesAdmin.post('/logout', (req, res) => {
  res.clearCookie('token'); // hoặc tên cookie chứa JWT bạn dùng
  res.redirect('/login');   // hoặc bất kỳ trang nào sau khi đăng xuất
});


export default routesAdmin;