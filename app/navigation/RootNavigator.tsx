import { NavigationContainer } from "@react-navigation/native";
import { NavigationIndependentTree } from "@react-navigation/core";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import CropScreen from "../screens/CropScreen";
import EnhanceProgressScreen from "../screens/EnhanceProgressScreen";
import HomeScreen from "../screens/HomeScreen";
import OcrResultScreen from "../screens/OcrResultScreen";
import ResultScreen from "../screens/ResultScreen";
import ScanResultScreen from "../screens/ScanResultScreen";
import { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationIndependentTree>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerShown: false,
            gestureEnabled: true,
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Crop" component={CropScreen} />
          <Stack.Screen name="EnhanceProgress" component={EnhanceProgressScreen} />
          <Stack.Screen name="Result" component={ResultScreen} />
          <Stack.Screen name="OcrResult" component={OcrResultScreen} />
          <Stack.Screen name="ScanResult" component={ScanResultScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </NavigationIndependentTree>
  );
}
