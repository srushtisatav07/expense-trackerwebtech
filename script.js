
const expenseForm = document.getElementById("expenseForm");
const titleInput = document.getElementById("title");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");

const expenseList = document.getElementById("expenseList");
const totalSpent = document.getElementById("totalSpent");
const totalTransactions = document.getElementById("totalTransactions");
const filterCategory = document.getElementById("filterCategory");
const filterMonth = document.getElementById("filterMonth");
const sortBy = document.getElementById("sortBy");

const themeToggle = document.getElementById("themeToggle");
const submitButton = document.getElementById("submitButton");
const cancelEdit = document.getElementById("cancelEdit");
const formHeading = document.getElementById("formHeading");
const categorySummary = document.getElementById("categorySummary");

const categories = [
    "Food",
    "Travel",
    "Shopping",
    "Bills",
    "Education",
    "Other"
];

let expenses = [];

try {
    const savedExpenses = JSON.parse(localStorage.getItem("expenses"));

    if (Array.isArray(savedExpenses)) {
        expenses = savedExpenses.filter(function(expense) {
            return expense &&
                Number.isFinite(Number(expense.id)) &&
                typeof expense.title === "string" &&
                expense.title.trim() !== "" &&
                Number.isFinite(Number(expense.amount)) &&
                Number(expense.amount) > 0 &&
                categories.includes(expense.category) &&
                typeof expense.date === "string" &&
                /^\d{4}-\d{2}-\d{2}$/.test(expense.date);
        }).map(function(expense) {
            return {
                id: Number(expense.id),
                title: expense.title,
                amount: Number(expense.amount),
                category: expense.category,
                date: expense.date
            };
        });
    }
} catch (error) {
    expenses = [];
}

let editingId = null;

function getToday() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function saveExpenses() {
    try {
        localStorage.setItem("expenses", JSON.stringify(expenses));
    } catch (error) {
        alert("Unable to save expenses in this browser.");
    }
}

