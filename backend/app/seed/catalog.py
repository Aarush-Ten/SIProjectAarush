from app.schemas.api import CareerOutput, CareerSkillOutput, InterestOutput, SkillOutput

# These are reviewed demo assumptions, not a certification or job-readiness standard.
SKILL_ROWS = [
    ("python", "Python", "Read and write small Python programs."),
    ("html", "HTML", "Structure accessible web pages using semantic HTML."),
    ("css", "CSS", "Style responsive interfaces with CSS."),
    ("javascript", "JavaScript", "Write interactive browser programs."),
    ("sql", "SQL", "Query and summarize relational data."),
    ("networking", "Networking", "Explain IP networks, DNS and common protocols."),
    ("linux", "Linux", "Use a Linux shell and understand files and permissions."),
    ("security_basics", "Security basics", "Recognize common threats and safe practices."),
    ("incident_response", "Incident response", "Document and triage illustrative alerts."),
    ("git", "Git", "Track changes and collaborate through version control."),
    ("troubleshooting", "Troubleshooting", "Isolate and document a technical problem."),
    ("communication", "Communication", "Explain work clearly and listen to users."),
    ("hardware_basics", "Computer hardware", "Identify components and basic maintenance needs."),
    ("testing", "Software testing", "Design checks and reproduce software defects."),
    ("test_automation", "Test automation", "Automate repeatable software checks."),
    ("spreadsheets", "Spreadsheets", "Clean tabular data and use formulas."),
    ("data_visualization", "Data visualization", "Choose clear charts and explain findings."),
    ("statistics", "Basic statistics", "Interpret averages, variation and sampling limits."),
    ("user_research", "User research", "Plan interviews and synthesize observed needs."),
    ("visual_design", "Visual design", "Use type, spacing and hierarchy consistently."),
    ("prototyping", "Prototyping", "Model and test an interface interaction."),
    ("accessibility", "Accessibility", "Check keyboard, contrast and semantic usability."),
    ("content_writing", "Content writing", "Write clear, audience-appropriate content."),
    ("seo", "SEO basics", "Explain search visibility and useful page metadata."),
    ("analytics", "Digital analytics", "Interpret basic audience and campaign measures."),
    ("social_media", "Social media", "Plan responsible posts and community responses."),
    ("cad", "CAD drafting", "Read and create basic computer-aided drawings."),
    ("technical_drawing", "Technical drawing", "Interpret dimensions and engineering drawings."),
    ("measurement", "Measurement", "Measure and record dimensions accurately."),
    ("electrical_basics", "Electrical fundamentals", "Explain circuits, current and voltage."),
    ("safety", "Workplace safety", "Identify hazards and follow supervised safety procedures."),
    ("solar_systems", "Solar PV systems", "Identify PV components and system functions."),
    (
        "installation",
        "Installation procedures",
        "Explain documented assembly and installation steps.",
    ),
    ("inventory", "Inventory management", "Record stock movements and identify discrepancies."),
    ("logistics", "Logistics planning", "Coordinate basic dispatch and delivery records."),
    ("office_tools", "Office tools", "Prepare documents, schedules and organized records."),
]
SKILLS = [
    SkillOutput(id=slug, label_en=label, description=description)
    for slug, label, description in SKILL_ROWS
]
SKILL_BY_ID = {skill.id: skill for skill in SKILLS}

INTERESTS = [
    InterestOutput(id=slug, label=label)
    for slug, label in [
        ("cybersecurity", "Cybersecurity"),
        ("web_development", "Web development"),
        ("it_support", "IT support"),
        ("data", "Data and analysis"),
        ("design", "Design"),
        ("digital_marketing", "Digital marketing"),
        ("engineering", "Engineering and drafting"),
        ("renewable_energy", "Renewable energy"),
        ("electrical", "Electrical work"),
        ("logistics", "Logistics and operations"),
        ("administration", "Office administration"),
        ("quality_assurance", "Quality assurance"),
    ]
]


