import React from "react";
import { View } from "react-native";
import { useSelector } from "react-redux";
import { H3 } from "../typography/Heading";

const GpLayout = ({ children }) => {
    const gp = useSelector((state) => state.gp);

    return (
        <>
            <View>
                {/* HEAD */}
                <View className="sticky top-0">
                    <View className="bg-white border-b border-b-gray-300 pt-2 pb-4">
                        <View className="">
                            <H3 className="text-2xl text-center text-indigo-600 font-extrabold tracking-wide">
                                ग्रामपंचायत {gp?.grampanchayat_name || "-"}
                            </H3>
                        </View>
                    </View>
                </View>

                {/* BODY */}
                <View className="px-2">{children}</View>
            </View>
        </>
    );
};

export default GpLayout;
