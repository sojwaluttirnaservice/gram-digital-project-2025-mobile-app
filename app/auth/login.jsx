import Input from "@/components/custom/form/Input";
import ScreenWrapper from "@/components/custom/screens/ScreenWrapper";
import { app } from "@/data/app";
import { setServerUrl, setIsConnected } from "@/redux/slices/connectionSlice";
import { setGp } from "@/redux/slices/gpSlice";
import { login, logout } from "@/redux/slices/userSlice";
import { setWebsites } from "@/redux/slices/websitesSlice";
import { Feather, MaterialIcons, Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useState, useMemo } from "react";
import { Alert, Image, Pressable, Text, View, ActivityIndicator } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useApi } from "../../hooks/custom/useApi";
import { getErrorMessage } from "@/utils/errorUtils";
import OfflineDownloadModal from "@/components/custom/utils/OfflineDownloadModal";
import Autocomplete from "@/components/custom/form/Autocomplete";
import { saveUserState, saveServerUrl, saveGpInfo, getUserState, getServerUrl, getGpInfo } from "@/utils/storage";

const initialState = {
    id: "",
    username: "s",
    password: "s",
};

const LoginScreen = () => {
    const { instance, api } = useApi();

    const router = useRouter();
    const [inputUser, setInputUser] = useState(initialState);
    const [showPassword, setShowPassword] = useState(false);
    const [selectedMode, setSelectedMode] = useState("online");
    const [showOfflineModal, setShowOfflineModal] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchGp, setSearchGp] = useState("");

    const { serverUrl, isDev } = useSelector((state) => state.connection);
    const websites = useSelector((state) => state.websites);
    const user = useSelector((state) => state.user);
    const gp = useSelector((state) => state.gp);
    const [location, setLocation] = useState(null);
    const dispatch = useDispatch();

    // Auto-restore persisted state from AsyncStorage on mount
    useEffect(() => {
        const restoreSavedState = async () => {
            const savedServer = await getServerUrl();
            const savedGp = await getGpInfo();
            const savedUser = await getUserState();

            if (savedServer && !serverUrl) {
                dispatch(setServerUrl(savedServer));
            }
            if (savedGp?.grampanchayat_name) {
                if (!gp?.grampanchayat_name) dispatch(setGp(savedGp));
                setSearchGp(savedGp.grampanchayat_name);
            }
            if (savedUser && (!user || !user.isAuthenticated)) {
                dispatch(login(savedUser));
            }
        };
        restoreSavedState();
    }, []);

    // Auto-redirect if already authenticated
    useEffect(() => {
        if (user && user.isAuthenticated && user.token) {
            router.replace("/(tabs)");
        }
    }, [user]);

    // FOR LOCATION ACCESS
    useEffect(() => {
        const getCurrentLocation = async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("Location Required", "You must enable location access to use this app from Settings.");
                return;
            }
            let loc = await Location.getCurrentPositionAsync({});
            setLocation(loc);
        };
        getCurrentLocation();
    }, []);

    const fetchWebsites = async () => {
        setIsRefreshing(true);
        try {
            let { success, data } = await instance.get("/websites");
            if (success) {
                dispatch(setWebsites(data.websites));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchWebsites();
    }, []);

    const gpOptions = useMemo(() => {
        let options = [];
        if (isDev) {
            options.push({ label: "Local (Dev)", value: "http://192.168.1.2:5900", searchString: "local dev http://192.168.1.2:5900" });
        }
        if (websites && websites.length > 0) {
            websites.forEach((web, idx) => {
                const label = web.grampanchayat_name || web.village_name || `Website ${idx + 1}`;
                const value = web.website_link || "";
                options.push({
                    label,
                    value,
                    searchString: `${label} ${value}`.toLowerCase()
                });
            });
        }
        if (!searchGp) return options;
        const q = searchGp.toLowerCase();
        return options.filter(opt => opt.searchString.includes(q));
    }, [websites, isDev, searchGp]);

    const handleLogin = async () => {
        if (!serverUrl) {
            Alert.alert("वेबसाईट निवडा", "कृपया लॉगिन करण्यापूर्वी तुमची ग्रामपंचायत वेबसाईट निवडा.");
            return;
        }
        try {
            let { success, data } = await instance.post("/auth/login", inputUser);
            if (success) {
                dispatch(login(data.user));
                await saveUserState(data.user);
                await saveServerUrl(serverUrl);
                if (selectedMode === "offline") {
                    dispatch(setIsConnected(false));
                } else {
                    dispatch(setIsConnected(true));
                }
                setShowOfflineModal(true);
            }
        } catch (err) {
            console.log(err);
            Alert.alert("Login Error", getErrorMessage(err, "An error occurred during login."));
        }
    };

    return (
        <ScreenWrapper scroll>
            <View className="flex-1 bg-slate-50">

                {/* ─── Compact Hero Banner ─── */}
                <View className="bg-indigo-700 pt-10 pb-8 px-6 items-center rounded-b-[30px] flex-row justify-center">
                    <View className="bg-white p-1 rounded-xl shadow-md mr-4">
                        <Image
                            source={require("../../assets/images/logo.png")}
                            style={{ width: 45, height: 45, borderRadius: 8 }}
                            resizeMode="contain"
                        />
                    </View>
                    <View>
                        <Text className="text-white text-2xl font-extrabold tracking-wider">
                            {app.name}
                        </Text>
                        <Text className="text-indigo-200 text-xs font-semibold mt-0.5">
                            ग्राम डिजिटल प्रकल्प — ग्रामपंचायत
                        </Text>
                    </View>
                </View>

                {/* ─── Compact Form Card ─── */}
                <View className="mx-4 -mt-4 bg-white rounded-2xl shadow-md border border-slate-100 p-5 mb-4">
                    {/* Username */}
                    <View className="mb-3">
                        <Input
                            label="वापरकर्ता नाव (Username)"
                            value={inputUser.username}
                            isLabelFloating
                            onChangeText={(text) => setInputUser({ ...inputUser, username: text })}
                        />
                    </View>

                    {/* Password */}
                    <View className="mb-2">
                        <Input
                            label="पासवर्ड (Password)"
                            mode="password"
                            value={inputUser.password}
                            isLabelFloating
                            secureTextEntry={!showPassword}
                            onChangeText={(text) => setInputUser({ ...inputUser, password: text })}
                        />
                        <Pressable
                            onPress={() => setShowPassword(!showPassword)}
                            className="mt-1.5 self-end flex-row items-center"
                        >
                            <Feather name={showPassword ? "eye" : "eye-off"} size={14} color="#94a3b8" />
                            <Text className="text-xs text-slate-400 ml-1.5">
                                {showPassword ? "लपवा" : "दाखवा"}
                            </Text>
                        </Pressable>
                    </View>

                    {/* Compact GP Picker */}
                    <View className="mb-3 mt-1">
                        <View className="flex-row items-center justify-between mb-1.5">
                            <Text className="text-xs font-bold text-slate-400 ml-1 uppercase tracking-wider">
                                ग्रामपंचायत निवडा
                            </Text>
                            <Pressable
                                onPress={fetchWebsites}
                                disabled={isRefreshing}
                                className={`flex-row items-center px-2 py-0.5 rounded-full ${isRefreshing ? "bg-slate-200 opacity-70" : "bg-slate-100 active:opacity-70"}`}
                            >
                                {isRefreshing ? (
                                    <ActivityIndicator size={12} color="#64748b" />
                                ) : (
                                    <MaterialIcons name="refresh" size={12} color="#64748b" />
                                )}
                                <Text className="text-slate-600 text-2xs font-bold ml-1">
                                    {isRefreshing ? "लोडिंग..." : "रिफ्रेश"}
                                </Text>
                            </Pressable>
                        </View>

                        <View className="mb-2 z-50">
                            {websites?.length > 0 && (
                                <Autocomplete
                                    data={gpOptions}
                                    value={searchGp}
                                    onChange={setSearchGp}
                                    onClear={() => {
                                        dispatch(setServerUrl(""));
                                        dispatch(setGp({ grampanchayat_name: "" }));
                                        saveServerUrl("");
                                        saveGpInfo(null);
                                    }}
                                    onSelect={(item) => {
                                        if (item) {
                                            dispatch(setGp({ grampanchayat_name: item.label }));
                                            dispatch(setServerUrl(item.value));
                                            saveGpInfo({ grampanchayat_name: item.label });
                                            saveServerUrl(item.value);
                                        }
                                    }}
                                    placeholder="शोधा..."
                                    getDisplayValue={(item) => item.label}
                                    maxDropdownHeight={200}
                                    maxEntries={1000}
                                />
                            )}
                        </View>

                        {serverUrl ? (
                            <View className="flex-row items-center mt-1.5 ml-1">
                                <Ionicons name="checkmark-circle" size={13} color="#10b981" />
                                <Text className="text-xs text-emerald-600 font-bold ml-1">ग्रामपंचायत निवडली आहे ✓</Text>
                            </View>
                        ) : (
                            <Text className="text-2xs text-rose-400 font-semibold mt-1 ml-1">
                                ⚠️ लॉगिन करण्यापूर्वी ग्रामपंचायत निवडणे आवश्यक आहे
                            </Text>
                        )}
                    </View>

                    {/* Segmented Mode Selector */}
                    <View className="mb-4">
                        <Text className="text-xs font-bold text-slate-400 mb-1.5 ml-1 uppercase tracking-wider">
                            कनेक्शन मोड
                        </Text>
                        <View className="flex-row bg-slate-100 p-1 rounded-xl">
                            <Pressable
                                onPress={() => setSelectedMode("online")}
                                style={{
                                    flex: 1,
                                    paddingVertical: 10,
                                    borderRadius: 8,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexDirection: "row",
                                    backgroundColor: selectedMode === "online" ? "#ffffff" : "transparent",
                                    shadowColor: "#000",
                                    shadowOffset: { width: 0, height: 1 },
                                    shadowOpacity: selectedMode === "online" ? 0.08 : 0,
                                    shadowRadius: 1.5,
                                    elevation: selectedMode === "online" ? 1 : 0,
                                }}
                            >
                                <Text className="text-sm mr-1">🌐</Text>
                                <Text
                                    style={{
                                        fontSize: 12,
                                        fontWeight: "800",
                                        color: selectedMode === "online" ? "#4f46e5" : "#64748b",
                                    }}
                                >
                                    ऑनलाईन (Online)
                                </Text>
                            </Pressable>
                            <Pressable
                                onPress={() => setSelectedMode("offline")}
                                style={{
                                    flex: 1,
                                    paddingVertical: 10,
                                    borderRadius: 8,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexDirection: "row",
                                    backgroundColor: selectedMode === "offline" ? "#ffffff" : "transparent",
                                    shadowColor: "#000",
                                    shadowOffset: { width: 0, height: 1 },
                                    shadowOpacity: selectedMode === "offline" ? 0.08 : 0,
                                    shadowRadius: 1.5,
                                    elevation: selectedMode === "offline" ? 1 : 0,
                                }}
                            >
                                <Text className="text-sm mr-1">📵</Text>
                                <Text
                                    style={{
                                        fontSize: 12,
                                        fontWeight: "800",
                                        color: selectedMode === "offline" ? "#d97706" : "#64748b",
                                    }}
                                >
                                    ऑफलाईन (Offline)
                                </Text>
                            </Pressable>
                        </View>
                    </View>

                    {/* Login Button */}
                    <Pressable
                        onPress={handleLogin}
                        className="w-full bg-indigo-600 rounded-xl py-3.5 items-center active:opacity-90 shadow-md shadow-indigo-600/10"
                    >
                        <Text className="text-white font-extrabold text-base tracking-wide">
                            लॉगिन करा
                        </Text>
                    </Pressable>
                </View>

                {/* Footer */}
                <View className="items-center pb-6">
                    <Text className="text-2xs text-slate-400 text-center">
                        © {new Date().getFullYear()} ग्राम डिजिटल प्रकल्प · v{app.version}
                    </Text>
                </View>

            </View>

            <OfflineDownloadModal
                isVisible={showOfflineModal}
                serverUrl={serverUrl}
                apiInstance={api}
                onComplete={() => {
                    setShowOfflineModal(false);
                    router.replace("/(tabs)");
                }}
                onCancel={() => {
                    setShowOfflineModal(false);
                    dispatch(logout());
                }}
            />
        </ScreenWrapper>
    );
};

export default LoginScreen;
