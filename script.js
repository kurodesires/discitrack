const $ = (id) => document.getElementById(id);

const KEYS = {
    accounts: "discitrackAccounts",
    user: "currentUser",
    violations: "discitrackViolations"
};

function ensureDemoAdmin() {
    const accounts = readData(KEYS.accounts);
    const adminExists = accounts.some(account =>
        (account.username || "").toLowerCase() === "admin" && account.role === "admin"
    );

    if (!adminExists) {
        accounts.push({
            id: "demo-admin",
            name: "DISCITRACK Administrator",
            username: "admin",
            email: "admin@discitrack.local",
            password: "Admin123!",
            role: "admin"
        });

        saveData(KEYS.accounts, accounts);
    }
}

ensureDemoAdmin();

function readData(key) {
    try {
        return JSON.parse(localStorage.getItem(key) || "[]");
    } catch {
        return [];
    }
}

function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function currentAccount() {
    try {
        return JSON.parse(localStorage.getItem(KEYS.user) || "null");
    } catch {
        return null;
    }
}


function showMessage(id, message, success = false) {
    const element = $(id);
    if (!element) return;
    element.textContent = message;
    element.classList.toggle("success", success);
    element.classList.toggle("error", Boolean(message) && !success);
}

function showPage(pageId) {
    document.querySelectorAll(".dashboard-section").forEach(section => {
        section.classList.toggle("hidden", section.id !== pageId);
    });
    document.querySelectorAll("[data-page]").forEach(button => {
        button.classList.toggle("active", button.dataset.page === pageId);
    });
}

function showAuthForm(form) {
    $("loginPanel").classList.toggle("hidden", form !== "login");
    $("adminLoginPanel").classList.toggle("hidden", form !== "admin");
    $("createPanel").classList.toggle("hidden", form !== "create");
    showMessage("loginMessage", "");
    showMessage("adminLoginMessage", "");
    showMessage("createMessage", "");
}

function showApp() {
    const user = currentAccount();

    $("authPage").classList.toggle("hidden", Boolean(user));

    $("adminDashboard").classList.toggle(
        "hidden",
        !user || user.role !== "admin"
    );

    $("studentDashboard").classList.toggle(
        "hidden",
        !user || user.role !== "student"
    );

    if (!user) return;

    if (user.role === "admin") {
        $("welcomeUser").textContent =
            "Welcome, " + (user.name || user.username) + "!";

        loadProfile();
        showPage("homePage");
        renderAll();
    } else if (user.role === "student") {
        $("studentWelcome").textContent =
            "Welcome, " + (user.name || user.username) + "!";

        loadStudentDashboard();
    }
}

function loadStudentDashboard() {
    const user = currentAccount();
    if (!user) return;

    const myRecords = getViolations().filter(record =>
        (record.studentName || "").trim().toLowerCase() ===
        (user.name || "").trim().toLowerCase()
    );

    $("myTotalViolations").textContent = myRecords.length;

    $("myPendingViolations").textContent =
        myRecords.filter(record => record.status === "Pending").length;

    $("myResolvedViolations").textContent =
        myRecords.filter(record => record.status === "Resolved").length;

    $("myViolationsTable").innerHTML = myRecords.length
        ? myRecords.map(record => `
            <tr>
                <td>${escapeHTML(record.date)}</td>
                <td>${escapeHTML(record.type)}</td>
                <td>${escapeHTML(record.status)}</td>
                <td>${escapeHTML(record.details || "No details")}</td>
            </tr>
        `).join("")
        : '<tr><td colspan="4">No violation records found for your name.</td></tr>';

    $("studentProfileNameInput").value = user.name || "";
    $("studentProfileUsernameInput").value = user.username || "";
    $("studentProfileEmailInput").value = user.email || "";
}

document.querySelectorAll("[data-student-page]").forEach(button => {
    button.addEventListener("click", () => {
        document.querySelectorAll(".student-section").forEach(section => {
            section.classList.toggle(
                "hidden",
                section.id !== button.dataset.studentPage
            );
        });
        document.querySelectorAll("[data-student-page]").forEach(item => {
            item.classList.toggle("active", item === button);
        });
    });
});

document.querySelectorAll("[data-page]").forEach(button => {
    button.addEventListener("click", () => showPage(button.dataset.page));
});

function getViolations() {
    return readData(KEYS.violations);
}

