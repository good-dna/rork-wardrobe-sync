import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function AvatarSetupScreen() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/avatar-onboarding' as any);
  }, []);
  return null;
}
