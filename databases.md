# Databases

## Relational model basics
Data lives in **tables** (relations) made of **rows** (tuples) and
**columns** (attributes). A **primary key** uniquely identifies each row;
a **foreign key** in one table references a primary key in another,
creating a relationship between tables. This is what "relational" refers
to — relationships between tables, not merely storing related data.

## Normalization
Normalization organizes columns/tables to reduce redundancy and avoid
update anomalies, via a series of "normal forms":
- **1NF** — every column holds atomic (indivisible) values, no repeating
  groups.
- **2NF** — 1NF, plus every non-key column depends on the *whole* primary
  key (matters for composite keys).
- **3NF** — 2NF, plus no non-key column depends on another non-key column
  (no "transitive" dependencies).
Higher normal forms exist but 3NF is the common target for most schemas.
Denormalization (deliberately reintroducing redundancy) is a legitimate
trade-off for read performance, not automatically "bad design."

## SQL joins
- **INNER JOIN** — only rows with a match in both tables.
- **LEFT (OUTER) JOIN** — all rows from the left table, matched rows from
  the right, NULLs where there's no match.
- **RIGHT (OUTER) JOIN** — mirror of LEFT.
- **FULL (OUTER) JOIN** — all rows from both sides, NULLs where unmatched.

## Transactions and ACID
A transaction groups operations so they succeed or fail as a unit. ACID
describes the guarantees: **Atomicity** (all-or-nothing), **Consistency**
(a transaction moves the DB from one valid state to another, respecting
constraints), **Isolation** (concurrent transactions don't see each
other's uncommitted changes), **Durability** (once committed, it survives
a crash).

## SQL vs. NoSQL
SQL/relational databases enforce a fixed schema and strong consistency,
and are a natural fit when data is inherently relational and integrity
matters (e.g. financial records). NoSQL is an umbrella for non-relational
stores — document (e.g. MongoDB), key-value, wide-column, and graph
databases — generally trading strict schema/consistency guarantees for
flexibility and horizontal scalability. Neither is "better"; the right
choice depends on the data shape and consistency needs.

## Common misconceptions worth correcting
- "A primary key and a unique key are the same thing." A table can have
  only one primary key but multiple unique keys; a primary key also
  cannot be NULL, while a unique key column can allow one NULL (in most
  databases).
- "NoSQL means no schema at all, ever." Many NoSQL databases are
  schema-flexible, not schema-*less* — the application still has an
  implicit shape it expects, it's just not enforced by the database
  engine.
- "Normalizing a database always improves performance." It improves data
  integrity and reduces redundancy; heavily normalized schemas can
  actually hurt *read* performance because queries need more joins,
  which is exactly why denormalization exists as a deliberate trade-off.
