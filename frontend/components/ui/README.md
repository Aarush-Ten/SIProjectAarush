# Local UI primitives

These source-owned primitives adapt the [shadcn/ui Button](https://ui.shadcn.com/docs/components/button) and [Card](https://ui.shadcn.com/docs/components/card) patterns: semantic native elements, a `cn` helper, CVA button variants, typed props, and `data-slot` attributes. Project CSS tokens and classes provide PathForge’s visual design. `components.json` records the local aliases and Tailwind configuration for future additions.

Phase 1 uses ordinary buttons and semantic links styled with `buttonVariants`. No polymorphic button, dialog, or custom select is needed, so no Radix runtime is installed. Forms use accessible native controls. Keep labels, keyboard focus, disabled states, and contrast when extending these primitives.
