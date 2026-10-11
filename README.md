# QuickNotes System Design

QuickNotes System Design is a learning project that combines a browser-based API client with documentation for designing a scalable notes application.

The project demonstrates HTTP requests, REST API design, relational data modeling, and system architecture through a practical QuickNotes example.

## Features

- Load notes using HTTP GET requests.
- Create notes using HTTP POST requests.
- Delete notes using HTTP DELETE requests.
- Display loading, success, error, and empty states.
- Validate note titles and handle failed requests.
- Document a proposed REST API contract.
- Design a relational database schema.
- Model a scalable architecture for one million registered users.

**Important:** The frontend uses JSONPlaceholder, a demonstration API. Its simulated POST and DELETE operations do not permanently modify server data. The documented API and architecture describe a proposed real QuickNotes backend; that backend is not implemented in this project.

## Technologies

- HTML5
- CSS3
- JavaScript
- Fetch API
- JSONPlaceholder
- Git and GitHub

## How to Run Locally

1. Clone the repository:

   ```bash
   git clone https://github.com/Mason-hun/quicknotes-system-design.git
   ```

2. Open the project folder in Visual Studio Code.

3. Start `index.html` using the Live Server extension, or open the file directly in a browser.

4. Click **Load notes** to retrieve sample notes. Use the form to create a simulated note and the Delete buttons to test the deletion flow.

An internet connection is required for requests to JSONPlaceholder.

## Design Documentation

- [API Design](docs/api-design.md) — REST endpoints, request and response examples, authentication, and error handling.
- [Data Model](docs/data-model.md) — database tables, relationships, SQL queries, indexes, and SQL-versus-NoSQL trade-offs.
- [Architecture](docs/architecture.md) — requirements, load estimates, architecture diagram, request flows, and scalability trade-offs.

## What I Learned

- How to structure asynchronous HTTP requests with `fetch`, `async/await`, and error handling.
- How to validate user input and render data safely using DOM methods and `textContent`.
- How shared application state keeps the displayed interface consistent with user actions.
- How to design REST APIs with appropriate HTTP methods and status codes.
- How primary keys, foreign keys, and junction tables model relational data.
- How caching, load balancing, read replicas, and queues address different system requirements.
- How to use meaningful Git commits to document project progress.

## Project Scope

This is an educational project, not a production-ready application. A production implementation would require a real backend, persistent database, secure authentication, authorization, automated tests, monitoring, and deployment configuration.