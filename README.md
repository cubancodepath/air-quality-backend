# Air Quality Backend

Simple NestJS application with PostgreSQL database.

## Quick Start

1. Clone and install:

```bash
git clone <repository>
cd <repository>
```

2. Create `.env` file:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=mysecretpassword
POSTGRES_DB=mydatabase
NODE_ENV=development
DATABASE_URL=postgresql://postgres:mysecretpassword@postgres:5432/mydatabase
```

3. Run with Docker:

```bash
docker-compose up --build
```

4. Access:

- API: http://localhost:3000
- Swagger Docs: http://localhost:3000/api/docs

## Stack

- NestJS
- PostgreSQL
- Docker
- Swagger
