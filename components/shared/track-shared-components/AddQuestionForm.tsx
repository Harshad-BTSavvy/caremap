import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import palette from "@/utils/theme/color";
import { LabeledTextInput } from "../labeledTextInput";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { QuestionType } from "@/constants/trackTypes";

export interface Question {
  id?: number; // preserve existing question id when editing
  text: string;
  type: string;
  required: boolean;
  options: string[];
}

interface Props {
  onSave: (q: Question) => void;
  onCancel?: () => void; // ✅ make cancel optional
  editing?: Question | null;
}

export default function AddQuestionForm({ onSave, onCancel, editing }: Props) {
  const [text, setText] = useState(editing?.text || "");
  const [type, setType] = useState(editing?.type || QuestionType.BOOLEAN);
  const [required, setRequired] = useState(editing?.required ?? true);
  const [options, setOptions] = useState<string[]>(editing?.options || []);

  const questionTypes = [
    { key: QuestionType.BOOLEAN, label: "Yes/No" },
    { key: QuestionType.MCQ, label: "Single Choice" },
    { key: QuestionType.MSQ, label: "Multiple Select" },
    { key: QuestionType.NUMERIC, label: "Number" },
    { key: QuestionType.TEXT, label: "Text" },
  ];

  const handleSave = () => {
    if (!text.trim()) {
      alert("Question text cannot be empty");
      return;
    }

    // Validate options for mcq/msq
    if (
      (type === QuestionType.MCQ || type === QuestionType.MSQ) &&
      options.filter((opt) => opt.trim()).length < 2
    ) {
      alert("Multiple choice questions need at least 2 valid options");
      return;
    }

    // Clean up options
    const cleanedOptions = options.filter((opt) => opt.trim().length > 0);

    onSave({
      id: editing?.id,
      text: text.trim(),
      type,
      required,
      options:
        type === QuestionType.MCQ || type === QuestionType.MSQ
          ? cleanedOptions
          : [],
    });

    if (!editing) {
      setText("");
      setType(QuestionType.BOOLEAN);
      setRequired(true);
      setOptions([]);
    }
  };

  // ✅ Handle type changes properly
  const handleTypeChange = (newType: string) => {
    setType(newType);

    if (newType === QuestionType.MCQ || newType === QuestionType.MSQ) {
      if (options.length < 2) setOptions(["", ""]);
    } else if (newType === QuestionType.BOOLEAN) {
      setOptions(["Yes", "No"]);
    } else {
      setOptions([]);
    }
  };

  return (
    <View className="mb-4">
      <Text
        style={{ color: palette.heading }}
        className="text-xl font-semibold mb-4"
      >
        Type your Question here ..
      </Text>

      {/* Question text */}
      <Textarea
        size="md"
        isDisabled={false}
        isInvalid={false}
        isReadOnly={false}
        className="mb-6 h-40"
        style={{
          borderColor: palette.gray300,
          borderWidth: 1,
          backgroundColor: palette.whiteColor,
        }}
      >
        <TextareaInput
          value={text}
          onChangeText={setText}
          placeholder="Type here..."
          textAlignVertical="top"
        />
      </Textarea>

      {/* Question Type */}
      <Text
        style={{ color: palette.heading }}
        className="mb-2 mt-4 text-lg font-semibold"
      >
        Select Question Type:
      </Text>

      <View
        className="flex-row rounded-xl overflow-hidden mb-4"
        style={{
          borderWidth: 1,
          borderColor: palette.primary,
          backgroundColor: palette.whiteColor,
          shadowColor:palette.gray300,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2,
        }}
      >
        {questionTypes.map((qt, idx, arr) => {
          const isActive = type === qt.key;
          return (
            <TouchableOpacity
              key={qt.key}
              style={{
                flex: 1,
                height: 40,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isActive ? palette.primary : palette.whiteColor,
                borderRightWidth: idx < arr.length - 1 ? 1 : 0,
                borderColor: palette.primary,
              }}
              onPress={() => handleTypeChange(qt.key)}
              activeOpacity={0.8}
            >
              <Text
                style={{
                  color: isActive ? palette.whiteColor : palette.primary,
                  fontWeight: isActive ? "700" : "500",
                  fontSize: 14,
                  textAlign: "center",
                }}
                numberOfLines={2}
              >
                {qt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Options */}
      {(type === QuestionType.MCQ || type === QuestionType.MSQ) && (
        <View
          className="p-3 rounded-lg mb-4"
          style={{
            borderWidth: 1,
            borderColor: palette.gray300,
          }}
        >
          <Text
            style={{ color: palette.heading }}
            className="text-sm font-medium mb-2"
          >
            Type Your Options
          </Text>
          {options.map((opt, i) => (
            <View key={i} className="flex-row items-center mb-2">
              <View className="flex-1">
                <LabeledTextInput
                  label={`Option ${i + 1}`}
                  value={opt}
                  onChangeText={(t) => {
                    const updated = [...options];
                    updated[i] = t;
                    setOptions(updated);
                  }}
                />
              </View>
              {options.length > 1 && (
                <TouchableOpacity
                  onPress={() => {
                    const updated = options.filter((_, idx) => idx !== i);
                    setOptions(updated);
                  }}
                  style={{
                    marginLeft: 8,
                    padding: 6,
                    backgroundColor: palette.gradientEnd, // light red bg
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: palette.primary, fontWeight: "600" }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          <TouchableOpacity
            onPress={() => setOptions([...options, ""])}
            style={{
              marginTop: 8,
              borderWidth: 1,
              borderColor: palette.primary,
              borderRadius: 8,
              alignItems: "center",
              paddingVertical: 10,
              backgroundColor: palette.whiteColor,
            }}
          >
            <Text style={{ color: palette.primary, fontWeight: "600" }}>
              + Add Option
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Required toggle */}
      <View className="flex-row items-center mb-3">
        <Switch
          size="sm"
          value={required}
          onValueChange={setRequired}
          trackColor={{
            false: palette.gray300,
            true: palette.secondary,
          }}
          thumbColor={palette.whiteColor}
          ios_backgroundColor={palette.gray300}
        />
        <Text style={{ marginLeft: 8, color: palette.heading }}>Required</Text>
      </View>

      {/* Save */}
      <TouchableOpacity
        onPress={handleSave}
        style={{
          backgroundColor: palette.primary,
          borderRadius: 8,
          paddingVertical: 12,
          alignItems: "center",
        }}
      >
        <Text style={{ color: palette.whiteColor, fontWeight: "bold" }}>
          {editing ? "Update Question" : "Save Question"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