function saveViolations(violations) {
    saveData(KEYS.violations, violations);
}

function makeId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function todayLocalISO() {
    const today = new Date();
    const offset = today.getTimezoneOffset() * 60_000;
    return new Date(today.getTime() - offset).toISOString().slice(0, 10);
}


$("showCreate").addEventListener("click", event => {
    event.preventDefault();
    showAuthForm("create");
});

$("showLogin").addEventListener("click", event => {
    event.preventDefault();
    showAuthForm("login");
});

$("showAdmin").addEventListener("click", event => {
    event.preventDefault();
    showAuthForm("admin");
});

$("backToStudentLogin").addEventListener("click", event => {
    event.preventDefault();
    showAuthForm("login");
});

// Student registration only
$("createForm").addEventListener("submit", event => {
    event.preventDefault();

    const name = $("createName").value.trim();
    const username = $("createUsername").value.trim();
    const email = $("createEmail").value.trim();
    const password = $("createPassword").value;
    const confirm = $("confirmPassword").value;

    if (!name || !username || !email) {
        showMessage("createMessage", "Please complete all fields.");
        return;
    }

    if (password.length < 6) {
        showMessage(
            "createMessage",
            "Password must be at least 6 characters."
        );
        return;
    }

    if (password !== confirm) {
        showMessage("createMessage", "Passwords do not match.");
        return;
    }

    const accounts = readData(KEYS.accounts);

    if (accounts.some(account =>
        (account.username || "").toLowerCase() === username.toLowerCase()
    )) {
        showMessage("createMessage", "That username already exists.");
        return;
    }

    if (accounts.some(account =>
        (account.email || "").toLowerCase() === email.toLowerCase()
    )) {
        showMessage("createMessage", "That email is already registered.");
        return;
    }

    accounts.push({
        id: makeId(),
        name,
        username,
        email,
        password,
        role: "student"
    });

    saveData(KEYS.accounts, accounts);

    $("createForm").reset();
    showAuthForm("login");
    $("loginUsername").value = username;

    showMessage(
        "loginMessage",
        "Student account created! Please log in.",
        true
    );
});

$("loginForm").addEventListener("submit", event => {
    event.preventDefault();

    const username = $("loginUsername").value.trim();
    const password = $("loginPassword").value;

    const account = readData(KEYS.accounts).find(item =>
        (item.username || "").toLowerCase() === username.toLowerCase() &&
        item.password === password &&
        item.role === "student"
    );

    if (!account) {
        showMessage(
            "loginMessage",
            "Invalid student username or password."
        );
        return;
    }

    localStorage.setItem(KEYS.user, JSON.stringify(account));
    $("loginForm").reset();
    showApp();
});

$("adminLoginForm").addEventListener("submit", event => {
    event.preventDefault();

    const username = $("adminUsername").value.trim();
    const password = $("adminPassword").value;

    const account = readData(KEYS.accounts).find(item =>
        (item.username || "").toLowerCase() === username.toLowerCase() &&
        item.password === password &&
        item.role === "admin"
    );

    if (!account) {
        showMessage(
            "adminLoginMessage",
            "Invalid administrator username or password."
        );
        return;
    }

    localStorage.setItem(KEYS.user, JSON.stringify(account));
    $("adminLoginForm").reset();
    showApp();
});

$("violationDate").value = todayLocalISO();

function resetViolationForm() {
    $("violationForm").reset();
    $("violationId").value = "";
    $("violationDate").value = todayLocalISO();
    $("saveViolationButton").textContent = "Save Violation";
    $("cancelEditButton").classList.add("hidden");
}

$("violationForm").addEventListener("submit", event => {
    event.preventDefault();

    const user = currentAccount();
    if (!user) return;

    const id = $("violationId").value;
    const records = getViolations();

    const record = {
        id: id || makeId(),
        studentName: $("studentName").value.trim(),
        studentNumber: $("studentNumber").value.trim(),
        type: $("violationType").value,
        date: $("violationDate").value,
        status: $("violationStatus").value,
        details: $("violationDetails").value.trim(),
        createdBy: user.username
    };

    if (!record.studentName || !record.type || !record.date) {
        showMessage("violationNotice", "Complete the required fields.");
        return;
    }

    if (id) {
        const index = records.findIndex(item => item.id === id);
        if (index !== -1) {
            record.createdBy = records[index].createdBy || user.username;
            records[index] = record;
        }
        showMessage("violationNotice", "Violation updated successfully.", true);
    } else {
        records.push(record);
        showMessage("violationNotice", "Violation saved successfully.", true);
    }

    saveViolations(records);
    resetViolationForm();
    renderAll();
});

