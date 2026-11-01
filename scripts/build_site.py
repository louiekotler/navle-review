"""Bundle the scraped questions and the study page into a static site.

Usage: python3 scripts/build_site.py DATA_DIR OUT_DIR
Reads DATA_DIR/*.jsonl and DATA_DIR/images/, copies the pages in site/
and writes OUT_DIR/questions.json and OUT_DIR/images/.
"""
import json
import pathlib
import shutil
import sys

SOURCES = {"navle": "Zuku NAVLE", "vetprep": "Dose of VetPrep"}
PAGES = pathlib.Path(__file__).resolve().parent.parent / "site"


def main(data, site):
    data, site = pathlib.Path(data), pathlib.Path(site)
    (site / "images").mkdir(parents=True, exist_ok=True)
    for page in PAGES.glob("*.html"):
        shutil.copy2(page, site / page.name)
    out = []
    for db in sorted(data.glob("*.jsonl")):
        for line in db.read_text().splitlines():
            if not line:
                continue
            r = json.loads(line)
            img = r.get("image")
            if img:
                src = data / "images" / img
                dst = site / "images" / img
                if not src.exists():
                    img = None
                elif not dst.exists():
                    shutil.copy2(src, dst)
            out.append({
                "id": f"{r['topic']}-{r['date']}",
                "source": SOURCES.get(r["topic"], r["topic"]),
                "date": r["date"],
                "q": r["question"],
                "choices": r["choices"],
                "answer": r["answer"],
                "expl": r["explanation"],
                "img": f"images/{img}" if img else None,
                "url": r.get("url"),
                "check": r.get("check_url"),
            })
    out.sort(key=lambda r: r["date"], reverse=True)
    (site / "questions.json").write_text(json.dumps(out, ensure_ascii=False))
    print(f"{len(out)} questions")


if __name__ == "__main__":
    main(*sys.argv[1:3])
