from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from movies.models import Genre, Movie, Comment

User = get_user_model()


class ShortsCommentAPITest(TestCase):
    """Shorts 댓글 API 테스트"""

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

    # ========== 1. 인증 + 유효 content → 201 ==========
    def test_comment_create_success(self):
        """인증된 사용자 + 유효 데이터로 댓글 작성 성공"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
        response = self.client.post(
            '/api/movies/shorts/27205/comments/',
            {'content': '방금 본 장면 대박이네요..'},
            format='json'
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['message'], '댓글이 성공적으로 등록되었습니다.')
        self.assertEqual(response.data['content'], '방금 본 장면 대박이네요..')
        self.assertEqual(response.data['user_name'], 'testuser')
        print('✅ [PASS] 인증 + 유효 content → 201')

    # ========== 2. 미인증 → 401 ==========
    def test_comment_unauthenticated(self):
        """인증 없이 요청하면 401 반환"""
        response = self.client.post(
            '/api/movies/shorts/27205/comments/',
            {'content': '테스트 댓글'},
            format='json'
        )
        self.assertEqual(response.status_code, 401)
        print('✅ [PASS] 미인증 → 401')

    # ========== 3. 없는 movie_id → 404 ==========
    def test_comment_movie_not_found(self):
        """존재하지 않는 movie_id → 404"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
        response = self.client.post(
            '/api/movies/shorts/99999/comments/',
            {'content': '테스트 댓글'},
            format='json'
        )
        self.assertEqual(response.status_code, 404)
        print('✅ [PASS] 없는 movie_id → 404')

    # ========== 4. content 빈 문자열 → 400 ==========
    def test_comment_empty_content(self):
        """content가 빈 문자열일 때 400 반환"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
        response = self.client.post(
            '/api/movies/shorts/27205/comments/',
            {'content': ''},
            format='json'
        )
        self.assertEqual(response.status_code, 400)
        print('✅ [PASS] content 빈 문자열 → 400')

    # ========== 5. 응답 필드 확인 ==========
    def test_comment_response_fields(self):
        """응답에 comment_id, user_name, content, created_at, message 모두 포함"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
        response = self.client.post(
            '/api/movies/shorts/27205/comments/',
            {'content': '필드 확인 테스트'},
            format='json'
        )
        required_fields = ['comment_id', 'user_name', 'content', 'created_at', 'message']
        for field in required_fields:
            self.assertIn(field, response.data, f"'{field}' 필드가 응답에 없음")
        self.assertIsInstance(response.data['comment_id'], int)
        print(f'✅ [PASS] 응답 필드 확인: {required_fields}')
