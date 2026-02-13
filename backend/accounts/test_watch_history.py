from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from movies.models import Genre, Movie
from accounts.models import UserMovieHistory, GENRE_ID_TO_PREF_FIELD

User = get_user_model()


class WatchHistoryAPITest(TestCase):
    """Watch History API 테스트"""

    @classmethod
    def setUpTestData(cls):
        """테스트용 데이터 생성 (클래스 단위 1회 실행)"""
        # ---- 장르 생성 (TMDB ID 사용) ----
        cls.genre_action = Genre.objects.create(id=28, name='액션')
        cls.genre_sf = Genre.objects.create(id=878, name='SF')
        cls.genre_adventure = Genre.objects.create(id=12, name='모험')

        # ---- 영화 생성 ----
        cls.movie = Movie.objects.create(
            movie_id='27205',
            title='인셉션',
            youtube_key='cdx31ak4KbQ',
            vote_average=8.37,
            star_rating=4.2,
            overview='테스트 영화 개요',
        )
        cls.movie.genres.set([cls.genre_action, cls.genre_sf, cls.genre_adventure])

    def setUp(self):
        """각 테스트 전 실행 — 유저 생성 + JWT 토큰 발급"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass1234!'
        )
        self.client = APIClient()
        refresh = RefreshToken.for_user(self.user)
        self.token = str(refresh.access_token)

    # ========== 1. 인증 + 유효 데이터 → 201 ==========
    def test_watch_history_success(self):
        """인증된 사용자 + 유효 데이터로 시청 기록 저장"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
        response = self.client.post(
            '/api/accounts/watch-history/',
            {'movie_id': '27205', 'watch_time': 45},
            format='json'
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['message'], '시청 기록이 저장되었습니다.')
        self.assertEqual(response.data['movie_id'], '27205')
        self.assertEqual(response.data['watch_time'], 45)
        print('✅ [PASS] 인증 + 유효 데이터 → 201')

    # ========== 2. 미인증 → 401 ==========
    def test_watch_history_unauthenticated(self):
        """인증 없이 요청하면 401 반환"""
        response = self.client.post(
            '/api/accounts/watch-history/',
            {'movie_id': '27205', 'watch_time': 45},
            format='json'
        )
        self.assertEqual(response.status_code, 401)
        print('✅ [PASS] 미인증 → 401')

    # ========== 3. 없는 movie_id → 404 ==========
    def test_watch_history_movie_not_found(self):
        """존재하지 않는 movie_id → 404"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
        response = self.client.post(
            '/api/accounts/watch-history/',
            {'movie_id': '99999', 'watch_time': 30},
            format='json'
        )
        self.assertEqual(response.status_code, 404)
        print('✅ [PASS] 없는 movie_id → 404')

    # ========== 4. watch_time ≤ 0 → 400 ==========
    def test_watch_history_invalid_watch_time(self):
        """watch_time이 0 이하일 때 400 반환"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
        response = self.client.post(
            '/api/accounts/watch-history/',
            {'movie_id': '27205', 'watch_time': 0},
            format='json'
        )
        self.assertEqual(response.status_code, 400)
        print('✅ [PASS] watch_time ≤ 0 → 400')

    # ========== 5. DB 레코드 생성 확인 ==========
    def test_watch_history_creates_record(self):
        """저장 후 UserMovieHistory 레코드가 DB에 존재"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
        self.client.post(
            '/api/accounts/watch-history/',
            {'movie_id': '27205', 'watch_time': 60},
            format='json'
        )
        history = UserMovieHistory.objects.filter(user=self.user, movie=self.movie)
        self.assertEqual(history.count(), 1)
        self.assertEqual(history.first().watch_time, 60)
        print('✅ [PASS] DB 레코드 생성 확인')

    # ========== 6. 장르 선호도 증가 확인 (매핑 딕셔너리 기반) ==========
    def test_watch_history_updates_genre_preference(self):
        """저장 후 유저의 장르 선호도 pref_ 필드가 증가"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
        self.client.post(
            '/api/accounts/watch-history/',
            {'movie_id': '27205', 'watch_time': 30},
            format='json'
        )
        # DB에서 최신 유저 정보 다시 로드
        self.user.refresh_from_db()

        # 영화 '인셉션'의 장르: 액션(28), SF(878), 모험(12)
        self.assertEqual(self.user.pref_action, 30)
        self.assertEqual(self.user.pref_science_fiction, 30)
        self.assertEqual(self.user.pref_adventure, 30)

        # 관련 없는 장르는 0 유지
        self.assertEqual(self.user.pref_horror, 0)
        self.assertEqual(self.user.pref_romance, 0)
        print('✅ [PASS] 장르 선호도 증가 확인 (매핑 딕셔너리 기반)')
