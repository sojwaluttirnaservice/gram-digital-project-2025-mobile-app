import Autocomplete from "@/components/custom/form/Autocomplete";
import Label from "@/components/custom/form/Label";
import ScreenWrapper from "@/components/custom/screens/ScreenWrapper";
import { H5, H6 } from "@/components/custom/typography/Heading";
import Card from "@/components/custom/utils/Card";
import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

const HomeScreen = () => {
    const [searchText, setSearchText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [idLabelPairs, setIdLabelPairs] = useState([]);


    const [selectedMalmattaDharak, setSelectedMalmattaDharak] = useState(null)

    // API search
    const handleMalmattaDharakSearch = async (text) => {
        try {

            console.log("the vlaue is = ", text)
            setSearchText(text);
            setIsLoading(true);

            const res = await fetch("http://192.168.1.12:5900/get-user-info", {
                method: "POST",
                body: JSON.stringify({
                    q: text,
                    sType: 2,
                }),
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const resData = await res.json();
            const { call: idLabelPairs } = resData;
            setIdLabelPairs(idLabelPairs || []);
        } catch (err) {
            console.log(err?.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearchUser = async (f8UserId) => {
        try {

            const res = await fetch("http://192.168.1.12:5900/form-8/getSingleUserDetails", {
                method: "POST",
                body: JSON.stringify({
                    id: f8UserId
                }),
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const resData = await res.json();

            console.log(resData.data)

            setSelectedMalmattaDharak(resData.data)

        } catch (err) {
            console.log(err)
        }
    };

    useEffect(() => {
        console.log("Selected dharak ================")
        console.log(selectedMalmattaDharak)
    }, [selectedMalmattaDharak])

    return (
        <ScreenWrapper>
            <View className="sticky top-0">
                <H6 className="text-white">मालमत्ता धारक यादी</H6>

                <View className="bg-white border border-gray-600 px-2 py-1">
                    <Label>Select the मालमत्ता धारक</Label>

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

                <View>


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
                                            <Label>Upload an home Image</Label>
                                            <View>

                                            </View>
                                        </Card>
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
