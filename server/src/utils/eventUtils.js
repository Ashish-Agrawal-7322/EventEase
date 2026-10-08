/**
 * Reusable utility to check if an event's date or registration deadline has expired
 */
export const checkEventExpired = (event) => {
  if (!event) return false;

  // Explicit completion or cancellation
  if (event.status === 'completed' || event.status === 'cancelled') {
    return true;
  }

  try {
    const now = new Date();

    // 1. If explicit registration deadline is set (e.g., ISO string or "YYYY-MM-DD" or "YYYY-MM-DD HH:mm")
    if (event.registrationDeadline && event.registrationDeadline.trim()) {
      const deadline = new Date(event.registrationDeadline);
      if (!isNaN(deadline.getTime())) {
        return now > deadline;
      }
    }

    // 2. Compute deadline from event date and endTime/startTime
    if (event.date) {
      // Check if date string has YYYY-MM-DD
      const dateParts = event.date.split('-');
      let eventDate;
      if (dateParts.length === 3) {
        eventDate = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2]));
      } else {
        eventDate = new Date(event.date);
      }

      if (isNaN(eventDate.getTime())) return false;

      // If endTime is provided (e.g. "04:00 PM" or "16:00")
      if (event.endTime) {
        const timeStr = event.endTime.trim();
        const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
        if (match) {
          let hours = parseInt(match[1], 10);
          const minutes = parseInt(match[2], 10);
          const meridiem = match[3] ? match[3].toUpperCase() : null;
          if (meridiem === 'PM' && hours < 12) hours += 12;
          if (meridiem === 'AM' && hours === 12) hours = 0;
          eventDate.setHours(hours, minutes, 59, 999);
        } else {
          // Default to end of event date
          eventDate.setHours(23, 59, 59, 999);
        }
      } else {
        // Default to end of event date (23:59:59)
        eventDate.setHours(23, 59, 59, 999);
      }

      return now > eventDate;
    }

    return false;
  } catch (err) {
    console.error('checkEventExpired error:', err);
    return false;
  }
};
