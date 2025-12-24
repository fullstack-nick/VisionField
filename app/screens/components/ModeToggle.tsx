import { ViewMode } from "../../navigation/types";
import { Pressable, Text, View } from "react-native";

type Props = {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
};

const modes: { key: ViewMode; label: string }[] = [
  { key: "buttons", label: "Buttons view" },
  { key: "camera", label: "Camera view" },
];

export default function ModeToggle({ value, onChange }: Props) {
  return (
    <View className="flex-row rounded-full bg-gray-100 p-1">
      {modes.map((mode) => {
        const active = value === mode.key;
        return (
          <Pressable
            key={mode.key}
            onPress={() => onChange(mode.key)}
            className={`flex-1 rounded-full px-3 py-2 ${active ? "bg-blue-600" : ""}`}
          >
            <Text className={`text-center text-sm font-semibold ${active ? "text-white" : "text-gray-700"}`}>
              {mode.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
