import XlsxPopulate from 'xlsx-populate';
const workbook = await XlsxPopulate.fromFileAsync("./test.xlsx");
const sheet = workbook.sheet(0);
const data = sheet.usedRange().value();

const [headerRow, ...rows] = data;

for (const row of rows) {
  const nameCell = row[1]; // Cột 2 = Họ và tên
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
    ebonusTCTy1: Math.round(Number(row[14]) || 0),    // 👈 xử lý cột trùng ở vị trí khác
    ebonusCT1: Math.round(Number(row[15]) || 0),
    tax: Math.round(Number(row[16]) || 0),
    // Nếu muốn: thuchi: Math.round(Number(row[17]) || 0)
  };

  console.log(salaryDetails);
  break; // chỉ in 1 dòng hợp lệ
}
