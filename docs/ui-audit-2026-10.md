# UI audit, October 2026

Audited the live page at 1280×800 and 390×844, idle and mid-race in all 7 categories, with the impeccable detector and screenshots.

| # | Severity | Finding | Fix |
|---|---|---|---|
| 1 | P0 | A first visit showed an empty arena: no contenders, and Run refused until two had been added by hand. Panels stayed blank until the race started. | Each category starts with two contenders drawn at their starting position (`js/defaults.js`, tested in `defaults.test.js`). |
| 2 | P0 | At phone width the arena sat beside the controls, pushed off the right edge. | Below 760px the controls stack above the race; the arena grid's minimum column clamps to the screen. |
| 3 | P1 | On a phone, the race started below the fold after pressing Run. | Run scrolls the arena into view (instantly under reduced motion). |
| 4 | P1 | Run looked like every other button; buttons were about 32px tall. | Run is the primary button; buttons are at least 40px tall. |
| 5 | P2 | `css/theme.css` was never loaded and defined a second, conflicting palette. | Removed. |
| 6 | P2 | A 404 on every load (no favicon). | Inline SVG favicon. |
| 7 | P3 | Panels lifted on hover although they aren't interactive. | Removed the hover lift. |

Detector notes: the header's "low contrast" finding is a false positive. The tool modelled the translucent gradient over white, but the page background is near-black, so light-on-dark contrast is above 12:1. "Overused font: Inter" is kept on purpose, as part of the existing identity.
