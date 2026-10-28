const LEADING_ARTICLE = /^(les|le|la|l)\s+/;

/**
 * Forme canonique d'un nom de lieu, pour comparer une saisie à une réponse :
 * sans majuscules, accents, ligatures, ponctuation ni article initial.
 * « L'Hers-Vif », « l’hers vif » et « HERS VIF » donnent tous « hers vif ».
 */
export function normalizeName(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(LEADING_ARTICLE, '');
}

/** Majuscule initiale, pour un nom en début de phrase (« le Loir » → « Le Loir »). */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
