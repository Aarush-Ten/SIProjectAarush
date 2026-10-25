"""Checked official reading references; durations are illustrative study allocations."""

from datetime import date

from app.schemas.roadmap import LearningResourceOutput

CHECKED = date(2026, 10, 24)
READING_NOTE = (
    "Checked official public reading on 2026-10-24. Free refers to the linked text, "
    "not software, certification or practical equipment. Hours are a curated demo "
    "study allocation, not the provider's course duration. Phone reading does not "
    "replace computer practice or qualified supervision."
)


def reading(
    resource_id: str,
    title: str,
    provider: str,
    url: str,
    skills: list[str],
    hours: float = 2,
    note: str = "",
) -> LearningResourceOutput:
    return LearningResourceOutput(
        id=resource_id,
        title=title,
        provider=provider,
        url=url,
        cost_inr=0,
        is_free=True,
        skill_ids=skills,
        estimated_hours=hours,
        source_note=READING_NOTE + (" " + note if note else ""),
        last_checked=CHECKED,
        device_requirement="any",
    )


RESOURCES = [
    reading(
        "python-tutorial",
        "Python tutorial: introductory reading",
        "Python Software Foundation",
        "https://docs.python.org/3/tutorial/",
        ["python"],
        4,
        "The tutorial assumes some general programming familiarity.",
    ),
    reading(
        "mdn-html",
        "Structuring content with HTML",
        "MDN Web Docs",
        "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content",
        ["html"],
        4,
    ),
    reading(
        "mdn-css",
        "CSS styling basics",
        "MDN Web Docs",
        "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics",
        ["css"],
        4,
    ),
    reading(
        "mdn-javascript",
        "Dynamic scripting with JavaScript",
        "MDN Web Docs",
        "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting",
        ["javascript"],
        4,
    ),
    reading(
        "postgresql-sql",
        "PostgreSQL SQL tutorial",
        "PostgreSQL Global Development Group",
        "https://www.postgresql.org/docs/current/tutorial.html",
        ["sql"],
        4,
    ),
    reading(
        "mdn-internet",
        "How the Internet works",
        "MDN Web Docs",
        (
            "https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/How_does_the_Internet_work"
        ),
        ["networking"],
    ),
    reading(
        "ubuntu-command-line",
        "The Linux command line for beginners",
        "Canonical / Ubuntu",
        "https://ubuntu.com/tutorials/command-line-for-beginners",
        ["linux"],
        4,
        "This accessible tutorial also points to a newer Ubuntu documentation version.",
    ),
    reading(
        "nist-security",
        "Cybersecurity Framework: orientation reading",
        "NIST",
        "https://www.nist.gov/cyberframework",
        ["security_basics"],
    ),
    reading(
        "nist-incident-response",
        "Incident response recommendations: overview",
        "NIST",
        "https://csrc.nist.gov/pubs/sp/800/61/r3/final",
        ["incident_response"],
        2,
        "Publication landing page and freely available report; introductory selected reading.",
    ),
    reading(
        "pro-git",
        "Pro Git: introductory chapters",
        "Git project",
        "https://git-scm.com/book/en/v2",
        ["git"],
        3,
    ),
    reading(
        "windows-support",
        "Windows help: devices and troubleshooting reference",
        "Microsoft Support",
        "https://support.microsoft.com/en-us/windows/",
        ["troubleshooting", "hardware_basics"],
        2,
        "Public help hub, not a hardware repair course or a Windows software licence.",
    ),
    reading(
        "atlassian-testing",
        "Types of software testing",
        "Atlassian",
        "https://www.atlassian.com/continuous-delivery/software-testing/types-of-software-testing",
        ["testing"],
    ),
    reading(
        "playwright-testing",
        "Playwright testing: introduction",
        "Microsoft / Playwright",
        "https://playwright.dev/docs/intro",
        ["test_automation"],
        3,
    ),
    reading(
        "excel-help",
        "Excel help and learning: reference reading",
        "Microsoft Support",
        "https://support.microsoft.com/en-us/excel/",
        ["spreadsheets"],
        3,
        "Public help content only; a paid Excel licence is not included or required for reading.",
    ),
    reading(
        "powerbi-overview",
        "Data visualization with Power BI: overview reading",
        "Microsoft Learn",
        "https://learn.microsoft.com/en-us/power-bi/fundamentals/power-bi-overview",
        ["data_visualization"],
        2,
        "Public overview text; software accounts, subscriptions and advanced labs are separate.",
    ),
    reading(
        "nist-statistics",
        "Descriptive statistics: measures of location",
        "NIST / SEMATECH",
        "https://www.itl.nist.gov/div898/handbook/eda/section3/eda351.htm",
        ["statistics"],
    ),
    reading(
        "gov-user-research",
        "User research: methods and planning",
        "UK Government Service Manual",
        "https://www.gov.uk/service-manual/user-research",
        ["user_research"],
    ),
    reading(
        "webdev-design",
        "Responsive design: layout and typography reading",
        "Google / web.dev",
        "https://web.dev/learn/design",
        ["visual_design"],
        3,
    ),
    reading(
        "gov-prototypes",
        "Making prototypes",
        "UK Government Service Manual",
        "https://www.gov.uk/service-manual/design/making-prototypes",
        ["prototyping"],
    ),
    reading(
        "mdn-accessibility",
        "Accessibility on the web",
        "MDN Web Docs",
        "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Accessibility",
        ["accessibility"],
        3,
    ),
    reading(
        "google-technical-writing",
        "Technical Writing One: clear communication",
        "Google for Developers",
        "https://developers.google.com/tech-writing/one",
        ["content_writing", "communication"],
        3,
    ),
    reading(
        "google-seo",
        "Search Engine Optimization starter guide",
        "Google Search Central",
        "https://developers.google.com/search/docs/fundamentals/seo-starter-guide",
        ["seo"],
    ),
    reading(
        "google-analytics",
        "Google Analytics setup concepts: reading",
        "Google Analytics Help",
        "https://support.google.com/analytics/answer/9304153?hl=en",
        ["analytics"],
        2,
        "Read the concepts without registering; operating a property requires a separate account.",
    ),
    reading(
        "gov-social-media",
        "Social media playbook: planning and evaluation",
        "UK Government Digital Service",
        "https://www.gov.uk/guidance/social-media-playbook",
        ["social_media"],
        2,
        (
            "Use general planning concepts; historical platform examples and figures are not "
            "current market data."
        ),
    ),
    reading(
        "librecad-manual",
        "LibreCAD user manual: drafting reference",
        "LibreCAD project",
        "https://docs.librecad.org/en/latest/",
        ["cad", "technical_drawing"],
        4,
        "The manual identifies itself as work in progress; computer access is needed for drafting.",
    ),
    reading(
        "librecad-dimensions",
        "Drawing dimensions and annotation",
        "LibreCAD project",
        "https://docs.librecad.org/en/latest/guides/annotate.html",
        ["measurement", "technical_drawing"],
        2,
        (
            "Drawing units and dimensioning theory; physical measurement practice needs "
            "appropriate supervision."
        ),
    ),
    reading(
        "openstax-circuits",
        "Ohm's law and simple circuits: theory reading",
        "OpenStax / Rice University",
        (
            "https://openstax.org/books/college-physics-2e/pages/20-2-ohms-law-resistance-and-simple-circuits"
        ),
        ["electrical_basics"],
        3,
        "Theory only. Do not perform electrical work without qualified supervision.",
    ),
    reading(
        "hse-workplace-safety",
        "Workplace health and safety: introductory reading",
        "UK Health and Safety Executive",
        "https://www.hse.gov.uk/simple-health-safety/",
        ["safety"],
        2,
        "Background reading in UK context, not Indian legal or certification guidance.",
    ),
    reading(
        "doe-solar-basics",
        "Solar photovoltaic technology basics",
        "US Department of Energy",
        "https://www.energy.gov/cmei/systems/solar-photovoltaic-technology-basics",
        ["solar_systems"],
        2,
        (
            "Component theory only; solar installation needs qualified supervision and local "
            "requirements."
        ),
    ),
    reading(
        "hse-installation-awareness",
        "Electrical installation hazards and competent supervision",
        "UK Health and Safety Executive",
        "https://www.hse.gov.uk/electricity/introduction.htm",
        ["installation", "safety"],
        2,
        (
            "Hazard awareness, not installation instructions or Indian legal guidance. No "
            "unsupervised work."
        ),
    ),
    reading(
        "dynamics-inventory",
        "Inventory management concepts: overview reading",
        "Microsoft Learn",
        "https://learn.microsoft.com/en-us/dynamics365/supply-chain/inventory/inventory-home-page",
        ["inventory"],
        2,
        (
            "Public product documentation illustrates concepts; no Dynamics software access "
            "is included."
        ),
    ),
    reading(
        "dynamics-logistics",
        "Transportation management concepts: overview reading",
        "Microsoft Learn",
        (
            "https://learn.microsoft.com/en-us/dynamics365/supply-chain/transportation/transportation-management-overview"
        ),
        ["logistics"],
        2,
        (
            "Public product documentation illustrates concepts; no Dynamics software access "
            "is included."
        ),
    ),
    reading(
        "word-help",
        "Word help and learning: office document reference",
        "Microsoft Support",
        "https://support.microsoft.com/en-us/word/",
        ["office_tools"],
        2,
        "Public help hub, not a bundled Microsoft 365 software licence.",
    ),
]
