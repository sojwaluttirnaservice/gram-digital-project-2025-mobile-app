import ScreenWrapper from '@/components/custom/screens/ScreenWrapper'
import { logout } from '@/redux/slices/userSlice'
import { useRouter } from 'expo-router'
import React from 'react'
import { Pressable, Text, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

const ProfileTab = () => {
  const router = useRouter()
  const dispatch = useDispatch()
  const user = useSelector(state => state.user)

  const handleLogout = () => {
    dispatch(logout())
    // Redirect to login screen
    router.replace('/auth/login')
  }

  return (
    <ScreenWrapper>
      <View className="flex-1 justify-between px-6 py-8 bg-gray-100">

        {/* Profile Info Card */}
        <View className="bg-white rounded-2xl shadow-md p-6">
          <Text className="text-2xl font-bold text-gray-800 mb-4 text-center">
            My Profile
          </Text>

          <View className="space-y-3">
            <View className="flex-row justify-between border-b border-gray-200 pb-2">
              <Text className="text-gray-500 font-medium">Username</Text>
              <Text className="text-gray-800 font-semibold">
                {user?.username || "-"}
              </Text>
            </View>

            <View className="flex-row justify-between border-b border-gray-200 pb-2">
              <Text className="text-gray-500 font-medium">User ID</Text>
              <Text className="text-gray-800 font-semibold">
                {user?.id || "-"}
              </Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <Pressable
          onPress={handleLogout}
          className="w-full bg-red-600 rounded-xl py-4 items-center shadow-md active:opacity-80"
        >
          <Text className="text-white font-semibold text-lg">Logout</Text>
        </Pressable>
      </View>
    </ScreenWrapper>
  )
}

export default ProfileTab
