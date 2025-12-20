export type ReportStatus =
  | "reported"
  | "rescued"
  | "vaccinated"
  | "relocated";

  
export interface StrayDog {
  id: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  description: string;
  status: ReportStatus;
  reportedBy: string;
  reportedAt: Date;
  imageUrl?: string;
}
