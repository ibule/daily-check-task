import { DayCard } from '../types';

interface Props {
  card: DayCard;
  columnsPerRow: 1 | 2 | 3;
  orientation: 'portrait' | 'landscape';
  fixedTaskRows: number;
}

interface S {
  df: number;   // date font-size
  wf: number;   // weekday font-size
  hp: string;   // header padding
  cw: number;   // checkbox column width (px)
  tf: number;   // table header font-size
  tp: string;   // table header cell padding
  rf: number;   // task row font-size
  rp: string;   // task row padding
  bs: number;   // checkbox box size
  cp: string;   // cheer padding
  cf: number;   // cheer font-size
}

function getSize(cols: 1 | 2 | 3, orient: 'portrait' | 'landscape'): S {
  if (cols === 1 && orient === 'portrait')
    return { df:34, wf:15, hp:'20px 12px 14px', cw:100, tf:13, tp:'8px 0 8px 16px', rf:16, rp:'10px 6px 10px 16px', bs:18, cp:'14px', cf:15 };
  if (cols === 1 && orient === 'landscape')
    return { df:30, wf:14, hp:'18px 10px 12px', cw:90,  tf:12, tp:'7px 0 7px 14px',  rf:15, rp:'9px 6px 9px 14px',   bs:16, cp:'11px', cf:14 };
  if (cols === 2 && orient === 'portrait')
    return { df:24, wf:13, hp:'14px 8px 10px',  cw:72,  tf:11, tp:'5px 0 5px 10px',  rf:13, rp:'5px 4px 5px 10px',  bs:13, cp:'8px',  cf:12 };
  if (cols === 2 && orient === 'landscape')
    return { df:26, wf:13, hp:'15px 8px 10px',  cw:82,  tf:12, tp:'6px 0 6px 12px',  rf:14, rp:'6px 4px 6px 12px',  bs:15, cp:'9px',  cf:13 };
  if (cols === 3 && orient === 'portrait')
    return { df:18, wf:11, hp:'10px 6px 7px',   cw:56,  tf:10, tp:'4px 0 4px 8px',   rf:11, rp:'4px 3px 4px 8px',   bs:11, cp:'5px',  cf:10 };
  // landscape 3-col
  return   { df:20, wf:11, hp:'11px 6px 8px',   cw:62,  tf:10, tp:'4px 0 4px 8px',   rf:12, rp:'5px 3px 5px 8px',   bs:12, cp:'6px',  cf:11 };
}

export default function DayCardView({ card, columnsPerRow, orientation, fixedTaskRows }: Props) {
  const s = getSize(columnsPerRow, orientation);
  const totalRows = Math.max(fixedTaskRows, 1);

  return (
    <div
      className="day-card"
      style={{
        border: '1.5px solid #1a1a1a',
        borderRadius: '8px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
      }}
    >
      {/* ── Header: white bg, large bold black date ── */}
      <div
        style={{
          background: '#fff',
          textAlign: 'center',
          padding: s.hp,
          borderBottom: '2px solid #1a1a1a',
          flexShrink: 0,
        }}
      >
        <div style={{ fontWeight: 900, fontSize: s.df, letterSpacing: '1px', color: '#111', lineHeight: 1.1 }}>
          {card.displayDate}
        </div>
        <div style={{ fontSize: s.wf, color: '#666', letterSpacing: '1px', marginTop: '4px', fontWeight: 500 }}>
          {card.weekdayLabel}
        </div>
      </div>

      {/* ── Task grid — flex:1 fills available card height ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `1fr ${s.cw}px ${s.cw}px`,
          gridTemplateRows: `auto repeat(${totalRows}, minmax(0, 1fr))`,
          flex: 1,
          overflow: 'hidden',
        }}
      >
        {/* Table header */}
        <div style={{ background: '#f2f2f2', fontWeight: 600, fontSize: s.tf, color: '#555', padding: s.tp, borderBottom: '1px solid #ddd', display: 'flex', alignItems: 'center' }}>
          今日任务
        </div>
        <div style={{ background: '#f2f2f2', fontWeight: 600, fontSize: s.tf, color: '#555', borderBottom: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          □ 已完成
        </div>
        <div style={{ background: '#f2f2f2', fontWeight: 600, fontSize: s.tf, color: '#555', borderBottom: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          □ 未完成
        </div>

        {/* Task rows */}
        {Array.from({ length: totalRows }).map((_, i) => {
          const task = card.tasks[i];
          const isEmpty = !task;
          const showEmptyState = isEmpty && card.tasks.length === 0 && totalRows === 1;

          return (
            <div key={`row-${card.isoDate}-${i}`} style={{ display: 'contents' }}>
              <div
                style={{
                  padding: s.rp,
                  fontSize: s.rf,
                  fontWeight: showEmptyState ? 400 : 500,
                  color: showEmptyState ? '#aaa' : '#111',
                  fontStyle: showEmptyState ? 'italic' : 'normal',
                  borderBottom: '0.5px solid #eee',
                  display: 'flex',
                  alignItems: 'center',
                  overflow: 'hidden',
                }}
              >
                {task ? `${i + 1}. ${task.name}` : showEmptyState ? '暂无任务' : '\u00A0'}
              </div>
              <div style={{ borderBottom: '0.5px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ display: 'inline-block', width: s.bs, height: s.bs, border: '1.5px solid #999', borderRadius: '2px', flexShrink: 0 }} />
              </div>
              <div style={{ borderBottom: '0.5px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ display: 'inline-block', width: s.bs, height: s.bs, border: '1.5px solid #999', borderRadius: '2px', flexShrink: 0 }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Encouragement bar ── */}
      <div
        style={{
          background: '#fffbee',
          borderTop: '1.5px solid #e8c84a',
          textAlign: 'center',
          fontWeight: 700,
          color: '#9a6e00',
          padding: s.cp,
          fontSize: s.cf,
          letterSpacing: '0.5px',
          flexShrink: 0,
        }}
      >
        ✦ {card.encouragement}
      </div>
    </div>
  );
}
