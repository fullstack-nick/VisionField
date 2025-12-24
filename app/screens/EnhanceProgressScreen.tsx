import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Image, Text, TouchableOpacity, View } from "react-native";
import {
  cancelEnhanceJob,
  onEnhanceCancelled,
  onEnhanceComplete,
  onEnhanceError,
  onEnhanceProgress,
  startEnhanceJob,
} from "../../features/enhance/enhance.service";
import type { EnhanceProgress } from "../../features/enhance/enhance.types";
import { RootStackParamList } from "../navigation/types";

type EnhanceNav = NativeStackNavigationProp<RootStackParamList, "EnhanceProgress">;
type EnhanceRoute = RouteProp<RootStackParamList, "EnhanceProgress">;

export default function EnhanceProgressScreen() {
  const navigation = useNavigation<EnhanceNav>();
  const route = useRoute<EnhanceRoute>();
  const { imageUri } = route.params;

  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState<EnhanceProgress | null>(null);
  const [enhancedUri, setEnhancedUri] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  const jobRef = useRef<string | null>(null);

  useEffect(() => {
    const progressSub = onEnhanceProgress((payload) => {
      if (payload.jobId !== jobRef.current) return;
      setProgress(payload);
    });

    const completeSub = onEnhanceComplete((payload) => {
      if (payload.jobId !== jobRef.current) return;
      setEnhancedUri(payload.enhancedUri);
      setProgress((current) =>
        current
          ? { ...current, done: current.total, percent: 1, message: "Complete" }
          : { jobId: payload.jobId, done: 1, total: 1, percent: 1, message: "Complete" }
      );
      setIsDone(true);
    });

    const errorSub = onEnhanceError((payload) => {
      if (payload.jobId !== jobRef.current) return;
      setErrorMessage(payload.message || "Enhancement failed.");
    });

    const cancelledSub = onEnhanceCancelled((payload) => {
      if (payload.jobId !== jobRef.current) return;
      navigation.popToTop();
    });

    return () => {
      progressSub.remove();
      completeSub.remove();
      errorSub.remove();
      cancelledSub.remove();
    };
  }, [navigation]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const result = await startEnhanceJob({ imageUri });
        if (!active) return;
        jobRef.current = result.jobId;
        setJobId(result.jobId);
      } catch (error) {
        console.error(error);
        if (active) {
          setErrorMessage("Unable to start enhancement.");
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [imageUri]);

  useEffect(() => {
    return () => {
      if (jobRef.current && !isDone) {
        void cancelEnhanceJob(jobRef.current);
      }
    };
  }, [isDone]);

  const percent = useMemo(() => {
    const raw = progress?.percent ?? 0;
    return Math.max(0, Math.min(1, raw));
  }, [progress]);
  const message = useMemo(() => progress?.message ?? "Preparing...", [progress]);

  const handleDiscard = async () => {
    if (jobRef.current) {
      await cancelEnhanceJob(jobRef.current);
    }
    navigation.popToTop();
  };

  const handleSeeResult = () => {
    if (!enhancedUri) return;
    navigation.navigate("Result", { imageUri: enhancedUri, tool: "enhance" });
  };

  useEffect(() => {
    if (errorMessage) {
      Alert.alert("Enhancement failed", errorMessage);
    }
  }, [errorMessage]);

  return (
    <View className="flex-1 bg-white px-4 pt-4">
      <Text className="text-sm font-semibold uppercase text-gray-500">Enhance Image</Text>
      <Text className="mt-1 text-2xl font-bold text-gray-900">Processing</Text>

      <View className="mt-6 flex-1">
        <View className="overflow-hidden rounded-2xl border border-gray-200 bg-black/5">
          <Image source={{ uri: imageUri }} className="h-64 w-full" resizeMode="cover" />
        </View>

        <View className="mt-6">
          <View className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
            <View className="h-full bg-green-500" style={{ width: `${Math.round(percent * 100)}%` }} />
          </View>
          <Text className="mt-3 text-sm text-gray-600">{message}</Text>
        </View>
      </View>

      <View className="flex-row gap-3 pb-8 pt-4">
        <TouchableOpacity
          className="flex-1 rounded-full border border-gray-300 px-4 py-3"
          onPress={handleDiscard}
        >
          <Text className="text-center text-base font-semibold text-gray-700">Discard</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 rounded-full px-4 py-3 ${isDone ? "bg-blue-600" : "bg-gray-300"}`}
          onPress={handleSeeResult}
          disabled={!isDone}
        >
          <Text className="text-center text-base font-semibold text-white">See result</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
