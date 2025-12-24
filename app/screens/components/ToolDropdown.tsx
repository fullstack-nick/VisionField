import { useEffect, useMemo, useState } from "react";
import { LayoutAnimation, Platform, Pressable, Text, UIManager, View } from "react-native";
import { ToolKey } from "../../navigation/types";

type Props = {
  value: ToolKey;
  onChange: (tool: ToolKey) => void;
};

const toolLabels: Record<ToolKey, string> = {
  enhance: "Enhance Image",
  ocr: "Text Recognition",
  scan: "Document Scanner",
};

export default function ToolDropdown({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const options = useMemo(() => Object.keys(toolLabels) as ToolKey[], []);

  useEffect(() => {
    if (Platform.OS === "android") {
      UIManager.setLayoutAnimationEnabledExperimental?.(true);
    }
  }, []);

  const toggleOpen = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((prev) => !prev);
  };

  const handleSelect = (tool: ToolKey) => {
    onChange(tool);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(false);
  };

  return (
    <View className="relative">
      <Pressable
        className="flex-row items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm"
        onPress={toggleOpen}
      >
        <Text className="text-base font-semibold text-gray-800">{toolLabels[value]}</Text>
        <Text className="text-lg text-gray-600">{open ? "^" : "v"}</Text>
      </Pressable>

      {open && (
        <View className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          {options.map((tool, index) => (
            <Pressable
              key={tool}
              className={`px-3 py-3 ${index !== options.length - 1 ? "border-b border-gray-100" : ""}`}
              onPress={() => handleSelect(tool)}
            >
              <Text className={`text-base ${tool === value ? "font-semibold text-blue-600" : "text-gray-800"}`}>
                {toolLabels[tool]}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
