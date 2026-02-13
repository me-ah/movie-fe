# MEAH 프로젝트 포팅 매뉴얼 (Porting Manual)

## 1. 개발 환경 정보
- **언어 및 런타임:** Python 3.11+
- **프레임워크:** Django 6.0.2 (Django REST Framework)
- **데이터베이스:** PostgreSQL 15
- **웹 서버:** Nginx 1.25
- **WAS:** Gunicorn 25.0.3
- **인메모리 데이터베이스 (캐시/추천):** Redis 7
- **IDE:** Visual Studio Code

## 2. 빌드 및 배포 방법
### 2.1 사전 요구사항
- Docker 및 Docker Compose 설치 필수

### 2.2 빌드 프로세스
1. 소스코드 클론 후 프로젝트 루트 디렉토리로 이동
2. `.env` 파일 작성 (아래 환경 변수 설정 참고)
3. 도커 컨테이너 빌드 및 실행:
   ```bash
   docker compose up -d --build
   ```
4. DB 마이그레이션 및 정적 파일 수집:
   ```bash
   docker compose exec backend python manage.py migrate
   docker compose exec backend python manage.py collectstatic --noinput
   ```
5. 홈 카테고리 초기화 (추천 시스템 가동):
   ```bash
   docker compose exec backend python manage.py refresh_home
   ```

## 3. 환경 변수 설정 (.env)
빌드 시 필요한 주요 환경 변수 목록입니다.
- `SECRET_KEY`: Django 보안 키
- `DATABASE_URL`: DB 접속 주소 (`postgres://user:pass@db:5432/db_name`)
- `TMDB_API_KEY`: 영화 정보 수집을 위한 API 키
- `KAKAO_REST_API_KEY`: 카카오 로그인용 API 키
- `GOOGLE_CLIENT_ID`: 구글 로그인용 클라이언트 ID

## 4. DB 접속 및 프로퍼티
- **사용자:** meah_user
- **데이터베이스명:** meah
- **포트:** 5432
- **주요 테이블:** `User`, `Movie`, `Genre`, `HomeCategory`, `MovieReview`, `UserMovieHistory`
