from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from movies.models import Genre, Movie
from accounts.models import UserLikeList

User = get_user_model()


class ShortsLikeAPITest(TestCase):
    """Shorts 좋아요 API 테스트"""

    @classmethod
    def setUpTestData(cls):
        """테스트용 데이터 생성 (클래스 단위 1회 실행)"""
        # ---- 장르 생성 ----
        cls.genre_action = Genre.objects.create(id=28, name='액션')

        # ---- 영화 생성 ----
        cls.movie = Movie.objects.create(
            movie_id='27205',
            title='인셉션',
            youtube_key='cdx31ak4KbQ',
            vote_average=8.37,
            star_rating=4.2,
            overview='테스트 영화 개요',
            like_count=100,
        )
        cls.movie.genres.set([cls.genre_action])

    def setUp(self):
        """각 테스트 전 실행 — 유저 생성 + JWT 토큰 발급"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass1234!',
            first_name='이싸피'
        )
        self.client = APIClient()
        refresh = RefreshToken.for_user(self.user)
        self.token = str(refresh.access_token)

    # ========== 1. 좋아요 등록 → 200 + is_liked=true ==========
    def test_like_create(self):
        """좋아요 등록 성공"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
        response = self.client.post('/api/movies/shorts/27205/like/')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['is_liked'])
        self.assertEqual(response.data['message'], '좋아요가 등록되었습니다.')
        self.assertEqual(response.data['movie_id'], '27205')

        # UserLikeList에 레코드 존재 확인
        self.assertTrue(
            UserLikeList.objects.filter(user=self.user, movie=self.movie).exists()
        )
        print('✅ [PASS] 좋아요 등록 → 200 + is_liked=true')

    # ========== 2. 같은 영화 재요청 → 토글(취소) ==========
    def test_like_toggle(self):
        """같은 영화 재요청하면 좋아요 취소 (토글)"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

        # 1차 요청: 좋아요 등록
        self.client.post('/api/movies/shorts/27205/like/')

        # 2차 요청: 좋아요 취소
        response = self.client.post('/api/movies/shorts/27205/like/')
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data['is_liked'])
        self.assertEqual(response.data['message'], '좋아요가 취소되었습니다.')

        # UserLikeList에서 레코드 삭제 확인
        self.assertFalse(
            UserLikeList.objects.filter(user=self.user, movie=self.movie).exists()
        )
        print('✅ [PASS] 좋아요 토글 → is_liked=false')

    # ========== 3. 미인증 → 401 ==========
    def test_like_unauthenticated(self):
        """인증 없이 좋아요 요청 → 401"""
        response = self.client.post('/api/movies/shorts/27205/like/')
        self.assertEqual(response.status_code, 401)
        print('✅ [PASS] 미인증 좋아요 → 401')

    # ========== 4. 없는 movie_id → 404 ==========
    def test_like_movie_not_found(self):
        """존재하지 않는 movie_id → 404"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
        response = self.client.post('/api/movies/shorts/99999/like/')
        self.assertEqual(response.status_code, 404)
        print('✅ [PASS] 없는 movie_id 좋아요 → 404')

    # ========== 5. total_likes 카운트 정확히 증감 ==========
    def test_like_count_change(self):
        """좋아요 등록/취소 시 like_count 정확히 증감"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

        # 현재 like_count 확인
        self.movie.refresh_from_db()
        original_count = self.movie.like_count

        # 좋아요 등록 → +1
        response = self.client.post('/api/movies/shorts/27205/like/')
        self.assertEqual(response.data['total_likes'], original_count + 1)

        # 좋아요 취소 → -1
        response = self.client.post('/api/movies/shorts/27205/like/')
        self.assertEqual(response.data['total_likes'], original_count)
        print('✅ [PASS] total_likes 카운트 정확히 증감')

    # ========== 6. Shorts 목록에서 is_liked 반영 확인 ==========
    def test_shorts_list_is_liked(self):
        """좋아요 후 Shorts 목록 조회 시 is_liked=true 반영"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

        # 좋아요 등록
        self.client.post('/api/movies/shorts/27205/like/')

        # Shorts 목록 조회
        response = self.client.get('/api/movies/shorts/')
        self.assertEqual(response.status_code, 200)

        # 해당 영화의 is_liked가 true인지 확인
        results = response.data['results']
        target = next(m for m in results if m['movie_id'] == '27205')
        self.assertTrue(target['is_liked'])
        print('✅ [PASS] Shorts 목록에서 is_liked=true 반영')
