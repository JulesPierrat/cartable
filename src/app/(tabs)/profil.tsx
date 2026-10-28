import { Screen } from '@/platform/ui/Screen';
import { AppText } from '@/platform/ui/AppText';
import { ComingSoon } from '@/platform/ui/ComingSoon';

export default function ProfileScreen() {
  return (
    <Screen edges={['top']}>
      <AppText variant="title" accessibilityRole="header">
        Profil
      </AppText>
      <ComingSoon
        phase="Phase 6"
        description="Réglages, rappel du défi du jour, et la mention des sources de données utilisées par les jeux."
      />
    </Screen>
  );
}
