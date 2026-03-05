import { KAPITEL_CONFIG } from '@/data/kapitel-config'
import type { KrisenhandbuchKapitelV3 } from '@/types/database'

/**
 * Erzeugt leere 12 BSI/BBK-Kapitel fuer ein neues Landkreis-Krisenhandbuch.
 * Nutzt KAPITEL_CONFIG als Single Source of Truth.
 */
export function createEmptyHandbuchKapitel(): KrisenhandbuchKapitelV3[] {
  return KAPITEL_CONFIG.map(cfg => ({
    id: `kap-${cfg.nummer}`,
    nummer: cfg.nummer,
    key: cfg.key,
    titel: cfg.titel,
    inhalt: '',
    checkliste: [],
  }))
}
