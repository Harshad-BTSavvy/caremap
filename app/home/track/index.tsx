import Header from "@/components/shared/Header";
import TrackCalendar from "@/components/shared/track-shared-components/TrackCalender";
import TrackCard from "@/components/shared/track-shared-components/TrackCard";
import { Divider } from "@/components/ui/divider";
import { PatientContext } from "@/context/PatientContext";
import { TrackContext } from "@/context/TrackContext";
import { getTrackCategoriesWithItemsAndProgress } from "@/services/core/TrackService";
import { ROUTES } from "@/utils/route";
import palette from "@/utils/theme/color";
import { useFocusEffect, useRouter } from "expo-router";
import moment from "moment";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TrackScreen() {
  const router = useRouter();

  const { patient } = useContext(PatientContext);
  const {
    categories,
    setCategories,
    refreshData,
    setRefreshData,
    selectedDate,
    setSelectedDate,
  } = useContext(TrackContext);

  const [currentSelectedDate, setCurrentSelectedDate] = useState(moment());
  //marking dates on calendar
  const [markedDates, setMarkedDates] = useState<string[]>([]);
  useEffect(() => {
    const formatted = currentSelectedDate.format("MM-DD-YYYY");
    if (selectedDate !== formatted) {
      setSelectedDate(formatted);
    }
  }, [currentSelectedDate, selectedDate]);

  useFocusEffect(
    useCallback(() => {
      if (!patient) {
        router.replace(ROUTES.MY_HEALTH);
        return;
      }

      const loadTrackItemsForSelectedDate = async () => {
        const res = await getTrackCategoriesWithItemsAndProgress(
          patient.id,
          currentSelectedDate.format("MM-DD-YYYY")
        );
        setCategories(res);
        setRefreshData(false);
        // 👇 collect all dates that have data (assuming API gives it or you can derive it)
        const datesWithData = res
          .filter((cat) => cat.items.length > 0)
          .map((cat) => currentSelectedDate.format("YYYY-MM-DD")); // adjust format if API gives date
        setMarkedDates(datesWithData);
      };

      loadTrackItemsForSelectedDate();
    }, [patient, currentSelectedDate, refreshData])
  );

  const handleAddItem = () => {
    router.push({
      pathname: "/home/track/addItem",
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* header */}
      <Header
        title="Track"
        right={
          <TouchableOpacity onPress={handleAddItem} className="px-2">
            <Text className="text-white font-medium whitespace-nowrap">
              {/* {categories.some((cat) => cat.items.length > 0) ? "Edit item" : "Add item"} */}
              Add Item
            </Text>
          </TouchableOpacity>
        }
      />

      <View className="px-2">
        <Divider className="bg-gray-300" />
      </View>
      {/* calendar */}
      <TrackCalendar
        selectedDate={currentSelectedDate}
        onDateSelected={setCurrentSelectedDate}
        markedDates={markedDates}
      />

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {categories.length === 0 ? (
          <Text className="text-gray-500">No items added for this date</Text>
        ) : (
          categories.map((cat) =>
            cat.items.length > 0 ? (
              <View key={cat.id} className="mb-6">
                {/* Category title */}
                <Text
                  className="font-bold text-xl mb-2"
                  style={{ color: palette.heading }}
                >
                  {cat.name}
                </Text>

                {/* Items under this category */}
                {cat.items.map((itm) => (
                  <TrackCard
                    summaries={itm.summaries ?? []}
                    key={itm.item.id}
                    item_id={itm.item.id}
                    entry_id={itm.entry_id}
                    item_name={itm.item.name}
                    completed={itm.completed}
                    total={itm.total}
                    date={currentSelectedDate.format("MM-DD-YYYY")}
                  />
                ))}
              </View>
            ) : null
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