def career(
    slug: str,
    title: str,
    summary: str,
    interests: list[str],
    essential: list[tuple[str, int, int]],
    optional: list[tuple[str, int, int]],
    tasks: list[str],
    hours: int = 6,
    device: str = "computer",
    budget: int = 0,
    note: str | None = None,
) -> CareerOutput:
    return CareerOutput(
        slug=slug,
        title=title,
        summary=summary,
        interest_tags=interests,
        device_requirement=device,
        recommended_hours_per_week=hours,
        practice_budget_inr=budget,
        device_note=note
        or ("Computer access is needed for practical exercises; a phone can support reading."),
        source_note="curated_demo",
        tasks=tasks,
        skills=[
            CareerSkillOutput(
                skill_id=skill_id,
                label=SKILL_BY_ID[skill_id].label_en,
                required_level=level,
                importance=importance,
                weight=weight,
            )
            for importance, entries in [("essential", essential), ("optional", optional)]
            for skill_id, level, weight in entries
        ],
    )


CAREERS = [
    career(
        "soc-analyst",
        "SOC Analyst (junior)",
        "Explore defensive security through supervised alert triage and clear incident notes.",
        ["cybersecurity"],
        [
            ("python", 2, 3),
            ("networking", 2, 5),
            ("linux", 2, 5),
            ("security_basics", 2, 5),
            ("incident_response", 1, 3),
        ],
        [("sql", 1, 2), ("communication", 2, 2), ("git", 1, 1)],
        ["Review illustrative alerts", "Record triage observations", "Escalate using a playbook"],
        hours=8,
    ),
    career(
        "frontend-developer",
        "Frontend Developer",
        "Build accessible, responsive browser interfaces and review their behavior.",
        ["web_development", "design"],
        [("html", 2, 5), ("css", 2, 5), ("javascript", 2, 5), ("git", 1, 2)],
        [("accessibility", 2, 2), ("testing", 1, 2), ("visual_design", 1, 1)],
        ["Implement interface components", "Check small-screen layouts", "Review code changes"],
        hours=8,
    ),
    career(
        "it-support-technician",
        "IT Support Technician",
        "Help users diagnose computer and connectivity issues and keep useful support records.",
        ["it_support"],
        [
            ("troubleshooting", 2, 5),
            ("hardware_basics", 2, 4),
            ("networking", 1, 4),
            ("communication", 2, 3),
        ],
        [("linux", 1, 2), ("security_basics", 1, 2), ("office_tools", 1, 1)],
        ["Clarify a support request", "Check device and network symptoms", "Record a resolution"],
    ),
    career(
        "qa-tester",
        "QA Tester",
        "Investigate software behavior using repeatable checks and clear defect reports.",
        ["quality_assurance", "web_development"],
        [("testing", 2, 5), ("troubleshooting", 2, 4), ("communication", 2, 3)],
        [("test_automation", 1, 3), ("javascript", 1, 2), ("sql", 1, 2)],
        ["Write test cases", "Reproduce an issue", "Document a defect and expected behavior"],
    ),
    career(
        "data-analyst",
        "Data Analyst (junior)",
        "Prepare tabular data and communicate careful, limited conclusions from it.",
        ["data"],
        [("spreadsheets", 2, 4), ("sql", 2, 5), ("statistics", 2, 4), ("data_visualization", 2, 4)],
        [("python", 2, 3), ("communication", 2, 2), ("analytics", 1, 1)],
        ["Clean a small dataset", "Query a question", "Explain a chart and its limitations"],
        hours=8,
    ),
    career(
        "ui-ux-designer",
        "UI/UX Designer",
        "Understand user needs and test clear interface ideas before implementation.",
        ["design"],
        [
            ("user_research", 2, 5),
            ("visual_design", 2, 4),
            ("prototyping", 2, 5),
            ("communication", 2, 3),
        ],
        [("accessibility", 2, 3), ("html", 1, 1), ("content_writing", 1, 1)],
        ["Summarize user observations", "Sketch a task flow", "Test an interactive prototype"],
    ),
    career(
        "digital-marketing-associate",
        "Digital Marketing Associate",
        "Plan useful digital content and review simple campaign measures responsibly.",
        ["digital_marketing", "design"],
        [("content_writing", 2, 4), ("seo", 1, 3), ("analytics", 1, 4), ("social_media", 2, 4)],
        [("visual_design", 1, 2), ("spreadsheets", 1, 2), ("communication", 2, 2)],
        ["Draft a content calendar", "Review a page's metadata", "Summarize campaign measures"],
        device="any",
        note=(
            "A smartphone supports introductory content exercises; detailed analytics and "
            "production workflows may still need a computer."
        ),
    ),
    career(
        "cad-technician",
        "CAD Technician",
        "Translate engineering drawing instructions into precise digital drafts.",
        ["engineering", "design"],
        [("cad", 2, 5), ("technical_drawing", 2, 5), ("measurement", 2, 4)],
        [("communication", 1, 2), ("safety", 1, 2), ("office_tools", 1, 1)],
        ["Interpret a drawing brief", "Draft dimensions", "Check a drawing revision"],
        hours=8,
        note=(
            "CAD practice needs a compatible computer and software; check actual lab access "
            "and software costs separately. The demo assumes a free or institution-provided tool."
        ),
    ),
    career(
        "solar-pv-technician",
        "Solar PV Technician",
        "Explore PV components, safe site procedures and supervised installation support.",
        ["renewable_energy", "electrical"],
        [
            ("electrical_basics", 2, 5),
            ("safety", 3, 5),
            ("solar_systems", 2, 5),
            ("installation", 2, 4),
            ("measurement", 2, 3),
        ],
        [("technical_drawing", 1, 2), ("communication", 1, 2), ("inventory", 1, 1)],
        [
            "Identify PV components",
            "Review a safety checklist",
            "Record supervised inspection notes",
        ],
        device="any",
        budget=500,
        note=(
            "A phone supports theory only. Practical work needs supervised training, safe "
            "equipment and site access; budget INR 500 is illustrative, not a price quote."
        ),
    ),
    career(
        "electrical-technician",
        "Electrical Technician",
        "Develop circuit understanding and disciplined safety habits for supervised work.",
        ["electrical", "engineering"],
        [
            ("electrical_basics", 2, 5),
            ("safety", 3, 5),
            ("troubleshooting", 2, 4),
            ("measurement", 2, 4),
        ],
        [("installation", 2, 3), ("technical_drawing", 1, 2), ("communication", 1, 1)],
        [
            "Read a simple circuit drawing",
            "Review safe isolation procedures",
            "Log supervised checks",
        ],
        device="any",
        budget=500,
        note=(
            "A phone supports theory only. Electrical practice requires qualified supervision "
            "and safe equipment; INR 500 is an illustrative assumption, not a training quote."
        ),
    ),
    career(
        "logistics-coordinator",
        "Supply Chain/Logistics Coordinator",
        "Keep stock and dispatch records organized and communicate delivery changes.",
        ["logistics", "administration"],
        [("inventory", 2, 5), ("logistics", 2, 5), ("spreadsheets", 2, 4), ("communication", 2, 3)],
        [("office_tools", 2, 2), ("analytics", 1, 1), ("safety", 1, 1)],
        [
            "Reconcile a sample stock record",
            "Prepare dispatch notes",
            "Communicate a schedule change",
        ],
    ),
    career(
        "office-administration-assistant",
        "Office Administration Assistant",
        "Support daily coordination through clear documents, schedules and accurate records.",
        ["administration"],
        [("office_tools", 2, 5), ("communication", 2, 4), ("spreadsheets", 1, 3)],
        [("content_writing", 1, 2), ("inventory", 1, 1), ("security_basics", 1, 2)],
        [
            "Prepare an office document",
            "Organize a sample schedule",
            "Check a simple records sheet",
        ],
        hours=4,
    ),
]
