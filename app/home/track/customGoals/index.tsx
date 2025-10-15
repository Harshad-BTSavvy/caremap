import Header from "@/components/shared/Header";
import { PatientContext } from "@/context/PatientContext";
import { TrackContext } from "@/context/TrackContext";
import { UserContext } from "@/context/UserContext";
import { useCustomToast } from "@/components/shared/useCustomToast";
import { ROUTES } from "@/utils/route";
import palette from "@/utils/theme/color";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  addCustomGoal,
  editCustomGoal,
  removeCustomGoal,
} from "@/services/core/TrackService";
 
import { CustomButton } from "@/components/shared/CustomButton";
import { LabeledTextInput } from "@/components/shared/labeledTextInput";
import ActionPopover from "@/components/shared/ActionPopover";
import { CustomAlertDialog } from "@/components/shared/CustomAlertDialog";
import { QuestionType, TrackingFrequency } from "@/constants/trackTypes";
 
export interface QuestionInput {
  id?: number; // optional id so existing questions can be updated instead of recreated
  text: string;
  type: string;
  required: boolean;
  options: string[];
}
 
export default function CustomGoals() {
  const router = useRouter();
  const showToast = useCustomToast();
  const { user } = useContext(UserContext);
  const { patient } = useContext(PatientContext);
  const { selectedDate, setRefreshData } = useContext(TrackContext);
 
  const [goalName, setGoalName] = useState("");
  const [questions, setQuestions] = useState<QuestionInput[]>([]);
  const [frequency, setFrequency] = useState<TrackingFrequency | null>(null);
 
  // Question deletion confirmation states
  const [questionToDelete, setQuestionToDelete] = useState<{
    index: number;
    question: QuestionInput;
  } | null>(null);
  const [showQuestionDeleteDialog, setShowQuestionDeleteDialog] =
    useState(false);
 
  // Router params
  const {
    goalId,
    goalName: passedGoalName,
    frequency: passedFrequency,
    questions: passedQuestions,
    newQuestion,
    editingIndex,
    addedQuestions,
  } = useLocalSearchParams<{
    goalId?: string;
    goalName?: string;
    frequency?: string;
    questions?: string;
    newQuestion?: string;
    editingIndex?: string;
    addedQuestions?: string;
  }>();
 
  // Prefill for editing or adding questions
  useEffect(() => {
    if (addedQuestions) {
      try {
        const parsed = JSON.parse(addedQuestions) as QuestionInput[];
        setQuestions(parsed);
      } catch {
        showToast({
          title: "Invalid data",
          description: "Could not parse updated questions.",
        });
      }
    } else if (newQuestion) {
      try {
        const parsed = JSON.parse(newQuestion) as QuestionInput;
        if (editingIndex !== undefined) {
          const idx = parseInt(editingIndex, 10);
          setQuestions((prev) => prev.map((q, i) => (i === idx ? parsed : q)));
        } else {
          setQuestions((prev) => [...prev, parsed]);
        }
      } catch {
        showToast({
          title: "Invalid question",
          description: "Could not parse question data.",
        });
      }
    }
  }, [addedQuestions, newQuestion, editingIndex]);
 
  // Initial prefill when editing
  useEffect(() => {
    if (passedGoalName) setGoalName(passedGoalName);
 
    if (passedFrequency) {
      const lower = passedFrequency.toLowerCase();
      if (lower === "daily") setFrequency(TrackingFrequency.DAILY);
      else if (lower === "weekly") setFrequency(TrackingFrequency.WEEKLY);
      else if (lower === "monthly") setFrequency(TrackingFrequency.MONTHLY);
    }
 
    if (passedQuestions) {
      try {
        const parsed = JSON.parse(passedQuestions) as QuestionInput[];
        setQuestions(parsed);
      } catch {
        showToast({ title: "Error", description: "Failed to load questions" });
      }
    }
  }, [passedGoalName, passedFrequency, passedQuestions]);
 
  const handleDelete = async (index: number) => {
    const questionToDeleteData = questions[index];
    setQuestionToDelete({ index, question: questionToDeleteData });
    setShowQuestionDeleteDialog(true);
  };
 
  const confirmQuestionDelete = () => {
    if (questionToDelete === null) return;
 
    const { index, question } = questionToDelete;
 
    // Always just remove from local state - don't auto-delete the goal
    // Goal deletion will be handled in save if no questions remain
    setQuestions((prev) => prev.filter((_, i) => i !== index));
 
    if (goalId && question.id) {
      showToast({
        title: "Deleted",
        description: "Question will be removed when you save.",
      });
    } else {
      showToast({ title: "Deleted", description: "Question removed." });
    }
 
    // Reset deletion state
    setQuestionToDelete(null);
    setShowQuestionDeleteDialog(false);
  };
 
  const handleSaveGoal = async () => {
    if (!user?.id) {
      showToast({
        title: "Authentication Error",
        description: "Please log in again.",
      });
      return router.replace(ROUTES.LOGIN);
    }
    if (!patient?.id) {
      showToast({
        title: "Patient Error",
        description: "Please select a patient.",
      });
      return router.replace(ROUTES.MY_HEALTH);
    }
 
    if (!goalName.trim()) {
      return showToast({
        title: "Goal name required",
        description: "Please enter a goal name.",
      });
    }
    if (!frequency) {
      return showToast({
        title: "Frequency required",
        description: "Please select a frequency.",
      });
    }
    if (questions.length === 0) {
      if (goalId) {
        // If editing an existing goal and no questions remain, delete the goal
        try {
          await removeCustomGoal(Number(goalId), patient.id);
          showToast({
            title: "Deleted",
            description: "Custom goal deleted (no questions remaining).",
          });
          setRefreshData(true);
          router.replace(ROUTES.TRACK_ADD_ITEM);
          return;
        } catch (error) {
          console.error("Failed to delete goal:", error);
          showToast({ title: "Error", description: "Failed to delete goal." });
          return;
        }
      } else {
        // For new goals, just show validation error
        return showToast({
          title: "Add questions",
          description: "Please add at least one question.",
        });
      }
    }
 
    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        return showToast({
          title: "Invalid question",
          description: `Question ${i + 1} cannot be empty.`,
        });
      }
      if (
        (q.type === "mcq" || q.type === "msq") &&
        (!q.options || q.options.filter((opt) => opt.trim()).length < 2)
      ) {
        return showToast({
          title: "Invalid options",
          description: `Question ${i + 1} needs at least 2 valid options.`,
        });
      }
    }
 
    try {
      if (goalId) {
        await editCustomGoal(Number(goalId), patient.id, {
          name: goalName.trim(),
          frequency,
          questions: questions.map((q) => ({
            id: q.id, // Keep existing ID for updates
            text: q.text.trim(),
            type: q.type as QuestionType,
            required: q.required,
            options: q.options?.filter((opt) => opt.trim()) || [],
          })),
        });
        showToast({ title: "Success", description: "Custom goal updated!" });
      } else {
        const trackItemId = await addCustomGoal({
          name: goalName.trim(),
          userId: user.id,
          code: `CUSTOM_${Date.now()}`,
          patientId: patient.id,
          date: selectedDate,
          frequency: frequency,
          questions: questions.map((q) => ({
            text: q.text.trim(),
            type: q.type,
            required: q.required,
            options: q.options?.filter((opt) => opt.trim()) || [],
          })),
        });
        console.log("Created custom goal with ID:", trackItemId);
        showToast({ title: "Success", description: "Custom goal saved!" });
      }
 
      setRefreshData(true);
      router.replace(ROUTES.TRACK_ADD_ITEM);
    } catch (err) {
      console.error("Failed to save custom goal:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to save goal.";
      showToast({
        title: "Error",
        description: goalId
          ? `Failed to update goal: ${errorMessage}`
          : `Failed to create goal: ${errorMessage}`,
      });
    }
  };
 
  const isDisabled =
    !goalName.trim() || !frequency || (!goalId && questions.length === 0);
 
  return (
    <SafeAreaView edges={["right", "top", "left"]} className="flex-1 bg-white">
      <Header
        title={goalId ? "Edit Custom Goal" : "Add Custom Goal"}
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
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 20,
            paddingBottom: 100,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Goal name */}
          <Text
            style={{ color: palette.heading }}
            className="text-xl font-semibold mb-2"
          >
            Goal Name
          </Text>
          <LabeledTextInput
            label="Type your Goal Name.."
            value={goalName}
            onChangeText={setGoalName}
          />
 
          {/* Frequency selection */}
          <Text
            style={{ color: palette.heading }}
            className="text-xl font-semibold mb-2"
          >
            Frequency
          </Text>
          <View style={{ width: "70%", alignSelf: "flex-start" }}>
            <View
              className="flex-row border rounded-lg overflow-hidden mb-2"
              style={{ borderColor: palette.primary }}
            >
              {[
                TrackingFrequency.DAILY,
                TrackingFrequency.WEEKLY,
                TrackingFrequency.MONTHLY,
              ].map((level, idx) => (
                <TouchableOpacity
                  key={level}
                  style={{
                    flex: 1,
                    backgroundColor:
                      frequency === level ? palette.primary : "white",
                    borderRightWidth: idx < 2 ? 1 : 0,
                    borderColor: palette.primary,
                    paddingVertical: 10,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onPress={() => setFrequency(level)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={{
                      color: frequency === level ? "white" : palette.primary,
                      fontWeight: "bold",
                      textTransform: "capitalize",
                    }}
                  >
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
 
          {/* Questions list */}
          <Text
            style={{ color: palette.heading }}
            className="font-bold text-xl mt-4 mb-2"
          >
            Questions
          </Text>
 
          <FlatList
            data={questions}
            keyExtractor={(_, index) => index.toString()}
            scrollEnabled={false}
            renderItem={({ item, index }) => (
              <View className="border border-gray-300 rounded-lg mb-3 px-3 py-3">
                <View className="flex-row items-center justify-between">
                  <Text className="text-lg max-w-[220px] text-left font-medium">
                    {index + 1}. {item.text}
                  </Text>
                  <View className="flex-row items-center">
                    <Text className="text-base text-gray-700 mr-3">
                      {item.type}
                    </Text>
                    <ActionPopover
                      onEdit={() =>
                        router.push({
                          pathname: ROUTES.TRACK_CUSTOM_GOALS_ADD_QUESTIONS,
                          params: {
                            existing: JSON.stringify(questions),
                            goalName,
                            goalId, // keep reference to existing goal
                            frequency, // ✅ Pass frequency
                            editIndex: index.toString(),
                          },
                        })
                      }
                      onDelete={() => handleDelete(index)}
                    />
                  </View>
                </View>
 
                {item.options?.length > 0 && (
                  <View className="px-3 mt-2">
                    <Text className="text-sm text-gray-700">
                      Options: {item.options.join(", ")}
                    </Text>
                  </View>
                )}
 
                <View className="px-3 mt-1">
                  <Text className="text-sm text-gray-500">
                    {item.required ? "Required" : "Optional"}
                  </Text>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <Text className="text-gray-500 text-center">
                No questions added yet.
              </Text>
            }
          />
        </ScrollView>
 
        {/* Bottom Actions */}
        <View className="bg-white absolute bottom-0 left-0 right-0 px-4 py-4 border-t border-gray-200">
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: ROUTES.TRACK_CUSTOM_GOALS_ADD_QUESTIONS,
                params: {
                  existing: JSON.stringify(questions),
                  goalName,
                  goalId, // keep goal id when editing existing goal
                  frequency, // ✅ Pass frequency
                },
              })
            }
            disabled={!goalName.trim() || !frequency}
            className={`flex-row items-center justify-center border border-dashed rounded-xl py-3 px-4 mb-3 ${
              !goalName.trim() || !frequency
                ? "border-gray-300 bg-gray-100"
                : "border-gray-400"
            }`}
          >
            <Text className="text-cyan-600 font-semibold">+ Add Question</Text>
          </TouchableOpacity>
 
          <CustomButton
            title={goalId ? "Update Goal" : "Save Goal"}
            onPress={handleSaveGoal}
            disabled={isDisabled}
          />
        </View>
      </KeyboardAvoidingView>
 
      {/* Question deletion confirmation dialog */}
      <CustomAlertDialog
        isOpen={showQuestionDeleteDialog}
        onClose={() => {
          setShowQuestionDeleteDialog(false);
          setQuestionToDelete(null);
        }}
        title="Delete Question"
        description={
          questionToDelete
            ? `Are you sure you want to delete this question: "${questionToDelete.question.text}"?`
            : "Are you sure you want to delete this question?"
        }
        onConfirm={confirmQuestionDelete}
      />
    </SafeAreaView>
  );
}