const API_URL = "https://jsonplaceholder.typicode.com/posts";

const loadButton = document.querySelector("#load-btn");
const statusText = document.querySelector("#status");
const notesList = document.querySelector("#notes-list");

async function request(url, options = {}) {
    const response = await fetch(url, options);

    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
    }

    return response;
}

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
        body.textContent = note.body;

        listItem.appendChild(title);
        listItem.appendChild(body);

        notesList.appendChild(listItem);
    });
}

async function loadNotes() {
    loadButton.disabled = true;
    statusText.textContent = "Loading notes...";
    statusText.className = "status loading";

    try {
        const response = await request(`${API_URL}?_limit=10`);
        const notes = await response.json();

        renderNotes(notes);

        statusText.textContent = `Loaded ${notes.length} notes from the server.`;
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

loadButton.addEventListener("click", loadNotes);