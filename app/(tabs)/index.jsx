import Autocomplete from "@/components/custom/form/Autocomplete";
import FileInput from "@/components/custom/form/FileInput";
import Label from "@/components/custom/form/Label";
import ScreenWrapper from "@/components/custom/screens/ScreenWrapper";
import { H5 } from "@/components/custom/typography/Heading";
import Card from "@/components/custom/utils/Card";
import ServerImage from "@/components/custom/utils/ServerImage";
import { useApi } from "@/hooks/custom/useApi";
import useCompress from "@/hooks/custom/useCompress";
import { setServerUrl } from "@/redux/slices/connectionSlice";
import { setWebsites } from "@/redux/slices/websitesSlice";
import { Picker } from '@react-native-picker/picker';
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";

const HomeScreen = () => {
    const [searchText, setSearchText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [idLabelPairs, setIdLabelPairs] = useState([]);

    const { api, instance } = useApi()


    const { compressImage } = useCompress()

    const [selectedMalmattaDharak, setSelectedMalmattaDharak] = useState(null)

    const [selectedHomeImage, setSelectedHomeImage] = useState(null)

    const { serverUrl, mainUrl } = useSelector(state => state.connection)
    const user = useSelector(state => state.user)

    const websites = useSelector(state => state.websites)


    useEffect(() => {
        console.log(user)
        console.log(websites)
    }, [user, websites])


    const dispatch = useDispatch()

    const handleFileChange = (file) => {
        setSelectedHomeImage(file); // { uri, name, size, mimeType, kind }
    };

    const handleUpload = async () => {
        if (!selectedHomeImage) {
            Alert.alert("Please select a file first");
            return;
        }
        const compressed = await compressImage(selectedHomeImage.uri)
        const fileName = selectedHomeImage.name || 'upload.jpg';
        const formData = new FormData();
        formData.append("homeImage", {
            uri: compressed.uri,
            name: fileName || "upload.jpg",
            type: selectedHomeImage.mimeType || "application/octet-stream",
        });

        formData.append('id', selectedMalmattaDharak.id)
        formData.append('home_image_upload_person_user_id', user.id)
        formData.append('home_image_upload_person_username', user.username)

        try {

            let { success, message } = await api.put('/form-8/update-home-image', formData)

            if (success) {
                Alert.alert(message)
                handleSearchUser(selectedMalmattaDharak.id)
            }
        } catch (err) {
            console.error("Upload error:", err);
        }
    };

    // API search
    const handleMalmattaDharakSearch = async (text) => {
        try {
            setSearchText(text);
            setIsLoading(true);

            const { call: idLabelPairs } = await api.post('/get-user-info', {
                q: text,
                sType: 2
            });

            setIdLabelPairs(idLabelPairs || []);

        } catch (err) {
            console.log(err?.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearchUser = async (f8UserId) => {
        try {
            const { data } = await api.post('/form-8/getSingleUserDetails', { id: f8UserId })

            setSelectedMalmattaDharak(data)
            setSelectedHomeImage(null)

        } catch (err) {
            console.log(err)
        }
    };

    useEffect(() => {

        const fetchWebsites = async () => {
            try {

                let { success, data } = await instance.get('/websites')

                if (success) {
                    dispatch(setWebsites(data.websites))
                }
            } catch (err) {
                console.error(err)
            }
        }


        fetchWebsites()

    }, [])



    useEffect(() => {


        console.log("server url changed===", serverUrl)
    }, [serverUrl])

    if (!user || !user.isAuthenticated) {
        return <Redirect href={'/auth'} />
    }




    return (
        <ScreenWrapper scroll>
            <View className="sticky top-0">


                <View className="border border-gray-300 rounded-lg overflow-hidden">
                    {websites?.length > 0 && (
                        <Picker
                            selectedValue={serverUrl}
                            onValueChange={(itemValue) => dispatch(setServerUrl(itemValue))}
                            dropdownIconColor="#374151" // arrow color
                            style={{ color: "#111827", backgroundColor: "white" }} // text color + bg
                        >
                            {/* Default placeholder */}
                            <Picker.Item
                                key="placeholder"
                                label="-- Select --"
                                value=""
                            />

                            {/* Local option for testing */}
                            <Picker.Item
                                key="local"
                                label="Local"
                                value="http://192.168.1.2:5900"
                            />

                            {/* Dynamic websites list */}
                            {websites.map((web, idx) => (
                                <Picker.Item
                                    key={web.id || idx}
                                    label={web.grampanchayat_name || web.village_name || `Website ${idx + 1}`}
                                    value={web.website_link}
                                />
                            ))}
                        </Picker>
                    )}

                </View>

                <View className="py-2">
                    <Label className="text-lg text-center">मालमत्ता धारक निवडा</Label>

                    {/* ✅ Integrated Autocomplete */}
                    <Autocomplete
                        value={searchText}
                        onChange={handleMalmattaDharakSearch}
                        onSelect={(item) => handleSearchUser(item.id)}
                        data={idLabelPairs}
                        placeholder="Do something"
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
            <View>
                <H5 className="text-white text-center">
                    This is the heading color
                </H5>

                <View className="px-2">
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
                                                onPress={handleUpload}
                                                style={{
                                                    backgroundColor: "#1d4ed8",
                                                    paddingVertical: 12,
                                                    paddingHorizontal: 20,
                                                    borderRadius: 8,
                                                    alignItems: "center",
                                                    marginTop: 10, // optional spacing
                                                }}
                                            >
                                                <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>
                                                    Upload
                                                </Text>
                                            </TouchableOpacity>

                                        </View>




                                    </View>
                                </>
                            )
                        }
                    </View>
                </View>
            </View>
        </ScreenWrapper>
    );
};

export default HomeScreen;
