import { Screen } from '@/platform/ui/Screen';
import { AppText } from '@/platform/ui/AppText';
import { ComingSoon } from '@/platform/ui/ComingSoon';

export default function StatsScreen() {
  return (
    <Screen edges={['top']}>
      <AppText variant="title" accessibilityRole="header">
        Stats
      </AppText>
      <ComingSoon
        phase="Phase 5"
        description="Parties jouées, taux de réussite, série en cours et record, répartition des erreurs."
      />
    </Screen>
  );
}
