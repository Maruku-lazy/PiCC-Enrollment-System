interface SectionCapacityBadgeProps {
  current: number;
  max: number;
}

export default function SectionCapacityBadge({ current, max }: SectionCapacityBadgeProps) {
  const percentage = Math.round((current / max) * 100);
  const isFull = current >= max;
  const isNearFull = percentage >= 85 && !isFull;

  let bg = '#dcfce7'; // green
  let text = '#15803d';

  if (isFull) {
    bg = '#fee2e2'; // red
    text = '#b91c1c';
  } else if (isNearFull) {
    bg = '#fef3c7'; // yellow
    text = '#b45309';
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.25rem 0.65rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 700,
        backgroundColor: bg,
        color: text,
      }}
    >
      {current} / {max} Enrolled ({isFull ? 'FULL' : `${percentage}%`})
    </span>
  );
}