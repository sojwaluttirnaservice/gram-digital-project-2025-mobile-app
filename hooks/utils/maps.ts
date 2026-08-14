import { Alert, Linking } from "react-native";

const openInGoogleMaps = async (
  latitude: number,
  longitude: number
): Promise<void> => {
  const url = `https://www.google.com/maps?q=${latitude},${longitude}`;

  try {
    const isSupported = await Linking.canOpenURL(url);

    if (isSupported) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Error", "Google Maps cannot be opened on this device.");
    }
  } catch (err) {
    Alert.alert(
      "Error",
      "An unexpected error occurred while opening Google Maps."
    );
    console.error("openInGoogleMaps error:", err);
  }
};

export { openInGoogleMaps };
