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
  PageBreak,
} from 'docx';
import { saveAs } from 'file-saver';
import { DayCard, PrintConfig } from './types';
import { buildDayCards } from './utils';

// A4 dimensions in DXA (1 inch = 1440 DXA)
const A4_W = 11906;
const A4_H = 16838;
const H_MARGIN = 227; // ~4mm
const V_MARGIN = 680; // ~12mm
const TWO_COL_MIN_GAP = 900; // ~15.9mm, 5x of previous ~3mm gap

function getTwoColLayout(contentW: number) {
  const idealCellW = Math.floor((contentW - TWO_COL_MIN_GAP) / 2);
  const idealGapW = contentW - idealCellW * 2;

  if (idealGapW >= TWO_COL_MIN_GAP) {
    return { cellW: idealCellW, gapW: idealGapW };
  }

  const cellW = Math.floor((contentW - TWO_COL_MIN_GAP) / 2);
  return { cellW, gapW: contentW - cellW * 2 };
}

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

function buildDayTable(card: DayCard, cellWidth: number, fixedTaskRows: number): Table {
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
  for (let i = 0; i < fixedTaskRows; i++) {
    const task = card.tasks[i];
    const showEmptyState = !task && card.tasks.length === 0 && fixedTaskRows === 1;

    rows.push(
      new TableRow({
        children: [
          new TableCell({
            width: { size: taskColW, type: WidthType.DXA },
            borders: thinBorder(),
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: task ? `${i + 1}. ${task.name}` : showEmptyState ? '暂无任务' : ' ',
                    size: 20,
                    italics: showEmptyState,
                    font: 'Microsoft YaHei',
                    color: showEmptyState ? 'AAAAAA' : '000000',
                  }),
                ],
              }),
            ],
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

function buildDayCell(card: DayCard, cellWidth: number, fixedTaskRows: number): TableCell {
  const table = buildDayTable(card, cellWidth, fixedTaskRows);
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
  const fixedTaskRows = Math.max(dayCards.reduce((max, card) => Math.max(max, card.tasks.length), 0), 1);
  const isLandscape = config.pageOrientation === 'landscape';
  const n = config.columnsPerRow; // days per page

  const pageW = isLandscape ? A4_H : A4_W;
  const contentW = pageW - H_MARGIN * 2;
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
      const pageCardCount = Math.max(pageCards.length, 1);

      const pageTable =
        pageCardCount === 1
          ? new Table({
              width: { size: contentW, type: WidthType.DXA },
              columnWidths: [contentW],
              rows: [
                new TableRow({
                  children: [buildDayCell(pageCards[0], contentW, fixedTaskRows)],
                }),
              ],
              borders: {
                top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              },
            })
          : pageCardCount === 2
          ? (() => {
              const { cellW: twoColCellW, gapW } = getTwoColLayout(contentW);
              const leftCell = pageCards[0]
                ? buildDayCell(pageCards[0], twoColCellW, fixedTaskRows)
                : new TableCell({
                    width: { size: twoColCellW, type: WidthType.DXA },
                    borders: noBorder(),
                    children: [new Paragraph({ children: [] })],
                  });
              const rightCell = pageCards[1]
                ? buildDayCell(pageCards[1], twoColCellW, fixedTaskRows)
                : new TableCell({
                    width: { size: twoColCellW, type: WidthType.DXA },
                    borders: noBorder(),
                    children: [new Paragraph({ children: [] })],
                  });

              return new Table({
                width: { size: contentW, type: WidthType.DXA },
                columnWidths: [twoColCellW, gapW, twoColCellW],
                rows: [
                  new TableRow({
                    children: [
                      leftCell,
                      new TableCell({
                        width: { size: gapW, type: WidthType.DXA },
                        borders: noBorder(),
                        children: [new Paragraph({ children: [] })],
                      }),
                      rightCell,
                    ],
                  }),
                ],
                borders: {
                  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                  insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                },
              });
            })()
          : (() => {
              const cells: TableCell[] = pageCards.map((card) => buildDayCell(card, cellW, fixedTaskRows));

              return new Table({
                width: { size: contentW, type: WidthType.DXA },
                columnWidths: Array(pageCardCount).fill(cellW) as number[],
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
            })();

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
            margin: { top: V_MARGIN, bottom: V_MARGIN, left: H_MARGIN, right: H_MARGIN },
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
