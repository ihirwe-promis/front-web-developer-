M1-Campusmate specification and wireframe

Theme and purpose
Campusmate is a campus life planner for keepin track of study tasks, duedates, study duration, and categories. The app stores its data in the current browser and lets the student export a json backup

Record data model
Each task is a javascript object with this structure:
{
    "id":"rec_0001",
    "title":"read chapter4",
    "duedate":"2026-10-15",
    "duration":45,
    "category":"coursework",
    "createat":"2026-10-14T08:00:000Z",
    "updatedat":"2026-10-14T08:00:000Z"
}
the id is unique. duration is stored in munites. timesatmps use ISO8601 string

page wireframe
-campusmate title and short purpose
-dashboard |tasks | search |goal |settings |about
-dashboard:task count |total minutes |top category |weekly study time chart
-add/edit taskform:title, duedate, minutes, tag
-search pattern |category filter |sort |case toggle
-task cards with edit and delete actions
-weekly goal progress and remaining
-settings:goal, display unit, import and export
-about, feedback messages, footer

Accesibility plan
-use header, named navigation, main, sections and footer landmarks
-keep a skip-to-main link, visible focus outline, and logical keyboard order
-associate every form label and inline error with its input
-announce routine feedback politely and announce exceeded goals assertively
-keep text and controls readable at phone withs; respect reduced-motion preferenes

Validation and search patterns
-title edges:/^\S(?:.*\S)?$/
-single spaces:/ {2,}/ must not match
-positive number:/^(0|[1-9]\d*)(\.d{1,2})?$/ plus whole-minute check
-date shape:/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/ plus real-calendar-date check
-category/tag:/^[A-Za-z]+(?:[ -][A-Za-z]+)*$/ and it must be one of the alloweed categories
-advanced repeated word:/\b(\w+)\s+\1\b/i
-search: userexpression is compiled in try/catch; invalid patterns are shown as feedback