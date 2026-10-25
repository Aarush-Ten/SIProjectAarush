# Phase 2 learning-reference verification

The 33 resources in `backend/app/seed/resources.py` were opened using the web tool on **24 October 2026**. All 36 normalized skills have at least one mapped resource. These are official public reading references, not a claim that a complete career course, software licence, certificate, lab, or supervised training is free.

Every resource has `cost_inr: 0`, `is_free: true`, `last_checked: 2026-10-24`, and `device_requirement: any`. Here `any` means the reading can be accessed on a phone; computer exercises, CAD software, physical measurement, electrical work, and solar installation retain separate practical requirements. The planner and UI must keep those limitations visible.

`estimated_hours` is a developer-curated introductory study allocation. It is not a provider duration, promise of proficiency, or estimate of completing an entire linked book. No content is scraped into the application and no resource needs to be fetched during generation. Public pages may change after this check.

## Checked records

| Resource ID | Official reference | Skill mapping |
| --- | --- | --- |
| `python-tutorial` | [Python tutorial](https://docs.python.org/3/tutorial/) | Python |
| `mdn-html` | [HTML structure](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content) | HTML |
| `mdn-css` | [CSS styling basics](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics) | CSS |
| `mdn-javascript` | [JavaScript scripting](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting) | JavaScript |
| `postgresql-sql` | [PostgreSQL tutorial](https://www.postgresql.org/docs/current/tutorial.html) | SQL |
| `mdn-internet` | [How the Internet works](https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/How_does_the_Internet_work) | Networking |
| `ubuntu-command-line` | [Linux command line](https://ubuntu.com/tutorials/command-line-for-beginners) | Linux |
| `nist-security` | [Cybersecurity Framework](https://www.nist.gov/cyberframework) | Security basics |
| `nist-incident-response` | [Incident response publication](https://csrc.nist.gov/pubs/sp/800/61/r3/final) | Incident response |
| `pro-git` | [Pro Git](https://git-scm.com/book/en/v2) | Git |
| `windows-support` | [Windows help](https://support.microsoft.com/en-us/windows/) | Troubleshooting, computer hardware |
| `atlassian-testing` | [Types of software testing](https://www.atlassian.com/continuous-delivery/software-testing/types-of-software-testing) | Testing |
| `playwright-testing` | [Playwright introduction](https://playwright.dev/docs/intro) | Test automation |
| `excel-help` | [Excel help](https://support.microsoft.com/en-us/excel/) | Spreadsheets |
| `powerbi-overview` | [Power BI overview](https://learn.microsoft.com/en-us/power-bi/fundamentals/power-bi-overview) | Data visualization |
| `nist-statistics` | [Measures of location](https://www.itl.nist.gov/div898/handbook/eda/section3/eda351.htm) | Statistics |
| `gov-user-research` | [User research](https://www.gov.uk/service-manual/user-research) | User research |
| `webdev-design` | [Responsive design](https://web.dev/learn/design) | Visual design |
| `gov-prototypes` | [Making prototypes](https://www.gov.uk/service-manual/design/making-prototypes) | Prototyping |
| `mdn-accessibility` | [Web accessibility](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Accessibility) | Accessibility |
| `google-technical-writing` | [Technical Writing One](https://developers.google.com/tech-writing/one) | Content writing, communication |
| `google-seo` | [SEO starter guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide) | SEO |
| `google-analytics` | [Analytics setup concepts](https://support.google.com/analytics/answer/9304153?hl=en) | Analytics |
| `gov-social-media` | [Social media playbook](https://www.gov.uk/guidance/social-media-playbook) | Social media |
| `librecad-manual` | [LibreCAD manual](https://docs.librecad.org/en/latest/) | CAD, technical drawing |
| `librecad-dimensions` | [Drawing annotation](https://docs.librecad.org/en/latest/guides/annotate.html) | Measurement, technical drawing |
| `openstax-circuits` | [Ohm's law and simple circuits](https://openstax.org/books/college-physics-2e/pages/20-2-ohms-law-resistance-and-simple-circuits) | Electrical fundamentals |
| `hse-workplace-safety` | [Workplace safety basics](https://www.hse.gov.uk/simple-health-safety/) | Safety |
| `doe-solar-basics` | [Solar PV technology basics](https://www.energy.gov/cmei/systems/solar-photovoltaic-technology-basics) | Solar systems |
| `hse-installation-awareness` | [Electrical hazards and supervision](https://www.hse.gov.uk/electricity/introduction.htm) | Installation awareness, safety |
| `dynamics-inventory` | [Inventory concepts](https://learn.microsoft.com/en-us/dynamics365/supply-chain/inventory/inventory-home-page) | Inventory |
| `dynamics-logistics` | [Transportation concepts](https://learn.microsoft.com/en-us/dynamics365/supply-chain/transportation/transportation-management-overview) | Logistics |
| `word-help` | [Word help](https://support.microsoft.com/en-us/word/) | Office tools |

## Verification limits and excluded candidates

- Microsoft support short URLs redirected to their `/en-us/` help hubs; those final URLs are stored. They are broad reference hubs, clearly titled as such. Microsoft Learn returned the public overview text alongside a generic authorization banner; operating the described products can require a separate account or subscription.
- The DOE solar URL redirected to the stored `/cmei/systems/` page. The old proposed home-solar planning URL returned 404 and was excluded.
- The Ubuntu tutorial is accessible and identifies a newer replacement. The LibreCAD manual identifies itself as work in progress. Their limitations are also recorded in source notes.
- A proposed MDN design extension URL, a GOV.UK design-system prototyping URL, and the legacy GDS blog social-media URL were inaccessible through the tool. Verified web.dev, GOV.UK Service Manual, and GOV.UK playbook pages were used instead.
- SparkFun's proposed circuits page returned 403 and was excluded. OpenStax's public textbook chapter provides theory reading instead.
- The NIST handbook's root page required frames and was not used as the statistics record. A directly opened chapter on measures of location was used instead.
- GOV.UK's older writing guide redirected to an unresolved redirect page and was excluded. Google's checked Technical Writing One page was used instead.

HSE, NIST, US DOE, and UK government references offer background educational material. Their legal, licensing, financial, or platform-specific details are not asserted to apply in India. Electrical/solar installation and measurement activities in this prototype are theory or case exercises; practical work requires suitable local training, qualified supervision, equipment, and applicable Indian requirements. No imported salaries, vacancy statistics, certification eligibility, pilot results, or market-demand claims are included.
