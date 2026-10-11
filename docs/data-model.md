# QuickNotes Data Model

## 1. Overview

QuickNotes needs a database that stores users, notes, and tags while maintaining the relationships between them.

This design uses a relational SQL database because the data has clear relationships and requires reliable constraints to protect data integrity.

The database contains four tables:

- `users`: stores user account information.
- `notes`: stores notes created by users.
- `tags`: stores reusable labels for organizing notes.
- `note_tags`: connects notes to tags through a many-to-many relationship.

## 2. Table Design

### 2.1 Users

| Column | Data Type | Constraints | Purpose |
|---|---|---|---|
| `id` | INTEGER | Primary key | Uniquely identifies a user |
| `name` | VARCHAR(100) | NOT NULL | Stores the user's name |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Stores the user's email |
| `password_hash` | VARCHAR(255) | NOT NULL | Stores the hashed password |
| `created_at` | TIMESTAMP | NOT NULL | Records account creation time |

Passwords must be stored as secure password hashes, never as plaintext.

### 2.2 Notes

| Column | Data Type | Constraints | Purpose |
|---|---|---|---|
| `id` | INTEGER | Primary key | Uniquely identifies a note |
| `user_id` | INTEGER | Foreign key, NOT NULL | Identifies the note's owner |
| `title` | VARCHAR(100) | NOT NULL | Stores the note title |
| `body` | TEXT | Nullable | Stores the note content |
| `created_at` | TIMESTAMP | NOT NULL | Records creation time |
| `updated_at` | TIMESTAMP | NOT NULL | Records the last update time |

The `user_id` foreign key references `users.id`. This ensures that every note belongs to an existing user.

### 2.3 Tags

| Column | Data Type | Constraints | Purpose |
|---|---|---|---|
| `id` | INTEGER | Primary key | Uniquely identifies a tag |
| `name` | VARCHAR(50) | UNIQUE, NOT NULL | Stores the tag name |

Tags are reusable labels such as `work`, `study`, and `personal`.

### 2.4 Note Tags

| Column | Data Type | Constraints | Purpose |
|---|---|---|---|
| `note_id` | INTEGER | Foreign key, NOT NULL | References a note |
| `tag_id` | INTEGER | Foreign key, NOT NULL | References a tag |

The combination of `note_id` and `tag_id` forms a composite primary key. This prevents the same tag from being assigned to the same note more than once.

## 3. Relationships

### One-to-Many: Users and Notes

One user can own many notes, but each note belongs to one user.

The relationship is implemented through `notes.user_id`, which references `users.id`.

### Many-to-Many: Notes and Tags

One note can have multiple tags, and one tag can be associated with multiple notes.

The `note_tags` junction table implements this relationship using two foreign keys.

This design avoids storing multiple tag names in a single database column and makes tags easier to manage and query.

## 4. SQL Table Definitions

The following SQL uses PostgreSQL-compatible syntax.

```sql
CREATE TABLE users (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notes (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title VARCHAR(100) NOT NULL,
    body TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notes_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE tags (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE note_tags (
    note_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,

    PRIMARY KEY (note_id, tag_id),

    FOREIGN KEY (note_id)
        REFERENCES notes(id)
        ON DELETE CASCADE,

    FOREIGN KEY (tag_id)
        REFERENCES tags(id)
        ON DELETE CASCADE
);
```

### Why these constraints matter

- **Primary keys:** uniquely identify database records.
- **Foreign keys:** prevent notes or note-tag relationships from referencing nonexistent records.
- **NOT NULL:** ensures required values are supplied.
- **UNIQUE:** prevents duplicate email addresses and duplicate tag names.
- **ON DELETE CASCADE:** automatically removes dependent records when their parent is deleted.

The `updated_at` default sets the initial timestamp. A real application must also update it when a note changes, using application logic or a database trigger.

## 5. Example SQL Queries

### Query 1: Retrieve a user's notes

```sql
SELECT id, title, body, created_at
FROM notes
WHERE user_id = 1
ORDER BY updated_at DESC;
```

This retrieves notes owned by user 1, with recently updated notes appearing first.

### Query 2: Find notes with their tags

```sql
SELECT
    n.id,
    n.title,
    t.name AS tag_name
FROM notes AS n
JOIN note_tags AS nt
    ON n.id = nt.note_id
JOIN tags AS t
    ON nt.tag_id = t.id
WHERE n.user_id = 1
ORDER BY n.id;
```

This query joins three tables to retrieve each note alongside its associated tags.

### Query 3: Count notes per user

```sql
SELECT
    u.id,
    u.name,
    COUNT(n.id) AS note_count
FROM users AS u
LEFT JOIN notes AS n
    ON u.id = n.user_id
GROUP BY u.id, u.name
ORDER BY note_count DESC;
```

The `LEFT JOIN` ensures users without notes are included, with a count of zero.

### Query 4: Create a tag relationship

```sql
INSERT INTO note_tags (note_id, tag_id)
VALUES (1, 2);
```

This associates tag 2 with note 1, provided both records exist and the relationship is not already present.

## 6. Indexing Strategy

Indexes can improve query performance by reducing the amount of data the database must examine.

For QuickNotes, I would add an index on `notes.user_id`:

```sql
CREATE INDEX idx_notes_user_id
ON notes(user_id);
```

The application frequently retrieves notes belonging to a particular user. This index helps the database locate those notes efficiently.

The `users.email`, `tags.name`, primary keys, and composite primary key already have indexes created by their respective uniqueness or primary-key constraints in PostgreSQL.

Indexes consume storage and add overhead to inserts, updates, and deletes. They should be added to support actual query patterns rather than indiscriminately.

## 7. SQL vs NoSQL

I would choose a relational SQL database for QuickNotes because users, notes, and tags have clear relationships that benefit from foreign keys, constraints, and joins.

SQL transactions also help maintain consistency when an operation involves multiple related records. For example, assigning tags to a note may require inserting several rows into `note_tags`.

A NoSQL document database could be useful if the application needed highly flexible document structures or a data model that was primarily document-oriented. However, those benefits are less important here than relational integrity and the ability to query relationships reliably.

The final choice should also consider workload, operational requirements, scaling needs, and the database technology supported by the backend.

## 8. Conclusion

This data model provides a structured foundation for QuickNotes. Primary and foreign keys preserve relationships, constraints prevent invalid data, and the junction table supports flexible note categorization.

The design can support future features such as filtering notes by tags, retrieving notes for a user, and generating usage statistics.