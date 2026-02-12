# MEAH Backend Session Summary (2026-02-12 업데이트)

이 문서는 현재까지 진행된 백엔드 개발 사항의 최종 요약본입니다.

---

## 1. 계정 및 인증 (Accounts)
- **온보딩 시스템:** `is_onboarding_completed` 필드 추가 및 `POST /api/accounts/onboarding/` 구현 (선택 장르당 +50점).
- **로그인 응답:** 모든 로그인 API에서 `onboarding` 완료 여부 필드 추가.
- **보안 로직:** 소셜 유저의 비밀번호 변경 차단 및 온보딩 상태의 되돌리기(False) 방지 적용.
- **프로필 관리:** `PATCH /api/accounts/profile/` (부분 수정) 및 `DELETE /api/accounts/profile/delete/` (탈퇴) 복구 및 안정화.
- **시청 기록:** `watch_time`이 3초 미만인 경우 점수 산정 및 기록에서 제외하는 필터링 적용.

## 2. 개인화 추천 시스템 (Home & Movies)
- **홈 서브 API:** 471개 단일/혼합 장르 카테고리 중 유저의 장르 점수 **평균**을 계산하여 상위 27개 맞춤 노출 (+고정 3개).
- **쇼츠 추천 엔진:** `Top(12) + Mid(4) + Trend(4)` 비율의 믹스 알고리즘 구현.
- **무한 스크롤 최적화:** Redis를 활용한 유저별 플레이리스트 버퍼링 (10개 소비 시 20개 자동 충전).
- **영화 상세:** 현재 영화와 장르 구성이 100% 일치하는 카테고리를 우선 매칭하는 정밀 추천 로직 적용.

## 3. 관리자 API (Management - 신설)
- **통합 관리:** 유저, 영화, 리뷰에 대한 전체 CRUD 기능을 `/api/admin/` 경로로 구축.
- **영화 관리 특화:** 제목 검색 및 가변 페이지네이션(10, 20, 50, 100) 기능 제공.
- **권한:** `IsAdminUser`를 통해서만 접근 가능하도록 엄격히 제한.

## 4. 리뷰 및 평점 시스템
- **리뷰 고도화:** `home` 앱에서 리뷰 CRUD 구현. 리뷰 변화 시 `Movie` 테이블의 `review_average` 실시간 갱신.
- **평점 초기화:** 리뷰가 없는 경우 TMDB의 `vote_average`를 기본값으로 사용하도록 처리.

## 5. 인프라 및 환경 설정
- **HTTPS 적용:** `sslip.io`와 `ZeroSSL`을 사용하여 서버 전역에 SSL 적용 완료 (`https://43.200.175.200.sslip.io`).
- **CORS 해결:** Nginx와 Django 간의 중복 헤더 충돌 해결 및 프리플라이트(OPTIONS) 최적화.
- **로컬 개발 환경:** `docker-compose.override.yml`과 `LOCAL_WSL_SETUP.md`를 통해 로컬(HTTP)과 서버(HTTPS) 환경 완벽 분리.
- **시간대:** 모든 DB 저장 시간을 **한국 시간(Asia/Seoul)**으로 통일 (`USE_TZ=False`).

---
**주의:** 다음 작업 시 `REPLICATION_GUIDE.md`와 `API_DOCUMENTATION.md`를 필히 참고하십시오.
