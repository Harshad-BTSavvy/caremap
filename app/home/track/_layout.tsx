import { TrackProvider } from "@/context/TrackContext";
import { Stack } from "expo-router";

const StackLayout = () => {
  return (
    <TrackProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="questions/[itemId]" />
        <Stack.Screen name="addItem" />
        <Stack.Screen name="customGoals/index" />
        <Stack.Screen name="customGoals/addQuestions" />
        <Stack.Screen name="manageCustomGoals" />
      </Stack>
    </TrackProvider>
  );
};

export default StackLayout;
