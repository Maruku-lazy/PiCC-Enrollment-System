export interface ScheduleSlot {
  day_of_week: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  start_time: string; // "HH:MM"
  end_time: string;   // "HH:MM"
  room: string;
  instructor_id?: string;
  section_name?: string;
}

export interface ConflictResult {
  hasConflict: boolean;
  type?: 'room' | 'instructor' | 'time';
  message?: string;
}

export function hasTimeOverlap(slotA: ScheduleSlot, slotB: ScheduleSlot): boolean {
  if (slotA.day_of_week !== slotB.day_of_week) return false;
  return slotA.start_time < slotB.end_time && slotB.start_time < slotA.end_time;
}

export function validateScheduleSlot(
  existingSlots: ScheduleSlot[],
  newSlot: ScheduleSlot
): ConflictResult {
  for (const existing of existingSlots) {
    if (hasTimeOverlap(existing, newSlot)) {
      if (existing.room.trim().toLowerCase() === newSlot.room.trim().toLowerCase()) {
        return {
          hasConflict: true,
          type: 'room',
          message: `Room conflict: Room ${newSlot.room} is already booked on ${newSlot.day_of_week} between ${existing.start_time} and ${existing.end_time} (${existing.section_name || 'Another section'}).`,
        };
      }

      if (
        newSlot.instructor_id &&
        existing.instructor_id &&
        newSlot.instructor_id === existing.instructor_id
      ) {
        return {
          hasConflict: true,
          type: 'instructor',
          message: `Instructor conflict: Instructor is already assigned to section ${existing.section_name || ''} during this time on ${newSlot.day_of_week}.`,
        };
      }
    }
  }

  return { hasConflict: false };
}