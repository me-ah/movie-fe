FROM python:3.11-slim

# uv 설치
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uv/bin/

WORKDIR /app

# 시스템 의존성 설치 (PostgreSQL 클라이언트 등)
# ffmpeg 추가 - 26/02/09 20:12 두진 추가
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# 프로젝트 파일 복사
COPY . .

# uv를 사용하여 의존성 설치 (시스템 Python에 직접 설치)
# pyproject.toml의 의존성을 기반으로 설치합니다.
RUN /uv/bin/uv pip install --system --no-cache -r pyproject.toml

# 정적 파일 수집 (필요시)
# RUN python manage.py collectstatic --noinput

EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "config.wsgi:application"]
