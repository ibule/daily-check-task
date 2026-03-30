import puppeteer from 'puppeteer';
import fs from 'fs';
import { execSync } from 'child_process';

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();

// 导航到 app，写入完整 50 天 / 1 任务配置到 localStorage
await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
await page.evaluate(() => {
  const fullConfig = {
    state: {
      config: {
        name: '测试',
        startDate: '2026-03-27',
        endDate: '2026-05-15',          // 50 天
        taskConfig: {
          mode: 'unified',
          tasks: [{ id: 'task1', name: '每日打卡' }],  // 1 条任务
        },
        encouragements: ['继续加油！'],
        columnsPerRow: 2,               // 2列 → 50÷2 = 25页
        pageOrientation: 'portrait',
      },
      showFullPreview: true,
    },
    version: 0,
  };
  localStorage.setItem('daily-check-config', JSON.stringify(fullConfig));
});

await page.reload({ waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 1000));

// DOM 验证
const domInfo = await page.evaluate(() => ({
  dayRows: document.querySelectorAll('.day-row').length,
  pageBreaks: document.querySelectorAll('.page-break').length,
  configText: document.querySelector('p.text-xs')?.textContent?.trim(),
  lastHint: [...document.querySelectorAll('.no-print')]
    .filter(el => /第 \d+ 页/.test(el.textContent))
    .map(el => el.textContent.trim()).at(-1),
}));
console.log('DOM 验证:', JSON.stringify(domInfo, null, 2));

// 生成 PDF
const pdfBuffer = await page.pdf({
  format: 'A4',
  margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
  printBackground: false,
});
const pdfPath = '/tmp/test-50days.pdf';
fs.writeFileSync(pdfPath, pdfBuffer);
console.log(`\nPDF 大小: ${(pdfBuffer.length / 1024).toFixed(0)} KB`);

// 用 strings 命令解析页数（可靠）
const pdfStrings = execSync(`strings "${pdfPath}"`).toString();
// PDF 页面树中可能有多个 /Count（中间节点+根节点），取最大值为总页数
const allCounts = [...pdfStrings.matchAll(/\/Count (\d+)/g)].map(m => parseInt(m[1]));
const pdfPageCount = allCounts.length > 0 ? Math.max(...allCounts) : 0;

console.log(`PDF /Count 所有值: [${allCounts.join(', ')}]`);
console.log(`PDF 总页数 (最大 /Count): ${pdfPageCount}`);
console.log(`\n====== 最终结果 ======`);
console.log(`配置: 50天 × 1任务 × 2列/页`);
console.log(`预期 PDF 页数: ${domInfo.dayRows}`);
console.log(`实际 PDF 页数: ${pdfPageCount}`);
if (pdfPageCount === domInfo.dayRows) {
  console.log(`✅ 通过！PDF ${pdfPageCount} 页 = 预览 ${domInfo.dayRows} 页`);
} else {
  console.log(`❌ 不一致：PDF ${pdfPageCount} 页 ≠ 预览 ${domInfo.dayRows} 页`);
}
console.log(`\nPDF 文件: ${pdfPath}  （可运行 open ${pdfPath} 手动查看）`);

await browser.close();
