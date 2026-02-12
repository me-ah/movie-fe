# 💻 Local WSL2 Development Environment Setup Guide

이 가이드는 현재 배포 서버(AWS EC2)와 동일한 **uv 기반 파이썬 환경** 및 **도커 환경**을 로컬 PC에 구축하기 위한 매뉴얼입니다.

---

## 1. 단계: 파이썬 uv 환경 셋팅 (WSL 터미널)

현재 프로젝트는 `uv`를 사용하여 패키지를 관리합니다.

### (1) uv 설치
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
# 설치 후 터미널에 경로 반영
export PATH="$HOME/.local/bin:$PATH"
source ~/.bashrc
```

### (2) 가상환경 생성 및 패키지 설치
`backend` 폴더에서 실행합니다.
```bash
cd backend
uv venv
# 패키지 동기화 (pyproject.toml 또는 requirements.txt 기준)
uv sync
```

---

## 2. 단계: 프로젝트 클론 및 데이터 준비

### (1) 소스 코드 클론
(생략)

### (2) 필수 데이터 폴더 복사 (중요!)
영화 정보가 담긴 `movie_data` 폴더는 대용량 파일 보호를 위해 Git에 포함되지 않았을 수 있습니다. 서버에서 해당 폴더를 내려받거나 별도로 전달받아 **backend 루트 디렉토리에 위치**시켜야 합니다.

**구조:**
- `backend/movie_data/movie_genres.json`
- `backend/movie_data/movie_info.json` 등

---

## 3. 단계: 로컬 전용 설정 (HTTP 모드)

로컬 개발의 편의를 위해 HTTPS 대신 HTTP(80) 환경을 사용합니다. 이미 `docker-compose.override.yml` 설정이 완료되어 있습니다.

1.  **도커 실행:**
    ```bash
    docker compose up -d --build
    ```
    *자동으로 override 파일이 적용되어 HTTP 환경으로 구동됩니다.*

---

## 3. 단계: 환경 변수(.env) 설정

서버의 `.env` 내용을 가져오되, 아래 항목만 로컬에 맞게 수정합니다.

```env
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
# 로컬 프론트엔드 연동용
CORS_ALLOWED_ORIGINS=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost/api
```

---

## 4. 단계: 데이터 초기화 및 관리자 생성

```bash
# 마이그레이션 및 초기 데이터
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py load_movies
docker compose exec backend python manage.py refresh_home

# 관리자 계정 생성
docker compose exec backend python manage.py createsuperuser
```

---

## 💡 VS Code 팁 (Python Interpreter)
VS Code에서 `Ctrl + Shift + P` -> `Python: Select Interpreter` 선택 후, 프로젝트 내의 **`.venv/bin/python`**을 선택해 주세요. 그래야 코드 에디터가 라이브러리들을 정상적으로 인식합니다.
