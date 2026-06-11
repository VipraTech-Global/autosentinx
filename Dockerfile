# AutoSentinx API — Cloud Run container.
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# deps first (better layer caching)
COPY requirements.txt .
RUN pip install -r requirements.txt

# app
COPY . .

# Cloud Run injects $PORT (default 8080). The app applies Alembic migrations on startup (lifespan).
ENV PORT=8080
CMD exec uvicorn app:app --host 0.0.0.0 --port ${PORT}
