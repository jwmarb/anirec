# Running the application

## Docker (recommended)

Edit the compose file and edit the environment variables. Just run the following command in the root directory of the project:

```sh
docker compose -f docker-compose.prod.yaml up
```

This will boot up a server at 0.0.0.0:8080 or localhost:8080.

## Local

Run two terminals, one for the frontend and one for the backend. You will also need to run MongoDB locally. Fortunately, a docker compose file is provided for you. If you need to run this, then you will need 3 terminals total.

1. First terminal, starting from root directory:

```sh
cd frontend && pnpm install
```

Once all the dependencies are installed, you need to create a `.env` file in `frontend`. Copy `.env.example` to `.env`, which creates a new file called `.env` and change the environment variables appropriately. By default, nothing needs to be set unless your backend is hosted at a different port or endpoint.

Once the `.env` file is created with the correct environment variables, you can run the frontend:

```sh
pnpm dev
```

2. Second terminal, starting from root directory:

```sh
cd backend && \
pnpm install && \
npm rebuild bcrypt
```

Similar to the frontend step, you need to create a `.env` file in `backend`. Copy `.env.example` to `.env`, which creates a new file called `.env` and change the environment variables appropriately. The required variables are `OPENAI_API_KEY` and `OPENAI_API_ENDPOINT`. It is also recommended to set `JWT_SECRET` for security purposes. You can create a quick `JWT_SECRET` key:

```sh
echo "JWT_SECRET=$(openssl rand -hex 32)" >> .env
```

Once the `.env` file is created with the correct environment variables, you can run the backend:

```sh
pnpm dev
```

3. Third terminal, starting from root directory:

Since this is a docker compose file, you only need to run the following command to set up a local MongoDB database:

```sh
docker compose -f docker-compose.dev.yaml up
```
