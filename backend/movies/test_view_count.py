from django.test import TestCase
from rest_framework.test import APIClient
from movies.models import Genre, Movie

class ShortsViewCountAPITest(TestCase):
    """Shorts 조회수 API 테스트"""

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
            view_count=500,
        )
        cls.movie.genres.set([cls.genre_action])

    def setUp(self):
        self.client = APIClient()

    # ========== 1. 조회수 증가 → 200 ==========
    def test_view_count_increase(self):
        """조회수 1 증가 성공"""
        self.movie.refresh_from_db()
        original = self.movie.view_count

        response = self.client.post('/api/movies/shorts/27205/view/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['current_view_count'], original + 1)
        self.assertEqual(response.data['movie_id'], '27205')
        self.assertEqual(response.data['message'], '조회수가 성공적으로 집계되었습니다.')
        print('✅ [PASS] 조회수 증가 → 200')

    # ========== 2. 연속 요청 시 정확히 증가 ==========
    def test_view_count_multiple(self):
        """3번 연속 요청하면 +3"""
        self.movie.refresh_from_db()
        original = self.movie.view_count

        self.client.post('/api/movies/shorts/27205/view/')
        self.client.post('/api/movies/shorts/27205/view/')
        response = self.client.post('/api/movies/shorts/27205/view/')

        self.assertEqual(response.data['current_view_count'], original + 3)
        print('✅ [PASS] 연속 3회 요청 → +3')

    # ========== 3. 미인증으로 요청 → 200 (로그인 불필요) ==========
    def test_view_count_unauthenticated(self):
        """로그인 없이도 조회수 증가 가능"""
        response = self.client.post('/api/movies/shorts/27205/view/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('current_view_count', response.data)
        print('✅ [PASS] 미인증 조회수 → 200')

    # ========== 4. 없는 movie_id → 404 ==========
    def test_view_count_movie_not_found(self):
        """존재하지 않는 movie_id → 404"""
        response = self.client.post('/api/movies/shorts/99999/view/')
        self.assertEqual(response.status_code, 404)
        print('✅ [PASS] 없는 movie_id 조회수 → 404')