$("cancelEditButton").addEventListener("click", resetViolationForm);

function editViolation(id) {
    const record = getViolations().find(item => item.id === id);
    if (!record) return;

    $("violationId").value = record.id;
    $("studentName").value = record.studentName;
    $("studentNumber").value = record.studentNumber || "";
    $("violationType").value = record.type;
    $("violationDate").value = record.date;
    $("violationStatus").value = record.status;
    $("violationDetails").value = record.details || "";
    $("saveViolationButton").textContent = "Update Violation";
    $("cancelEditButton").classList.remove("hidden");

    showPage("violationsPage");
    $("studentName").focus();
}

function deleteViolation(id) {
    if (!confirm("Are you sure you want to delete this violation?")) return;

    saveViolations(getViolations().filter(item => item.id !== id));
    showMessage("violationNotice", "Violation deleted.", true);
    renderAll();
}

function renderViolations() {
    const search = $("violationSearch").value.trim().toLowerCase();
    const status = $("statusFilter").value;

    const records = getViolations().filter(record => {
        const matchesSearch =
            (record.studentName || "").toLowerCase().includes(search) ||
            (record.studentNumber || "").toLowerCase().includes(search) ||
            (record.type || "").toLowerCase().includes(search);

        return matchesSearch && (!status || record.status === status);
    });

    const tbody = $("violationsTable");

    if (!records.length) {
        tbody.innerHTML = '<tr><td colspan="5">No violations found.</td></tr>';
        return;
    }

    tbody.innerHTML = records.map(record => `
        <tr>
            <td>${escapeHTML(record.date)}</td>
            <td>${escapeHTML(record.studentName)}<br>
                <small>${escapeHTML(record.studentNumber || "")}</small>
            </td>
            <td>${escapeHTML(record.type)}</td>
            <td>${escapeHTML(record.status)}</td>
            <td>
                <button class="small-button" data-edit="${escapeHTML(record.id)}">Edit</button>
                <button class="small-button danger" data-delete="${escapeHTML(record.id)}">Delete</button>
            </td>
        </tr>
    `).join("");
}

$("violationsTable").addEventListener("click", event => {
    const editButton = event.target.closest("[data-edit]");
    const deleteButton = event.target.closest("[data-delete]");

    if (editButton) editViolation(editButton.dataset.edit);
    if (deleteButton) deleteViolation(deleteButton.dataset.delete);
});

$("violationSearch").addEventListener("input", renderViolations);
$("statusFilter").addEventListener("change", renderViolations);

function renderStudents() {
    const search = $("studentSearch").value.trim().toLowerCase();
    const records = getViolations();
    const students = new Map();

    records.forEach(record => {
        const name = (record.studentName || "").trim();
        const number = (record.studentNumber || "").trim();
        if (!name) return;
        const key = (number || name).toLowerCase();

        if (!students.has(key)) {
            students.set(key, {
                name: record.studentName,
                number: record.studentNumber || "—",
                count: 0
            });
        }

        students.get(key).count++;
    });

    readData(KEYS.accounts).filter(account => account.role === "student").forEach(account => {
        const key = (account.username || account.name || "").toLowerCase();
        if (!key || students.has(key)) return;
        students.set(key, { name: account.name || account.username, number: "—", count: 0 });
    });

    const filtered = [...students.values()].filter(student =>
        student.name.toLowerCase().includes(search) ||
        student.number.toLowerCase().includes(search)
    );

    $("studentsTable").innerHTML = filtered.length
        ? filtered.map(student => `
            <tr>
                <td>${escapeHTML(student.name)}</td>
                <td>${escapeHTML(student.number)}</td>
                <td>${student.count}</td>
            </tr>
        `).join("")
        : '<tr><td colspan="3">No student records found. Add a violation to begin.</td></tr>';
}

$("studentSearch").addEventListener("input", renderStudents);

