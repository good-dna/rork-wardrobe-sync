import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function AvatarSetupScreen() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/avatar-onboarding' as any);
  }, []);
  return null;
}
// Sun Mar 29 02:37:54 UTC 2026
