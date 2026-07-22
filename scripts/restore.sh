#!/usr/bin/env bash
set -euo pipefail
if [[ "${1:-}" == "--check-only" ]]; then
  echo "Aucun jeu de sauvegarde à contrôler dans la PHASE 1."
  exit 0
fi
echo "Restauration non activée dans la PHASE 1." >&2
exit 2
