# MEAH Full API Documentation

이 문서는 MEAH 백엔드 서버의 모든 API 명세를 상세히 기록한 문서입니다.

---

## 1. 계정 및 인증 (Accounts)

### [POST] 회원가입
| Description | 자체 이메일 회원가입 |
| --- | --- |
| URL | `/api/accounts/register/` |
| Auth Required | No |

| Parameter | Type | Required | Place | Description |
| --- | --- | --- | --- | --- |
| username | String | O | body | 사용자 아이디 |
| email | String | O | body | 사용자 이메일 |
| password | String | O | body | 비밀번호 (Django 기본 검증 적용) |
| password_confirm | String | O | body | 비밀번호 확인 |
| first_name | String | X | body | 유저 성 |
| last_name | String | X | body | 유저 이름 |
| pref_... | Number | X | body | 19개 장르별 초기 선호도 (기본 0) |

**Response 201 (Success)**
```json
{
  "username": "ssafy123",
  "email": "ssafy@naver.com",
  "first_name": "Kim",
  "last_name": "Ssafy"
}
```

**Response 400 (Failure)**
```json
{
  "password": ["비밀번호가 일치하지 않습니다."],
  "email": ["이미 존재하는 이메일입니다."]
}
```

---

### [POST] 로그인
| Description | 자체 로그인 (ID 또는 이메일 사용 가능) |
| --- | --- |
| URL | `/api/accounts/login/` |
| Auth Required | No |

| Parameter | Type | Required | Place | Description |
| --- | --- | --- | --- | --- |
| username | String | O | body | 아이디 또는 이메일 |
| password | String | O | body | 비밀번호 |

**Response 200 (Success)**
```json
{
  "message": "로그인 성공",
  "user": {
    "userid": 1,
    "username": "ssafy123",
    "useremail": "ssafy@naver.com",
    "firstname": "Kim",
    "lastname": "Ssafy"
  },
  "token": "access_token_jwt",
  "refresh": "refresh_token_jwt"
}
```

**Response 400 (Failure)**
```json
{
  "non_field_errors": ["아이디 또는 비밀번호가 일치하지 않습니다."]
}
```

---

### [POST] 토큰 갱신
| Description | 리프레시 토큰을 이용한 액세스 토큰 재발급 |
| --- | --- |
| URL | `/api/accounts/login/refresh/` |
| Auth Required | No |

| Parameter | Type | Required | Place | Description |
| --- | --- | --- | --- | --- |
| refresh | String | O | body | 발급받았던 리프레시 토큰 |

**Response 200 (Success)**
```json
{
  "access": "new_access_token_jwt"
}
```

---

### [POST] 소셜 로그인 (카카오/구글)
| Description | 소셜 서비스 토큰으로 가입 및 로그인 |
| --- | --- |
| URL | `/api/accounts/login/kakao/` 또는 `/google/` |
| Auth Required | No |

| Parameter | Type | Required | Place | Description |
| --- | --- | --- | --- | --- |
| access_token | String | O | body | 각 소셜 플랫폼 발급 액세스 토큰 |

**Response 200 (Success)**
```json
{
  "message": "로그인 성공",
  "user": { "userid": 1, ... },
  "token": "...",
  "refresh": "..."
}
```

---

### [POST] 비밀번호 변경
| Description | 자체 로그인 유저의 비밀번호 변경 |
| --- | --- |
| URL | `/api/accounts/change_password/` |
| Auth Required | Yes |

| Parameter | Type | Required | Place | Description |
| --- | --- | --- | --- | --- |
| old_password | String | O | body | 현재 비밀번호 |
| new_password | String | O | body | 변경할 새 비밀번호 |
| new_password_confirm | String | O | body | 새 비밀번호 확인 |

**Response 200 (Success)**
```json
{
  "status": "success",
  "message": "Password updated successfully"
}
```

---

### [POST] 마이페이지 조회
| Description | 유저 활동 통계 및 시청/찜 목록 조회 |
| --- | --- |
| URL | `/api/accounts/mypage/` |
| Auth Required | Yes |

| Parameter | Type | Required | Place | Description |
| --- | --- | --- | --- | --- |
| userid | Number | O | body | 유저 고유 PK |

**Response 200 (Success)**
```json
{
  "userdata": { "userid": "1", "username": "...", ... },
  "watchtime": "1200",
  "usermylist": "10",
  "recordmovie": { "1": { "recordmovie_name": "...", "recordmovie_poster": "..." } },
  "mylistmovie": { "2": { "mylistmovie_name": "...", "mylistmovie_poster": "..." } }
}
```

---

### [POST] 시청 기록 저장
| Description | 시청 시간 기록 및 장르 선호도 점수 누적 |
| --- | --- |
| URL | `/api/accounts/watch-history/` |
| Auth Required | Yes |

