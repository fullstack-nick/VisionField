import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CameraView } from "expo-camera";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, BackHandler, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import BottomBar from "./components/BottomBar";
import CameraPreview from "./components/CameraPreview";
import ModeToggle from "./components/ModeToggle";
import ToolDropdown from "./components/ToolDropdown";
import { RootStackParamList, ToolKey, ViewMode } from "../navigation/types";
import { capturePhoto } from "../../shared/image/cameraCapture";
import { pickImageFromLibrary } from "../../shared/image/pickImage";
import { fetchRecentPhotos } from "../../shared/image/recentPhotos";
import { formatPermissionState, requestPermissions } from "../../shared/image/permissions";
import { scanDocument } from "../../features/scanner/scanner.service";

type HomeNav = NativeStackNavigationProp<RootStackParamList, "Home">;

const toolButtons: { key: ToolKey; title: string; description: string }[] = [
  { key: "enhance", title: "Enhance Image", description: "Upscale and sharpen" },
  { key: "ocr", title: "Text Recognition", description: "Extract printed text" },
  { key: "scan", title: "Document Scanner", description: "Capture documents" },
];

export default function HomeScreen() {
  const navigation = useNavigation<HomeNav>();
  const [viewMode, setViewMode] = useState<ViewMode>("buttons");
  const [selectedTool, setSelectedTool] = useState<ToolKey>("enhance");
  const [permissionState, setPermissionState] = useState<Awaited<ReturnType<typeof requestPermissions>> | null>(null);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [recentPhotos, setRecentPhotos] = useState<string[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView | null>(null);

  const permissions = useMemo(() => (permissionState ? formatPermissionState(permissionState) : null), [permissionState]);

  useEffect(() => {
    (async () => {
      setLoadingPermissions(true);
      const state = await requestPermissions();
      setPermissionState(state);
      setLoadingPermissions(false);
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!permissionState) return;
      const { mediaGranted } = formatPermissionState(permissionState);
      if (!mediaGranted) return;
      void refreshRecentPhotos();
    }, [permissionState])
  );

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (viewMode === "camera") {
          setViewMode("buttons");
          return true;
        }
        return false;
      };

      const backHandler = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      const unsubscribe = navigation.addListener("beforeRemove", (event) => {
        if (viewMode !== "camera") return;
        event.preventDefault();
        setViewMode("buttons");
      });

      return () => {
        backHandler.remove();
        unsubscribe();
      };
    }, [navigation, viewMode])
  );

  const refreshRecentPhotos = useCallback(async () => {
    if (!permissionState) return;
    const { mediaGranted } = formatPermissionState(permissionState);
    if (!mediaGranted) return;
    try {
      const photos = await fetchRecentPhotos(12);
      setRecentPhotos(photos);
    } catch (error) {
      console.error(error);
    }
  }, [permissionState]);

  const handleScan = useCallback(async () => {
    if (!permissions?.cameraGranted) return;
    try {
      setViewMode("buttons");
      setIsCapturing(true);
      const result = await scanDocument();
      if (result.canceled) return;
      navigation.navigate("ScanResult", { pages: result.pages, pdf: result.pdf });
    } catch (error) {
      console.error(error);
      Alert.alert("Scan failed", "Could not scan this document. Please try again.");
    } finally {
      setIsCapturing(false);
    }
  }, [navigation, permissions?.cameraGranted]);

  const handleCapture = useCallback(async () => {
    if (selectedTool === "scan") {
      await handleScan();
      return;
    }
    if (!cameraRef.current || !permissions?.cameraGranted) return;
    try {
      setIsCapturing(true);
      const photo = await capturePhoto(cameraRef);
      navigation.navigate("Crop", { imageUri: photo.uri, tool: selectedTool });
      await refreshRecentPhotos();
    } catch (error) {
      console.error(error);
      Alert.alert("Capture failed", "Could not capture a photo. Please try again.");
    } finally {
      setIsCapturing(false);
    }
  }, [handleScan, navigation, permissions?.cameraGranted, refreshRecentPhotos, selectedTool]);

  const handleOpenGallery = useCallback(async () => {
    if (selectedTool === "scan") {
      await handleScan();
      return;
    }
    try {
      const picked = await pickImageFromLibrary();
      if (!picked) return;
      navigation.navigate("Crop", { imageUri: picked.uri, tool: selectedTool });
      await refreshRecentPhotos();
    } catch (error) {
      console.error(error);
      Alert.alert("Gallery error", "Could not open your gallery. Please try again.");
    }
  }, [handleScan, navigation, refreshRecentPhotos, selectedTool]);

  const handleSelectToolFromButtons = (tool: ToolKey) => {
    if (tool === "scan") {
      setSelectedTool("enhance");
      void handleScan();
      return;
    }
    setSelectedTool(tool);
    setViewMode("camera");
  };

  const handleSelectToolFromDropdown = (tool: ToolKey) => {
    setSelectedTool(tool);
    if (tool === "scan") {
      void handleScan();
    }
  };

  const handleViewModeChange = (mode: ViewMode) => {
    if (mode === "camera" && selectedTool === "scan") {
      setSelectedTool("enhance");
    }
    setViewMode(mode);
  };

  const handleRequestPermissions = async () => {
    setLoadingPermissions(true);
    const state = await requestPermissions();
    setPermissionState(state);
    setLoadingPermissions(false);
  };

  const renderButtonsView = () => (
    <View className="flex-1 px-4 pb-6">
      <Text className="mb-4 mt-3 text-lg font-semibold text-gray-800">Choose a tool to get started</Text>
      <ScrollView contentContainerStyle={{ gap: 12 }}>
        {toolButtons.map((tool) => (
          <TouchableOpacity
            key={tool.key}
            className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
            onPress={() => handleSelectToolFromButtons(tool.key)}
          >
            <Text className="text-xl font-bold text-gray-900">{tool.title}</Text>
            <Text className="mt-1 text-sm text-gray-600">{tool.description}</Text>
            <Text className="mt-3 text-blue-600">Open camera</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderPermissionsBlocked = (message: string) => (
    <View className="flex-1 items-center justify-center px-4">
      <Text className="mb-3 text-center text-base font-semibold text-gray-800">{message}</Text>
      <TouchableOpacity
        className="rounded-full bg-blue-600 px-4 py-3"
        onPress={handleRequestPermissions}
        disabled={loadingPermissions}
      >
        <Text className="text-base font-semibold text-white">Grant permissions</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCameraView = () => {
    if (loadingPermissions || !permissionState || !permissions) {
      return (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      );
    }

    if (!permissions.cameraGranted) {
      return renderPermissionsBlocked("Camera permission is needed to capture photos.");
    }

    const mediaGranted = permissions.mediaGranted;

    const captureLabel = selectedTool === "scan" ? "Scan" : "Snap";

    return (
      <View className="flex-1">
        <View className="px-4 pt-4 z-20">
          <ToolDropdown value={selectedTool} onChange={handleSelectToolFromDropdown} />
        </View>
        <View className="relative mt-4 flex-1 px-4 pb-4">
          <CameraPreview cameraRef={cameraRef} />
          <BottomBar
            previewPhotos={mediaGranted ? recentPhotos : []}
            onOpenGallery={handleOpenGallery}
            onCapture={handleCapture}
            isCapturing={isCapturing}
            captureLabel={captureLabel}
          />
        </View>
        {!mediaGranted && (
          <View className="px-4 pb-4 pt-2">
            <Text className="text-center text-sm text-gray-500">
              Grant media permissions to show your recent photos here.
            </Text>
            <TouchableOpacity
              className="mt-3 self-center rounded-full bg-blue-600 px-4 py-2"
              onPress={handleRequestPermissions}
              disabled={loadingPermissions}
            >
              <Text className="text-sm font-semibold text-white">Grant media access</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-4 pt-4">
        <ModeToggle value={viewMode} onChange={handleViewModeChange} />
      </View>
      {viewMode === "buttons" ? renderButtonsView() : renderCameraView()}
    </SafeAreaView>
  );
}
