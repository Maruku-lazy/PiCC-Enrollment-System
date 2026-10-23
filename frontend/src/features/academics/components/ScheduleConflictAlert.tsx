import { AlertTriangle } from 'lucide-react';

interface ScheduleConflictAlertProps {
  message: string;
}

export default function ScheduleConflictAlert({ message }: ScheduleConflictAlertProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.85rem 1rem',
        backgroundColor: '#fff1f2',
        border: '1px solid #fecdd3',
        borderRadius: '8px',
        color: '#be123c',
        fontSize: '0.85rem',
        fontWeight: 500,
        margin: '0.75rem 0',
      }}
      role="alert"
    >
      <AlertTriangle size={18} color="#e11d48" style={{ flexShrink: 0 }} />
      <span>{message}</span>
    </div>
  );
}