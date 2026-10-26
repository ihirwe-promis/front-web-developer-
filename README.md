# CampusMate — Campus Life Planner

CampusMate helps students organize study tasks, due dates, durations, and categories. It is a responsive, vanilla HTML/CSS/JavaScript app. Task data is saved in the browser's local storage and can be imported or exported as JSON.

## Run 

Download or clone the repository, then open `index.html` in a browser. No build step or external library is required. For reliable browser storage, use a local static server or GitHub Pages rather than opening the file directly from disk.

## Features
- Add, edit, and delete tasks with a title, due date, duration in minutes, and category.
- Search titles with regular expressions, highlight matches, filter by category, and sort by due date, duration, or title.
- See total tasks, total study time, top category, and a seven-day study-time chart.
- Set a weekly target and display totals in minutes or hours.
- Persist tasks and settings in local storage; import and export validated JSON.
- Use keyboard navigation, visible focus, a skip link, field errors, and live status announcements.

## Data model
Tasks have the fields `id`, `title`, `dueDate`, `duration`, `category`, `createdAt`, and `updatedAt`. Duration is stored as whole minutes. Dates use `YYYY-MM-DD`; timestamps use ISO 8601.

## Regex catalog
| Purpose | Pattern | Example |
|---|---|---|
| Title has no edge whitespace | `/^\S(?:.*\S)?$/` | Accepts `Read chapter`; rejects ` Read ` |

| No double spaces | `/ {2,}/` | Rejects `Read  chapter` |

| Positive decimal syntax | `/^(0|[1-9]\d*)(\.\d{1,2})?$/` | Accepts `45`; app additionally requires whole minutes |

| Date shape | `/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/` | Accepts `2026-10-20`; app also checks calendar validity |

| Category shape | `/^[A-Za-z]+(?:[ -][A-Za-z]+)*$/` | Accepts `exam prep` |

| Advanced duplicate-word check | `/\b(\w+)\s+\1\b/i` | Finds `study study` using a back-reference |

| Live search example | `biology|chemistry` | Matches either word |

The search expression is compiled inside `try/catch`; malformed patterns produce an accessible error message. Matched text is escaped before it is wrapped in `<mark>`.

## Keyboard and accessibility
- Use `Tab` and `Shift+Tab` to move through controls and links; use `Enter` or `Space` to activate buttons and links.
- Use the skip link at the top of the page to jump to main content.
- Every form input has a visible label and inline validation message.
- Routine updates use polite live regions; a reached or exceeded weekly goal uses an assertive alert.
- The layout adapts for mobile, tablet, and desktop and disables motion when reduced motion is preferred.

## Seed data and checks
- Use the app's **Import JSON** button and select `seed.json` to load ten sample tasks. Import replaces the current task list after confirmation.
- Open `tests.html` in a browser to run small assertions for the input validation and regex compiler.
- Also manually test add/edit/delete, each sort mode, category filter, invalid regex, search highlighting, refresh persistence, target progress, JSON export/import, and the layout at narrow/mobile and desktop widths.

## Deployment
Publish the repository's `outputs` project files to a GitHub repository and enable GitHub Pages from the repository settings. Add the actual Pages URL here after it is live: `https://ihirwe-promis.github.io/front-web-developer-/`

## Demo recording plan
this the link of my video https://youtu.be/6dObzbQgPms

## AI assistance
AI assistance was used to revise and document parts of this project. 

