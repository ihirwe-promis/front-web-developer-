"use strict";

(() => {
    const STORAGE_KEY = "campusmate_tasks_v2";
    const TARGET_KEY = "campusmate_weekly_target_v1";
    const UNIT_KEY = "campusmate_display_unit_v1";
    const CATEGORIES = ["coursework", "exam prep", "project", "personal study"];
    const CHART_COLORS = { start: "#5e91d2", end: "#2459a4" };
    const $ = (id) => document.getElementById(id);

    const form = $("taskform");
    const titleInput = $("tasktitle");
    const dateInput = $("duedate");
    const durationInput = $("duration");
    const categoryInput = $("category");
    const taskList = $("tasklist");
    const importFile = $("importfile");

    let tasks = loadTasks();
    let weeklyTarget = loadWeeklyTarget();
    let displayUnit = localStorage.getItem(UNIT_KEY) === "hours" ? "hours" : "minutes";

    $("weeklytargetinput").value = weeklyTarget;
    $("displayunit").value = displayUnit;

    function isValidDate(value) {
        if (!/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(value)) {
            return false;
        }

        const date = new Date(`${value}T00:00:00Z`);
        return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
    }

    function isValidTask(task) {
        return task &&
            typeof task.id === "string" && task.id.length > 0 &&
            typeof task.title === "string" &&
            /^\S(?:.*\S)?$/.test(task.title) &&
            !/ {2,}/.test(task.title) &&
            !/\b(\w+)\s+\1\b/i.test(task.title) &&
            task.title.length <= 120 &&
            isValidDate(task.dueDate) &&
            Number.isInteger(Number(task.duration)) && Number(task.duration) > 0 &&
            CATEGORIES.includes(task.category) &&
            Number.isFinite(Date.parse(task.createdAt)) &&
            Number.isFinite(Date.parse(task.updatedAt));
    }

    function loadTasks() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
            return Array.isArray(saved) ? saved.filter(isValidTask) : [];
        } catch {
            return [];
        }
    }

    function loadWeeklyTarget() {
        const saved = Number(localStorage.getItem(TARGET_KEY) || 600);
        return Number.isInteger(saved) && saved > 0 ? saved : 600;
    }

    function saveTasks() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
            return true;
        } catch {
            showError("Could not save tasks in this browser. Export a backup and check browser storage settings.");
            return false;
        }
    }

    function showError(message = "") {
        $("errormessage").textContent = message;
        if (message) $("appmessage").textContent = "";
    }

    function showMessage(message = "") {
        $("appmessage").textContent = message;
        if (message) showError("");
    }

    function escapeHTML(value) {
        return String(value).replace(/[&<>"']/g, (character) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[character]));
    }

    function compileRegex(pattern, flags) {
        try {
            return pattern ? new RegExp(pattern, flags) : null;
        } catch {
            return false;
        }
    }

    function highlightMatches(text, regex) {
        if (!regex) return escapeHTML(text);

        const flags = [...new Set(`${regex.flags.replace("g", "")}g`)].join("");
        const globalRegex = new RegExp(regex.source, flags);
        const pieces = [];
        let lastIndex = 0;
        let match;

        while ((match = globalRegex.exec(text)) !== null) {
            if (!match[0]) {
                globalRegex.lastIndex += 1;
                continue;
            }

            pieces.push(
                escapeHTML(text.slice(lastIndex, match.index)),
                `<mark>${escapeHTML(match[0])}</mark>`
            );
            lastIndex = match.index + match[0].length;
        }

        pieces.push(escapeHTML(text.slice(lastIndex)));
        return pieces.join("");
    }

    function getTasksFromLastSevenDays() {
        const now = new Date();
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() - 6);

        return tasks.filter((task) => {
            const created = new Date(task.createdAt);
            return created >= start && created <= now;
        });
    }

    function renderWeeklyChart(recentTasks) {
        const days = Array.from({ length: 7 }, (_, index) => {
            const day = new Date();
            day.setHours(0, 0, 0, 0);
            day.setDate(day.getDate() - 6 + index);
            const key = day.toISOString().slice(0, 10);
            const minutes = recentTasks
                .filter((task) => task.createdAt.slice(0, 10) === key)
                .reduce((sum, task) => sum + Number(task.duration), 0);

            return {
                label: day.toLocaleDateString(undefined, { weekday: "short" }),
                minutes
            };
        });
        const maximum = Math.max(1, ...days.map((day) => day.minutes));

        $("weeklychart").innerHTML = days.map((day) => {
            const height = day.minutes ? Math.max(5, day.minutes / maximum * 100) : 0;
            return `<div class="chartday" aria-hidden="true">
                <b>${day.minutes || ""}</b>
                <div class="chartbarwrap"><div class="chartbar" style="height:${height}%;background:linear-gradient(${CHART_COLORS.start},${CHART_COLORS.end})"></div></div>
                <span>${escapeHTML(day.label)}</span>
            </div>`;
        }).join("");

        $("weeklychart").setAttribute(
            "aria-label",
            `Study time in the last seven days: ${days.map((day) => `${day.label}: ${day.minutes} minutes`).join(", ")}.`
        );
    }

    function updateStatistics() {
        const totalMinutes = tasks.reduce((sum, task) => sum + Number(task.duration), 0);
        const categoryCounts = CATEGORIES.map((category) => [
            category,
            tasks.filter((task) => task.category === category).length
        ]).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
        const recentTasks = getTasksFromLastSevenDays();
        const weeklyMinutes = recentTasks.reduce((sum, task) => sum + Number(task.duration), 0);

        $("totaltasks").textContent = tasks.length;
        $("totaltime").textContent = displayUnit === "hours"
            ? (totalMinutes / 60).toFixed(1)
            : totalMinutes;
        $("totalunit").textContent = displayUnit === "hours" ? "hours" : "min";
        $("topcategory").textContent = tasks.length && categoryCounts[0][1]
            ? categoryCounts[0][0]
            : "None";
        $("weektotal").textContent = weeklyMinutes;
        $("weeklytime").textContent = weeklyMinutes;
        $("weeklytarget").textContent = weeklyTarget;

        const progress = $("goalpress");
        progress.max = weeklyTarget;
        progress.value = Math.min(weeklyMinutes, weeklyTarget);

        if (weeklyMinutes >= weeklyTarget) {
            $("progressstatus").textContent = "";
            $("goalalert").textContent = weeklyMinutes === weeklyTarget
                ? `Weekly study target reached: ${weeklyMinutes} minutes.`
                : `Weekly target exceeded by ${weeklyMinutes - weeklyTarget} minutes.`;
        } else {
            $("goalalert").textContent = "";
            $("progressstatus").textContent = weeklyMinutes === 0
                ? `No study time logged this week. Target: ${weeklyTarget} minutes.`
                : `${weeklyTarget - weeklyMinutes} minutes to go (${Math.round(weeklyMinutes / weeklyTarget * 100)}% complete).`;
        }

        renderWeeklyChart(recentTasks);
    }

    function renderTasks() {
        const query = $("regexinput").value;
        const regex = compileRegex(query, $("caseinsensitive").checked ? "i" : "");

        if (regex === false) {
            taskList.innerHTML = '<p class="emptystate">Invalid regular expression. Check your pattern.</p>';
            $("searchstatus").textContent = "Invalid regular expression.";
            updateStatistics();
            return;
        }

        const category = $("categoryfilter").value;
        const visibleTasks = tasks.filter((task) =>
            (!regex || regex.test(task.title)) && (!category || task.category === category)
        );
        const sort = $("sortoption").value;

        visibleTasks.sort((a, b) => {
            if (sort === "dateascend") return a.dueDate.localeCompare(b.dueDate);
            if (sort === "datedescend") return b.dueDate.localeCompare(a.dueDate);
            if (sort === "durationascend") return a.duration - b.duration;
            if (sort === "durationdescend") return b.duration - a.duration;
            if (sort === "titleascend") return a.title.localeCompare(b.title);
            return b.title.localeCompare(a.title);
        });

        $("searchstatus").textContent = `${visibleTasks.length} of ${tasks.length} task(s) shown.`;
        taskList.innerHTML = visibleTasks.length
            ? visibleTasks.map((task) => `<article class="taskcard">
                <div>
                    <h3>${highlightMatches(task.title, regex)}</h3>
                    <p class="taskmeta">Due ${escapeHTML(task.dueDate)} · ${formatDuration(task.duration)}</p>
                    <span class="tag">${escapeHTML(task.category)}</span>
                </div>
                <div class="taskactions">
                    <button type="button" data-edit="${escapeHTML(task.id)}">Edit</button>
                    <button type="button" class="task-delete" data-delete="${escapeHTML(task.id)}">Delete</button>
                </div>
            </article>`).join("")
            : '<p class="emptystate">No matching tasks yet. Add a task or adjust your search.</p>';

        updateStatistics();
    }

    function formatDuration(minutes) {
        return displayUnit === "hours"
            ? `${(Number(minutes) / 60).toFixed(1)} h`
            : `${Number(minutes)} min`;
    }

    function setFieldError(input, errorId, message) {
        input.classList.toggle("invalid", Boolean(message));
        input.setAttribute("aria-invalid", message ? "true" : "false");
        $(errorId).textContent = message;
    }

    function validateForm() {
        const title = titleInput.value;
        const duration = durationInput.value;
        const category = categoryInput.value;
        const titleError = !/^\S(?:.*\S)?$/.test(title)
            ? "Enter a title without leading or trailing spaces."
            : / {2,}/.test(title)
                ? "Use single spaces between words."
                : /\b(\w+)\s+\1\b/i.test(title)
                    ? "Remove repeated words, such as ‘study study’."
                    : title.length > 120 ? "Keep the title to 120 characters or fewer." : "";
        const dateError = isValidDate(dateInput.value)
            ? ""
            : "Enter a real date in YYYY-MM-DD format.";
        const durationError = /^(0|[1-9]\d*)(\.\d{1,2})?$/.test(duration) &&
            Number.isInteger(Number(duration)) && Number(duration) > 0
            ? ""
            : "Enter a positive whole number of minutes.";
        const categoryError = /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/.test(category) &&
            CATEGORIES.includes(category)
            ? ""
            : "Choose a category from the list.";

        setFieldError(titleInput, "titleerror", titleError);
        setFieldError(dateInput, "dateerror", dateError);
        setFieldError(durationInput, "durationerror", durationError);
        setFieldError(categoryInput, "categoryerror", categoryError);
        return !(titleError || dateError || durationError || categoryError);
    }

    function resetForm() {
        form.reset();
        $("editingid").value = "";
        $("formheading").textContent = "Add a task";
        $("savetask").textContent = "Add task";
        $("canceledit").hidden = true;
        [titleInput, dateInput, durationInput, categoryInput].forEach((input) => {
            input.classList.remove("invalid");
            input.removeAttribute("aria-invalid");
        });
        ["titleerror", "dateerror", "durationerror", "categoryerror"].forEach((id) => {
            $(id).textContent = "";
        });
    }

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        showError("");

        if (!validateForm()) {
            showError("Please fix the highlighted fields and try again.");
            form.querySelector('[aria-invalid="true"]')?.focus();
            return;
        }

        const id = $("editingid").value;
        const existingTask = tasks.find((task) => task.id === id);
        const now = new Date().toISOString();
        const task = {
            id: id || (crypto.randomUUID ? crypto.randomUUID() : `rec_${Date.now()}`),
            title: titleInput.value,
            dueDate: dateInput.value,
            duration: Number(durationInput.value),
            category: categoryInput.value,
            createdAt: existingTask?.createdAt || now,
            updatedAt: now
        };

        tasks = existingTask
            ? tasks.map((savedTask) => savedTask.id === id ? task : savedTask)
            : [...tasks, task];

        if (!saveTasks()) return;
        resetForm();
        renderTasks();
        showMessage(existingTask ? "Task updated." : "Task added.");
        titleInput.focus();
    });

    $("canceledit").addEventListener("click", () => {
        resetForm();
        titleInput.focus();
        showMessage("Edit cancelled.");
    });

    taskList.addEventListener("click", (event) => {
        const editButton = event.target.closest("[data-edit]");
        const deleteButton = event.target.closest("[data-delete]");

        if (editButton) {
            const task = tasks.find((item) => item.id === editButton.dataset.edit);
            if (!task) return;

            $("editingid").value = task.id;
            titleInput.value = task.title;
            dateInput.value = task.dueDate;
            durationInput.value = task.duration;
            categoryInput.value = task.category;
            $("formheading").textContent = "Edit task";
            $("savetask").textContent = "Save changes";
            $("canceledit").hidden = false;
            document.getElementById("tasks").scrollIntoView({ behavior: "smooth" });
            titleInput.focus();
        }

        if (deleteButton) {
            const task = tasks.find((item) => item.id === deleteButton.dataset.delete);
            if (!task || !confirm(`Delete “${task.title}”?`)) return;
            tasks = tasks.filter((item) => item.id !== task.id);
            saveTasks();
            renderTasks();
            showMessage("Task deleted.");
        }
    });

    $("deleteall").addEventListener("click", () => {
        if (!tasks.length) {
            showError("There are no tasks to delete.");
            return;
        }

        if (confirm(`Delete all ${tasks.length} tasks? This cannot be undone.`)) {
            tasks = [];
            saveTasks();
            renderTasks();
            showMessage("All tasks deleted.");
        }
    });

    ["regexinput", "caseinsensitive", "categoryfilter", "sortoption"].forEach((id) => {
        $(id).addEventListener(id === "regexinput" ? "input" : "change", renderTasks);
    });

    $("savetarget").addEventListener("click", () => {
        const value = Number($("weeklytargetinput").value);
        if (!Number.isInteger(value) || value < 1 || value > 100000) {
            showError("Enter a whole-number target from 1 to 100,000 minutes.");
            return;
        }

        weeklyTarget = value;
        localStorage.setItem(TARGET_KEY, String(weeklyTarget));
        renderTasks();
        showMessage("Weekly target saved.");
    });

    $("displayunit").addEventListener("change", () => {
        displayUnit = $("displayunit").value;
        localStorage.setItem(UNIT_KEY, displayUnit);
        renderTasks();
    });

    $("exporttasks").addEventListener("click", () => {
        const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "campusmate-tasks.json";
        document.body.append(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        showMessage(`Exported ${tasks.length} task(s).`);
    });

    $("importtasks").addEventListener("click", () => importFile.click());

    importFile.addEventListener("change", async () => {
        const file = importFile.files?.[0];
        if (!file) return;

        try {
            const data = JSON.parse(await file.text());
            const ids = Array.isArray(data) ? data.map((task) => task.id) : [];
            if (!Array.isArray(data) || !data.every(isValidTask) || new Set(ids).size !== ids.length) {
                throw new Error("Choose a JSON array of valid CampusMate tasks with unique IDs.");
            }
            if (!confirm(`Replace your ${tasks.length} current task(s) with ${data.length} imported task(s)?`)) {
                return;
            }

            tasks = data;
            if (saveTasks()) {
                renderTasks();
                showMessage(`Imported ${tasks.length} task(s).`);
            }
        } catch (error) {
            showError(error.message || "Could not read that JSON file.");
        } finally {
            importFile.value = "";
        }
    });

    renderTasks();
})();
