#!/usr/bin/env python3
"""Slozi public/llms-full.txt z hlavicky llms.txt a plneho textu vsech guide stranek.

Proc: guide stranky jsou statické HTML, ktere roboti prectou — ale AI asistenti
(GPTBot, ClaudeBot, Perplexity) radeji berou jeden textovy soubor nez 8 HTML stranek.
llms.txt je jen rozcestnik s popisky; llms-full.txt nese cely obsah.

Spusteni:  python3 scripts/build-llms-full.py
Pak:       git add public/llms-full.txt && commit + push (Vercel nasadi sam)
"""

import html
import re
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"

# Poradi je zamerne — stejne jako v llms.txt, aby se to cetlo jako jeden dokument.
PAGES = [
    ("guides/childcare-and-daycare.html", "Childcare & daycare"),
    ("guides/childrens-healthcare.html", "Your child's health"),
    ("guides/birth-and-kraamzorg.html", "Midwife & kraamzorg"),
    ("guides/primary-school-amsterdam.html", "Primary school in Amsterdam"),
    ("guides/registration-and-waiting-lists.html", "Paperwork & waiting lists"),
    ("guides/child-first-aid.html", "Child & baby first aid"),
    ("guides/peuterspeelzaal-voorschool-amsterdam.html", "Peuterspeelzaal & voorschool in Amsterdam"),
    ("guides/swimming-and-zwemdiploma.html", "Swimming & the zwemdiploma"),
]

# childcare-guide.html tu ZAMERNE neni: je to printable 12stranovy layout bez <main>
# a obsahove pokryva tytez temata jako guides vyse. Vytahovat ho sem by znamenalo
# mit stejny obsah v souboru dvakrat. Odkaz na nej nese llms.txt v hlavicce.

SKIP_TAGS = {"script", "style", "nav", "header", "footer"}
# Navigace, drobeckova cesta a patickove veci — do textu pro AI nepatri.
# "cards"/"card"/"cta"/"links" je blok "dalsi guides" na konci kazde stranky:
# opakoval by se 7x a v llms.txt uz ten rozcestnik jednou je.
# POZOR: "sources" se NEskipuje zamerne — to jsou odkazy na oficialni holandske
# zdroje a ty maji pro AI cenu.
SKIP_CLASSES = {
    "topbar", "crumbs", "brand", "sitefoot", "backlink", "nav",
    "cards", "card", "cta", "links",
}


class MainTextExtractor(HTMLParser):
    """Vytahne text stranky od <h1> dal. Nadpisy na Markdown, seznamy na odrazky.

    Sbira se az od prvniho <h1>, ne od <main> — <h1> a uvodni odstavec (lede)
    lezi na guide strankach PRED <main>, takze cist jen <main> by o ne pripravilo.
    Navigace a paticka se vyhazuji podle znacky a tridy (SKIP_TAGS / SKIP_CLASSES).
    """

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.in_main = False  # zapne se na prvnim <h1>
        self.depth = 0
        self.skip_depth = 0
        self.tag_stack = []
        self.out = []
        self.buf = []

    # --- pomocne ---
    def _flush(self, prefix="", suffix="\n"):
        text = " ".join("".join(self.buf).split())
        self.buf = []
        if text:
            self.out.append(prefix + text + suffix)

    # --- parser ---
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        classes = set((attrs.get("class") or "").split())

        if tag in SKIP_TAGS or (classes & SKIP_CLASSES):
            # Navigaci preskoc i predtim, nez zacneme sbirat — jinak by <h1>
            # v hlavicce webu spustilo sber uz na topbaru.
            if self.in_main:
                self.depth += 1
                if not self.skip_depth:
                    self.skip_depth = self.depth
            return

        if not self.in_main:
            if tag != "h1":
                return
            self.in_main = True  # nasli jsme nadpis stranky, odtud sbirame
            self.depth = 0

        self.depth += 1
        if self.skip_depth:
            return

        if tag in ("h1", "h2", "h3", "h4", "p", "li", "td", "th"):
            self._flush()
            self.tag_stack.append(tag)

    def handle_endtag(self, tag):
        if not self.in_main:
            return
        if tag == "body":
            self._flush()
            self.in_main = False
            return

        if self.skip_depth and self.depth <= self.skip_depth:
            self.skip_depth = 0

        if self.tag_stack and tag == self.tag_stack[-1]:
            open_tag = self.tag_stack.pop()
            prefix = {
                "h1": "\n# ", "h2": "\n## ", "h3": "\n### ", "h4": "\n#### ",
                "li": "- ", "td": "- ", "th": "- ",
            }.get(open_tag, "")
            self._flush(prefix=prefix)

        self.depth = max(0, self.depth - 1)

    def handle_data(self, data):
        if self.in_main and not self.skip_depth:
            self.buf.append(data)


def extract(path: Path) -> str:
    parser = MainTextExtractor()
    parser.feed(path.read_text(encoding="utf-8"))
    text = "".join(parser.out)
    text = html.unescape(text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    # Po vyhozeni bloku "dalsi guides" zustal jeho nadpis viset prazdny — pryc s nim.
    text = re.sub(r"\n#+ More guides[^\n]*\s*$", "", text)
    return text.strip()


def main():
    header = (PUBLIC / "llms.txt").read_text(encoding="utf-8").strip()

    parts = [
        header,
        "\n\n---\n",
        "# Full text of the guides\n",
        "Everything below is the complete text of the guide pages listed above,",
        "in the same order. Each guide links to the authoritative Dutch source;",
        "this is practical orientation, not official or medical advice.\n",
    ]

    for rel, title in PAGES:
        path = PUBLIC / rel
        if not path.exists():
            print(f"  ! chybi {rel} — preskakuji")
            continue
        body = extract(path)
        if not body:
            print(f"  ! {rel} nema <main> nebo je prazdny — preskakuji")
            continue
        parts.append(f"\n\n---\n\n<!-- {title} -->")
        parts.append(f"Source: https://raisingamsterdam.com/{rel}\n")
        parts.append(body)
        print(f"  + {title}: {len(body):,} znaku")

    out = "\n".join(parts).rstrip() + "\n"
    target = PUBLIC / "llms-full.txt"
    target.write_text(out, encoding="utf-8")
    print(f"\nhotovo: public/llms-full.txt ({len(out):,} znaku)")


if __name__ == "__main__":
    main()
