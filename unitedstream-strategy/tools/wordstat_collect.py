#!/usr/bin/env python3
"""Сбор частотностей Яндекс Wordstat (Yandex Cloud Search API v2) по списку фраз.

Запускать на своём компьютере. Нужен только Python 3.8+, сторонние пакеты не нужны.
Ключ не выводится в консоль и не пишется в результаты.

Пример:
    python3 wordstat_collect.py --key-file ~/biology/YaApl --folder-id b1gxxxxxxxxxxxxxxx

Ключ можно передать и через переменную окружения YC_API_KEY, ID каталога — через YC_FOLDER_ID.
Результат — папка wordstat_out/ с CSV-файлами. Её можно прислать целиком.
"""
import argparse
import csv
import datetime as dt
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request

API = "https://searchapi.api.cloud.yandex.net/v2/wordstat/"
HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_KEYWORDS = os.path.join(HERE, "..", "wordstat-keywords.txt")

# Фразы для точной частотности (операторы "..." и !)
EXACT = [
    "платежный агент", "платежный агент для юрлиц", "платежный агент вэд",
    "международные платежи для бизнеса", "оплата инвойса", "оплата иностранному поставщику",
    "оплата в китай", "оплата в китай для юрлиц", "платежный агент китай", "оплата поставщику в китае",
    "платежи в оаэ", "платежи в турцию", "платежи в европу", "оплата в евро юрлицо",
    "оплата зарубежных сервисов для юрлиц", "оплатить aws из россии", "получить оплату из-за границы",
    "а7 агент", "а7 платежи", "а7 отзывы", "а7 альтернатива",
    "юнайтед стрим", "united stream", "юнистрим", "рейтинг платежных агентов",
]
# Фразы для помесячной динамики
DYNAMICS = [
    "платежный агент", "платежный агент для юрлиц", "оплата инвойса", "оплата в китай для юрлиц",
    "платежный агент китай", "оплата иностранному поставщику", "платежи в оаэ", "платежи в турцию",
    "платежи в европу", "оплата зарубежных сервисов для юрлиц", "а7 агент", "а7 платежи",
    "юнайтед стрим", "вэд аутсорсинг", "получить оплату из-за границы",
]
# Фразы для распределения по регионам
REGIONS = ["платежный агент", "оплата в китай для юрлиц", "оплата инвойса", "платежи в оаэ", "а7 агент"]


def read_key(path):
    if path:
        raw = open(os.path.expanduser(path), encoding="utf-8").read()
        m = re.search(r"(AQVN[\w\-]+)", raw)
        key = m.group(1) if m else raw.strip().splitlines()[0].split("=")[-1].strip()
    else:
        key = os.environ.get("YC_API_KEY", "").strip()
    if not key:
        sys.exit("Нет ключа: укажите --key-file или переменную YC_API_KEY")
    return key


