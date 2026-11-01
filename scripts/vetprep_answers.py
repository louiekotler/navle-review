"""Read a Dose of VetPrep answer by opening the email's choice link.

The link is a HubSpot click-tracking URL whose landing page only redirects
once its JavaScript runs, and the VetPrep answer page itself is rendered by
JavaScript, so this uses headless Chromium (Playwright) the way a person's
browser would open the link. Opening it records that choice for the
subscriber, the same as clicking it in the email.

Usage (test): python3 scripts/vetprep_answers.py LINK
"""
import json
import sys

MARK = "Correct Answer"


def parse(text):
    """Answer and explanation from the answer page's visible text."""
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    answer = None
    for i, line in enumerate(lines):
        if line.endswith(MARK) and line.lstrip("✓ ").startswith(MARK):
            j = i - 1
            if j >= 0 and lines[j] == "✓":
                j -= 1
            answer = lines[j] if j >= 0 else None
            break
    explanation = ""
    if "Explanation" in lines:
        explanation = "\n".join(lines[lines.index("Explanation") + 1:])
    return answer, explanation


def read_answers(links, timeout_ms=45000):
    """{link: {"answer", "explanation"} or {"error"}} for each link."""
    from playwright.sync_api import sync_playwright

    out = {}
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        for link in links:
            try:
                # HubSpot's page never finishes "loading" before its script
                # redirects, so don't wait for its load event.
                page.goto(link, wait_until="commit", timeout=timeout_ms)
                page.wait_for_url(lambda u: "/dailydose-question" in u, timeout=timeout_ms)
                page.get_by_text("Explanation", exact=True).wait_for(timeout=timeout_ms)
                answer, explanation = parse(page.locator("main").inner_text())
                out[link] = ({"answer": answer, "explanation": explanation} if answer
                             else {"error": "no answer marker"})
            except Exception as e:  # report and move on to the next email
                # Host, path and title only: the query string holds tracking IDs.
                where = page.url.split("?")[0].split("://")[-1]
                try:
                    title = page.title()
                except Exception:
                    title = "?"
                out[link] = {"error": f"{type(e).__name__} at {where} (title: {title!r})"}
        browser.close()
    return out


if __name__ == "__main__":
    for r in read_answers(sys.argv[1:]).values():
        print(json.dumps(r, ensure_ascii=False)[:600])
