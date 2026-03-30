import puppeteer from 'puppeteer';
import fs from 'fs';

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();

// 最小测试：用 @media print 的 break-after:page
await page.setContent(`
  <style>
    @media print { .pb { break-after: page; page-break-after: always; } }
  </style>
  <div>Page 1</div><div class="pb"></div>
  <div>Page 2</div><div class="pb"></div>
  <div>Page 3</div><div class="pb"></div>
  <div>Page 4</div>
`);

const pdf = await page.pdf({ format: 'A4' });
fs.writeFileSync('/tmp/debug.pdf', pdf);

// 用 Buffer 的 indexOf 搜字节序列
function countBytesOf(buf, searchStr) {
  const needle = Buffer.from(searchStr, 'latin1');
  let count = 0, pos = 0;
  while ((pos = buf.indexOf(needle, pos)) !== -1) { count++; pos++; }
  return count;
}

const pageCount1 = countBytesOf(pdf, '/Type /Page');   // 带空格
const pageCount2 = countBytesOf(pdf, '/Type/Page');    // 不带空格（两种都数）
const pagesCount  = countBytesOf(pdf, '/Type /Pages'); // 页面树（应该是1）
const pagesCount2 = countBytesOf(pdf, '/Type/Pages');
const countField  = countBytesOf(pdf, '/Count ');

// 也搜 /Count N
const pdfStr = pdf.toString('latin1');
const allCounts = [...pdfStr.matchAll(/\/Count\s+(\d+)/g)].map(m => `${m[1]}`);

console.log('PDF bytes:', pdf.length);
console.log('/Type /Page  (带空格):', pageCount1);
console.log('/Type/Page   (无空格):', pageCount2);
console.log('/Type /Pages (应为1):', pagesCount);
console.log('/Type/Pages         :', pagesCount2);
console.log('/Count N 字段:', allCounts);

// 提取 /Count 值（页面树总数）
const totalPages = parseInt(allCounts[0] || '0');
console.log('\n实际 PDF 页数 (via /Count):', totalPages || '未找到');
console.log('期望: 4 页');

// 也把 PDF 存下来供手动检查
console.log('\nPDF 已保存到 /tmp/debug.pdf，可用 open /tmp/debug.pdf 手动验证');

await browser.close();
