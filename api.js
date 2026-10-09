
const API_URL = "https://jsonplaceholder.typicode.com/posts";

// DOM elements
const loadButton = document.querySelector("#load-btn");
const statusText = document.querySelector("#status");
const notesList = document.querySelector("#notes-list");

const noteForm = document.querySelector("#note-form");
const titleInput = document.querySelector("#title-input");
const bodyInput = document.querySelector("#body-input");
const submitButton = document.querySelector("#submit-btn");

// Shared application state
let notes = [];

// Reusable HTTP request helper
async function request(url, options = {}) {
    const response = await fetch(url, options);

    if (!response.ok) {
        throw new Error(
            `Request failed with status ${response.status}`
        );
    }

    return response;
}

// Render notes in the interface
function renderNotes(notes) {
    notesList.textContent = "";

    if (notes.length === 0) {
        const emptyMessage = document.createElement("li");
        emptyMessage.textContent = "No notes found.";
        notesList.appendChild(emptyMessage);
        return;
    }

    notes.forEach(function (note) {
        const listItem = document.createElement("li");

        const title = document.createElement("h3");
        title.textContent = note.title;

        const body = document.createElement("p");
        body.textContent = note.body || "";

        listItem.appendChild(title);
        listItem.appendChild(body);

        notesList.appendChild(listItem);
    });
}

// GET: Load notes from the API
async function loadNotes() {
    loadButton.disabled = true;
    statusText.textContent = "Loading notes...";
    statusText.className = "status loading";

    try {
        const response = await request(`${API_URL}?_limit=10`);
        notes = await response.json();

        renderNotes(notes);

        statusText.textContent =
            `Loaded ${notes.length} notes from the server.`;
        statusText.className = "status success";
    } catch (error) {
        statusText.textContent =
            "Could not load notes. Please check your connection and try again.";
        statusText.className = "status error";

        console.error(error);
    } finally {
        loadButton.disabled = false;
    }
}

// POST: Create a new note
async function createNote(event) {
    event.preventDefault();

    const title = titleInput.value.trim();
    const body = bodyInput.value.trim();

    if (!title) {
        statusText.textContent = "Please enter a note title.";
        statusText.className = "status error";
        titleInput.focus();
        return;
    }

    if (title.length > 100) {
        statusText.textContent =
            "The title must be 100 characters or fewer.";
        statusText.className = "status error";
        return;
    }

    submitButton.disabled = true;
    statusText.textContent = "Creating note...";
    statusText.className = "status loading";

    try {
        const response = await request(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title: title,
                body: body,
                userId: 1
            })
        });

        const createdNote = await response.json();

        notes.unshift(createdNote);
        renderNotes(notes);

        noteForm.reset();

        statusText.textContent =
            `Note created successfully. ID: ${createdNote.id}`;
        statusText.className = "status success";
    } catch (error) {
        statusText.textContent =
            "Could not create the note. Please try again.";
        statusText.className = "status error";

        console.error(error);
    } finally {
        submitButton.disabled = false;
    }
}

// Event listeners
loadButton.addEventListener("click", loadNotes);
noteForm.addEventListener("submit", createNote);
