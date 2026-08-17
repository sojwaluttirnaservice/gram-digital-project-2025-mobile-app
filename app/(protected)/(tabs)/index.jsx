import Autocomplete from "@/components/custom/form/Autocomplete";
import FileInput from "@/components/custom/form/FileInput";
import Label from "@/components/custom/form/Label";
import ScreenWrapper from "@/components/custom/screens/ScreenWrapper";
import { H3 } from "@/components/custom/typography/Heading";
import Card from "@/components/custom/utils/Card";
import ServerImage from "@/components/custom/utils/ServerImage";
import { useApi } from "@/hooks/custom/useApi";
import useCompress from "@/hooks/custom/useCompress";
import { openInGoogleMaps } from "@/hooks/utils/maps";
import { dbService } from "@/services/db";
import { syncOfflineData } from "@/services/sync";
import { Feather } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSelector } from "react-redux";



const HomeScreen = () => {
    const gp = useSelector((state) => state.gp);
    const user = useSelector((state) => state.user);
    const isConnected = useSelector((state) => state.connection.isConnected);
    const serverUrl = useSelector((state) => state.connection.serverUrl);

    // Utility
    const { api } = useApi();
    const { compressImage } = useCompress();
    const router = useRouter();

    // States
    const [searchText, setSearchText] = useState("");
    const [searchTypeOfUser, setSearchTypeOfUser] = useState("2");
    const [isLoading, setIsLoading] = useState(false);
    const [idLabelPairs, setIdLabelPairs] = useState([]);

    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [selectedMalmattaDharak, setSelectedMalmattaDharak] = useState(null);
    const [selectedHomeImage, setSelectedHomeImage] = useState(null);

    const [pendingCount, setPendingCount] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);

    const updatePendingCount = async () => {
        try {
            const count = await dbService.getPendingUploadsCount();
            setPendingCount(count);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        updatePendingCount();
    }, []);

    const handleFileChange = (file) => {
        setSelectedHomeImage(file);
    };

    const handleHomeImageUpload = async () => {
        if (!selectedHomeImage) {
            Alert.alert("Please select a file first");
            return;
        }

        setIsUploadingImage(true);
        try {
            const compressed = await compressImage(selectedHomeImage.uri);
            const fileName = selectedHomeImage.name || "upload.jpg";

            let location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Highest,
                maximumAge: 5000,
                timeout: 15000,
            });

            const timestampUTC = new Date(location.timestamp);
            const offsetIST = 5.5 * 60 * 60 * 1000;
            const istTimestamp = new Date(timestampUTC.getTime() + offsetIST);
            const timestampStr = istTimestamp.toISOString().replace("Z", "+05:30");
            const locationGeoJson = JSON.stringify({
                type: "Point",
                coordinates: [location.coords.longitude, location.coords.latitude],
            });

            const uploadPayload = {
                malmatta_number: selectedMalmattaDharak.feu_malmattaNo,
                user_id: user.id,
                username: user.username,
                local_image_uri: compressed.uri,
                mime_type: selectedHomeImage.mimeType || "image/jpeg",
                file_name: fileName,
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                accuracy: location.coords.accuracy,
                altitude: location.coords.altitude,
                altitude_accuracy: location.coords.altitudeAccuracy,
                heading: location.coords.heading,
                speed: location.coords.speed,
                timestamp: timestampStr,
                location_geojson: locationGeoJson,
            };

            if (isConnected) {
                const formData = new FormData();
                formData.append("homeImage", {
                    uri: compressed.uri,
                    name: fileName || "upload.jpg",
                    type: selectedHomeImage.mimeType || "application/octet-stream",
                });

                formData.append("id", selectedMalmattaDharak.id);
                formData.append("malmatta_number", selectedMalmattaDharak.feu_malmattaNo);
                formData.append("home_image_upload_person_user_id", user.id);
                formData.append("home_image_upload_person_username", user.username);

                formData.append("home_image_latitude", location.coords.latitude);
                formData.append("home_image_longitude", location.coords.longitude);
                formData.append("home_image_accuracy", location.coords.accuracy);
                formData.append("home_image_altitude", location.coords.altitude);
                formData.append("home_image_altitude_accuracy", location.coords.altitudeAccuracy);
                formData.append("home_image_heading", location.coords.heading);
                formData.append("home_image_speed", location.coords.speed);
                formData.append("home_image_timestamp", timestampStr);
                formData.append("home_image_location", locationGeoJson);

                let { success, message } = await api.put("/form-8/update-home-image", formData);

                if (success) {
                    Alert.alert("यशस्वी", message || "फोटो यशस्वीरित्या अपलोड झाला!");
                    setSelectedHomeImage(null);
                    setSelectedMalmattaDharak((prev) => (prev ? { ...prev, local_image_uri: null } : null));
                    await handleSearchUser(selectedMalmattaDharak.id);
                } else {
                    Alert.alert("अपलोड अयशस्वी", message || "फोटो अपलोड करताना त्रुटी आली.");
                }
            } else {
                await dbService.queueOfflineUpload(serverUrl, selectedMalmattaDharak.id, uploadPayload);
                Alert.alert(
                    "ऑफलाईन सेव्ह केले",
                    "फोटो मोबाईलमध्ये सेव्ह झाला आहे. इंटरनेट आल्यावर तो आपोआप अपलोड होईल.",
                );

                setSelectedMalmattaDharak((prev) => ({
                    ...prev,
                    local_image_uri: compressed.uri,
                    home_image_latitude: location.coords.latitude,
                    home_image_longitude: location.coords.longitude,
                }));
                setSelectedHomeImage(null);
                updatePendingCount();
            }
        } catch (err) {
            console.error("Upload error:", err);
            Alert.alert("कृपया पुन्हा प्रयत्न करा.");
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handleClearSearch = () => {
        setSearchText("");
        setIdLabelPairs([]);
        setSelectedMalmattaDharak(null);
        setSelectedHomeImage(null);
    };

    const handleMalmattaDharakSearch = async (queryText) => {
        try {
            setSearchText(queryText);
            if (!queryText) {
                setIdLabelPairs([]);
                setIsLoading(false);
                return;
            }
            setIsLoading(true);

            if (isConnected) {
                const { call: idLabelPairs } = await api.post("/get-user-info", {
                    q: queryText,
                    sType: searchTypeOfUser,
                });
                setIdLabelPairs(idLabelPairs || []);
            } else {
                const results = await dbService.searchLocalDharaks(serverUrl, queryText, searchTypeOfUser);
                setIdLabelPairs(results);
            }
        } catch (err) {
            console.error(err?.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearchUser = async (f8UserId) => {
        try {
            if (isConnected) {
                const { data: malmattaDharakDetails } = await api.post("/form-8/getSingleUserDetails", {
                    id: f8UserId,
                });
                setSelectedMalmattaDharak(malmattaDharakDetails);
                setSelectedHomeImage(null);

                if (serverUrl && malmattaDharakDetails) {
                    await dbService.cacheDharak(serverUrl, malmattaDharakDetails);
                }
            } else {
                const localDetails = await dbService.getLocalDharakDetails(f8UserId);
                if (localDetails) {
                    setSelectedMalmattaDharak(localDetails);
                } else {
                    Alert.alert("माहिती उपलब्ध नाही", "ही मालमत्ता स्थानिक डेटाबेसमध्ये उपलब्ध नाही.");
                }
                setSelectedHomeImage(null);
            }
        } catch (err) {
            console.log(err);
        }
    };

    useEffect(() => {
        if (searchText) handleMalmattaDharakSearch(searchText);
    }, [searchTypeOfUser]);

    return (
        <ScreenWrapper>
            {/* Connection and Sync Banners */}
            <View className="bg-white border-b border-slate-200 z-50">
                {!isConnected && (
                    <TouchableOpacity 
                        onPress={() => router.push('/queue')} 
                        className="bg-amber-50 border-b border-amber-100 px-4 py-3 flex-row items-center justify-between"
                    >
                        <View className="flex-row items-center flex-1 pr-2">
                            <Feather name="wifi-off" size={16} color="#d97706" className="mr-2" />
                            <Text className="text-amber-800 font-bold text-sm">
                                ऑफलाईन मोड (माहिती स्थानिक पातळीवर सेव्ह होईल)
                            </Text>
                        </View>
                        {pendingCount > 0 && (
                            <View className="bg-amber-500/10 px-2.5 py-1 rounded-full">
                                <Text className="text-amber-700 text-sm font-bold">
                                    {pendingCount} बाकी
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                )}
                {isConnected && pendingCount > 0 && (
                    <View className="bg-indigo-50 border-b border-indigo-100 px-4 py-2.5 flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1">
                            <Feather name="refresh-cw" size={14} color="#4f46e5" className="mr-2" />
                            <Text className="text-indigo-800 font-medium text-sm">
                                {isSyncing ? "माहिती अपलोड होत आहे..." : `${pendingCount} प्रलंबित माहिती अपलोड करायची आहे`}
                            </Text>
                        </View>
                        {!isSyncing && (
                            <TouchableOpacity
                                onPress={async () => {
                                    setIsSyncing(true);
                                    await syncOfflineData(() => updatePendingCount());
                                    setIsSyncing(false);
                                    updatePendingCount();
                                }}
                                className="bg-indigo-600 px-3.5 py-1.5 rounded-lg"
                            >
                                <Text className="text-white text-sm font-extrabold">अपलोड करा</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>

            {/* Content Scroll Area */}
            <ScrollView className="bg-slate-50" contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
                {/* Gram Panchayat Banner */}
                <View className="px-4 pt-4 pb-3">
                    <View className="bg-indigo-50/50 rounded-2xl py-3 px-4 border border-indigo-50">
                        <Text className="text-sm text-center text-slate-400 font-bold uppercase tracking-wider mb-1">
                            सक्रिय गाव / ग्रामपंचायत
                        </Text>
                        <H3 className="text-xl text-center text-indigo-700 font-black tracking-wide">
                            {gp?.grampanchayat_name || "-"}
                        </H3>
                    </View>
                </View>

                {/* Styled Search Criteria Pills & Autocomplete Search */}
                <View className="px-4 pb-4">
                    <View className="mb-3">
                        <Text className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">
                            शोध पर्याय (Search Criteria)
                        </Text>
                        <View className="flex-row bg-slate-100 p-1 rounded-xl">
                            {[
                                { label: "मालमत्ता क्र.", value: "2" },
                                { label: "धारक नाव", value: "1" },
                                { label: "भोगवटदार", value: "3" }
                            ].map((opt) => (
                                <Pressable
                                    key={opt.value}
                                    onPress={() => {
                                        setSearchTypeOfUser(opt.value);
                                        handleClearSearch();
                                    }}
                                    style={{
                                        flex: 1,
                                        paddingVertical: 8,
                                        borderRadius: 8,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        backgroundColor: searchTypeOfUser === opt.value ? "#ffffff" : "transparent",
                                        shadowColor: "#000",
                                        shadowOffset: { width: 0, height: 1 },
                                        shadowOpacity: searchTypeOfUser === opt.value ? 0.08 : 0,
                                        shadowRadius: 1.5,
                                        elevation: searchTypeOfUser === opt.value ? 1 : 0,
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 11,
                                            fontWeight: "800",
                                            color: searchTypeOfUser === opt.value ? "#4f46e5" : "#64748b",
                                        }}
                                    >
                                        {opt.label}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    <Autocomplete
                        value={searchText}
                        onChange={handleMalmattaDharakSearch}
                        onSelect={(item) => handleSearchUser(item.id)}
                        onClear={handleClearSearch}
                        data={idLabelPairs}
                        placeholder={
                            searchTypeOfUser === "2"
                                ? "उदा. १२३..."
                                : searchTypeOfUser === "1"
                                ? "उदा. रमेश..."
                                : "उदा. सुरेश..."
                        }
                        inputStyle={{
                            borderWidth: 1,
                            borderColor: "#cbd5e1",
                            borderRadius: 12,
                            paddingHorizontal: 14,
                            height: 48,
                            backgroundColor: "#f8fafc",
                            fontSize: 14,
                        }}
                        loading={isLoading}
                        listClass="rounded-xl border border-slate-200 shadow-lg mt-1 max-h-60"
                        getDisplayValue={(item) => item.label}
                        renderItem={({ item, onSelect }) => (
                            <TouchableOpacity 
                                onPress={onSelect} 
                                className="px-4 py-3.5 border-b border-slate-100"
                            >
                                <View className="flex-row justify-between items-center mb-1">
                                    <Text className="text-slate-800 font-extrabold text-base">
                                        मा. क्र. {item.feu_malmattaNo}
                                    </Text>
                                    <View className="bg-slate-100 px-2 py-0.5 rounded">
                                        <Text className="text-slate-500 text-sm font-bold">आयडी: {item.id}</Text>
                                    </View>
                                </View>
                                <Text className="text-slate-500 text-sm font-semibold">
                                    धारक: {item.feu_ownerName}
                                </Text>
                            </TouchableOpacity>
                        )}
                        renderEmpty={() => (
                            <View className="p-4 items-center">
                                <Text className="text-slate-400 text-sm font-semibold">
                                    कोणतेही रेकॉर्ड सापडले नाही
                                </Text>
                            </View>
                        )}
                    />
                </View>

                <View className="px-4 py-4">
                    {selectedMalmattaDharak ? (
                        <View className="flex flex-col gap-4">

                            {/* ---------------- Name Header ---------------- */}
                            <Card className="p-4 border border-slate-100 rounded-2xl bg-white shadow-sm shadow-slate-200">
                                <Text className="text-slate-500 text-sm font-semibold mb-1">मालमत्ता धारकाचे नाव</Text>
                                <Text className="text-indigo-700 font-extrabold text-2xl">
                                    {selectedMalmattaDharak.feu_ownerName}
                                </Text>
                                {selectedMalmattaDharak.feu_secondOwnerName ? (
                                    <Text className="text-slate-500 text-base mt-1">
                                        भोगवटदार: {selectedMalmattaDharak.feu_secondOwnerName}
                                    </Text>
                                ) : null}
                            </Card>

                            {/* ---------------- घराचा फोटो + Upload ---------------- */}
                            <Card className="border border-slate-100 rounded-2xl bg-white shadow-sm shadow-slate-200 overflow-hidden">
                                <View className="border-b border-slate-100 rounded-xl overflow-hidden">
                                    <ServerImage
                                        className="w-full h-56"
                                        imageClassName="w-full h-full"
                                        src={
                                            selectedMalmattaDharak.local_image_uri ||
                                            `/home_map_image/home_photo/${selectedMalmattaDharak.feu_image || `${selectedMalmattaDharak.feu_malmattaNo}.jpeg`}`
                                        }
                                        loading="lazy"
                                    />
                                </View>

                                <View className="p-4">
                                    <Label className="mb-2 text-sm font-bold text-slate-400 uppercase tracking-wider">नवीन फोटो निवडा</Label>
                                    <FileInput value={selectedHomeImage} onChange={handleFileChange} />

                                    <TouchableOpacity
                                        onPress={handleHomeImageUpload}
                                        style={{
                                            backgroundColor: "#4f46e5",
                                            paddingVertical: 13,
                                            borderRadius: 12,
                                            alignItems: "center",
                                            marginTop: 12,
                                        }}
                                        disabled={isUploadingImage}
                                    >
                                        <Text style={{ color: "#fff", fontWeight: "800", fontSize: 14 }}>
                                            {isUploadingImage ? "अपलोड होत आहे..." : "फोटो अपलोड करा"}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </Card>

                            {/* ---------------- मालकाची माहिती ---------------- */}
                            <Card className="p-5 border border-slate-100 rounded-2xl bg-white shadow-sm shadow-slate-200">
                                <Text className="font-extrabold text-xl text-indigo-700 mb-4 border-b-2 border-indigo-100 pb-2">
                                    मालकाची माहिती
                                </Text>
                                <View className="space-y-4">
                                    <View className="flex-row justify-between border-b border-slate-100 pb-3">
                                        <View className="w-1/2 pr-3">
                                            <Label className="text-slate-500 text-sm font-semibold">मोबाईल क्रमांक</Label>
                                            <Text className="text-slate-900 mt-1 font-bold text-lg">{selectedMalmattaDharak.feu_mobileNo || "-"}</Text>
                                        </View>
                                        <View className="w-1/2">
                                            <Label className="text-slate-500 text-sm font-semibold">आधार क्रमांक</Label>
                                            <Text className="text-slate-900 mt-1 font-bold text-lg">{selectedMalmattaDharak.feu_aadharNo || "-"}</Text>
                                        </View>
                                    </View>
                                    <View className="flex-row justify-between">
                                        <View className="w-1/2 pr-3">
                                            <Label className="text-slate-500 text-sm font-semibold">घरकुल योजना</Label>
                                            <Text className="text-slate-900 mt-1 font-bold text-lg">{selectedMalmattaDharak.feu_gharkulYojna || "-"}</Text>
                                        </View>
                                        <View className="w-1/2">
                                            <Label className="text-slate-500 text-sm font-semibold">शौचालय</Label>
                                            <Text className="text-slate-900 mt-1 font-bold text-lg">{selectedMalmattaDharak.feu_havingToilet || "-"}</Text>
                                        </View>
                                    </View>
                                </View>
                                <View className="mt-5 pt-4 border-t border-slate-200">
                                    <TouchableOpacity
                                        disabled={!(selectedMalmattaDharak?.home_image_latitude && selectedMalmattaDharak?.home_image_longitude)}
                                        onPress={() => openInGoogleMaps(selectedMalmattaDharak?.home_image_latitude, selectedMalmattaDharak?.home_image_longitude)}
                                        style={{
                                            backgroundColor: (selectedMalmattaDharak?.home_image_latitude && selectedMalmattaDharak?.home_image_longitude) ? "#4f46e5" : "#e2e8f0",
                                            paddingVertical: 12, borderRadius: 12, alignItems: "center", flexDirection: "row", justifyContent: "center"
                                        }}
                                    >
                                        <Feather name="map" size={16} color={(selectedMalmattaDharak?.home_image_latitude && selectedMalmattaDharak?.home_image_longitude) ? "#ffffff" : "#94a3b8"} className="mr-2" />
                                        <Text style={{ color: (selectedMalmattaDharak?.home_image_latitude && selectedMalmattaDharak?.home_image_longitude) ? "#ffffff" : "#64748b", fontWeight: "800", fontSize: 13 }}>
                                            {selectedMalmattaDharak?.home_image_latitude && selectedMalmattaDharak?.home_image_longitude ? "नकाशावर पहा (Google Maps)" : "नकाशाचे स्थान उपलब्ध नाही"}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </Card>

                        {/* ---------------- मालमत्ता माहिती ---------------- */}
                            <Card className="p-5 border border-slate-100 rounded-2xl bg-white shadow-sm shadow-slate-200">
                                <Text className="font-extrabold text-xl text-indigo-700 mb-4 border-b-2 border-indigo-100 pb-2">
                                    मालमत्ता माहिती
                                </Text>

                                <View className="space-y-4">
                                    <View className="flex-row justify-between border-b border-slate-100 pb-3">
                                        <View className="w-1/2 pr-3">
                                            <Label className="text-slate-500 text-sm font-semibold">अनु क्र.</Label>
                                            <Text className="text-slate-900 mt-1 font-bold text-lg">
                                                {selectedMalmattaDharak.id}
                                            </Text>
                                        </View>
                                        <View className="w-1/2">
                                            <Label className="text-slate-500 text-sm font-semibold">घर क्रमांक</Label>
                                            <Text className="text-slate-900 mt-1 font-bold text-lg">
                                                {selectedMalmattaDharak.feu_homeNo}
                                            </Text>
                                        </View>
                                    </View>

                                    <View className="flex-row justify-between">
                                        <View className="w-1/2 pr-3">
                                            <Label className="text-slate-500 text-sm font-semibold">मालमत्ता क्रमांक</Label>
                                            <Text className="text-slate-900 mt-1 font-bold text-lg">
                                                {selectedMalmattaDharak.feu_malmattaNo}
                                            </Text>
                                        </View>
                                        <View className="w-1/2">
                                            <Label className="text-slate-500 text-sm font-semibold">वार्ड क्रमांक</Label>
                                            <Text className="text-slate-900 mt-1 font-bold text-lg">
                                                {selectedMalmattaDharak.feu_wardNo || "-"}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </Card>

                            {/* ---------------- जागेची माहिती ---------------- */}
                            <Card className="p-5 border border-slate-100 rounded-2xl bg-white shadow-sm shadow-slate-200">
                                <Text className="font-extrabold text-xl text-indigo-700 mb-4 border-b-2 border-indigo-100 pb-2">
                                    जागेची माहिती
                                </Text>

                                <View className="space-y-4">
                                    <View className="flex-row justify-between">
                                        <View className="w-1/2 pr-3">
                                            <Label className="text-slate-500 text-sm font-semibold">ग्रामपंचायत</Label>
                                            <Text className="text-slate-900 mt-1 font-bold text-lg">
                                                {selectedMalmattaDharak.feu_gramPanchayet || "-"}
                                            </Text>
                                        </View>
                                        <View className="w-1/2">
                                            <Label className="text-slate-500 text-sm font-semibold">गावाचे नाव</Label>
                                            <Text className="text-slate-900 mt-1 font-bold text-lg">
                                                {selectedMalmattaDharak.feu_villageName || "-"}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </Card>

                            {/* ---------------- क्षेत्रफळ माहिती ---------------- */}
                            <Card className="p-5 border border-slate-100 rounded-2xl bg-white shadow-sm shadow-slate-200">
                                <Text className="font-extrabold text-xl text-indigo-700 mb-4 border-b-2 border-indigo-100 pb-2">
                                    क्षेत्रफळ माहिती
                                </Text>
                                <View className="space-y-4">
                                    <View className="flex-row justify-between border-b border-slate-100 pb-3">
                                        <View className="w-1/2 pr-3">
                                            <Label className="text-slate-500 text-sm font-semibold">लांबी (फुट)</Label>
                                            <Text className="text-slate-900 mt-1 font-bold text-lg">
                                                {selectedMalmattaDharak.feu_areaHeight}
                                            </Text>
                                        </View>
                                        <View className="w-1/2">
                                            <Label className="text-slate-500 text-sm font-semibold">रुंदी (फुट)</Label>
                                            <Text className="text-slate-900 mt-1 font-bold text-lg">
                                                {selectedMalmattaDharak.feu_areaWidth}
                                            </Text>
                                        </View>
                                    </View>

                                    <View className="flex-row justify-between">
                                        <View className="w-1/2 pr-3">
                                            <Label className="text-slate-500 text-sm font-semibold">एकूण क्षेत्रफळ (फुट)</Label>
                                            <Text className="text-slate-900 mt-1 font-bold text-lg">
                                                {selectedMalmattaDharak.feu_totalArea}
                                            </Text>
                                        </View>
                                        <View className="w-1/2">
                                            <Label className="text-slate-500 text-sm font-semibold">एकूण क्षेत्रफळ (मी.)</Label>
                                            <Text className="text-slate-900 mt-1 font-bold text-lg">
                                                {selectedMalmattaDharak.feu_totalAreaSquareMeter}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </Card>

                            {/* ---------------- दिशा माहिती ---------------- */}
                            <Card className="p-5 border border-slate-100 rounded-2xl bg-white shadow-sm shadow-slate-200">
                                <Text className="font-extrabold text-xl text-indigo-700 mb-4 border-b-2 border-indigo-100 pb-2">
                                    दिशा माहिती
                                </Text>

                                <View className="space-y-4">
                                    <View className="flex-row justify-between border-b border-slate-100 pb-3">
                                        <View className="w-1/2 pr-3">
                                            <Label className="text-slate-500 text-sm font-semibold">पूर्वेस</Label>
                                            <Text className="text-slate-900 mt-1 font-bold text-lg">
                                                {selectedMalmattaDharak.feu_eastLandmark || "-"}
                                            </Text>
                                        </View>
                                        <View className="w-1/2">
                                            <Label className="text-slate-500 text-sm font-semibold">पश्चिमेस</Label>
                                            <Text className="text-slate-900 mt-1 font-bold text-lg">
                                                {selectedMalmattaDharak.feu_westLandmark || "-"}
                                            </Text>
                                        </View>
                                    </View>

                                    <View className="flex-row justify-between border-b border-slate-100 pb-3">
                                        <View className="w-1/2 pr-3">
                                            <Label className="text-slate-500 text-sm font-semibold">उत्तरेस</Label>
                                            <Text className="text-slate-900 mt-1 font-bold text-lg">
                                                {selectedMalmattaDharak.feu_northLandmark || "-"}
                                            </Text>
                                        </View>
                                        <View className="w-1/2">
                                            <Label className="text-slate-500 text-sm font-semibold">दक्षिणेस</Label>
                                            <Text className="text-slate-900 mt-1 font-bold text-lg">
                                                {selectedMalmattaDharak.feu_southLandmark || "-"}
                                            </Text>
                                        </View>
                                    </View>

                                    <View>
                                        <Label className="text-slate-500 text-sm font-semibold">बोजा / शेरा</Label>
                                        <Text className="text-slate-900 mt-1 font-bold text-lg">
                                            {selectedMalmattaDharak.feu_bojaShera || "-"}
                                        </Text>
                                    </View>
                                </View>
                            </Card>

                            </View>
                    ) : (
                        // Styled Empty State
                        <View className="bg-white border border-slate-100 rounded-3xl p-8 items-center shadow-sm mt-4">
                            <View className="bg-indigo-50 p-5 rounded-full mb-4">
                                <Feather name="search" size={40} color="#4f46e5" />
                            </View>
                            <Text className="text-slate-800 font-extrabold text-lg text-center mb-2">
                                शोध सुरू करा
                            </Text>
                            <Text className="text-slate-400 text-sm text-center leading-5 max-w-[260px]">
                                वरील शोधपेटीत निवडीनुसार मालमत्ता क्रमांक किंवा नाव टाईप करून माहिती शोधा.
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
};

export default HomeScreen;
