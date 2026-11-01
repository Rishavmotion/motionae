# Component catalog

23 proven Apple-style motion graphics, shared by both routes:
- **AE route:** `ae/motionkit.jsxinc` has the helpers they were built with.
- **Web route:** build them with `kit/motionkit.js`; `templates/` holds finished ones (`calendar` = #19).

Each entry gives what it shows, what should be editable, and its sound cues (sound names from `tools/generate_sfx.py`, with seconds from the start).

| # | Component | Theme | Len | What it is |
|---|---|---|---|---|
| 01 | Kinetic Title | light | 5s | Eyebrow, headline that types in with a soft blur edge, and subline |
| 02 | Word Stack | light | 5s | Big stacked words ("Shoot. Edit. Ship."), last word in the accent color |
| 03 | Callout Pointer | light | 5s | Pulsing target dot, a leader line that draws itself, and a label pill. Move the Target and Label Point controls to aim it |
| 04 | Lower Third | light | 5s | Name and role card that resizes to fit the text |
| 05 | Stat Counter | light | 5s | Big number that counts up, a label, and a delta chip |
| 06 | Stat Trio | light | 5s | Three counters side by side |
| 07 | Bar Chart | light | 6s | Five bars driven by value sliders, with counting value labels and a highlight bar |
| 08 | Progress Ring | light | 5s | Ring that fills to a percent, with a counter in the middle |
| 09 | Flow Diagram | light | 6s | Three nodes joined by connectors that draw themselves |
| 10 | Profile Card | white | 5s | YouTube-style channel card (banner, avatar, verified badge, Subscribed button) |
| 11 | Social Post | light | 5s | Instagram-style post (header, media, counts, caption) |
| 12 | Product Card | dark | 5s | Horizontal dark card: product tile, name, price pill, Add to cart |
| 13 | Product Tile | dark | 5s | Vertical white product tile that enters with a 3D-ish tilt |
| 14 | Product Detail | white | 6s | Product page: rating chip, quantity, checkout, description panel |
| 15 | Video Card | white | 6s | Video thumbnail with a live waveform pill and action pills |
| 16 | Tooltip Bubble | dark | 5s | Speech-bubble product callout that pops out of its tail with a wobble |
| 17 | Checklist Light | white | 6s | Items type in, a highlight bar follows the newest item, boxes get checked |
| 18 | Checklist Dark | dark | 6s | Same idea, with a "Bullet List" header and a rotating chevron |
| 19 | Calendar Event | light | 6s | Month view with real date math, a highlighted day and an event bubble |
| 20 | Step Card | light | 5s | "Step 1" card with tilted photo and stickers, plus a folder-tab panel |
| 21 | Post Thread | white | 7s | X/Twitter-style post plus a reply, with a keyframed scroll |
| 22 | Notification | light | 4s | iOS-style banner that slides down |
| 23 | Search Bar | light | 6s | A query that types in with a caret, then a suggestions dropdown |

Themes: **light** is #F5F5F7 with white cards, **white** is #FFFFFF with #F2F2F7 cards, **dark** is #1E1E1E with #2C2C2E cards; ink #1D1D1F / #F5F5F7, secondary #86868B, accent #0A84FF.

## Fields and cues

- **Kinetic Title**: text: Eyebrow, Headline, Subline; sounds: ui_tick@0, type_roll@0.25, whoosh_in@1.4
- **Word Stack**: text: Caption, Word 1…N; sounds: sparkle@1.15
- **Callout Pointer**: text: Label, Sublabel; points: Label Point, Target; sounds: ui_pop@0, draw@0.3, bubble_in@0.8, type_roll@1.2
- **Lower Third**: text: Name, Role; sounds: whoosh_in@0, type_roll@0.3, ui_tick@0.75
- **Stat Counter**: text: Delta Chip, Label, Number Format (# = number); numbers: Count Duration, Decimals, Number; toggles: Thousands Separator; sounds: counter_roll@0.1, ui_pop@1.5, sparkle@1.55
- **Stat Trio**: text: Label 1…N; numbers: Count Duration, Decimals , Number ; toggles: Thousands Separator; sounds: counter_roll@0.1, ui_tick@0.3, ui_tick@0.5
- **Bar Chart**: text: Bar 1…N, Subtitle, Title, Value Format (# = number); numbers: Bar , Decimals, Highlight Bar, Scale Max; toggles: Thousands Separator; sounds: rise@0.35, ui_tick@0.35, ui_tick@0.59, ui_tick@0.83, sparkle@1.4
- **Progress Ring**: text: Label, Number Format (# = number); numbers: Count Duration, Decimals, Percent; toggles: Thousands Separator; sounds: rise@0.25, counter_roll@0.25, check@1.85
- **Flow Diagram**: text: Step 1…N; sounds: sparkle@2.3
- **Profile Card**: text: Button Label, Handle, Name, Stats; media: Avatar, Banner; sounds: whoosh_in@0, ui_pop@0.25, type_roll@0.5, ui_pop@1, toggle@1.3
- **Social Post**: text: Audio Line, Caption, Comments, Likes, Shares, Timestamp, Username; media: Avatar, Post Media; sounds: ui_pop@0, whoosh_in@0.3, ui_tick@0.8, ui_tick@0.95, ui_tick@1.05, ui_tap@1.2, type_roll@1.35
- **Product Card**: text: Brand, Button Label, Price, Product Name; media: Product; sounds: whoosh_in@0, type_roll@0.3, ui_pop@1.25, ui_tap@1.4
- **Product Tile**: text: Price, Product Name; media: Product; sounds: whoosh_in@0, type_roll@0.55, ui_tick@0.95, ui_pop@1.15
- **Product Detail**: text: Checkout Label, Description, Description Title, Price, Quantity, Rating, Title; media: Product; sounds: whoosh_in@0, type_roll@0.3, ui_pop@0.4, ui_tick@0.75, ui_pop@0.95, ui_tap@1.15, ui_tap@1.25, whoosh_in@1.45, type_roll@1.9
- **Video Card**: text: Channel, Like Count, Meta, Title; media: Channel Avatar, Thumbnail; sounds: whoosh_in@0, ui_pop@0.45, type_roll@0.55, ui_tick@1.25, ui_tick@1.35, ui_tick@1.45, ui_tick@1.55, sparkle@1.65
- **Tooltip Bubble**: text: Price, Subtitle, Title; media: Product; sounds: bubble_in@0, ui_pop@0.25, type_roll@0.35, ui_tick@0.9
- **Checklist Light**: text: Header, Item 1…N; toggles: Show Highlight; extra colors: Highlight; sounds: whoosh_in@0, type_roll@0.15, toggle@0.3
- **Checklist Dark**: text: Header, Item 1…N; toggles: Show Highlight; extra colors: Highlight; sounds: whoosh_in@0, type_roll@0.15, toggle@0.3
- **Calendar Event**: text: Event Title, Month, Year; numbers: Days in Month, First Weekday (0=Sun), Highlight Day, Week Offset; sounds: ui_tick@0, type_roll@0.25, swipe@0.75, ding@1.6, bubble_in@2
- **Step Card**: text: Description, Step Label, Sticker Label, Title; media: App Icon, Photo; sounds: whoosh_in@0, type_roll@0.2, ui_pop@0.35, ui_pop@0.55, whoosh_in@0.7, ui_pop@0.85, type_roll@1, draw@1.35, type_roll@1.5
- **Post Thread**: text: Account Handle, Account Name, Post Stat 1…N, Post Text, Reply Handle, Reply Meta, Reply Name, Reply Stat 1…N, Reply Text; media: Account Avatar, Post Media, Reply Avatar; sounds: ui_tick@0.9, ui_pop@0, type_roll@0.3, whoosh_in@0.55, draw@2, swipe@2.2, ui_pop@2.4, type_roll@2.8, type_roll@3.7, ui_tick@4.55
- **Notification**: text: App Name, Message, Time; media: App Icon; sounds: ding@0.1, whoosh_out@3.45
- **Search Bar**: text: Search Query, Suggestion 1…N; sounds: ui_tick@2.1, ui_tap@0, type_roll@0.4, type_roll@1.3, whoosh_in@1.9, toggle@2.6
