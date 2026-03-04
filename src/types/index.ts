export type Meeting = {
  id: string;
  userId: string;
  name: string;
  location: string;
  time: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type Checkin = {
  id: string;
  userId: string;
  meetingId: string;
  meetingName: string;
  dayKey: string;
  createdAt?: Date;
};
