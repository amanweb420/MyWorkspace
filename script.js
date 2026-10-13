
/* =========================================
   MYWORKSPACE - MAIN JAVASCRIPT
   ========================================= */


/* =========================================
   0. FIRST-TIME SETUP CHECK
   ========================================= */

if (
    document.getElementById("userName") &&
    localStorage.getItem("userName")
) {
    window.location.href = "dashboard.html";
}


/* =========================================
   1. WORKSPACE CREATION
   ========================================= */

function createWorkspace() {
    const input = document.getElementById("userName");

    if (!input) return;

    const name = input.value.trim();

    if (name === "") {
        alert("Please enter your name.");
        return;
    }

    // Hindi names and English names are supported.
    localStorage.setItem("userName", name);

    window.location.href = "dashboard.html";
}


/* =========================================
   2. DASHBOARD USER INFORMATION
   ========================================= */

const userNameDisplay =
    document.getElementById("userNameDisplay");

const workspaceMessage =
    document.getElementById("workspaceMessage");

if (userNameDisplay) {
    const savedName = localStorage.getItem("userName");

    if (savedName) {
        userNameDisplay.textContent = savedName;
    }
}

if (workspaceMessage) {
    const savedWorkspace =
        localStorage.getItem("workspaceName");

    if (savedWorkspace) {
        workspaceMessage.textContent = savedWorkspace;
    }
}


/* =========================================
   3. GREETING + TODAY'S DATE
   ========================================= */

const greetingText =
    document.getElementById("greetingText");

const todayDate =
    document.getElementById("todayDate");

const today = new Date();
const hour = today.getHours();

if (greetingText) {
    if (hour >= 5 && hour < 12) {
        greetingText.textContent = "Good Morning";
    } else if (hour >= 12 && hour < 17) {
        greetingText.textContent = "Good Afternoon";
    } else if (hour >= 17 && hour < 21) {
        greetingText.textContent = "Good Evening";
    } else {
        greetingText.textContent = "Good Night";
    }
}