function formatAmount(amount) {
    return "₹" + amount.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function updateSummary() {
    const total = expenses.reduce(function(sum, expense) {
        return sum + expense.amount;
    }, 0);

    totalSpent.textContent = formatAmount(total);
    totalTransactions.textContent = expenses.length;
}

function renderCategorySummary() {
    categorySummary.innerHTML = "";

    if (expenses.length === 0) {
        const message = document.createElement("p");
        message.className = "empty-message";
        message.textContent = "No expenses to display yet.";
        categorySummary.appendChild(message);
        return;
    }

    const categoryTotals = {};

    categories.forEach(function(category) {
        categoryTotals[category] = 0;
    });

    expenses.forEach(function(expense) {
        categoryTotals[expense.category] += expense.amount;
    });

    const highestCategoryTotal = Math.max(
        ...Object.values(categoryTotals)
    );

    categories.forEach(function(category) {
        const amount = categoryTotals[category];

        if (amount === 0) {
            return;
        }

        const row = document.createElement("div");
        row.className = "category-row";

        const heading = document.createElement("div");
        heading.className = "category-heading";

        const name = document.createElement("span");
        name.textContent = category;

        const value = document.createElement("span");
        value.textContent = formatAmount(amount);

        heading.append(name, value);

        const bar = document.createElement("div");
        bar.className = "category-bar";

        const fill = document.createElement("div");
        fill.className = "category-fill";
        fill.style.width =
            (amount / highestCategoryTotal * 100) + "%";

        bar.appendChild(fill);
        row.append(heading, bar);
        categorySummary.appendChild(row);
    });
}

function renderExpenses() {
    expenseList.innerHTML = "";

    const selectedCategory = filterCategory.value;
    const selectedMonth = filterMonth.value;
    const selectedSort = sortBy.value;

    const filteredExpenses = expenses.filter(function(expense) {
        const matchesCategory =
            selectedCategory === "All" ||
            expense.category === selectedCategory;

        const matchesMonth =
            selectedMonth === "" ||
            expense.date.startsWith(selectedMonth);

        return matchesCategory && matchesMonth;
    });

    if (selectedSort === "highest") {
        filteredExpenses.sort(function(a, b) {
            return b.amount - a.amount;
        });
    } else if (selectedSort === "lowest") {
        filteredExpenses.sort(function(a, b) {
            return a.amount - b.amount;
        });
    } else if (selectedSort === "newest") {
        filteredExpenses.sort(function(a, b) {
            return b.date.localeCompare(a.date) || b.id - a.id;
        });
    } else if (selectedSort === "oldest") {
        filteredExpenses.sort(function(a, b) {
            return a.date.localeCompare(b.date) || a.id - b.id;
        });
    }

    if (filteredExpenses.length === 0) {
        const message = document.createElement("p");
        message.className = "empty-message";
        message.textContent = expenses.length === 0
            ? "No expenses yet. Add your first expense!"
            : "No matching expenses found.";

        expenseList.appendChild(message);
        return;
    }

    filteredExpenses.forEach(function(expense) {
        const item = document.createElement("article");
        item.className = "expense-item";

        const details = document.createElement("div");
        details.className = "expense-details";

        const title = document.createElement("h3");
        title.textContent = expense.title;

        const info = document.createElement("p");
        info.textContent = `${expense.category} · ${expense.date}`;

        const actions = document.createElement("div");
        actions.className = "expense-actions";

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "edit-btn";
        editButton.dataset.id = expense.id;
        editButton.textContent = "Edit";

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-btn";
        deleteButton.dataset.id = expense.id;
        deleteButton.textContent = "Delete";

        actions.append(editButton, deleteButton);
        details.append(title, info, actions);

        const amount = document.createElement("p");
        amount.className = "expense-amount";
        amount.textContent = "−" + formatAmount(expense.amount);

        item.append(details, amount);
        expenseList.appendChild(item);
    });
}

function render() {
    updateSummary();
    renderCategorySummary();
    renderExpenses();
}

function resetForm() {
    expenseForm.reset();
    editingId = null;

    formHeading.textContent = "Add New Expense";
    submitButton.textContent = "Add Expense";
    cancelEdit.hidden = true;
    dateInput.value = getToday();
}

function startEditing(expenseId) {
    const expense = expenses.find(function(item) {
        return item.id === expenseId;
    });

    if (!expense) {
        return;
    }

    editingId = expense.id;

    titleInput.value = expense.title;
    amountInput.value = expense.amount;
    categoryInput.value = expense.category;
    dateInput.value = expense.date;

    formHeading.textContent = "Edit Expense";
    submitButton.textContent = "Save Changes";
    cancelEdit.hidden = false;

    expenseForm.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    titleInput.focus({
        preventScroll: true
    });
}

expenseForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const title = titleInput.value.trim();
    const amount = Number(amountInput.value);
    const category = categoryInput.value;
    const date = dateInput.value;

    if (
        !title ||
        !Number.isFinite(amount) ||
        amount <= 0 ||
        !categories.includes(category) ||
        !date ||
        !/^\d{4}-\d{2}-\d{2}$/.test(date)
    ) {
        alert("Please enter valid expense details.");
        return;
    }

    if (editingId !== null) {
        expenses = expenses.map(function(expense) {
            if (expense.id === editingId) {
                return {
                    id: expense.id,
                    title: title,
                    amount: amount,
                    category: category,
                    date: date
                };
            }

            return expense;
        });
    } else {
        expenses.push({
            id: Date.now(),
            title: title,
            amount: amount,
            category: category,
            date: date
        });
    }

    saveExpenses();
    resetForm();
    render();
});

expenseList.addEventListener("click", function(event) {
    const button = event.target.closest("button");

    if (!button || !expenseList.contains(button)) {
        return;
    }

    const expenseId = Number(button.dataset.id);

    if (!Number.isFinite(expenseId)) {
        return;
    }

    if (button.classList.contains("edit-btn")) {
        startEditing(expenseId);
    }

    if (button.classList.contains("delete-btn")) {
        const confirmed = confirm(
            "Are you sure you want to delete this expense?"
        );

        if (!confirmed) {
            return;
        }

        expenses = expenses.filter(function(expense) {
            return expense.id !== expenseId;
        });

        if (editingId === expenseId) {
            resetForm();
        }

        saveExpenses();
        render();
    }
});

cancelEdit.addEventListener("click", function() {
    resetForm();
});

filterCategory.addEventListener("change", renderExpenses);
filterMonth.addEventListener("change", renderExpenses);
sortBy.addEventListener("change", renderExpenses);

function setTheme(theme) {
    const isDark = theme === "dark";

    document.body.classList.toggle("dark", isDark);
    themeToggle.textContent = isDark ? "Light Mode" : "Dark Mode";
    themeToggle.setAttribute("aria-pressed", String(isDark));

    try {
        localStorage.setItem("theme", isDark ? "dark" : "light");
    } catch (error) {
        return;
    }
}

let savedTheme = "light";

try {
    savedTheme = localStorage.getItem("theme") || "light";
} catch (error) {
    savedTheme = "light";
}

setTheme(savedTheme);

themeToggle.addEventListener("click", function() {
    const isDark = document.body.classList.contains("dark");
    setTheme(isDark ? "light" : "dark");
});

dateInput.value = getToday();

render();
