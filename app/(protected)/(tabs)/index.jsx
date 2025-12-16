import Autocomplete from "@/components/custom/form/Autocomplete";
import { TouchableOpacityButton } from "@/components/custom/form/Button";
import FileInput from "@/components/custom/form/FileInput";
import Label from "@/components/custom/form/Label";
import ScreenWrapper from "@/components/custom/screens/ScreenWrapper";
import { H3, H5 } from "@/components/custom/typography/Heading";
import Card from "@/components/custom/utils/Card";
import ServerImage from "@/components/custom/utils/ServerImage";
import { useApi } from "@/hooks/custom/useApi";
import useCompress from "@/hooks/custom/useCompress";
import { openInGoogleMaps } from "@/hooks/utils/maps";
import { Picker } from '@react-native-picker/picker';
import * as Location from 'expo-location';
import { useEffect, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSelector } from "react-redux";

const HomeScreen = () => {

    const gp = useSelector(state => state.gp)

    // Utility
    const { api } = useApi()
    const { compressImage } = useCompress()

    // States
    const [searchText, setSearchText] = useState("");
    // 1 => by मालमत्ता धारक नाव (feu_ownerName)
    // 2 => by मालमत्ता क्रमांक (feu_malmattaNo)
    // 3 => by भोगवटदार (feu_secondOwnerName)
    // default => by id (Primary key)
    const [searchTypeOfUser, setSearchTypeOfUser] = useState('2')
    const [isLoading, setIsLoading] = useState(false);
    const [idLabelPairs, setIdLabelPairs] = useState([]);

    const [isUploadingImage, setIsUploadingImage] = useState(false)

    const [selectedMalmattaDharak, setSelectedMalmattaDharak] = useState(null)
    const [selectedHomeImage, setSelectedHomeImage] = useState(null)

    const user = useSelector(state => state.user)

    const handleFileChange = (file) => {
        setSelectedHomeImage(file); // { uri, name, size, mimeType, kind }
    };

    const handleHomeImageUpload = async () => {

        if (!selectedHomeImage) {
            Alert.alert("Please select a file first");
            return;
        }

        setIsUploadingImage(true)
        const compressed = await compressImage(selectedHomeImage.uri)
        const fileName = selectedHomeImage.name || 'upload.jpg';


        let location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Highest,
            maximumAge: 5000,                    // use cached result if less than 5s old
            timeout: 15000                        // wait up to 15 seconds before failing
        })

        const formData = new FormData();
        formData.append("homeImage", {
            uri: compressed.uri,
            name: fileName || "upload.jpg",
            type: selectedHomeImage.mimeType || "application/octet-stream",
        });

        formData.append('id', selectedMalmattaDharak.id)
        formData.append('malmatta_number', selectedMalmattaDharak.feu_malmattaNo)
        formData.append('home_image_upload_person_user_id', user.id)
        formData.append('home_image_upload_person_username', user.username)

        // Basic GPS fields
        formData.append("home_image_latitude", location.coords.latitude);
        formData.append("home_image_longitude", location.coords.longitude);

        // Extra GPS metadata fields
        formData.append("home_image_accuracy", location.coords.accuracy);
        formData.append("home_image_altitude", location.coords.altitude);
        formData.append("home_image_altitude_accuracy", location.coords.altitudeAccuracy);
        formData.append("home_image_heading", location.coords.heading);
        formData.append("home_image_speed", location.coords.speed);

        const timestampUTC = new Date(location.timestamp);
        const offsetIST = 5.5 * 60 * 60 * 1000; // +05:30 hours
        const istTimestamp = new Date(timestampUTC.getTime() + offsetIST);

        formData.append("home_image_timestamp", istTimestamp.toISOString().replace("Z", "+05:30"));

        // Geometry field (WKT or GeoJSON string — backend will parse it)
        formData.append(
            "home_image_location",
            JSON.stringify({
                type: "Point",
                coordinates: [location.coords.longitude, location.coords.latitude],
            })
        );

        try {

            let { success, message } = await api.put('/form-8/update-home-image', formData)

            if (success) {
                Alert.alert(message)
                handleSearchUser(selectedMalmattaDharak.id)
            }
        } catch (err) {
            console.error("Upload error:", err);
            Alert.alert("Retry Again.")
        } finally {
            setIsUploadingImage(false)
        }
    };

    /**
     * Searches Malmatta Dharaks by Malmatta Number.
     * Returns all dharaks whose number includes the entered digits.
     *
     * Example:
     *   Input: "1" → Results: 1, 10, 11, 12 (if present)
     *
     * @param {string|number} malmattaNumber - The number typed in the search bar.
     */

    const handleMalmattaDharakSearch = async (queryText) => {
        try {

            setSearchText(queryText);
            setIsLoading(true);

            // HERE, q = Query and sType = Search Type
            const { call: idLabelPairs } = await api.post('/get-user-info', {
                q: queryText,
                sType: searchTypeOfUser
            });

            setIdLabelPairs(idLabelPairs || []);

        } catch (err) {
            console.error(err?.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearchUser = async (f8UserId) => {
        try {
            const { data: malmattaDharakDetails } = await api.post('/form-8/getSingleUserDetails', { id: f8UserId })

            setSelectedMalmattaDharak(malmattaDharakDetails)
            setSelectedHomeImage(null)

        } catch (err) {
            console.log(err)
            // Alert.alert('error first', err)
            // Alert.alert('err second', err.message)
        }
    };


    useEffect(()=>{
        if(searchText)
            handleMalmattaDharakSearch(searchText)
    }, [searchTypeOfUser])


    return (
        <ScreenWrapper>


            <View className='sticky top-0 px-2 bg-white border-b-2 border-gray-400 py-2'>
                <View className='bg-white border-b border-b-gray-300 pt-2 pb-4'>
                    <View className="">
                        <H3 className="text-2xl text-center text-indigo-600 font-extrabold tracking-wide">
                            ग्रामपंचायत {gp?.grampanchayat_name || '-'}
                        </H3>
                    </View>
                </View>

                <Label className="text-lg text-center">मालमत्ता क्रमांक टाकून धारक शोधा.</Label>

                <View className='mb-4'>
                    <Text className='mb-2 font-bold'>
                        शोधण्याचा निकष
                    </Text>

                    <View className="border border-[#1E88E5] rounded-lg bg-white overflow-hidden">
                        <Picker
                            selectedValue={searchTypeOfUser}
                            onValueChange={(value) => setSearchTypeOfUser(value)}
                            dropdownIconColor="#1E88E5"
                            style={{
                                color: "#111827", // Tailwind doesn't apply color to Picker text directly
                                backgroundColor: "white",
                            }}
                        >
                            <Picker.Item label="-- निवडा --" value="" />
                            <Picker.Item label="मालमत्ताधारक नाव" value="1" />
                            <Picker.Item label="मालमत्ता क्रमांक" value="2" />
                            <Picker.Item label="भोगवटदाराचे नाव" value="3" />
                        </Picker>
                    </View>

                    {/* <Text style={{ marginTop: 10, color: "#4B5563" }}>
                        निवडलेला प्रकार: {searchTypeOfUser || "काहीही नाही"}
                    </Text> */}
                </View>

                <Autocomplete
                    value={searchText}
                    onChange={handleMalmattaDharakSearch}
                    onSelect={(item) => handleSearchUser(item.id)}
                    data={idLabelPairs}
                    placeholder=""
                    inputStyle={{ borderWidth: 2 }}
                    loading={isLoading}
                    listClass="rounded-sm"
                    getDisplayValue={(item) => item.label}
                    renderItem={({ item, onSelect }) => (
                        <TouchableOpacity
                            onPress={onSelect}
                            className="px-3 py-4 border-b border-gray-200"
                        >
                            <Text className="text-blue-900 font-semibold text-base">
                                मा. क्र. {item.feu_malmattaNo}
                            </Text>
                            <Text className="text-blue-700 mt-2 text-sm tracking-wide">
                                मा. धारक: {item.feu_ownerName}
                            </Text>
                        </TouchableOpacity>
                    )}
                    renderEmpty={() => (
                        <Text className="p-3 text-gray-400">
                            No matching मालमत्ता धारक found
                        </Text>
                    )}
                />
            </View>

            <ScrollView className="bg-gray-50">
                <View className="px-4 py-5">
                    <H5 className="text-center text-2xl font-semibold text-blue-800 mb-7 tracking-wide">
                        मालमत्ता धारकाची माहीती
                    </H5>

                    {selectedMalmattaDharak && (
                        <View className="flex flex-col gap-7 pb-10">

                            {/* ---------------- मालमत्ता माहिती ---------------- */}
                            <Card className="p-5 border border-gray-200 rounded-2xl bg-white shadow-md shadow-blue-50">
                                <Text className="font-semibold text-lg text-blue-700 mb-4 border-b-2 border-blue-200 pb-2">
                                    मालमत्ता माहिती
                                </Text>

                                <View className="space-y-4">
                                    <View className="flex-row justify-between border-b border-gray-200 pb-3">
                                        <View className="w-1/2 pr-3">
                                            <Label>अनु क्रमांक</Label>
                                            <Text className="text-gray-900 mt-1">{selectedMalmattaDharak.id}</Text>
                                        </View>
                                        <View className="w-1/2">
                                            <Label>घर क्रमांक</Label>
                                            <Text className="text-gray-900 mt-1">{selectedMalmattaDharak.feu_homeNo}</Text>
                                        </View>
                                    </View>

                                    <View className="flex-row justify-between">
                                        <View className="w-1/2 pr-3">
                                            <Label>मालमत्ता क्र.</Label>
                                            <Text className="text-gray-900 mt-1">{selectedMalmattaDharak.feu_malmattaNo}</Text>
                                        </View>
                                        <View className="w-1/2">
                                            <Label>वार्ड नं</Label>
                                            <Text className="text-gray-900 mt-1">{selectedMalmattaDharak.feu_wardNo}</Text>
                                        </View>
                                    </View>
                                </View>
                            </Card>

                            {/* ---------------- मालकाची माहिती ---------------- */}
                            <Card className="p-5 border border-gray-200 rounded-2xl bg-white shadow-md shadow-blue-50">
                                <Text className="font-semibold text-lg text-blue-700 mb-4 border-b-2 border-blue-200 pb-2">
                                    मालकाची माहिती
                                </Text>

                                <View className="space-y-4">
                                    <View className="border-b border-gray-200 pb-3">
                                        <Label>मालमत्ता धारकाचे नाव</Label>
                                        <Text className="text-gray-900 mt-1">{selectedMalmattaDharak.feu_ownerName}</Text>
                                    </View>

                                    <View className="border-b border-gray-200 pb-3">
                                        <Label>भोगवटदाराचे नाव</Label>
                                        <Text className="text-gray-900 mt-1">{selectedMalmattaDharak.feu_secondOwnerName}</Text>
                                    </View>

                                    <View className="flex-row justify-between border-b border-gray-200 pb-3">
                                        <View className="w-1/2 pr-3">
                                            <Label>मोबाईल क्रमांक</Label>
                                            <Text className="text-gray-900 mt-1">{selectedMalmattaDharak.feu_mobileNo}</Text>
                                        </View>
                                        <View className="w-1/2">
                                            <Label>आधार क्रं.</Label>
                                            <Text className="text-gray-900 mt-1">{selectedMalmattaDharak.feu_aadharNo}</Text>
                                        </View>
                                    </View>

                                    <View className="flex-row justify-between">
                                        <View className="w-1/2 pr-3">
                                            <Label>घरकुल योजना</Label>
                                            <Text className="text-gray-900 mt-1">{selectedMalmattaDharak.feu_gharkulYojna}</Text>
                                        </View>
                                        <View className="w-1/2">
                                            <Label>शौच्छालय</Label>
                                            <Text className="text-gray-900 mt-1">{selectedMalmattaDharak.feu_havingToilet}</Text>
                                        </View>
                                    </View>
                                </View>

                                <View className="mt-5 pt-4 border-t border-gray-200">
                                    <TouchableOpacityButton
                                        color="#2563EB"
                                        disabled={
                                            !(
                                                selectedMalmattaDharak?.home_image_latitude &&
                                                selectedMalmattaDharak?.home_image_longitude
                                            )
                                        }
                                        onPress={() =>
                                            openInGoogleMaps(
                                                selectedMalmattaDharak?.home_image_latitude,
                                                selectedMalmattaDharak?.home_image_longitude
                                            )
                                        }
                                    >
                                        {selectedMalmattaDharak?.home_image_latitude &&
                                            selectedMalmattaDharak?.home_image_longitude
                                            ? "Open in Google Maps"
                                            : "No Associated Location Found"}
                                    </TouchableOpacityButton>
                                </View>
                            </Card>

                            {/* ---------------- जागेची माहिती ---------------- */}
                            <Card className="p-5 border border-gray-200 rounded-2xl bg-white shadow-md shadow-blue-50">
                                <Text className="font-semibold text-lg text-blue-700 mb-4 border-b-2 border-blue-200 pb-2">
                                    जागेची माहिती
                                </Text>
                                <View className="space-y-4">
                                    <View className="border-b border-gray-200 pb-3">
                                        <Label>ग्रामपंचायत</Label>
                                        <Text className="text-gray-900 mt-1">{selectedMalmattaDharak.feu_gramPanchayet}</Text>
                                    </View>
                                    <View>
                                        <Label>गावाचे नाव</Label>
                                        <Text className="text-gray-900 mt-1">{selectedMalmattaDharak.feu_villageName}</Text>
                                    </View>
                                </View>
                            </Card>

                            {/* ---------------- क्षेत्रफळ माहिती ---------------- */}
                            <Card className="p-5 border border-gray-200 rounded-2xl bg-white shadow-md shadow-blue-50">
                                <Text className="font-semibold text-lg text-blue-700 mb-4 border-b-2 border-blue-200 pb-2">
                                    क्षेत्रफळ माहिती
                                </Text>
                                <View className="space-y-4">
                                    <View className="flex-row justify-between border-b border-gray-200 pb-3">
                                        <View className="w-1/2 pr-3">
                                            <Label>लांबी (फुट)</Label>
                                            <Text className="text-gray-900 mt-1">{selectedMalmattaDharak.feu_areaHeight}</Text>
                                        </View>
                                        <View className="w-1/2">
                                            <Label>रुंदी (फुट)</Label>
                                            <Text className="text-gray-900 mt-1">{selectedMalmattaDharak.feu_areaWidth}</Text>
                                        </View>
                                    </View>

                                    <View className="flex-row justify-between">
                                        <View className="w-1/2 pr-3">
                                            <Label>एकूण क्षेत्रफळ (फुट)</Label>
                                            <Text className="text-gray-900 mt-1">{selectedMalmattaDharak.feu_totalArea}</Text>
                                        </View>
                                        <View className="w-1/2">
                                            <Label>एकूण क्षेत्रफळ (मी.)</Label>
                                            <Text className="text-gray-900 mt-1">{selectedMalmattaDharak.feu_totalAreaSquareMeter}</Text>
                                        </View>
                                    </View>
                                </View>
                            </Card>

                            {/* ---------------- दिशा माहिती ---------------- */}
                            <Card className="p-5 border border-gray-200 rounded-2xl bg-white shadow-md shadow-blue-50">
                                <Text className="font-semibold text-lg text-blue-700 mb-4 border-b-2 border-blue-200 pb-2">
                                    दिशा माहिती
                                </Text>

                                <View className="space-y-4">
                                    <View className="flex-row justify-between border-b border-gray-200 pb-3">
                                        <View className="w-1/2 pr-3">
                                            <Label>पूर्वेस</Label>
                                            <Text className="text-gray-900 mt-1">{selectedMalmattaDharak.feu_eastLandmark || "-"}</Text>
                                        </View>
                                        <View className="w-1/2">
                                            <Label>पश्चिमेस</Label>
                                            <Text className="text-gray-900 mt-1">{selectedMalmattaDharak.feu_westLandmark || "-"}</Text>
                                        </View>
                                    </View>

                                    <View className="flex-row justify-between border-b border-gray-200 pb-3">
                                        <View className="w-1/2 pr-3">
                                            <Label>उत्तरेस</Label>
                                            <Text className="text-gray-900 mt-1">{selectedMalmattaDharak.feu_northLandmark || "-"}</Text>
                                        </View>
                                        <View className="w-1/2">
                                            <Label>दक्षिणेस</Label>
                                            <Text className="text-gray-900 mt-1">{selectedMalmattaDharak.feu_southLandmark || "-"}</Text>
                                        </View>
                                    </View>

                                    <View>
                                        <Label>बोजा/शेरा</Label>
                                        <Text className="text-gray-900 mt-1">{selectedMalmattaDharak.feu_bojaShera || "-"}</Text>
                                    </View>
                                </View>
                            </Card>

                            {/* ---------------- घराचा फोटो ---------------- */}
                            <Card className="p-5 border border-gray-200 rounded-2xl bg-white shadow-md shadow-blue-50">
                                <Text className="font-semibold text-lg text-blue-700 mb-4 border-b-2 border-blue-200 pb-2">
                                    घराचा फोटो
                                </Text>

                                <View className="mb-4 border border-gray-200 rounded-xl overflow-hidden">
                                    <ServerImage
                                        className="w-full h-52"
                                        imageClassName="w-full h-full"
                                        src={`/home_map_image/home_photo/${selectedMalmattaDharak.feu_image || `${selectedMalmattaDharak.feu_malmattaNo}.jpeg`}`}
                                        loading="lazy"
                                    />
                                </View>

                                <Label className="mb-2 text-gray-700">Upload a Home Image</Label>
                                <FileInput onChange={handleFileChange} />

                                <TouchableOpacity
                                    onPress={handleHomeImageUpload}
                                    style={{
                                        backgroundColor: "#2563EB",
                                        paddingVertical: 13,
                                        borderRadius: 10,
                                        alignItems: "center",
                                        marginTop: 12,
                                    }}
                                    disabled={isUploadingImage}
                                >
                                    <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>
                                        {isUploadingImage ? "Uploading..." : "Upload"}
                                    </Text>
                                </TouchableOpacity>
                            </Card>
                        </View>
                    )}
                </View>
            </ScrollView>


        </ScreenWrapper>
    );
};

export default HomeScreen;
