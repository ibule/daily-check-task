import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  AlignmentType,
  PageOrientation,
  ShadingType,
  BorderStyle,
  HeightRule,
  PageBreak,
} from 'docx';
import { saveAs } from 'file-saver';
import { DayCard, PrintConfig } from './types';
import { buildDayCards } from './utils';

// A4 dimensions in DXA (1 inch = 1440 DXA)
const A4_W = 11906;
const A4_H = 16838;
const MARGIN = 720; // 0.5 inch

function noBorder() {
  return {
    top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  };
}

function thinBorder() {
  return {
    top: { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB' },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB' },
    left: { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB' },
    right: { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB' },
  };
}

function outerBorder() {
  return {
    top: { style: BorderStyle.SINGLE, size: 12, color: '374151' },
    bottom: { style: BorderStyle.SINGLE, size: 12, color: '374151' },
    left: { style: BorderStyle.SINGLE, size: 12, color: '374151' },
    right: { style: BorderStyle.SINGLE, size: 12, color: '374151' },
  };
}

function buildDayTable(card: DayCard, cellWidth: number): Table {
  const bgColor = card.isWeekend ? 'EBEBEB' : 'F5F5F5';
  const taskColW = Math.floor(cellWidth * 0.6);
  const checkColW = Math.floor((cellWidth - taskColW) / 2);

  const rows: TableRow[] = [];

  // Title row
  rows.push(
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 3,
          borders: outerBorder(),
          shading: { type: ShadingType.CLEAR, color: bgColor, fill: bgColor },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: `${card.displayDate}  ${card.weekdayLabel}`,
                  bold: true,
                  size: 26,
                  font: 'Microsoft YaHei',
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  // Header row
  rows.push(
    new TableRow({
      children: [
        new TableCell({
          width: { size: taskColW, type: WidthType.DXA },
          borders: thinBorder(),
          shading: { type: ShadingType.CLEAR, color: 'FAFAFA', fill: 'FAFAFA' },
          children: [new Paragraph({ children: [new TextRun({ text: '今日任务', bold: true, size: 20, font: 'Microsoft YaHei' })] })],
        }),
        new TableCell({
          width: { size: checkColW, type: WidthType.DXA },
          borders: thinBorder(),
          shading: { type: ShadingType.CLEAR, color: 'FAFAFA', fill: 'FAFAFA' },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '□已完成', bold: true, size: 20, font: 'Microsoft YaHei' })] })],
        }),
        new TableCell({
          width: { size: checkColW, type: WidthType.DXA },
          borders: thinBorder(),
          shading: { type: ShadingType.CLEAR, color: 'FAFAFA', fill: 'FAFAFA' },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '□未完成', bold: true, size: 20, font: 'Microsoft YaHei' })] })],
        }),
      ],
    })
  );

  // Task rows
  if (card.tasks.length === 0) {
    rows.push(
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 3,
            borders: thinBorder(),
            children: [new Paragraph({ children: [new TextRun({ text: '暂无任务', size: 20, italics: true, font: 'Microsoft YaHei', color: 'AAAAAA' })] })],
          }),
        ],
      })
    );
  } else {
    for (let i = 0; i < card.tasks.length; i++) {
      rows.push(
        new TableRow({
          children: [
            new TableCell({
              width: { size: taskColW, type: WidthType.DXA },
              borders: thinBorder(),
              children: [new Paragraph({ children: [new TextRun({ text: `${i + 1}. ${card.tasks[i].name}`, size: 20, font: 'Microsoft YaHei' })] })],
            }),
            new TableCell({
              width: { size: checkColW, type: WidthType.DXA },
              borders: thinBorder(),
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '□', size: 24, font: 'Microsoft YaHei' })] })],
            }),
            new TableCell({
              width: { size: checkColW, type: WidthType.DXA },
              borders: thinBorder(),
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '□', size: 24, font: 'Microsoft YaHei' })] })],
            }),
          ],
        })
      );
    }
  }

  // Notes row
  rows.push(
    new TableRow({
      height: { value: 400, rule: HeightRule.EXACT },
      children: [
        new TableCell({
          columnSpan: 3,
          borders: thinBorder(),
          children: [new Paragraph({ children: [] })],
        }),
      ],
    })
  );

  // Encouragement row
  rows.push(
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 3,
          borders: outerBorder(),
          shading: { type: ShadingType.CLEAR, color: 'FFFBF0', fill: 'FFFBF0' },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: `✨ ${card.encouragement}`, size: 20, color: 'F59E0B', font: 'Microsoft YaHei' })],
            }),
          ],
        }),
      ],
    })
  );

  return new Table({
    width: { size: cellWidth, type: WidthType.DXA },
    columnWidths: [taskColW, checkColW, checkColW],
    rows,
  });
}

function buildDayCell(card: DayCard, cellWidth: number): TableCell {
  const table = buildDayTable(card, cellWidth);
  return new TableCell({
    width: { size: cellWidth, type: WidthType.DXA },
    borders: noBorder(),
    children: [table, new Paragraph({ children: [] })],
  });
}

export async function exportToWord(
  config: PrintConfig,
  onProgress: (pct: number) => void
): Promise<void> {
  const dayCards = buildDayCards(config);
  const isLandscape = config.pageOrientation === 'landscape';
  const n = config.columnsPerRow; // days per page

  const pageW = isLandscape ? A4_H : A4_W;
  const contentW = pageW - MARGIN * 2;
  const gapDXA = 180; // ~3mm gap between columns
  const cellW = Math.floor((contentW - gapDXA * (n - 1)) / n);

  // Group cards into pages of exactly N cards
  const pages: DayCard[][] = [];
  for (let i = 0; i < dayCards.length; i += n) {
    pages.push(dayCards.slice(i, i + n));
  }

  const totalBatches = Math.ceil(pages.length / 5);
  const docChildren: (Table | Paragraph)[] = [];

  for (let b = 0; b < totalBatches; b++) {
    const batchStart = b * 5;
    const batchEnd = Math.min(batchStart + 5, pages.length);

    for (let pi = batchStart; pi < batchEnd; pi++) {
      const pageCards = pages[pi];

      // Build cells for this page
      const cells: TableCell[] = pageCards.map((card) => buildDayCell(card, cellW));

      // Pad with empty cells if the last page has fewer cards
      while (cells.length < n) {
        cells.push(
          new TableCell({
            width: { size: cellW, type: WidthType.DXA },
            borders: noBorder(),
            children: [new Paragraph({ children: [] })],
          })
        );
      }

      // One page = one single-row table of N day cells
      const pageTable = new Table({
        width: { size: contentW, type: WidthType.DXA },
        columnWidths: Array(n).fill(cellW) as number[],
        rows: [new TableRow({ children: cells })],
        borders: {
          top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        },
      });

      docChildren.push(pageTable);

      // Page break after every page except the last
      if (pi < pages.length - 1) {
        docChildren.push(
          new Paragraph({
            children: [new PageBreak()],
          })
        );
      }
    }

    onProgress(Math.round(((b + 1) / totalBatches) * 100));
    await new Promise((r) => setTimeout(r, 0));
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: isLandscape ? A4_H : A4_W,
              height: isLandscape ? A4_W : A4_H,
              orientation: isLandscape ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT,
            },
            margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
          },
        },
        children: docChildren,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const name = config.name || '打卡表';
  saveAs(blob, `${name}_打卡表_${config.startDate}_${config.endDate}.docx`);
}
