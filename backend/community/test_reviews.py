from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from community.models import Review, ReviewComment

User = get_user_model()


class ReviewAPITest(TestCase):
    """커뮤니티 리뷰 API 테스트"""

    @classmethod
    def setUpTestData(cls):
        """테스트용 데이터 생성"""
        # ---- 유저 생성 ----
        cls.user1 = User.objects.create_user(
            username='testuser1', email='test1@test.com', password='testpass1234!'
        )
        cls.user2 = User.objects.create_user(
            username='testuser2', email='test2@test.com', password='testpass1234!'
        )

        # ---- 리뷰 생성 ----
        cls.review1 = Review.objects.create(
            user=cls.user1,
            title='정말 재밌는 영화!',
            movie_title='어벤져스 1',
            rank=9,
            content='영상미가 예술 수준입니다.'
        )
        cls.review2 = Review.objects.create(
            user=cls.user2,
            title='감동적인 영화',
            movie_title='인터스텔라',
            rank=10,
            content='눈물 없이는 볼 수 없는 영화.'
        )
        cls.review3 = Review.objects.create(
            user=cls.user1,
            title='평범한 액션 영화',
            movie_title='어벤져스 2',
            rank=6,
            content='1편보다는 아쉬운 작품.'
        )

        # ---- 댓글 생성 ----
        cls.comment1 = ReviewComment.objects.create(
            review=cls.review1, user=cls.user2,
            content='저도 정말 재밌게 봤어요'
        )
        cls.comment2 = ReviewComment.objects.create(
            review=cls.review1, user=cls.user1,
            content='감사합니다!'
        )

    def setUp(self):
        self.client = APIClient()

    # ========== 1. 리뷰 목록 조회 → 200 ==========
    def test_review_list_success(self):
        """리뷰 목록 조회 성공"""
        response = self.client.get('/api/review/list/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('results', response.data)
        self.assertEqual(response.data['count'], 3)
        print('✅ [PASS] 리뷰 목록 조회 → 200')

    # ========== 2. search 파라미터로 영화 제목 검색 ==========
    def test_review_list_search(self):
        """영화 제목으로 검색"""
        response = self.client.get('/api/review/list/', {'search': '어벤져스'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 2)
        print('✅ [PASS] search=어벤져스 → 2건')

    # ========== 3. rating 필터 ==========
    def test_review_list_rating_filter(self):
        """평점 필터링"""
        response = self.client.get('/api/review/list/', {'rating': '10'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['movie_title'], '인터스텔라')
        print('✅ [PASS] rating=10 → 1건')

    # ========== 4. 정렬 (type + order) ==========
    def test_review_list_sort(self):
        """정렬 기능 — rating 오름차순"""
        response = self.client.get('/api/review/list/', {'type': 'rating', 'order': 'asc'})
        self.assertEqual(response.status_code, 200)
        results = response.data['results']
        self.assertEqual(results[0]['rank'], 6)   # 가장 낮은 평점 먼저
        self.assertEqual(results[-1]['rank'], 10)  # 가장 높은 평점 마지막
        print('✅ [PASS] 정렬 rating asc → 6, 9, 10')

    # ========== 5. 리뷰 상세 조회 → 200 + comments 포함 ==========
    def test_review_detail_success(self):
        """리뷰 상세 조회 — 댓글 포함"""
        response = self.client.get(f'/api/review/{self.review1.id}/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['title'], '정말 재밌는 영화!')
        self.assertEqual(response.data['movie_title'], '어벤져스 1')
        self.assertEqual(response.data['rank'], 9)
        self.assertEqual(len(response.data['comments']), 2)
        self.assertEqual(response.data['user']['username'], 'testuser1')
        print('✅ [PASS] 리뷰 상세 조회 → 200 + 댓글 2개')

    # ========== 6. 없는 review_id → 404 ==========
    def test_review_detail_not_found(self):
        """존재하지 않는 review_id → 404"""
        response = self.client.get('/api/review/99999/')
        self.assertEqual(response.status_code, 404)
        print('✅ [PASS] 없는 review_id → 404')
