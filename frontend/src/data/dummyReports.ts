import type { StrayDog } from "../types/StrayDog";

export const dummyReports: StrayDog[] = [
  {
    id: "1",
    location: {
      latitude: 27.7172,
      longitude: 85.324,
      address: "Thamel, Kathmandu",
    },
    description: "Injured dog near tourist area, limping",
    status: "reported",
    reportedBy: "Anonymous",
    reportedAt: new Date("2025-10-28"),
    imageUrl: "https://example.com/dog1.jpg",
  },
  {
    id: "2",
    location: {
      latitude: 27.7089,
      longitude: 85.3206,
      address: "Patan Durbar Square",
    },
    description: "Mother dog with puppies, needs food",
    status: "rescued",
    reportedBy: "Karma Sherpa",
    reportedAt: new Date("2025-10-27"),
  },
  {
    id: "3",
    location: {
      latitude: 27.7242,
      longitude: 85.3089,
      address: "Swayambhunath Temple Area",
    },
    description: "Aggressive dog, vaccination needed",
    status: "vaccinated",
    reportedBy: "Sita Rai",
    reportedAt: new Date("2025-10-26"),
  },
  {
    id: "4",
    location: {
      latitude: 27.6710,
      longitude: 85.4298,
      address: "Bhaktapur Durbar Square",
    },
    description: "Dog safely relocated to shelter",
    status: "relocated",
    reportedBy: "Animal Welfare Team",
    reportedAt: new Date("2025-10-25"),
  },
  {
    id: "5",
    location: {
      latitude: 27.6710,
      longitude: 85.4298,
      address: "Satungal Durbar Square",
    },
    description: "Dog safely relocated to shelter",
    status: "relocated",
    reportedBy: "Animal Welfare Team",
    reportedAt: new Date("2025-10-25"),
  },
];
