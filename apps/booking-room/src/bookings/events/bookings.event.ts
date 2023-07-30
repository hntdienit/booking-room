export class rejectBookingEvent {
  booking: any;
  adminId: number;
}

export class pendingBookingEvent {
  currentTime: string;
  roomId: number;
  disableReason: string;
}
