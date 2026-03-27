import { DayCard } from '../types';

interface Props {
  card: DayCard;
}

export default function DayCardView({ card }: Props) {
  const bgColor = card.isWeekend ? '#EBEBEB' : '#F5F5F5';

  return (
    <div
      className="border rounded overflow-hidden text-sm"
      style={{ borderWidth: '1.5px', borderColor: '#374151' }}
    >
      {/* Date title */}
      <div
        className="text-center font-bold py-1.5 px-2"
        style={{
          backgroundColor: bgColor,
          fontSize: '13px',
          borderBottom: '1px solid #D1D5DB',
        }}
      >
        {card.displayDate}&nbsp;&nbsp;{card.weekdayLabel}
      </div>

      {/* Table header */}
      <div
        className="grid font-semibold"
        style={{
          gridTemplateColumns: '1fr 20% 20%',
          borderBottom: '0.5px solid #E5E7EB',
          fontSize: '11px',
          backgroundColor: '#FAFAFA',
        }}
      >
        <div className="px-2 py-1 border-r" style={{ borderColor: '#E5E7EB' }}>今日任务</div>
        <div className="px-1 py-1 text-center border-r whitespace-nowrap" style={{ borderColor: '#E5E7EB', fontSize: '10px' }}>□已完成</div>
        <div className="px-1 py-1 text-center whitespace-nowrap" style={{ fontSize: '10px' }}>□未完成</div>
      </div>

      {/* Tasks */}
      {card.tasks.length === 0 ? (
        <div
          className="px-2 py-2 text-gray-400 italic"
          style={{ fontSize: '11px', borderBottom: '0.5px solid #E5E7EB' }}
        >
          暂无任务
        </div>
      ) : (
        card.tasks.map((task, i) => (
          <div
            key={task.id}
            className="grid"
            style={{
              gridTemplateColumns: '1fr 20% 20%',
              borderBottom: '0.5px solid #E5E7EB',
              fontSize: '11px',
            }}
          >
            <div className="px-2 py-1 border-r" style={{ borderColor: '#E5E7EB' }}>
              {i + 1}. {task.name}
            </div>
            <div className="px-1 py-1 text-center border-r text-base" style={{ borderColor: '#E5E7EB' }}>□</div>
            <div className="px-1 py-1 text-center text-base">□</div>
          </div>
        ))
      )}

      {/* Notes area */}
      <div
        className="px-2"
        style={{
          height: '24px',
          borderBottom: '0.5px solid #E5E7EB',
        }}
      />

      {/* Encouragement */}
      <div
        className="px-2 py-1.5 text-center"
        style={{
          fontSize: '10px',
          color: '#F59E0B',
          backgroundColor: '#FFFBF0',
        }}
      >
        ✨ {card.encouragement}
      </div>
    </div>
  );
}