function renderHome() {
    const records = getViolations();
    const students = new Set(records.map(record =>
        (record.studentNumber || record.studentName || "").toLowerCase()
    ).filter(Boolean));
    readData(KEYS.accounts).filter(account => account.role === "student").forEach(account => {
        if (account.username) students.add(account.username.toLowerCase());
    });

    $("totalCount").textContent = records.length;
    $("pendingCount").textContent = records.filter(record => record.status === "Pending").length;
    $("resolvedCount").textContent = records.filter(record => record.status === "Resolved").length;
    $("studentCount").textContent = students.size;

    const recent = [...records]
        .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
        .slice(0, 5);

    $("recentTable").innerHTML = recent.length
        ? recent.map(record => `
            <tr>
                <td>${escapeHTML(record.date)}</td>
                <td>${escapeHTML(record.studentName)}</td>
                <td>${escapeHTML(record.type)}</td>
                <td>${escapeHTML(record.status)}</td>
            </tr>
        `).join("")
        : '<tr><td colspan="4">No violations recorded yet.</td></tr>';
}

function renderReports() {
    const records = getViolations();

    $("reportTotal").textContent = records.length;
    $("reportPending").textContent = records.filter(record => record.status === "Pending").length;
    $("reportResolved").textContent = records.filter(record => record.status === "Resolved").length;
}

function renderAll() {
    renderHome();
    renderViolations();
    renderStudents();
    renderReports();
}

$("exportButton").addEventListener("click", () => {
    const records = getViolations();

    if (!records.length) {
        alert("There are no records to export.");
        return;
    }

    const columns = [
        ["Date", "date"],
        ["Student Name", "studentName"],
        ["Student Number", "studentNumber"],
        ["Violation", "type"],
        ["Status", "status"],
        ["Details", "details"]
    ];

    const csvCell = value =>
        '"' + String(value ?? "").replace(/"/g, '""') + '"';

    const csv = [
        columns.map(column => csvCell(column[0])).join(","),
        ...records.map(record =>
            columns.map(column => csvCell(record[column[1]])).join(",")
        )
    ].join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "DISCITRACK_Violations.csv";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
});

function loadProfile() {
    const user = currentAccount();
    if (!user) return;

    $("profileName").value = user.name || "";
    $("profileEmail").value = user.email || "";
    $("profileUsername").value = user.username || "";
}

$("profileForm").addEventListener("submit", event => {
    event.preventDefault();

    const user = currentAccount();
    if (!user) return;

    const name = $("profileName").value.trim();
    const email = $("profileEmail").value.trim();

    if (!name || !email) {
        showMessage("profileMessage", "Enter your name and email.");
        return;
    }

    const accounts = readData(KEYS.accounts);
    const emailInUse = accounts.some(account =>
        account.username !== user.username &&
        (account.email || "").toLowerCase() === email.toLowerCase()
    );

    if (emailInUse) {
        showMessage("profileMessage", "That email is already in use.");
        return;
    }

    const updatedAccounts = accounts.map(account =>
        account.username === user.username
            ? { ...account, name, email }
            : account
    );

    const updatedUser = { ...user, name, email };

    saveData(KEYS.accounts, updatedAccounts);
    localStorage.setItem(KEYS.user, JSON.stringify(updatedUser));

    $("welcomeUser").textContent = "Welcome, " + name + "!";
    showMessage("profileMessage", "Profile updated successfully.", true);
});

$("studentProfileForm").addEventListener("submit", event => {
    event.preventDefault();
    const user = currentAccount();
    if (!user || user.role !== "student") return;
    const name = $("studentProfileNameInput").value.trim();
    const email = $("studentProfileEmailInput").value.trim();
    if (!name || !email) return showMessage("studentProfileMessage", "Enter your name and email.");
    const accounts = readData(KEYS.accounts);
    if (accounts.some(account => account.username !== user.username &&
        (account.email || "").toLowerCase() === email.toLowerCase())) {
        return showMessage("studentProfileMessage", "That email is already in use.");
    }
    const updated = { ...user, name, email };
    saveData(KEYS.accounts, accounts.map(account => account.username === user.username ? updated : account));
    localStorage.setItem(KEYS.user, JSON.stringify(updated));
    $("studentWelcome").textContent = "Welcome, " + name + "!";
    showMessage("studentProfileMessage", "Profile updated successfully.", true);
});

document.querySelectorAll("#studentLogoutButton, #logoutButton").forEach(button => {
    button.addEventListener("click", () => {
        localStorage.removeItem(KEYS.user);
        showAuthForm("login");
        showApp();
        window.scrollTo(0, 0);
    });
});

showApp();
