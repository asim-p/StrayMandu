import type { StrayDog } from "@/src/types/StrayDog";
import React from "react";
import { ScrollView } from "react-native";
import ReportCard from "./ReportCard";

interface Props {
  strayDogs: StrayDog[];
}

export default function ReportList({ strayDogs }: Props) {
  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      {strayDogs.map((dog) => (
        <ReportCard key={dog.id} dog={dog} />
      ))}
    </ScrollView>
  );
}
