import { StyleSheet, View } from 'react-native';

import type { GridCell } from '@/games/jusqua-la-mer/engine/game';
import { colors } from '@/platform/theme';
import { Icon } from '@/platform/ui/Icon';

/** La grille de la partie : bleu plein pour une bonne réponse, orange clair barré pour une erreur, ampoule pour un indice. */
export function ResultGrid({ cells }: { cells: GridCell[] }) {
  const hits = cells.filter((cell) => cell === 'hit').length;
  const misses = cells.filter((cell) => cell === 'miss').length;
  const hints = cells.length - hits - misses;
  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`${hits} bonnes réponses, ${misses} erreurs, ${hints} indices`}>
      {cells.map((cell, i) =>
        cell === 'hit' ? (
          <View key={i} style={[styles.cell, styles.hit]} />
        ) : cell === 'miss' ? (
          <View key={i} style={[styles.cell, styles.miss]}>
            <Icon name="close" size={10} color={colors.error} strokeWidth={4} />
          </View>
        ) : (
          <View key={i} style={[styles.cell, styles.hint]}>
            <Icon name="hint" size={13} color={colors.night} strokeWidth={2.4} />
          </View>
        ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  cell: {
    width: 20,
    height: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hit: {
    backgroundColor: colors.water,
  },
  miss: {
    backgroundColor: colors.errorSoft,
    borderWidth: 2,
    borderColor: colors.error,
  },
  hint: {
    backgroundColor: colors.waterSoft,
  },
});
