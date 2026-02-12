# 💻 MEAH 로컬 WSL2 환경 구축 완벽 가이드 (초보자용)

이 문서는 리눅스를 처음 사용하는 분들도 AWS 서버와 동일한 개발 환경을 로컬 PC에 구축할 수 있도록 모든 단계를 생략 없이 기록했습니다.

---

## 1. 단계: Windows 필수 프로그램 설치

1.  **WSL2 활성화:** PowerShell을 관리자 권한으로 열고 `wsl --install` 입력 후 PC 재부팅.
2.  **Ubuntu 설치:** Microsoft Store에서 **Ubuntu 22.04 LTS** 설치 후 실행 (계정 생성).
3.  **Docker Desktop 설치:** [공식 홈페이지](https://www.docker.com/products/docker-desktop/) 다운로드 및 설치.
    - 설정(Settings) > Resources > WSL Integration에서 `Ubuntu-22.04` 체크 후 Apply.

---

## 2. 단계: 리눅스 기초 도구 및 uv 설치 (Ubuntu 터미널)

Ubuntu 터미널을 열고 아래 명령어를 한 줄씩 복사해서 붙여넣으세요.

```bash
# (1) 시스템 패키지 업데이트 및 필수 도구(curl, git 등) 설치
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y curl git vim build-essential

# (2) uv (파이썬 패키지 매니저) 설치
curl -LsSf https://astral.sh/uv/install.sh | sh
# 설치 후 경로 반영
export PATH="$HOME/.local/bin:$PATH"
source ~/.bashrc

# uv 설치 확인
uv --version
```

---

## 3. 단계: 프로젝트 클론 및 설정 파일 준비

```bash
# (1) 프로젝트 클론 (S14P11M101 폴더가 생깁니다)
git clone <GitLab_URL>
cd S14P11M101/backend

# (2) 환경 변수 파일 (.env) 생성
# 전달받은 로컬용 .env 내용을 아래 명령어로 만듭니다.
nano .env  # 편집창이 뜨면 내용을 붙여넣고 Ctrl+O (저장), Enter, Ctrl+X (종료)

# (3) 로컬 전용 설정 파일 생성 확인
# 이미 프로젝트에 포함되어 있다면 확인만 하시고, 없다면 생성해야 합니다.
# - docker-compose.override.yml
# - nginx/nginx.local.conf

# (4) 필수 데이터 폴더 (movie_data) 복사
# 서버에서 다운로드한 'movie_data' 폴더를 반드시 'backend/' 폴더 안에 넣어야 합니다.
# 구조: backend/movie_data/movie_info.json 등
```

---

## 4. 단계: 도커 서비스 빌드 및 실행

```bash
# (1) 컨테이너 빌드 및 백그라운드 실행
docker compose up -d --build

# (2) 가상환경 생성 및 패키지 동기화 (로컬 개발용)
uv venv
uv sync
```

---

## 5. 단계: 데이터베이스 초기화 및 데이터 로드

이 단계는 **서버와 동일한 데이터**를 로컬에 심는 과정입니다.

```bash
# (1) DB 테이블 생성 (마이그레이션)
docker compose exec backend python manage.py migrate

# (2) 서버에서 받은 데이터 덤프(backup.sql)가 있다면 복원
# (파일이 backend/ 폴더에 있어야 합니다)
docker compose exec -T db psql -U meah_user -d meah < backup.sql

# (3) 영화 데이터 로드
docker compose exec backend python manage.py load_movies

# (4) 홈 화면 큐레이션(카테고리) 생성
docker compose exec backend python manage.py refresh_home

# (5) 관리자 계정 생성 (스스로 사용할 ID/PW 설정)
docker compose exec backend python manage.py createsuperuser
```

---

## 6. 단계: 개발 시작하기

1.  **스웨거 접속:** 브라우저에서 `http://localhost/api/schema/swagger-ui/` 접속.
