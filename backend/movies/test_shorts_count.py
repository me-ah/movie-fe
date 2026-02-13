from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from movies.models import Genre, Movie, Comment

User = get_user_model()

class ShortsCommentCountTest(TestCase):
    """
    Shorts API 응답에서 comment_count가 올바르게 계산되는지 검증하는 테스트입니다.
    """

    def setUp(self):
        """테스트 데이터 설정: 유저 생성, 영화 생성, 댓글 작성"""
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='password')
        
        # 영화 2개 생성
        self.movie1 = Movie.objects.create(movie_id='m1', title='영화 1')
        self.movie2 = Movie.objects.create(movie_id='m2', title='영화 2')
        
        # 영화 1에 댓글 3개 작성 (유저 생성)
        Comment.objects.create(movie=self.movie1, user=self.user, content='댓글 1')
        Comment.objects.create(movie=self.movie1, user=self.user, content='댓글 2')
        Comment.objects.create(movie=self.movie1, user=self.user, content='댓글 3')
        
        # 영화 2는 댓글 0개 유지

    def test_shorts_list_comment_count(self):
        """
        [GET /api/movies/shorts/]
        쇼츠 목록 조회 시, 각 영화 객체에 comment_count 필드가 포함되어야 합니다.
        """
        print("\n=== [TEST] Shorts 목록 조회 및 comment_count 검증 시작 ===")
        
        # 비로그인 상태로 조회
        response = self.client.get('/api/movies/shorts/')
        self.assertEqual(response.status_code, 200)
        
        results = response.data['results']
        print(f"-> 전체 응답 개수: {len(results)}개")

        # 영화 1의 데이터 찾기
        m1_data = next(r for r in results if r['movie_id'] == 'm1')
        print(f"-> 영화 1 (제목: {m1_data['title']})의 comment_count: {m1_data['comment_count']}")
        self.assertEqual(m1_data['comment_count'], 3, "영화 1의 댓글 수는 3개여야 합니다.")

        # 영화 2의 데이터 찾기
        m2_data = next(r for r in results if r['movie_id'] == 'm2')
        print(f"-> 영화 2 (제목: {m2_data['title']})의 comment_count: {m2_data['comment_count']}")
        self.assertEqual(m2_data['comment_count'], 0, "영화 2의 댓글 수는 0개여야 합니다.")
        
        print("=== [pass] Shorts 목록 조회 테스트 통과 ===")

    def test_shorts_detail_comment_count(self):
        """
        [GET /api/movies/shorts/{movie_id}/]
        쇼츠 상세 조회 시, 현재 영화(current)와 추천 목록(results) 모두 comment_count가 포함되어야 합니다.
        """
        print("\n=== [TEST] Shorts 상세 조회 및 comment_count 검증 시작 ===")
        
        # 영화 1 상세 조회
        url = f'/api/movies/shorts/{self.movie1.movie_id}/'
        print(f"-> 요청 URL: {url}")
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        
        # 1. 현재 영화(current) 검증
        current = response.data['current']
        print(f"-> [Current] 영화 제목: {current['title']}, comment_count: {current['comment_count']}")
        self.assertEqual(current['movie_id'], 'm1')
        self.assertEqual(current['comment_count'], 3, "상세 조회된 영화의 댓글 수는 3개여야 합니다.")
        
        # 2. 다음 추천 영화(results) 검증
        results = response.data['results']
        print(f"-> [Results] 추천 영화 개수: {len(results)}개")
        
        if results:
            m2_data = next((r for r in results if r['movie_id'] == 'm2'), None)
            if m2_data:
                print(f"-> [Results] 추천 목록 내 영화 2의 comment_count: {m2_data['comment_count']}")
                self.assertEqual(m2_data['comment_count'], 0, "추천 목록에 있는 영화 2의 댓글 수는 0개여야 합니다.")
        
        print("=== [PASS] Shorts 상세 조회 테스트 통과 ===")
