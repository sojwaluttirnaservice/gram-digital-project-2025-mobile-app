

import { Autocomplete, AutocompleteItem } from '@ui-kitten/components';
import React, { useCallback, useState } from "react";
import { View } from "react-native";


const movies = [
    { title: 'Star Wars' },
    { title: 'Back to the Future' },
    { title: 'The Matrix' },
    { title: 'Inception' },
    { title: 'Interstellar' },
];

const filter = (item, query) => item.title.toLowerCase().includes(query.toLowerCase());


const HomeScreen = () => {

    /*

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
    */



    const [value, setValue] = useState("");
    const [data, setData] = useState(movies);

    const onSelect = useCallback((index) => {
        setValue(data[index].title);
    }, [data]);

    const onChangeText = useCallback((query) => {
        setValue(query);
        setData(movies.filter(item => filter(item, query)));
    }, []);

    return (


        <View className='px-4'>

            <Autocomplete
                placeholder='Place your Text'
                value={value}
                placement='inner top'
                onSelect={onSelect}
                onChangeText={onChangeText}
                className='w-full'
            >
                {data.map((item, index) => {
                    return (
                        <AutocompleteItem
                            key={index}
                            title={item.title}
                        />
                    )
                })}
            </Autocomplete>
        </View>
    );
}


export default HomeScreen