import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { colors } from "@/constants/colors";
import { trpc, trpcClient } from "@/lib/trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

// Create a client
const queryClient = new QueryClient();

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) {
      console.error(error);
      throw error;
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTintColor: colors.text,
            headerTitleStyle: {
              fontWeight: '600',
            },
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen 
            name="item/[id]" 
            options={{ 
              title: "Item Details",
              presentation: "card",
            }} 
          />
          <Stack.Screen 
            name="category/[id]" 
            options={{ 
              title: "Category",
              presentation: "card",
            }} 
          />
          <Stack.Screen 
            name="outfit/[id]" 
            options={{ 
              title: "Outfit Details",
              presentation: "card",
            }} 
          />
          <Stack.Screen 
            name="wishlist/[id]" 
            options={{ 
              title: "Wishlist Item",
              presentation: "card",
            }} 
          />
          <Stack.Screen 
            name="add-item" 
            options={{ 
              title: "Add New Item",
              presentation: "modal",
            }} 
          />
          <Stack.Screen 
            name="add-outfit" 
            options={{ 
              title: "Create Outfit",
              presentation: "modal",
            }} 
          />
          <Stack.Screen 
            name="add-wishlist" 
            options={{ 
              title: "Add to Wishlist",
              presentation: "modal",
            }} 
          />
        </Stack>
      </QueryClientProvider>
    </trpc.Provider>
  );
}