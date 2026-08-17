import ScreenWrapper from "@/components/custom/screens/ScreenWrapper";
import { dbService } from "@/services/db";
import { Feather, Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSelector } from "react-redux";
import OfflineDownloadModal from "@/components/custom/utils/OfflineDownloadModal";
import ServerImage from "@/components/custom/utils/ServerImage";
import { useApi } from "@/hooks/custom/useApi";

export default function OfflineDataScreen() {
    const router = useRouter();
    const serverUrl = useSelector((state) => state.connection.serverUrl);
    const [dharaks, setDharaks] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [showDownloadModal, setShowDownloadModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [selectedItem, setSelectedItem] = useState(null);
    const { api } = useApi();

    const loadData = async () => {
        setIsLoading(true);
        const data = await dbService.getAllLocalDharaks(serverUrl, 10000, 0); // Load all cached dharaks
        setDharaks(data || []);
        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [serverUrl]);

    // Reset pagination when search query changes
    const handleSearchChange = (text) => {
        setSearchQuery(text);
        setCurrentPage(1);
    };

    const filteredDharaks = dharaks.filter((item) => {
        const query = searchQuery.toLowerCase();
        return (
            (item.feu_ownerName && item.feu_ownerName.toLowerCase().includes(query)) ||
            (item.feu_malmattaNo && item.feu_malmattaNo.toString().includes(query))
        );
    });

    const effectiveLimit = Math.min(Math.max(parseInt(itemsPerPage, 10) || 20, 1), 1000);
    const totalPages = Math.max(Math.ceil(filteredDharaks.length / effectiveLimit), 1);
    const rawPage = typeof currentPage === "number" && currentPage > 0 ? currentPage : 1;
    const activePage = Math.min(rawPage, totalPages);
    const paginatedDharaks = filteredDharaks.slice(
        (activePage - 1) * effectiveLimit,
        activePage * effectiveLimit
    );

    const handleSelectItem = async (item) => {
        try {
            const details = await dbService.getLocalDharakDetails(item.id);
            setSelectedItem(details || item);
        } catch (e) {
            setSelectedItem(item);
        }
    };

    const renderItem = ({ item }) => (
        <Pressable
            onPress={() => handleSelectItem(item)}
            className="bg-white p-4 rounded-2xl shadow-sm mb-3 border border-slate-100 flex-row justify-between items-center active:bg-slate-50"
        >
            <View className="flex-1 pr-4">
                <Text className="text-slate-800 font-bold text-lg mb-1">{item.feu_ownerName}</Text>
                <View className="flex-row items-center">
                    <View className="bg-slate-100 px-2 py-0.5 rounded-md mr-2">
                        <Text className="text-slate-500 font-bold text-sm">मालमत्ता क्र.</Text>
                    </View>
                    <Text className="text-indigo-600 font-extrabold text-base">{item.feu_malmattaNo}</Text>
                </View>
            </View>
            <View className="flex-row items-center">
                <View className="bg-emerald-50 p-2 rounded-full border border-emerald-100 mr-2">
                    <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                </View>
                <Feather name="chevron-right" size={18} color="#94a3b8" />
            </View>
        </Pressable>
    );

    return (
        <ScreenWrapper>
            <Stack.Screen options={{ headerShown: false }} />
            <View className="flex-1 bg-slate-50">
                {/* Custom Modern Header */}
                <View className="bg-white px-6 pt-6 pb-5 rounded-b-3xl border-b border-slate-100 flex-row items-center justify-between shadow-sm">
                    <Pressable 
                        onPress={() => router.back()} 
                        className="p-2.5 bg-slate-50 rounded-2xl active:bg-slate-100 border border-slate-100"
                    >
                        <Feather name="arrow-left" size={20} color="#475569" />
                    </Pressable>
                    <Text className="text-2xl font-bold text-slate-800 flex-1 text-center mx-2">ऑफलाईन डेटा</Text>
                    <Pressable 
                        onPress={() => setShowDownloadModal(true)} 
                        className="p-2.5 bg-indigo-50 active:bg-indigo-100 rounded-2xl border border-indigo-100"
                    >
                        <Feather name="download-cloud" size={20} color="#4f46e5" />
                    </Pressable>
                </View>

                <View className="flex-1 px-5 pt-4">
                    {/* Search Bar */}
                    {dharaks.length > 0 && (
                        <View className="mb-3">
                            <View className="bg-white flex-row items-center px-4 rounded-2xl border border-slate-100 shadow-sm mb-3">
                                <Feather name="search" size={18} color="#94a3b8" />
                                <TextInput
                                    placeholder="नाव किंवा मालमत्ता क्रमांक शोधा..."
                                    placeholderTextColor="#94a3b8"
                                    value={searchQuery}
                                    onChangeText={handleSearchChange}
                                    className="flex-1 py-3.5 px-3 text-slate-800 text-base font-medium"
                                />
                                {searchQuery.length > 0 && (
                                    <Pressable onPress={() => handleSearchChange("")}>
                                        <Feather name="x-circle" size={18} color="#94a3b8" />
                                    </Pressable>
                                )}
                            </View>

                            {/* Top Pagination & Limit Controls Card */}
                            {filteredDharaks.length > 0 && (
                                <View className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                                    {/* Limit selector label + input */}
                                    <View className="flex-row items-center justify-between mb-2 px-1">
                                        <Text className="text-sm font-bold text-slate-500">
                                            नोंदी प्रति पान (Limit max 1000):
                                        </Text>
                                        <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-2 py-0.5">
                                            <TextInput
                                                keyboardType="number-pad"
                                                value={String(itemsPerPage)}
                                                onChangeText={(val) => {
                                                    const num = parseInt(val, 10);
                                                    if (isNaN(num) || num <= 0) {
                                                        setItemsPerPage(10);
                                                    } else {
                                                        setItemsPerPage(Math.min(num, 1000));
                                                    }
                                                    setCurrentPage(1);
                                                }}
                                                className="text-indigo-700 font-extrabold text-sm py-0.5 px-1 min-w-[32px] text-center"
                                                maxLength={4}
                                            />
                                            <Text className="text-sm text-slate-400 font-bold">नोंदी</Text>
                                        </View>
                                    </View>

                                    {/* Preset Limit Chips */}
                                    <View className="flex-row justify-between mb-2.5 bg-slate-100 p-1 rounded-xl">
                                        {[10, 25, 50, 100, 500, 1000].map((preset) => (
                                            <Pressable
                                                key={preset}
                                                onPress={() => {
                                                    setItemsPerPage(preset);
                                                    setCurrentPage(1);
                                                }}
                                                className={`flex-1 py-1 rounded-lg items-center justify-center ${
                                                    itemsPerPage === preset ? "bg-white shadow-xs" : ""
                                                }`}
                                            >
                                                <Text
                                                    className={`text-sm font-extrabold ${
                                                        itemsPerPage === preset ? "text-indigo-600" : "text-slate-500"
                                                    }`}
                                                >
                                                    {preset}
                                                </Text>
                                            </Pressable>
                                        ))}
                                    </View>

                                    {/* Pagination Buttons & Page Indicator */}
                                    <View className="flex-row items-center justify-between pt-2 border-t border-slate-100">
                                        <Pressable
                                            onPress={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                            className={`flex-row items-center px-3 py-1.5 rounded-xl border ${
                                                currentPage === 1
                                                    ? "bg-slate-50 border-slate-200 opacity-40"
                                                    : "bg-indigo-50 border-indigo-100 active:bg-indigo-100"
                                            }`}
                                        >
                                            <Feather name="chevron-left" size={16} color={currentPage === 1 ? "#94a3b8" : "#4f46e5"} />
                                            <Text className={`text-sm font-bold ml-1 ${currentPage === 1 ? "text-slate-400" : "text-indigo-600"}`}>
                                                मागे
                                            </Text>
                                        </Pressable>

                                        <View className="items-center">
                                            <View className="flex-row items-center">
                                                <Text className="text-sm font-extrabold text-slate-700 mr-1">पान</Text>
                                                <TextInput
                                                    keyboardType="number-pad"
                                                    value={String(currentPage)}
                                                    onChangeText={(val) => {
                                                        const num = parseInt(val, 10);
                                                        if (!isNaN(num) && num >= 1 && num <= totalPages) {
                                                            setCurrentPage(num);
                                                        } else if (val === "") {
                                                            setCurrentPage("");
                                                        }
                                                    }}
                                                    onBlur={() => {
                                                        const num = parseInt(currentPage, 10);
                                                        if (isNaN(num) || num < 1) setCurrentPage(1);
                                                        else if (num > totalPages) setCurrentPage(totalPages);
                                                    }}
                                                    className="bg-slate-100 border border-slate-300 rounded-lg px-2 py-0.5 text-center text-sm font-extrabold text-indigo-600 min-w-[36px]"
                                                    maxLength={4}
                                                />
                                                <Text className="text-sm font-extrabold text-slate-700 ml-1">/ {totalPages}</Text>
                                            </View>
                                            <Text className="text-xs text-slate-400 font-bold mt-0.5">
                                                ({((currentPage || 1) - 1) * effectiveLimit + 1} - {Math.min((currentPage || 1) * effectiveLimit, filteredDharaks.length)} / {filteredDharaks.length})
                                            </Text>
                                        </View>

                                        <Pressable
                                            onPress={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                            className={`flex-row items-center px-3 py-1.5 rounded-xl border ${
                                                currentPage === totalPages
                                                    ? "bg-slate-50 border-slate-200 opacity-40"
                                                    : "bg-indigo-50 border-indigo-100 active:bg-indigo-100"
                                            }`}
                                        >
                                            <Text className={`text-sm font-bold mr-1 ${currentPage === totalPages ? "text-slate-400" : "text-indigo-600"}`}>
                                                पुढे
                                            </Text>
                                            <Feather name="chevron-right" size={16} color={currentPage === totalPages ? "#94a3b8" : "#4f46e5"} />
                                        </Pressable>
                                    </View>
                                </View>
                            )}
                        </View>
                    )}

                    {isLoading ? (
                        <View className="flex-1 justify-center items-center">
                            <Text className="text-slate-500 font-semibold text-lg">माहिती लोड होत आहे...</Text>
                        </View>
                    ) : dharaks.length === 0 ? (
                        <View className="flex-1 items-center justify-center px-6">
                            <View className="bg-indigo-50 p-6 rounded-full mb-4">
                                <Feather name="database" size={48} color="#4f46e5" />
                            </View>
                            <Text className="text-slate-700 font-bold text-xl text-center mb-2">
                                डेटा डाउनलोड केलेला नाही
                            </Text>
                            <Text className="text-slate-400 text-base text-center mb-6 leading-5">
                                तुम्ही इंटरनेट नसतानाही काम करू शकावे यासाठी कृपया वरील डाउनलोड बटणावर क्लिक करून माहिती डाउनलोड करा.
                            </Text>
                            <Pressable
                                onPress={() => setShowDownloadModal(true)}
                                className="bg-indigo-600 px-6 py-3 rounded-2xl shadow-sm active:opacity-90"
                            >
                                <Text className="text-white font-bold text-lg">माहिती डाउनलोड करा</Text>
                            </Pressable>
                        </View>
                    ) : filteredDharaks.length === 0 ? (
                        <View className="flex-1 items-center justify-center">
                            <Feather name="search" size={40} color="#cbd5e1" />
                            <Text className="text-slate-400 text-lg mt-3 font-semibold">
                                जुळणारी कोणतीही माहिती सापडली नाही.
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={paginatedDharaks}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={renderItem}
                            contentContainerStyle={{ paddingBottom: 30 }}
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                </View>

                {/* Read-Only Property Detail Modal */}
                <Modal
                    visible={!!selectedItem}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setSelectedItem(null)}
                >
                    <View className="flex-1 bg-black/50 justify-end">
                        <View className="bg-slate-50 rounded-t-3xl max-h-[85%] overflow-hidden">
                            {/* Modal Header */}
                            <View className="bg-white px-6 py-4 border-b border-slate-100 flex-row items-center justify-between">
                                <View>
                                    <Text className="text-slate-400 font-bold text-sm uppercase tracking-wider">मालमत्ता सविस्तर माहिती</Text>
                                    <Text className="text-slate-800 font-extrabold text-xl">मालमत्ता क्र. {selectedItem?.feu_malmattaNo}</Text>
                                </View>
                                <Pressable
                                    onPress={() => setSelectedItem(null)}
                                    className="p-2 bg-slate-100 rounded-full active:bg-slate-200"
                                >
                                    <Feather name="x" size={20} color="#64748b" />
                                </Pressable>
                            </View>

                            <ScrollView className="p-5" showsVerticalScrollIndicator={false}>
                                {/* Photo Preview if available */}
                                {(selectedItem?.local_image_uri || selectedItem?.feu_image) ? (
                                    <View className="mb-4 rounded-2xl overflow-hidden border border-slate-200 bg-white">
                                        <ServerImage
                                            className="w-full h-48"
                                            imageClassName="w-full h-full"
                                            src={
                                                selectedItem.local_image_uri ||
                                                `/home_map_image/home_photo/${selectedItem.feu_image || `${selectedItem.feu_malmattaNo}.jpeg`}`
                                            }
                                        />
                                    </View>
                                ) : null}

                                {/* Owner Info Card */}
                                <View className="bg-white p-4 rounded-2xl border border-slate-100 mb-4 shadow-sm">
                                    <Text className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">धारक व वैयक्तिक माहिती</Text>
                                    <Text className="text-indigo-700 font-extrabold text-xl mb-1">{selectedItem?.feu_ownerName}</Text>
                                    
                                    {selectedItem?.feu_secondOwnerName ? (
                                        <Text className="text-slate-600 text-base font-medium mb-3">
                                            भोगवटदार: <Text className="font-bold text-slate-800">{selectedItem.feu_secondOwnerName}</Text>
                                        </Text>
                                    ) : null}

                                    <View className="h-px bg-slate-100 my-2" />

                                    <View className="flex-row flex-wrap mt-1">
                                        <View className="w-1/2 mb-3 pr-2">
                                            <Text className="text-sm text-slate-400 font-bold">मोबाईल क्र.</Text>
                                            <Text className="text-base font-bold text-slate-700">{selectedItem?.feu_mobileNo || "-"}</Text>
                                        </View>
                                        <View className="w-1/2 mb-3 pl-2">
                                            <Text className="text-sm text-slate-400 font-bold">आधार क्र.</Text>
                                            <Text className="text-base font-bold text-slate-700">{selectedItem?.feu_aadharNo || "-"}</Text>
                                        </View>
                                        <View className="w-1/2 mb-3 pr-2">
                                            <Text className="text-sm text-slate-400 font-bold">घर क्र. / वॉर्ड</Text>
                                            <Text className="text-base font-bold text-slate-700">
                                                {selectedItem?.feu_homeNo || "-"} (वॉर्ड: {selectedItem?.feu_wardNo || "-"})
                                            </Text>
                                        </View>
                                        <View className="w-1/2 mb-3 pl-2">
                                            <Text className="text-sm text-slate-400 font-bold">घरकुल योजना</Text>
                                            <Text className="text-base font-bold text-slate-700">{selectedItem?.feu_gharkulYojna || "-"}</Text>
                                        </View>
                                        <View className="w-1/2 mb-1 pr-2">
                                            <Text className="text-sm text-slate-400 font-bold">शौचालय</Text>
                                            <Text className="text-base font-bold text-slate-700">{selectedItem?.feu_havingToilet || "-"}</Text>
                                        </View>
                                        <View className="w-1/2 mb-1 pl-2">
                                            <Text className="text-sm text-slate-400 font-bold">गाव / ग्रामपंचायत</Text>
                                            <Text className="text-base font-bold text-slate-700">
                                                {selectedItem?.feu_villageName || selectedItem?.feu_gramPanchayet || "-"}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Area Details Card */}
                                <View className="bg-white p-4 rounded-2xl border border-slate-100 mb-4 shadow-sm">
                                    <Text className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">क्षेत्रफळ तपशील</Text>
                                    <View className="flex-row flex-wrap">
                                        <View className="w-1/2 mb-3 pr-2">
                                            <Text className="text-sm text-slate-400 font-bold">एकूण क्षेत्रफळ (चौ. फूट)</Text>
                                            <Text className="text-base font-extrabold text-indigo-600">{selectedItem?.feu_totalArea || "-"} चौ. फूट</Text>
                                        </View>
                                        <View className="w-1/2 mb-3 pl-2">
                                            <Text className="text-sm text-slate-400 font-bold">एकूण क्षेत्रफळ (चौ. मीटर)</Text>
                                            <Text className="text-base font-bold text-slate-700">{selectedItem?.feu_totalAreaSquareMeter || "-"} चौ. मी.</Text>
                                        </View>
                                        <View className="w-1/2 mb-1 pr-2">
                                            <Text className="text-sm text-slate-400 font-bold">लांबी x रुंदी</Text>
                                            <Text className="text-base font-bold text-slate-700">
                                                {selectedItem?.feu_areaHeight || "-"} x {selectedItem?.feu_areaWidth || "-"}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Landmarks Card */}
                                <View className="bg-white p-4 rounded-2xl border border-slate-100 mb-6 shadow-sm">
                                    <Text className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">चतुःसीमा (Landmarks)</Text>
                                    <View className="flex-row flex-wrap">
                                        <View className="w-1/2 mb-3 pr-2">
                                            <Text className="text-sm text-slate-400 font-bold">पूर्व दिशा</Text>
                                            <Text className="text-base font-semibold text-slate-700">{selectedItem?.feu_eastLandmark || "-"}</Text>
                                        </View>
                                        <View className="w-1/2 mb-3 pl-2">
                                            <Text className="text-sm text-slate-400 font-bold">पश्चिम दिशा</Text>
                                            <Text className="text-base font-semibold text-slate-700">{selectedItem?.feu_westLandmark || "-"}</Text>
                                        </View>
                                        <View className="w-1/2 mb-1 pr-2">
                                            <Text className="text-sm text-slate-400 font-bold">उत्तर दिशा</Text>
                                            <Text className="text-base font-semibold text-slate-700">{selectedItem?.feu_northLandmark || "-"}</Text>
                                        </View>
                                        <View className="w-1/2 mb-1 pl-2">
                                            <Text className="text-sm text-slate-400 font-bold">दक्षिण दिशा</Text>
                                            <Text className="text-base font-semibold text-slate-700">{selectedItem?.feu_southLandmark || "-"}</Text>
                                        </View>
                                    </View>
                                </View>
                            </ScrollView>
                        </View>
                    </View>
                </Modal>

                {/* Download Modal */}
                <OfflineDownloadModal
                    isVisible={showDownloadModal}
                    serverUrl={serverUrl}
                    apiInstance={api}
                    onComplete={() => {
                        setShowDownloadModal(false);
                        loadData(); // Refresh list after download
                    }}
                    onCancel={() => {
                        setShowDownloadModal(false);
                    }}
                />
            </View>
        </ScreenWrapper>
    );
}
