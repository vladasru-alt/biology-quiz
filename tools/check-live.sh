#!/bin/sh
# sh tools/check-live.sh https://<аккаунт>.github.io/<репозиторий>/ — после git push опрашивать GitHub Pages,
# пока опубликованные index.html, quiz-data.js, game.js и картинки из папки img/ не совпадут с локальными побайтово.
# ?n=… обходит кэш CDN; проверяются все файлы: новая страница со старым банком может сломаться,
# а картинка, не попавшая в коммит, оставит на сайте пустую рамку с описанием.
URL=${1:?укажите адрес сайта, например https://vladasru-alt.github.io/biology-quiz/}
case "$URL" in */) ;; *) URL="$URL/";; esac
ROOT=$(cd "$(dirname "$0")/.." && pwd); T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
FILES="index.html quiz-data.js game.js"
# картинки берутся из данных: поле img у записей в figures
IMGS=$(cd "$ROOT" && node -e 'const f=require("./tools/lib.js").loadFigures(); console.log(Object.values(f).map((x)=>x.img).filter(Boolean).join(" "))' 2>/dev/null)
for i in $(seq 1 30); do
  ok=1
  for f in $FILES $IMGS; do
    mkdir -p "$T/$(dirname "$f")"
    curl -s -o "$T/$f" "${URL}${f}?n=$$$i"
    cmp -s "$T/$f" "$ROOT/$f" || ok=0
  done
  if [ $ok = 1 ]; then echo "сайт обновлён (попытка $i): $FILES $IMGS"; exit 0; fi
  sleep 15
done
echo "сайт ещё не обновился за 30 попыток"; exit 1
