import { CustomButton } from "@/components/shared/CustomButton";
import Header from "@/components/shared/Header";
import { CheckIcon, Icon } from "@/components/ui/icon";
import { PatientContext } from "@/context/PatientContext";
import { TrackContext } from "@/context/TrackContext";
import { UserContext } from "@/context/UserContext";
import { TrackCategoryWithSelectableItems } from "@/services/common/types";
import {
  addTrackItemOnDate,
  getAllCategoriesWithSelectableItems,
  removeTrackItemFromDate,
} from "@/services/core/TrackService";

import { ROUTES } from "@/utils/route";
import palette from "@/utils/theme/color";
import { usePathname, useRouter } from "expo-router";
import React, {
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { useFocusEffect } from "@react-navigation/native";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AddItem() {
  const router = useRouter();

  const { user } = useContext(UserContext);
  const { patient } = useContext(PatientContext);
  const { selectedDate, setRefreshData, refreshData } =
    useContext(TrackContext);
  const [selectableCategories, setSelectableCategories] = useState<
    TrackCategoryWithSelectableItems[]
  >([]);
  const selectableCategoriesRef = useRef<TrackCategoryWithSelectableItems[]>(
    []
  );
  const initialCategoriesRef = useRef<TrackCategoryWithSelectableItems[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadSelectableItems = useCallback(async () => {
    if (!user || !patient) return;
    const res = await getAllCategoriesWithSelectableItems(
      patient.id,
      selectedDate
    );
    selectableCategoriesRef.current = res;
    initialCategoriesRef.current = res;
    setSelectableCategories(res);
    if (refreshData) setRefreshData(false);
  }, [user, patient, selectedDate, refreshData, setRefreshData]);

  // Initial load & refresh trigger
  useEffect(() => {
    if (!user) {
      router.replace(ROUTES.LOGIN);
      return;
    }
    if (!patient) {
      router.replace(ROUTES.MY_HEALTH);
      return;
    }
    loadSelectableItems();
  }, [user, patient, selectedDate, refreshData, loadSelectableItems]);

  // Ensure list refreshes when returning from manage custom goals screen
  useFocusEffect(
    useCallback(() => {
      loadSelectableItems();
    }, [loadSelectableItems])
  );

  const toggleSelect = (categoryIndex: number, itemIndex: number) => {
    setSelectableCategories((prev) => {
      const categoryGroup = prev[categoryIndex];
      const items = categoryGroup.items.map((item, i) =>
        i === itemIndex ? { ...item, selected: !item.selected } : item
      );

      const updatedGroup = { ...categoryGroup, items };
      const next = prev.map((group, i) =>
        i === categoryIndex ? updatedGroup : group
      );
      selectableCategoriesRef.current = next;
      return next;
    });
  };

  const handleSave = async () => {
    if (isLoading) return;
    if (!user?.id) throw new Error("Authentication ERROR");
    if (!patient?.id) throw new Error("Authentication ERROR");

    setIsLoading(true);

    try {
      const current = selectableCategoriesRef.current;
      const initial = initialCategoriesRef.current;

      const initialMap: Record<number, boolean> = {};
      for (const group of initial) {
        for (const it of group.items) {
          initialMap[it.item.id] = !!it.selected;
        }
      }

      const toAdd: number[] = [];
      const toRemove: number[] = [];
      for (const group of current) {
        for (const it of group.items) {
          const wasSelected = initialMap[it.item.id] ?? false;
          const isSelected = !!it.selected;
          if (isSelected !== wasSelected) {
            if (isSelected) toAdd.push(it.item.id);
            else toRemove.push(it.item.id);
          }
        }
      }

      for (const itemId of toAdd) {
        await addTrackItemOnDate(itemId, user.id, patient.id, selectedDate);
      }
      for (const itemId of toRemove) {
        await removeTrackItemFromDate(
          itemId,
          user.id,
          patient.id,
          selectedDate
        );
      }

      initialCategoriesRef.current = selectableCategoriesRef.current;

      setRefreshData(true);
      router.navigate("/home/track");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView edges={["right", "top", "left"]} className="flex-1 bg-white">
      <Header
        title="Select care items to track"
        right={
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-white font-medium">Cancel</Text>
          </TouchableOpacity>
        }
      />
      <ScrollView contentContainerClassName="px-4 pb-40 pt-5">
        {selectableCategories.map((categoryGroup, categoryIndex) => (
          <View key={categoryGroup.category.id} className="mb-6">
            <Text
              style={{ color: palette.secondary }}
              className="font-bold text-xl mb-3"
            >
              {categoryGroup.category.name}
            </Text>
            {categoryGroup.items.map((itemObj, itemIndex) => (
              <TouchableOpacity
                key={itemObj.item.id}
                onPress={() => toggleSelect(categoryIndex, itemIndex)}
                className={`flex-row items-center justify-between border rounded-xl py-3 px-4 mb-2
    ${
      itemObj.selected
        ? "bg-cyan-100 border-cyan-400"
        : "bg-gray-100 border-gray-300"
    }
  `}
              >
                {/* Left: item name */}
                <Text className="text-[15px] flex-1">{itemObj.item.name}</Text>

                {/* Right: frequency + check icon */}
                <View className="flex-row items-center gap-2">
                  <Text className="text-sm text-gray-700">
                    {itemObj.item.frequency}
                  </Text>
                  {itemObj.selected ? (
                    <Icon
                      as={CheckIcon}
                      size="xl"
                      style={{ color: palette.primary }}
                    />
                  ) : (
                    // invisible placeholder to keep space fixed
                    <View style={{ width: 24, height: 24 }} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
      <View className="bg-white absolute bottom-0 left-0 right-0 px-4 py-4 border-t border-gray-200">
        {selectableCategories.some(
          (categoryGroup) =>
            categoryGroup.category.name === "Custom" &&
            categoryGroup.items.length > 0
        ) ? (
          // If there is at least 1 custom goal → show Manage button
          <TouchableOpacity
            onPress={() => router.push("/home/track/manageCustomGoals")}
            className="flex-row items-center justify-center border border-dashed border-gray-400 rounded-xl py-3 px-4 mb-3"
          >
            <Text className="text-cyan-600 font-semibold">
              Manage Custom Goals
            </Text>
          </TouchableOpacity>
        ) : (
          // Otherwise → default Add button
          <TouchableOpacity
            onPress={() => router.push(ROUTES.TRACK_CUSTOM_GOALS)}
            className="flex-row items-center justify-center border border-dashed border-gray-400 rounded-xl py-3 px-4 mb-3"
          >
            <Text className="text-cyan-600 font-semibold">
              + Add Custom Goal
            </Text>
          </TouchableOpacity>
        )}

        <CustomButton onPress={handleSave} disabled={isLoading} title="Save" />
      </View>
    </SafeAreaView>
  );
}
