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
import * as Location from 'expo-location';
import { useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSelector } from "react-redux";

const HomeScreen = () => {
    // Utility
    const { api } = useApi()
    const { compressImage } = useCompress()

    // States
    const [searchText, setSearchText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [idLabelPairs, setIdLabelPairs] = useState([]);

    const [isUploadingImage, setIsUploadingImage] = useState(false)


    const [selectedMalmattaDharak, setSelectedMalmattaDharak] = useState(null)
    const [selectedHomeImage, setSelectedHomeImage] = useState(null)

    const gp = useSelector(state => state.gp)
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

    const handleMalmattaDharakSearch = async (malmattaNumber) => {
        try {

            setSearchText(malmattaNumber);
            setIsLoading(true);

            // HERE, q = Query and sType = Search Type
            const { call: idLabelPairs } = await api.post('/get-user-info', {
                q: malmattaNumber,
                sType: 2
            });

            setIdLabelPairs(idLabelPairs || []);

        } catch (err) {
            console.error(err?.message);
            Alert.alert('Try Again...')
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
        }
    };



    return (
        <ScreenWrapper>
            <View className="sticky top-0">
                <View>
                    <H3 className="text-center text-indigo-500 font-extrabold">ग्रामपंचायत : {gp ? gp.grampanchayat_name : '-'}</H3>
                    <Label className="text-lg text-center">मालमत्ता क्रमांक टाकून धारक शोधा.</Label>
                    <Autocomplete
                        value={searchText}
                        onChange={handleMalmattaDharakSearch}
                        onSelect={(item) => handleSearchUser(item.id)}
                        data={idLabelPairs}
                        placeholder=""
                        loading={isLoading}
                        listClass="rounded-sm"
                        getDisplayValue={(item) => item.label}
                        renderItem={({ item, onSelect }) => (
                            <TouchableOpacity
                                onPress={onSelect}
                                className="px-3 py-4 border-b border-gray-200"
                            >
                                <Text className="font-semibold">{item.label}</Text>
                            </TouchableOpacity>
                        )}
                        renderEmpty={() => (
                            <Text className="p-3 text-gray-400">
                                No matching मालमत्ता धारक found
                            </Text>
                        )}
                    />
                </View>
            </View>

            <ScrollView>
                <H5 className="text-center">
                    मालमत्ता धारकाची माहीती.
                </H5>

                <View className="">
                    <View>
                        {
                            selectedMalmattaDharak &&
                            (
                                <>

                                    <View className="flex flex-col gap-2">
                                        {/* मालमत्ता माहिती */}
                                        <Card className="p-3">
                                            <Text className="font-bold text-lg text-yellow-700 mb-2">
                                                मालमत्ता माहिती
                                            </Text>
                                            <View className="flex-row justify-between">
                                                <View className="w-1/2 pr-2">
                                                    <Label>अनु क्रमांक</Label>
                                                    <Text>{selectedMalmattaDharak.id}</Text>
                                                </View>
                                                <View className="w-1/2">
                                                    <Label>घर क्रमांक</Label>
                                                    <Text>{selectedMalmattaDharak.feu_homeNo}</Text>
                                                </View>
                                            </View>
                                            <View className="flex-row justify-between mt-2">
                                                <View className="w-1/2 pr-2">
                                                    <Label>मालमत्ता क्र.</Label>
                                                    <Text>{selectedMalmattaDharak.feu_malmattaNo}</Text>
                                                </View>
                                                <View className="w-1/2">
                                                    <Label>वार्ड नं</Label>
                                                    <Text>{selectedMalmattaDharak.feu_wardNo}</Text>
                                                </View>
                                            </View>
                                        </Card>

                                        {/* मालकाची माहिती */}
                                        <Card className="p-3">
                                            <Text className="font-bold text-lg text-yellow-700 mb-2">
                                                मालकाची माहिती
                                            </Text>
                                            <View className="mb-2">
                                                <Label>मालमत्ता धारकाचे नाव</Label>
                                                <Text>{selectedMalmattaDharak.feu_ownerName}</Text>
                                            </View>
                                            <View className="mb-2">
                                                <Label>भोगवटदाराचे नाव</Label>
                                                <Text>{selectedMalmattaDharak.feu_secondOwnerName}</Text>
                                            </View>
                                            <View className="flex-row justify-between">
                                                <View className="w-1/2 pr-2">
                                                    <Label>मोबाईल क्रमांक</Label>
                                                    <Text>{selectedMalmattaDharak.feu_mobileNo}</Text>
                                                </View>
                                                <View className="w-1/2">
                                                    <Label>आधार क्रं.</Label>
                                                    <Text>{selectedMalmattaDharak.feu_aadharNo}</Text>
                                                </View>
                                            </View>
                                            <View className="flex-row justify-between mt-2">
                                                <View className="w-1/2 pr-2">
                                                    <Label>घरकुल योजना</Label>
                                                    <Text>{selectedMalmattaDharak.feu_gharkulYojna}</Text>
                                                </View>
                                                <View className="w-1/2">
                                                    <Label>शौच्छालय</Label>
                                                    <Text>{selectedMalmattaDharak.feu_havingToilet}</Text>
                                                </View>

                                            </View>
                                            <View className="mt-2">
                                                <TouchableOpacityButton
                                                    color="#1E88E5"
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

                                        {/* जागेची माहिती */}
                                        <Card className="p-3">
                                            <Text className="font-bold text-lg text-yellow-700 mb-2">
                                                जागेची माहिती
                                            </Text>
                                            <Label>ग्रामपंचायत</Label>
                                            <Text>{selectedMalmattaDharak.feu_gramPanchayet}</Text>
                                            <Label className="mt-2">गावाचे नाव</Label>
                                            <Text>{selectedMalmattaDharak.feu_villageName}</Text>
                                        </Card>

                                        {/* क्षेत्रफळ माहिती */}
                                        <Card className="p-3">
                                            <Text className="font-bold text-lg text-yellow-700 mb-2">
                                                क्षेत्रफळ माहिती
                                            </Text>
                                            <View className="flex-row justify-between">
                                                <View className="w-1/2 pr-2">
                                                    <Label>लांबी (फुट)</Label>
                                                    <Text>{selectedMalmattaDharak.feu_areaHeight}</Text>
                                                </View>
                                                <View className="w-1/2">
                                                    <Label>रुंदी (फुट)</Label>
                                                    <Text>{selectedMalmattaDharak.feu_areaWidth}</Text>
                                                </View>
                                            </View>
                                            <View className="flex-row justify-between mt-2">
                                                <View className="w-1/2 pr-2">
                                                    <Label>एकूण क्षेत्रफळ (फुट)</Label>
                                                    <Text>{selectedMalmattaDharak.feu_totalArea}</Text>
                                                </View>
                                                <View className="w-1/2">
                                                    <Label>एकूण क्षेत्रफळ (मी.)</Label>
                                                    <Text>{selectedMalmattaDharak.feu_totalAreaSquareMeter}</Text>
                                                </View>
                                            </View>
                                        </Card>

                                        {/* दिशा माहिती */}
                                        <Card className="p-3">
                                            <Text className="font-bold text-lg text-yellow-700 mb-2">
                                                दिशा माहिती
                                            </Text>
                                            <View className="flex-row justify-between">
                                                <View className="w-1/2 pr-2">
                                                    <Label>पूर्वेस</Label>
                                                    <Text>{selectedMalmattaDharak.feu_eastLandmark || "-"}</Text>
                                                </View>
                                                <View className="w-1/2">
                                                    <Label>पश्चिमेस</Label>
                                                    <Text>{selectedMalmattaDharak.feu_westLandmark || "-"}</Text>
                                                </View>
                                            </View>
                                            <View className="flex-row justify-between mt-2">
                                                <View className="w-1/2 pr-2">
                                                    <Label>उत्तरेस</Label>
                                                    <Text>{selectedMalmattaDharak.feu_northLandmark || "-"}</Text>
                                                </View>
                                                <View className="w-1/2">
                                                    <Label>दक्षिणेस</Label>
                                                    <Text>{selectedMalmattaDharak.feu_southLandmark || "-"}</Text>
                                                </View>
                                            </View>
                                            <View className="mt-2">
                                                <Label>बोजा/शेरा</Label>
                                                <Text>{selectedMalmattaDharak.feu_bojaShera || "-"}</Text>
                                            </View>
                                        </Card>

                                        <Card>


                                            <View>
                                                <Text>HomeImagePreview</Text>
                                                <ServerImage
                                                    className='w-full h-52'
                                                    imageClassName={'w-full h-full'}
                                                    src={`/home_map_image/home_photo/${selectedMalmattaDharak.feu_image || `${selectedMalmattaDharak.feu_malmattaNo}.jpeg`}`}
                                                    loading={'lazy'}
                                                />
                                            </View>


                                            <Label>Upload an home Image</Label>
                                            <View>
                                                <FileInput
                                                    onChange={handleFileChange}
                                                />
                                            </View>
                                        </Card>




                                        <View>
                                            <TouchableOpacity
                                                onPress={handleHomeImageUpload}
                                                style={{
                                                    backgroundColor: "#1d4ed8",
                                                    paddingVertical: 12,
                                                    paddingHorizontal: 20,
                                                    borderRadius: 8,
                                                    alignItems: "center",
                                                    marginTop: 10, // optional spacing
                                                }}
                                                disabled={isUploadingImage}
                                            >
                                                <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>
                                                    {isUploadingImage ? "Uploading..." : "Upload"}
                                                </Text>
                                            </TouchableOpacity>

                                        </View>




                                    </View>
                                </>
                            )
                            // :
                            // (
                            //     <>
                            //         <View>
                            //             <Text>कोणताही संलग्न मालमत्ता धारक मिळाला नाही. </Text>
                            //         </View>
                            //     </>
                            // )
                        }
                    </View>
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
};

export default HomeScreen;
