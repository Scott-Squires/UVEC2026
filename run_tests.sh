#!/usr/bin/env bash
# Runs main.py against every tests/*.txt case and checks it against the hand-traced
# expected output in demo/samples/<name>.js (the `output: `...`` block). Cases with no
# matching sample are just run and reported, since there's nothing to diff against.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

pass=0
fail=0
skip=0

# Pulls the text inside output: `...`, out of a demo/samples/*.js fixture
extract_expected() {
  awk '
    capture {
      line = $0
      if (line ~ /`,[ \t]*$/) { sub(/`,[ \t]*$/, "", line); print line; capture = 0; next }
      print line; next
    }
    /output: `/ {
      line = $0
      sub(/^.*output: `/, "", line)
      if (line ~ /`,[ \t]*$/) { sub(/`,[ \t]*$/, "", line); print line }
      else { print line; capture = 1 }
    }
  ' "$1"
}

for tfile in tests/*.txt; do
  name="$(basename "$tfile" .txt)"
  sample="demo/samples/${name}.js"

  actual="$(python3 main.py "$tfile" 2>&1)"

  if [[ -f "$sample" ]]; then
    expected="$(extract_expected "$sample")"
    if [[ "$actual" == "$expected" ]]; then
      echo "PASS  $name"
      pass=$((pass + 1))
    else
      echo "FAIL  $name"
      diff --label expected --label actual <(printf '%s\n' "$expected") <(printf '%s\n' "$actual") | sed 's/^/      /'
      fail=$((fail + 1))
    fi
  else
    echo "SKIP  $name  (no fixture in demo/samples/, showing output)"
    printf '%s\n' "$actual" | sed 's/^/      /'
    skip=$((skip + 1))
  fi
done

echo
echo "$pass passed, $fail failed, $skip skipped (no fixture)"
[[ $fail -eq 0 ]]
