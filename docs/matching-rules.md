# Deterministic exploration matching

All scores come from the backend. Scores compare a profile snapshot with the illustrative catalog; they do not predict employment, establish eligibility, or prove practical ability. Education, study field, goal, and language are collected as context but do not affect ranking.

## Essential skill coverage

For each essential skill, unreported level defaults to 0. Levels range from 0 to 3. Required levels range from 1 to 3 and weights from 1 to 5.

```text
coverage = 100 * sum(weight * min(user_level / required_level, 1)) / sum(weight)
missing_level = max(required_level - user_level, 0)
```

Only essential requirements enter coverage. Optional gaps are returned separately with `importance: optional`; they do not reduce coverage. Reporting a higher level than required never yields more than 100% coverage.

## Interest alignment

```text
interest_match = 100 * count(career_tags intersect selected_interests) / count(career_tags)
```

When no interests are selected, the component is neutral 50 with `interest_status: unknown`. This is disclosed in the response and UI. An interest contributes to alignment; it is not treated as skill evidence.

## Feasibility rules

```text
feasibility = 0.40 * schedule + 0.40 * device + 0.20 * budget
```

| Factor | Rule | Component score |
| --- | --- | ---: |
| Schedule | Available hours >= career's illustrative recommended weekly hours | 100 |
| Schedule | At least half the recommended hours, below the full recommendation | 75 |
| Schedule | Below half the recommended hours | 50 |
| Device | Introductory study marked `any`, or laptop access | 100 |
| Device | Computer practicals required, shared computer access | 75 |
| Device | Computer practicals required, smartphone only | 25 |
| Budget | Learning budget >= illustrative practice budget | 100 |
| Budget | Learning budget below illustrative practice budget | 50 |

These scores reflect rough introductory-study assumptions. `any` means introductory theory may be accessible; it does not mean the career can be learned or practiced using only a phone. Solar and electrical roles require supervised equipment/site access, independently of phone access. All roles return catalog device notes and applicable warnings.

Catalog weekly recommendations are 8 hours for SOC, frontend, data, and CAD; 4 for office administration; 6 for the other roles. Solar and electrical roles use an **illustrative INR 500 practice budget**; all other demo roles assume INR 0 for introductory study. These values are neither provider prices nor the full cost of training, equipment, certification, transport, or computer access. They require local validation.

## Final ordering

```text
fit = 0.60 * coverage + 0.25 * interest_match + 0.15 * feasibility
```

The starting weights are configurable in the pure matching service. Ranking uses full-precision fit descending, coverage descending, then career slug ascending for stable ties. The API returns exactly the top three of the 12 catalog careers. UI formatting must not recompute or change the backend scores.

## Hand-calculated demo check

For Python=2, HTML=2, SQL=1, cybersecurity interest, 6 hours/week, INR 0 and laptop access:

- SOC essential weights total 21. Python contributes 3 and all other essential skills are unreported: coverage = `100 * 3/21` = approximately 14.2857%.
- Cybersecurity is SOC's only interest tag: alignment = 100%.
- SOC recommends 8 weekly hours: schedule=75, device=100, budget=100; feasibility=90.
- SOC fit = `0.60*(100*3/21) + 0.25*100 + 0.15*90` = approximately 47.0714.
- SOC essential gaps are networking 2, Linux 2, security basics 2, and incident response 1. Python and optional SQL have no gap. Optional communication has gap 2 and Git has gap 1.

The expected demo order is SOC Analyst, Frontend Developer, then Data Analyst. This order follows the catalog and arithmetic; it is not hardcoded for the demo.
