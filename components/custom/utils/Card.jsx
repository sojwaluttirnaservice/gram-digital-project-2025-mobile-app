import { View } from "react-native";

const Card = ({ children, className = "" }) => {
    return (
        <View
            className={`bg-white border border-gray-200 rounded-2xl shadow p-3 ${className}`}
        >
            {children}
        </View>
    );
}

export default Card