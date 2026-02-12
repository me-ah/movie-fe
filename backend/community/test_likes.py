from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from community.models import Review

User = get_user_model()


class ReviewLikeTest(TestCase):
    """리뷰 좋아요 API 테스트"""

    @classmethod
    def setUpTestData(cls):
        """테스트 데이터 생성"""
        # 유저 2명 생성 (작성자, 좋아요 누를 사람)
        cls.author = User.objects.create_user(username='author', password='password123')
        cls.user = User.objects.create_user(username='liker', password='password123')

        # 토큰 생성 (좋아요 누를 사람)
        refresh = RefreshToken.for_user(cls.user)
        cls.token = str(refresh.access_token)

        # 리뷰 생성
        cls.review = Review.objects.create(
            user=cls.author,
            title="테스트 리뷰",
            movie_title="테스트 영화",
            rank=5,
            content="재미있어요"
        )
        cls.url = f'/api/community/review/{cls.review.id}/like/'

    def setUp(self):
        self.client = APIClient()

    def test_like_toggle(self):
        """좋아요 토글 테스트"""
        
        # 1. 좋아요 등록
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
        response = self.client.post(self.url)
        
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['is_liked'])
        self.assertEqual(response.data['like_users_count'], 1)
        self.assertEqual(response.data['message'], "좋아요가 등록되었습니다.")

        # DB 확인
        self.review.refresh_from_db()
        self.assertEqual(self.review.like_users.count(), 1)
        self.assertTrue(self.review.like_users.filter(id=self.user.id).exists())

        # 2. 좋아요 취소 (다시 요청)
        response = self.client.post(self.url)

        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data['is_liked'])
        self.assertEqual(response.data['like_users_count'], 0)
        self.assertEqual(response.data['message'], "좋아요가 취소되었습니다.")

        # DB 확인
        self.review.refresh_from_db()
        self.assertEqual(self.review.like_users.count(), 0)

    def test_like_unauthenticated(self):
        """비로그인 유저 접근 차단 테스트"""
        self.client.credentials()  # 인증 정보 제거
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, 401)