def call(method, body, key, retries=5):
    data = json.dumps(body, ensure_ascii=False).encode("utf-8")
    for attempt in range(retries):
        req = urllib.request.Request(API + method, data=data, method="POST", headers={
            "Authorization": "Api-Key " + key, "Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            msg = e.read().decode("utf-8", "replace")[:500]
            if e.code in (429, 500, 502, 503, 504) and attempt < retries - 1:
                time.sleep(2 ** attempt + 1)
                continue
            print(f"  ! {method} «{body.get('phrase')}»: HTTP {e.code} {msg}", file=sys.stderr)
            if e.code in (401, 403):
                sys.exit("Ключ не принят или нет прав на Wordstat API: проверьте ключ, роль search-api.webSearch.user (или аналогичную) и ID каталога.")
            return None
        except urllib.error.URLError as e:
            if attempt < retries - 1:
                time.sleep(2 ** attempt + 1)
                continue
            print(f"  ! {method}: {e}", file=sys.stderr)
            return None


def load_phrases(path):
    out = []
    for line in open(path, encoding="utf-8"):
        line = line.strip()
        if line and not line.startswith("#"):
            out.append(line)
    return list(dict.fromkeys(out))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--key-file", help="файл с API-ключом Yandex Cloud")
    ap.add_argument("--folder-id", default=os.environ.get("YC_FOLDER_ID", ""), help="ID каталога Yandex Cloud")
    ap.add_argument("--keywords", default=DEFAULT_KEYWORDS)
    ap.add_argument("--region", default="225", help="225 = Россия")
    ap.add_argument("--out", default="wordstat_out")
    ap.add_argument("--pause", type=float, default=0.4)
    a = ap.parse_args()
    key = read_key(a.key_file)
    if not a.folder_id:
        sys.exit("Нужен ID каталога: --folder-id или YC_FOLDER_ID (консоль Yandex Cloud → каталог → ID)")
    os.makedirs(a.out, exist_ok=True)
    base = {"folderId": a.folder_id, "regions": [a.region], "devices": ["DEVICE_ALL"]}
    phrases = load_phrases(a.keywords)
    print(f"Фраз: {len(phrases)}")

    # 1. topRequests
    top_rows, rel_rows, raw = [], [], {}
    for i, p in enumerate(phrases, 1):
        r = call("topRequests", {**base, "phrase": p, "numPhrases": 50}, key)
        time.sleep(a.pause)
        if not r:
            top_rows.append([p, ""]); continue
        raw[p] = r
        top_rows.append([p, r.get("totalCount", "")])
        for x in r.get("results", []):
            rel_rows.append([p, "related", x.get("phrase"), x.get("count")])
        for x in r.get("associations", []):
            rel_rows.append([p, "association", x.get("phrase"), x.get("count")])
        print(f"[{i}/{len(phrases)}] {p}: {r.get('totalCount')}")
    write(a.out, "top.csv", ["phrase", "total_count"], top_rows)
    write(a.out, "related.csv", ["seed", "type", "phrase", "count"], rel_rows)
    json.dump(raw, open(os.path.join(a.out, "top_raw.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    # 2. Точная частотность
    ex_rows = []
    for p in EXACT:
        bang = " ".join("!" + w for w in p.split())
        row = [p]
        for q in (p, f'"{p}"', f'"{bang}"'):
            r = call("topRequests", {**base, "phrase": q, "numPhrases": 1}, key)
            time.sleep(a.pause)
            row.append(r.get("totalCount", "") if r else "")
        ex_rows.append(row)
        print(f"exact {p}: {row[1:]}")
    write(a.out, "exact.csv", ["phrase", "broad", "quoted", "quoted_exact_forms"], ex_rows)

    # 3. Динамика за 24 месяца
    today = dt.date.today().replace(day=1)
    start = (today - dt.timedelta(days=730)).replace(day=1)
    dyn_rows = []
    for p in DYNAMICS:
        r = call("dynamics", {"folderId": a.folder_id, "phrase": p, "period": "PERIOD_MONTHLY",
                               "fromDate": start.isoformat() + "T00:00:00Z", "toDate": today.isoformat() + "T00:00:00Z",
                               "regions": [a.region], "devices": ["DEVICE_ALL"]}, key)
        time.sleep(a.pause)
        for x in (r or {}).get("results", []):
            dyn_rows.append([p, x.get("date"), x.get("count"), x.get("share")])
        print(f"dynamics {p}: {len((r or {}).get('results', []))} точек")
    write(a.out, "dynamics.csv", ["phrase", "date", "count", "share"], dyn_rows)

    # 4. Регионы
    reg_rows = []
    for p in REGIONS:
        for kind in ("REGION_REGIONS", "REGION_CITIES"):
            r = call("regions", {"folderId": a.folder_id, "phrase": p, "region": kind, "devices": ["DEVICE_ALL"]}, key)
            time.sleep(a.pause)
            for x in (r or {}).get("results", []):
                reg_rows.append([p, kind, x.get("region"), x.get("count"), x.get("share"), x.get("affinityIndex")])
        print(f"regions {p}: ok")
    write(a.out, "regions.csv", ["phrase", "kind", "region", "count", "share", "affinity"], reg_rows)
    print(f"Готово: {os.path.abspath(a.out)}")


def write(out, name, header, rows):
    with open(os.path.join(out, name), "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f, delimiter=";")
        w.writerow(header)
        w.writerows(rows)


if __name__ == "__main__":
    main()
