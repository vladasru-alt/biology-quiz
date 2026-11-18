#!/bin/sh
# sh tools/check-live.sh https://<аккаунт>.github.io/<репозиторий>/ — после git push опрашивать GitHub Pages,
# пока опубликованные index.html, quiz-data.js и game.js не совпадут с локальными побайтово.
# ?n=… обходит кэш CDN; проверяются все три файла: новая страница со старым банком может сломаться.
URL=${1:?укажите адрес сайта, например https://vladasru-alt.github.io/biology-quiz/}
case "$URL" in */) ;; *) URL="$URL/";; esac
ROOT=$(cd "$(dirname "$0")/.." && pwd); T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
for i in $(seq 1 30); do
  curl -s -o "$T/index.html" "${URL}index.html?n=$$$i"; curl -s -o "$T/quiz-data.js" "${URL}quiz-data.js?n=$$$i"; curl -s -o "$T/game.js" "${URL}game.js?n=$$$i"
  if cmp -s "$T/index.html" "$ROOT/index.html" && cmp -s "$T/quiz-data.js" "$ROOT/quiz-data.js" && cmp -s "$T/game.js" "$ROOT/game.js"; then echo "сайт обновлён (попытка $i)"; exit 0; fi
  sleep 15
done
echo "сайт ещё не обновился за 30 попыток"; exit 1
