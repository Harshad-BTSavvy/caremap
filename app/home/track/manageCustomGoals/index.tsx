import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { CustomButton } from "@/components/shared/CustomButton";
import { Divider } from "@/components/ui/divider";
import ActionPopover from "@/components/shared/ActionPopover";
import {
  getAllCategoriesWithSelectableItems,
  removeCustomGoal,
  getQuestionsForTrackItem,
} from "@/services/core/TrackService";
import { PatientContext } from "@/context/PatientContext";
import { TrackContext } from "@/context/TrackContext";
import { CustomAlertDialog } from "@/components/shared/CustomAlertDialog";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/shared/Header";
import { Question } from "@/services/database/migrations/v1/schema_v1";

// ✅ no `details`
interface CustomGoal {
  id: number;
  name: string;
  created_date: string; // store as string (ISO)
  frequency?: string; // optional
  questions?: Question[]; // optional, can be array of any structure
}

export default function ManageCustomGoals() {
  const router = useRouter();
  const { patient } = useContext(PatientContext);
  const { setRefreshData } = useContext(TrackContext);

  const [customGoals, setCustomGoals] = useState<CustomGoal[]>([]);
  const [goalToDelete, setGoalToDelete] = useState<CustomGoal | null>(null);
  const [showAlertDialog, setShowAlertDialog] = useState(false);

  const fetchCustomGoals = async () => {
    if (!patient?.id) return;

    try {
      const res = await getAllCategoriesWithSelectableItems(
        patient.id,
        new Date().toISOString()
      );

      const customCategory = res.find((cat) => cat.category.name === "Custom");

      if (customCategory) {
        setCustomGoals(
          customCategory.items
            .filter((it) => it.item.status === "active") // Only show active items
            .map((it) => ({
              id: it.item.id,
              name: it.item.name,
              created_date: new Date(it.item.created_date).toISOString(),
              frequency: it.item.frequency,
            }))
        );
      } else {
        setCustomGoals([]);
      }
    } catch (error) {
      console.error("Failed to fetch custom goals:", error);
      setCustomGoals([]);
    }
  };

  useEffect(() => {
    fetchCustomGoals();
  }, [patient?.id]);

  const handleEditGoal = async (goal: CustomGoal) => {
    try {
      // Fetch latest questions (with options) so edit screen pre-populates reliably
      const q = await getQuestionsForTrackItem(goal.id);
      router.push({
        pathname: "/home/track/customGoals",
        params: {
          goalId: goal.id.toString(),
          goalName: goal.name,
          frequency: goal.frequency,
          questions: JSON.stringify(
            q.map((qu) => ({
              id: qu.id,
              text: qu.text,
              type: qu.type,
              required: qu.required,
              options: qu.options || [],
            }))
          ),
        },
      });
    } catch (e) {
      console.warn("Failed to load questions for goal", goal.id, e);
      router.push({
        pathname: "/home/track/customGoals",
        params: {
          goalId: goal.id.toString(),
          goalName: goal.name,
          frequency: goal.frequency,
        },
      });
    }
  };

  const handleDeleteGoal = async () => {
    if (!goalToDelete || !patient?.id) return;

    const deletingGoal = goalToDelete;
    const deletingId = deletingGoal.id;

    // Optimistic update
    setCustomGoals((prev) => prev.filter((g) => g.id !== deletingId));
    setShowAlertDialog(false);
    setGoalToDelete(null);

    try {
      await removeCustomGoal(deletingId, patient.id);
      // Signal other track screens to refresh
      setRefreshData(true);
      console.log(`Successfully deleted custom goal: ${deletingGoal.name}`);
    } catch (error) {
      console.error("Failed to delete custom goal:", error);
      // Rollback on failure - restore the deleted goal
      setCustomGoals((prev) =>
        [deletingGoal, ...prev].sort((a, b) => a.id - b.id)
      );
      // Show error message (you could add a toast here if available)
      alert(`Failed to delete "${deletingGoal.name}". Please try again.`);
    }
  };

  return (
    <SafeAreaView edges={["right", "top", "left"]} className="flex-1 bg-white">
      <Header
        title="Manage Custom Goals"
        right={
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-white font-medium">Cancel</Text>
          </TouchableOpacity>
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <FlatList
          data={customGoals}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 20,
            paddingBottom: 100,
          }}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <Text className="text-xl font-bold mb-4">Manage Custom Goals</Text>
          }
          renderItem={({ item }) => {
            const formattedDate = new Date(
              item.created_date
            ).toLocaleDateString();

            return (
              <View className="border border-gray-300 rounded-lg mb-3 px-3 py-3">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center space-x-2">
                    <Text className="text-lg ml-3 max-w-[220px] font-medium">
                      {item.name}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Text className="text-lg text-gray-700 mr-3">
                      {/* {formattedDate} */}
                      {item.frequency}
                    </Text>
                    <ActionPopover
                      onEdit={() => handleEditGoal(item)}
                      onDelete={() => {
                        setGoalToDelete(item);
                        setShowAlertDialog(true);
                      }}
                    />
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <Text className="text-gray-500">No Custom Goals found.</Text>
          }
        />
      </KeyboardAvoidingView>

      <Divider className="bg-gray-300 mb-3" />

      <View className="p-5">
        <CustomButton
          title="Add More Goals"
          onPress={() => router.push("/home/track/customGoals")}
        />
      </View>

      <CustomAlertDialog
        isOpen={showAlertDialog}
        onClose={() => setShowAlertDialog(false)}
        title="Delete Custom Goal"
        description={
          goalToDelete
            ? `Are you sure you want to delete the custom goal "${goalToDelete.name}"? This action cannot be undone.`
            : "Are you sure you want to delete this custom goal?"
        }
        onConfirm={handleDeleteGoal}
      />
    </SafeAreaView>
  );
}
