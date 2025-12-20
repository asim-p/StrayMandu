import type { ReportStatus } from "@/src/types/StrayDog";

export const getStatusColor = (status: ReportStatus) => {
  switch (status) {
    case "reported":
      return "#ff6b6b";
    case "rescued":
      return "#feca57";
    case "vaccinated":
      return "#48dbfb";
    case "relocated":
      return "#1dd1a1";
    default:
      return "#95a5a6";
  }
};


export const getStatusLabel = (status: ReportStatus) =>
  status.charAt(0).toUpperCase() + status.slice(1);