if (todayDate) {
    todayDate.textContent = today.toLocaleDateString(
        "en-IN",
        {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );
}


/* =========================================
   4. STUDENT SERVICES
   ========================================= */

// My Goal
// My Skills
// Skill Videos
// My Routine


/* =========================================
   5. USEFUL LINKS
   ========================================= */

// Student Links
// Jobs
// File & Document Tools
// AI Tools
// General Useful Links


/* =========================================
   6. HELP / WORK
   ========================================= */

// Website Work
// Form / Application Help
// Basic Design
// Video Editing
// Document Work


/* =========================================
   7. STUDENT LINKS - MORE DETAILS
   ========================================= */

function toggleResourceDetails(button) {
    const details = button.nextElementSibling;

    if (!details) return;

    const isHidden =
        window.getComputedStyle(details).display === "none";

    if (isHidden) {
        details.style.display = "block";
        button.textContent = "Hide Details ↑";
    } else {
        details.style.display = "none";
        button.textContent = "More Details ↓";
    }
}

function toggleResourceContent(button) {
    const content = button.nextElementSibling;

    if (!content) return;

    const isHidden =
        window.getComputedStyle(content).display === "none";

    if (isHidden) {
        content.style.display = "block";
        button.textContent = "Hide ↑";
    } else {
        content.style.display = "none";

        button.textContent =
            button.dataset.originalText || "Open →";
    }
}

document
    .querySelectorAll(".resource-option-info > button")
    .forEach(button => {
        if (!button.dataset.originalText) {
            button.dataset.originalText =
                button.textContent.trim();
        }
    });


/* =========================================
   8. AUTOMATIC PRIORITY SYSTEM
   जरूरी लिंक ऊपर दिखाएँ
   ========================================= */

function sortPriorityLinks() {
    const current = new Date();

    const currentDate =
        current.getFullYear() + "-" +
        String(current.getMonth() + 1).padStart(2, "0") + "-" +
        String(current.getDate()).padStart(2, "0");

    const cards =
        document.querySelectorAll(".student-resource");

    const groups = new Map();

    cards.forEach((card, index) => {
        const parent = card.parentElement;

        if (!groups.has(parent)) {
            groups.set(parent, []);
        }

        if (card.dataset.originalOrder === undefined) {
            card.dataset.originalOrder = index;
        }

        const start = card.dataset.priorityStart || "";
        const end = card.dataset.priorityEnd || "";

        const active =
            start !== "" &&
            end !== "" &&
            start <= end &&
            currentDate >= start &&
            currentDate <= end;

        groups.get(parent).push({ card, active });
    });

    groups.forEach(items => {
        items.sort((a, b) => {
            if (a.active !== b.active) {
                return a.active ? -1 : 1;
            }

            return (
                Number(a.card.dataset.originalOrder) -
                Number(b.card.dataset.originalOrder)
            );
        });

        items.forEach(item => {
            item.card.parentElement.appendChild(item.card);
        });
    });
}

sortPriorityLinks();


/* =========================================
   9. ROUTINE REMINDER + REVIEW
   Dashboard पर Routine दिखाएँ
   ========================================= */

(function initRoutineDashboard() {
    const section =
        document.getElementById("routineReviewSection");

    const title =
        document.getElementById("routineReviewTitle");

    const message =
        document.getElementById("routineReviewMessage");

    const reminderList =
        document.getElementById("routineReminderList");

    const reviewForm =
        document.getElementById("routineReviewForm");

    // Run only on pages containing the routine section.
    if (!section || !title || !message ||
        !reminderList || !reviewForm) {
        return;
    }

    const DATA_KEY = "mw_routine_direct_boxes_v1";
    const MSG_KEY = "mw_routine_direct_messages_v1";

    let routines = {};
    let messages = {};

    try {
        routines = JSON.parse(
            localStorage.getItem(DATA_KEY) || "{}"
        );

        messages = JSON.parse(
            localStorage.getItem(MSG_KEY) || "{}"
        );
    } catch (error) {
        console.error("Routine data could not be read.", error);
        section.style.display = "block";
        title.textContent = "Routine";
        message.textContent =
            "Routine data पढ़ने में समस्या हुई। अपनी Routine फ़ाइल जाँचें।";
        return;
    }

    const now = new Date();
    const todayKey = localDateKey(now);

    function localDateKey(date) {
        return (
            date.getFullYear() + "-" +
            String(date.getMonth() + 1).padStart(2, "0") + "-" +
            String(date.getDate()).padStart(2, "0")
        );
    }

    function parseTaskTime(dateKey, time) {
        if (!/^\d{1,2}:\d{2}$/.test(time || "")) {
            return null;
        }

        const parts = time.split(":").map(Number);
        const dateParts = dateKey.split("-").map(Number);

        const result = new Date(
            dateParts[0],
            dateParts[1] - 1,
            dateParts[2],
            parts[0],
            parts[1],
            0,
            0
        );

        return Number.isNaN(result.getTime()) ? null : result;
    }

    function getTasks(dayData) {
        if (Array.isArray(dayData)) return dayData;

        if (dayData && Array.isArray(dayData.tasks)) {
            return dayData.tasks;
        }

        if (dayData && Array.isArray(dayData.boxes)) {
            return dayData.boxes;
        }

        return [];
    }

    function taskEnd(task, dateKey) {
        return parseTaskTime(dateKey, task.end || "");
    }

    function getLatestEnd(tasks, dateKey) {
        const validEnds = tasks
            .map(task => taskEnd(task, dateKey))
            .filter(Boolean);

        if (!validEnds.length) return null;

        return new Date(
            Math.max(...validEnds.map(date => date.getTime()))
        );
    }

    function taskLabel(task) {
        return task.work || task.name || task.title || "Routine task";
    }

    function statusOf(task) {
        return task.status || "pending";
    }

    function saveData() {
        localStorage.setItem(DATA_KEY, JSON.stringify(routines));
        localStorage.setItem(MSG_KEY, JSON.stringify(messages));
    }

    function setStatus(task, status, reasonText, reasons) {
        task.status = status;
        task.reasonText = reasonText || "";
        task.reasons = reasons || [];

        // Keep the old field for compatibility with earlier routine data.
        task.reason = task.reasonText;

        task.reviewedAt = new Date().toISOString();
    }

    function makeButton(text, onClick) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = text;
        button.style.margin = "5px";
        button.style.padding = "9px 12px";
        button.style.borderRadius = "8px";
        button.style.cursor = "pointer";
        button.addEventListener("click", onClick);
        return button;
    }

    function addText(parent, text) {
        const p = document.createElement("p");
        p.textContent = text;
        parent.appendChild(p);
        return p;
    }

    function renderReview(dateKey, tasks) {
        title.textContent = "📋 आज की Routine Review";
        message.textContent =
            "आपकी Routine का समय पूरा हो गया है। हर काम का परिणाम चुनें।";

        reminderList.replaceChildren();
        reviewForm.replaceChildren();

        const heading = document.createElement("h3");
        heading.textContent = "आज के काम";
        reviewForm.appendChild(heading);

        let hasPending = false;

        tasks.forEach((task, index) => {
            if (statusOf(task) !== "pending") return;

            hasPending = true;

            const card = document.createElement("div");
            card.style.border = "1px solid #ccc";
            card.style.borderRadius = "10px";
            card.style.padding = "12px";
            card.style.margin = "10px 0";

            addText(
                card,
                (task.start || "") + "–" +
                (task.end || "") + " | " + taskLabel(task)
            );

            const choices = document.createElement("div");

            const reasonArea = document.createElement("textarea");
            reasonArea.placeholder = "आंशिक या नहीं करने का कारण लिखें";
            reasonArea.rows = 2;
            reasonArea.style.width = "100%";
            reasonArea.style.marginTop = "8px";
            reasonArea.style.display = "none";

            const reasonOptions = [
                "समय नहीं मिला",
                "काम कठिन था",
                "थकान / नींद",
                "जरूरी काम आ गया",
                "मन नहीं लगा",
                "लागू नहीं था"
            ];

            const selectedReasons = new Set();
            const optionsBox = document.createElement("div");
            optionsBox.style.display = "none";

            reasonOptions.forEach(reason => {
                const label = document.createElement("label");
                label.style.display = "block";

                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.value = reason;

                checkbox.addEventListener("change", () => {
                    if (checkbox.checked) {
                        selectedReasons.add(reason);
                    } else {
                        selectedReasons.delete(reason);
                    }
                });

                label.append(checkbox, document.createTextNode(" " + reason));
                optionsBox.appendChild(label);
            });

            function chooseStatus(status) {
                if (status === "partial" || status === "notdone") {
                    reasonArea.style.display = "block";
                    optionsBox.style.display = "block";
                    reasonArea.focus();

                    let saveButton = card.querySelector(".save-task-result");

                    if (!saveButton) {
                        saveButton = makeButton("परिणाम सेव करें", () => {
                            const reasonText = reasonArea.value.trim();
                            const reasons = Array.from(selectedReasons);

                            setStatus(task, status, reasonText, reasons);
                            saveData();
                            renderAll();
                        });

                        saveButton.className = "save-task-result";
                        card.appendChild(saveButton);
                    }

                    card.dataset.chosenStatus = status;
                    return;
                }

                setStatus(task, status, "", []);
                saveData();
                renderAll();
            }

            choices.append(
                makeButton("✅ हो गया", () => chooseStatus("done")),
                makeButton("🟡 आंशिक", () => chooseStatus("partial")),
                makeButton("❌ नहीं हुआ", () => chooseStatus("notdone")),
                makeButton("⏭️ लागू नहीं", () => chooseStatus("skip"))
            );

            card.append(choices, reasonArea, optionsBox);
            reviewForm.appendChild(card);
        });

        if (!hasPending) {
            addText(reviewForm, "इस Routine के सभी परिणाम सेव हो चुके हैं।");
        }
    }

    function renderReminders(dateKey, tasks) {
        title.textContent = "⏰ Routine Reminder";
        message.textContent =
            "जिन कामों का समय पूरा हो गया है, उन्हें यहाँ देखें।";

        reminderList.replaceChildren();
        reviewForm.replaceChildren();

        let count = 0;

        tasks.forEach(task => {
            const end = taskEnd(task, dateKey);

            if (!end || end > now || statusOf(task) !== "pending") {
                return;
            }

            const reminderId = dateKey + "_" + (task.id || taskLabel(task));
            const dismissedKey = "mw_routine_reminder_dismissed_v1";
            let dismissed = {};

            try {
                dismissed = JSON.parse(
                    localStorage.getItem(dismissedKey) || "{}"
                );
            } catch (error) {
                dismissed = {};
            }

            if (dismissed[reminderId]) return;

            count++;

            const card = document.createElement("div");
            card.style.border = "1px solid #ccc";
            card.style.borderRadius = "10px";
            card.style.padding = "12px";
            card.style.margin = "10px 0";

            addText(
                card,
                taskLabel(task) + " का समय पूरा हो गया। किया?"
            );

            card.appendChild(
                makeButton("ठीक है", () => {
                    dismissed[reminderId] = true;
                    localStorage.setItem(
                        dismissedKey,
                        JSON.stringify(dismissed)
                    );
                    renderAll();
                })
            );

            reminderList.appendChild(card);
        });

        if (count === 0) {
            section.style.display = "none";
        }
    }

    function renderAll() {
        const dateKeys = Object.keys(routines).sort();

        // A completed routine review always takes priority.
        // Older unfinished routines remain available for review.
        for (const dateKey of dateKeys) {
            const tasks = getTasks(routines[dateKey]);

            if (!tasks.length) continue;

            const latestEnd = getLatestEnd(tasks, dateKey);
            if (!latestEnd) continue;

            const pending = tasks.some(
                task => statusOf(task) === "pending"
            );

            const isPastDate = dateKey < todayKey;
            const isFinishedToday = dateKey === todayKey && now >= latestEnd;

            if (pending && (isPastDate || isFinishedToday)) {
                section.style.display = "block";
                renderReview(dateKey, tasks);
                return;
            }
        }

        const todayTasks = getTasks(routines[todayKey]);

        if (todayTasks.length) {
            const latestEnd = getLatestEnd(todayTasks, todayKey);

            // Once the whole routine ends, ask for the full review.
            if (latestEnd && now >= latestEnd) {
                section.style.display = "block";
                renderReview(todayKey, todayTasks);
                return;
            }

            section.style.display = "block";
            renderReminders(todayKey, todayTasks);
            return;
        }

        section.style.display = "none";
    }

    renderAll();
})();
