# 🚀 MEAH Backend Deployment & Replication Guide (Ultra Detail)

이 문서는 새로운 서버(Ubuntu 22.04 권장)에서 본 프로젝트를 배포하기 위한 모든 절차를 담고 있습니다.

---

## 1. 서버 기초 환경 설정 (Prerequisites)

먼저 서버에 필수 도구들을 설치해야 합니다.

```bash
# 패키지 업데이트
sudo apt-get update && sudo apt-get upgrade -y

# Docker 설치
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker 권한 설정 (현재 유저가 docker 명령어를 sudo 없이 쓰게 함)
sudo usermod -aG docker $USER
# (주의: 이 설정 후 터미널을 재접속해야 권한이 적용됩니다.)
```

---

## 2. 프로젝트 준비 및 환경 변수 설정

### (1) 소스 코드 클론
```bash
git clone <GitLab_Repository_URL>
cd <Project_Root>/backend
```

### (2) 환경 변수 파일 (.env) 생성
루트 디렉토리에 `.env` 파일을 생성하고 내용을 채웁니다. **이 파일이 없으면 서버가 작동하지 않습니다.**

```bash
touch .env
nano .env  # 아래 내용을 복사해서 붙여넣으세요.
```

**.env 필수 내용:**
```env
DEBUG=False
SECRET_KEY=django-insecure-your-key-here

# Database (PostgreSQL)
POSTGRES_DB=meah
POSTGRES_USER=meah_user
POSTGRES_PASSWORD=ssafy1234
POSTGRES_HOST=db
POSTGRES_PORT=5432
DATABASE_URL=postgres://meah_user:ssafy1234@db:5432/meah

# Allowed Hosts & Domain
# <Server_IP> 자리에 실제 서버의 탄력적 IP를 적으세요.
ALLOWED_HOSTS=localhost,127.0.0.1,<Server_IP>,<Server_IP>.sslip.io
CORS_ALLOWED_ORIGINS=https://movie-fe-rosy.vercel.app,http://localhost:3000

# API Keys (TMDB, Social Auth)
TMDB_API_KEY=your_tmdb_key
KAKAO_REST_API_KEY=your_kakao_key
GOOGLE_CLIENT_ID=your_google_id
GOOGLE_CLIENT_SECRET=your_google_secret
```

---

## 3. HTTPS SSL 인증서 발급 (ZeroSSL + acme.sh)

IP 주소를 도메인처럼 사용하게 해주는 `sslip.io`와 Let's Encrypt의 발급 제한을 피하기 위한 `ZeroSSL`을 사용합니다.

### (1) acme.sh 도구 설치
```bash
curl https://get.acme.sh | sh -s email=your_email@example.com
source ~/.bashrc
```

### (2) 인증서 발급
인증서 발급 시 포트 80이 비어있어야 합니다.
```bash
# 만약 이미 무언가 켜져있다면 중지 (예: Nginx)
sudo docker compose stop nginx 2>/dev/null

# ZeroSSL을 기본 인증기관으로 설정
~/.acme.sh/acme.sh --set-default-ca --server zerossl

# 발급 실행 (Server_IP에 실제 IP 입력)
sudo /root/.acme.sh/acme.sh --issue -d <Server_IP>.sslip.io --standalone
```

### (3) 인증서 파일 프로젝트로 복사
```bash
mkdir -p certs
sudo cp /root/.acme.sh/<Server_IP>.sslip.io_ecc/fullchain.cer certs/fullchain.pem
sudo cp /root/.acme.sh/<Server_IP>.sslip.io_ecc/<Server_IP>.sslip.io.key certs/privkey.pem
sudo chmod 644 certs/*
```

---

## 4. 도커 서비스 빌드 및 실행

### (1) 서비스 실행
```bash
docker compose up -d --build
```

### (2) Django 초기화 (필수)
컨테이너가 올라온 후, DB 테이블을 만들고 초기 데이터를 채워야 합니다.

```bash
# 1. DB 테이블 생성
docker compose exec backend python manage.py migrate

# 2. 정적 파일 모으기 (Swagger/Admin용)
docker compose exec backend python manage.py collectstatic --noinput

# 3. TMDB 영화 데이터 로드 (매니지먼트 명령어)
docker compose exec backend python manage.py load_movies

# 4. 홈 화면 맞춤 카테고리(471개) 분석 및 생성
docker compose exec backend python manage.py refresh_home
```

---

## 5. 확인 및 테스트

- **Swagger UI:** `https://<Server_IP>.sslip.io/api/schema/swagger-ui/`
- **API Base:** `https://<Server_IP>.sslip.io/api/`
- **Django Admin:** `https://<Server_IP>.sslip.io/admin/`

---

## 🛠 트러블슈팅 (Q&A)

**Q: 502 Bad Gateway 에러가 뜹니다.**
A: `docker compose logs -f backend` 명령어로 백엔드 서버가 에러로 죽었는지 확인하세요. 특히 DB 연결 문제인 경우가 많습니다.

**Q: 브라우저에서 '연결이 비공개로 설정되어 있지 않습니다'가 뜹니다.**
A: 주소창에 IP 주소(`http://43.200...`)로 접속하지 않았는지 확인하세요. 반드시 발급받은 도메인(`https://...sslip.io`)으로 접속해야 합니다.

**Q: CORS 에러가 발생합니다.**
A: `.env` 파일의 `CORS_ALLOWED_ORIGINS`에 프론트엔드 주소가 정확히 등록되어 있는지 확인하고, Nginx 설정과 중복되지 않는지 체크하세요. (현재 가이드는 장고가 CORS를 담당하도록 설정되어 있습니다.)

---
**Last Updated:** 2026-02-12
