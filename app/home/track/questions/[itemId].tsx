
import Header from "@/components/shared/Header";
import QuestionRenderer from "@/components/shared/track-shared-components/QuestionRenderer";
import { useCustomToast } from "@/components/shared/useCustomToast";
import { PatientContext } from "@/context/PatientContext";
import { TrackContext } from "@/context/TrackContext";
import { UserContext } from "@/context/UserContext";
import {
  addOptionToQuestion,
  getQuestionsWithOptions,
  isQuestionVisible,
  saveResponse,
} from "@/services/core/TrackService";
import {
  Question,
  ResponseOption,
} from "@/services/database/migrations/v1/schema_v1";
import { ROUTES } from "@/utils/route";
import palette from "@/utils/theme/color";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useContext, useEffect, useState, useMemo } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function QuestionFlowScreen() {
  const { itemId, itemName, entryId } = useLocalSearchParams<{
    itemId: string;
    itemName: string;
    entryId: string;
  }>();

  const router = useRouter();
  const showToast = useCustomToast();
  const { user } = useContext(UserContext);
  const { patient } = useContext(PatientContext);
  const { setRefreshData } = useContext(TrackContext);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [responseOptions, setResponseOptions] = useState<ResponseOption[]>([]);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [customOptions, setCustomOptions] = useState<Record<number, string>>(
    {}
  );

  const [currentIndex, setCurrentIndex] = useState(0);

  const itemIdNum = Number(itemId);
  const entryIdNum = Number(entryId);

  // Compute visibleQuestions dynamically
  const visibleQuestions = useMemo(() => {
    return questions.filter((q) =>
      isQuestionVisible(q, answers, questions, responseOptions)
    );
  }, [questions, answers, responseOptions]);

  // Keep currentQuestion in sync with visibleQuestions + currentIndex
  const currentQuestion = visibleQuestions[currentIndex] || null;
  const currentOptions = responseOptions.filter(
    (r) => r.question_id === currentQuestion?.id
  );

  // isLast checks against last visible question
  const isLast =
    currentQuestion &&
    visibleQuestions.length > 0 &&
    visibleQuestions[visibleQuestions.length - 1]?.id === currentQuestion.id;

  const hasAnswer =
    currentQuestion &&
    answers[currentQuestion.id] !== undefined &&
    answers[currentQuestion.id] !== null;

  // Cleanup hidden answers automatically
  useEffect(() => {
    setAnswers((prev) => {
      const newAnswers = { ...prev };
      let changed = false;

      questions.forEach((q) => {
        const stillVisible = visibleQuestions.some((vq) => vq.id === q.id);
        if (!stillVisible && newAnswers[q.id] !== undefined) {
          delete newAnswers[q.id];
          changed = true;
        }
      });

      // ✅ only return a new object if something actually changed
      return changed ? newAnswers : prev;
    });

    if (
      currentIndex >= visibleQuestions.length &&
      visibleQuestions.length > 0
    ) {
      setCurrentIndex(visibleQuestions.length - 1);
    }
  }, [visibleQuestions, questions, currentIndex]);

  useEffect(() => {
    if (!user) {
      router.replace(ROUTES.LOGIN);
      return;
    }
    if (!patient) {
      router.replace(ROUTES.MY_HEALTH);
      return;
    }

    const loadQuestionsWithOptions = async () => {
      if (!itemIdNum) return;
      const questionWithOptions = await getQuestionsWithOptions(
        itemIdNum,
        entryIdNum
      );

      const questionsArray = questionWithOptions.map((qwo) => qwo.question);
      const responseOptionsArray = questionWithOptions.flatMap(
        (qwo) => qwo.options
      );

      const existingResponses: Record<number, any> = {};
      questionWithOptions.forEach((qwo) => {
        const response = qwo.existingResponse;
        if (response && response.question_id != null) {
          let answerValue: any = response.answer;
          try {
            answerValue = JSON.parse(answerValue);
          } catch {
            // leave as-is if not JSON
          }
          existingResponses[response.question_id] = answerValue;
        }
      });

      setQuestions(questionsArray);
      setResponseOptions(responseOptionsArray);
      setAnswers(existingResponses);
    };

    loadQuestionsWithOptions();
  }, [itemIdNum]);

  // Answer setter
  const handleSetAnswer = (val: any) => {
    if (!currentQuestion?.id) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: val }));
  };

  // Custom option adder
  const handleAddOption = (question_id: number, newOption: string) => {
    setCustomOptions((prev) => ({ ...prev, [question_id]: newOption }));
  };

  const submitAnswers = async (responseObj: Record<number, any>) => {
    if (!user?.id || !patient?.id) throw new Error("Authentication ERROR");

    try {
      for (const [questionIdStr, answerObj] of Object.entries(responseObj)) {
        const questionId = Number(questionIdStr);

        if (answerObj === null || answerObj === undefined) continue;

        // Add custom option if needed
        for (const [customQuesIdStr, customVal] of Object.entries(
          customOptions
        )) {
          const customQuesId = Number(customQuesIdStr);
          if (JSON.stringify(answerObj).includes(customVal)) {
            await addOptionToQuestion(customQuesId, customVal);
          }
        }

        await saveResponse(
          entryIdNum,
          questionId,
          answerObj,
          user.id,
          patient.id
        );
      }
    } catch (error) {
      console.error("Error saving answers:", error);
    }
  };

  const handleNext = async () => {
    if (
      currentQuestion?.required &&
      (answers[currentQuestion.id] === undefined ||
        answers[currentQuestion.id] === null)
    ) {
      showToast({
        title: "Answer required",
        description: "Please answer the question before proceeding.",
      });
      return;
    }

    if (isLast) {
      await submitAnswers(answers);
      router.back();
      setRefreshData(true);
    } else {
      setCurrentIndex((p) => p + 1);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header
        title={itemName}
        right={
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-white font-medium">Cancel</Text>
          </TouchableOpacity>
        }
      />

      {!currentQuestion ? (
        <View className="flex-1 justify-center items-center px-4">
          <Text className="text-gray-500 text-center">
            No questions found for this item.
          </Text>
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          >
            {currentQuestion.instructions && (
              <Text className="text-base text-gray-600 mb-2">
                {currentQuestion.instructions}
              </Text>
            )}

            <QuestionRenderer
              question={currentQuestion}
              answer={answers[currentQuestion.id]}
              setAnswer={handleSetAnswer}
              responses={currentOptions}
              setCustomOption={handleAddOption}
            />
          </ScrollView>

          <View className="flex-row p-4 border-t border-gray-200 bg-white">
            {!currentQuestion.required && !isLast && !hasAnswer && (
              <TouchableOpacity
                className="flex-1 py-3 rounded-lg border border-gray-300 mr-2"
                onPress={() => {
                  setAnswers((prev) => ({
                    ...prev,
                    [currentQuestion.id]: null,
                  }));
                  setCurrentIndex((p) => p + 1);
                }}
              >
                <Text className="text-center text-gray-500 font-medium">
                  Skip
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={{ backgroundColor: palette.primary }}
              className="flex-1 py-3 rounded-lg"
              onPress={handleNext}
            >
              <Text className="text-white font-bold text-center">
                {isLast ? "Submit" : "Next"}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
