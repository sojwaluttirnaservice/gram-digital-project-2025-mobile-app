
import Label from "@/components/custom/form/Label";
import { H5, H6 } from "@/components/custom/typography/Heading";
import { Picker } from '@react-native-picker/picker';
import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

const HomeScreen = () => {

    const [searchText, setSearchText] = useState("")
    const [isTyping, setIsTyping] = useState(false)


    const [idLabelPairs, setIdLabelPairs] = useState([])


    const handleSearchUser = (f8UserId) => {


        try {

        } catch (err) {

        }

    }

    const handleMalmattaDharakSearch = async (text) => {
        try {

            setSearchText(text)
            const res = await fetch('http://192.168.1.12:5900/get-user-info', {
                method: "POST",
                body: JSON.stringify({
                    q: text,
                    sType: 2
                }),
                headers: {
                    'Content-Type': "application/json"
                }
            })



            const resData = await res.json()


            const { call: idLabelPairs } = resData



            setIdLabelPairs(idLabelPairs)





        } catch (err) {
            console.log(err?.message)
        }
    }

    return (


        <View className="bg-yellow-400">
            <H5 className="text-red-500 text-center">
                This is the heading color
            </H5>

            <Text>This</Text>

            <View>

                <H6 className="text-white">मालमत्ता धारक यादी</H6>

                <View className="bg-white border border-gray-600 px-2 py-1">

                    <View>
                        <Text> Select the malmatta dharak</Text>
                        <View className="relative">
                            <TextInput
                                className="border border-gray-200"
                                onChangeText={handleMalmattaDharakSearch}
                            />

                            {

                                setIsTyping &&
                                (

                                    <View View className="absolute top-full left-0 w-full bg-white z-[500]">

                                        {
                                            idLabelPairs && idLabelPairs.length > 0 ?

                                                <View className="flex flex-col">

                                                    {
                                                        idLabelPairs.map(({ id: f8UserId, label }) => {
                                                            return (
                                                                <TouchableOpacity
                                                                    key={f8UserId}
                                                                    onClick={() => handleSearchUser(f8UserId)}
                                                                    className="border-b border-b-gray-200 rounded-md px-2 py-1"
                                                                >
                                                                    <Text>{label}</Text>
                                                                </TouchableOpacity>
                                                            )
                                                        })
                                                    }
                                                </View>
                                                :
                                                <View>
                                                    <Text>No Search Results Founds</Text>
                                                </View>
                                        }
                                    </View>
                                )
                            }
                        </View>


                    </View>


                    <Picker
                        className="bg-red-500"
                    >
                        <Picker.Item label="Java" value="java" />
                        <Picker.Item label="JavaScript" value="js" />
                        <Picker.Item label="Other" value="js" />
                    </Picker>




                    <View>
                        <Label className="text-white">Malmatta nos</Label>
                        <TextInput value="hi" className="border border-gray-500" />
                    </View>


                    <View>
                        <Label className="text-white">Malmatta nos</Label>
                        <TextInput value="hi" className="border border-gray-500" />
                    </View>


                    <View>
                        <Label className="text-white">Malmatta nos</Label>
                        <TextInput value="hi" className="border border-gray-500" />
                    </View>

                    <View>
                        <Label className="text-white">Malmatta nos</Label>
                        <TextInput value="hi" className="border border-gray-500" />
                    </View>


                </View>

            </View>
        </View>
    );
}


export default HomeScreen