| Parameter | Type | Required | Place | Description |
| --- | --- | --- | --- | --- |
| movie_id | String | O | body | 영화 고유 ID (tt12345 등) |
| watch_time | Number | O | body | 시청 시간 (초) |

**Response 201 (Success)**
```json
{ "message": "시청 기록이 저장되었습니다.", "movie_id": "...", "watch_time": 150 }
```

**Response 200 (Ignored)**
```json
{ "message": "시청 시간이 짧아 기록되지 않았습니둥.", ... }
```

---

## 2. 홈 화면 (Home)

### [GET] 홈 메인 큐레이션
| Description | 최신/평점/인기 종합 상위 10개 영화 조회 |
| --- | --- |
| URL | `/api/home/main/` |
| Auth Required | No |

**Response 200 (Success)**
```json
{
  "user": { "userid": 1, "username": "..." },
  "main": [ { "movie_id": 1, "movie_title": "...", "movie_poster": "...", "movie_video": "..." } ]
}
```

---

### [GET] 홈 서브 카테고리
| Description | 유저별 맞춤형 30개 카테고리 레일 조회 |
| --- | --- |
| URL | `/api/home/sub/` |
| Auth Required | No |

**Response 200 (Success)**
```json
{
  "sub": [ { "category_title": "지금 뜨는 인기작", "movies": [...] } ]
}
```

---

### [GET] 영화 상세 정보
| Description | 영화 정보, 장르 일치 추천 리스트, 리뷰 목록 조회 |
| --- | --- |
| URL | `/api/home/detail/` |
| Auth Required | No |

| Parameter | Type | Required | Place | Description |
| --- | --- | --- | --- | --- |
| id | Number | O | url | 영화 고유 PK (?id=1) |

**Response 200 (Success)**
```json
{
  "trailer": "...", "title": "...", "rank": "8.5", "year": "2024",
  "MovieDetail": { "overview": "...", "genres": ["액션", "SF"], ... },
  "ReviewItem": [ { "id": 1, "author": "...", "rating": 9, ... } ],
  "recommend_list": [ { "id": 10, "title": "...", "poster": "..." } ]
}
```

---

### [POST] 리뷰 작성
| Description | 상세 페이지 유저 리뷰 등록 |
| --- | --- |
| URL | `/api/home/detail/{movie_id}/review/` |
| Auth Required | Yes |

**Response 201 (Success)**
```json
{ "id": 1, "author": "...", "rating": 10, "content": "...", "createdAt": "..." }
```

---

### [PUT/DELETE] 리뷰 수정/삭제
| Description | 본인 리뷰 수정 및 삭제 |
| --- | --- |
| URL | `/api/home/review/{review_id}/` |
| Auth Required | Yes |

---

## 3. 쇼츠 (Movies)

### [GET] 쇼츠 목록 조회
| Description | 무한 스크롤 개인화 믹스 큐레이션 (20개 단위 충전) |
| --- | --- |
| URL | `/api/movies/shorts/` |
| Auth Required | No |

| Parameter | Type | Required | Place | Description |
| --- | --- | --- | --- | --- |
| cursor | Number | X | url | 인덱스 커서 (0, 10, 20...) |

**Response 200 (Success)**
```json
{ "next_cursor": 10, "results": [ { "movie_id": 1, "is_liked": true, ... } ] }
```

---

### [GET] 쇼츠 상세 연동
| Description | 공유 링크 진입 시 특정 영상 + 후속 추천 리스트 |
| --- | --- |
| URL | `/api/movies/shorts/{movie_id}/` |
| Auth Required | No |

**Response 200 (Success)**
```json
{ "current": { ... }, "next_cursor": 10, "results": [...] }
```

---

### [POST] 좋아요 토글
| Description | 영상 좋아요 등록 및 취소 |
| --- | --- |
| URL | `/api/movies/shorts/{movie_id}/like/` |
| Auth Required | Yes |

---

### [POST] 조회수 증가
| Description | 영상 시청 시 조회수 1 증가 |
| --- | --- |
| URL | `/api/movies/shorts/{movie_id}/view/` |
| Auth Required | No |

---

### [GET/POST] 댓글 목록 및 작성
| Description | 쇼츠 댓글 조회 및 등록 |
| --- | --- |
| URL | `/api/movies/shorts/{movie_id}/comments/` |
| Auth Required | No(조회)/Yes(작성) |

---

### [DELETE] 댓글 삭제
| Description | 본인 댓글 삭제 |
| --- | --- |
| URL | `/api/movies/shorts/{movie_id}/comments/{comment_id}/` |
| Auth Required | Yes |
