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
            username='testuser1', first_name='길동', last_name='홍', email='test1@test.com', password='testpass1234!'
        )
        cls.user2 = User.objects.create_user(
            username='testuser2', first_name='철수', last_name='김', email='test2@test.com', password='testpass1234!'
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
        response = self.client.get('/api/community/review/list/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('results', response.data)
        self.assertEqual(response.data['count'], 3)
        print('✅ [PASS] 리뷰 목록 조회 → 200')

    # ========== 2. search 파라미터로 영화 제목 검색 ==========
    def test_review_list_search(self):
        """영화 제목으로 검색"""
        response = self.client.get('/api/community/review/list/', {'search': '어벤져스'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 2)
        print('✅ [PASS] search=어벤져스 → 2건')

    # ========== 3. rating 필터 ==========
    def test_review_list_rating_filter(self):
        """평점 필터링"""
        response = self.client.get('/api/community/review/list/', {'rating': '10'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['movie_title'], '인터스텔라')
        print('✅ [PASS] rating=10 → 1건')

    # ========== 4. 정렬 (type + order) ==========
    def test_review_list_sort(self):
        """정렬 기능 — rating 오름차순"""
        response = self.client.get('/api/community/review/list/', {'type': 'rating', 'order': 'asc'})
        self.assertEqual(response.status_code, 200)
        results = response.data['results']
        self.assertEqual(results[0]['rank'], 6)   # 가장 낮은 평점 먼저
        self.assertEqual(results[-1]['rank'], 10)  # 가장 높은 평점 마지막
        print('✅ [PASS] 정렬 rating asc → 6, 9, 10')

    # ========== 5. 리뷰 상세 조회 → 200 + comments 포함 ==========
    def test_review_detail_success(self):
        """리뷰 상세 조회 — 댓글 포함"""
        response = self.client.get(f'/api/community/review/{self.review1.id}/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['title'], '정말 재밌는 영화!')
        self.assertEqual(response.data['movie_title'], '어벤져스 1')
        self.assertEqual(response.data['rank'], 9)
        self.assertEqual(len(response.data['comments']), 2)
        self.assertEqual(response.data['user']['username'], 'testuser1')
        self.assertEqual(response.data['user']['email'], 'test1@test.com')
        self.assertEqual(response.data['user']['first_name'], '길동')
        self.assertEqual(response.data['user']['last_name'], '홍')
        print('✅ [PASS] 리뷰 상세 조회 → 200 + 댓글 2개')

    # ========== 6. 없는 review_id → 404 ==========
    def test_review_detail_not_found(self):
        """존재하지 않는 review_id → 404"""
        response = self.client.get('/api/community/review/99999/')
        self.assertEqual(response.status_code, 404)
        print('✅ [PASS] 없는 review_id → 404')

    # ========== 7. 리뷰 작성 성공 → 201 ==========
    def test_review_create_success(self):
        """인증된 사용자가 리뷰 작성 성공"""
        refresh = RefreshToken.for_user(self.user1)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        response = self.client.post('/api/community/review/create/', {
            'title': '스파이더맨 액션 시퀀스가 대박!',
            'movie_title': '스파이더맨: 노 웨이 홈',
            'rank': 9,
            'content': '스파이더맨 3명이 함께 나오는 장면은 정말 소름돋았습니다.'
        })
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['message'], '게시글이 성공적으로 작성되었습니다.')
        post = response.data['post']
        self.assertEqual(post['title'], '스파이더맨 액션 시퀀스가 대박!')
        self.assertEqual(post['user']['username'], 'testuser1')
        self.assertEqual(post['like_users_count'], 0)
        self.assertFalse(post['is_liked'])
        print('✅ [PASS] 리뷰 작성 → 201 + 응답 필드 확인')

    # ========== 8. 미인증 → 401 ==========
    def test_review_create_unauthenticated(self):
        """인증 없이 리뷰 작성 → 401"""
        response = self.client.post('/api/community/review/create/', {
            'title': '테스트', 'movie_title': '테스트', 'rank': 5, 'content': '테스트'
        })
        self.assertEqual(response.status_code, 401)
        print('✅ [PASS] 미인증 리뷰 작성 → 401')

    # ========== 9. title 누락 → 400 ==========
    def test_review_create_missing_title(self):
        """title 누락 시 400"""
        refresh = RefreshToken.for_user(self.user1)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        response = self.client.post('/api/community/review/create/', {
            'movie_title': '테스트', 'rank': 5, 'content': '테스트'
        })
        self.assertEqual(response.status_code, 400)
        print('✅ [PASS] title 누락 → 400')

    # ========== 10. content 누락 → 400 ==========
    def test_review_create_missing_content(self):
        """content 누락 시 400"""
        refresh = RefreshToken.for_user(self.user1)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        response = self.client.post('/api/community/review/create/', {
            'title': '테스트', 'movie_title': '테스트', 'rank': 5
        })
        self.assertEqual(response.status_code, 400)
        print('✅ [PASS] content 누락 → 400')

    # ========== 11. 리뷰 수정 (PATCH) 성공 → 200 ==========
    def test_review_update_success(self):
        """작성자 본인이 리뷰 수정 (PATCH)"""
        refresh = RefreshToken.for_user(self.user1)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        # review1은 user1이 작성함
        response = self.client.patch(f'/api/community/review/{self.review1.id}/update/', {
            'title': '제목 수정됨',
            'rank': 10
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['message'], '게시글 수정 완료')
        post = response.data['post']
        self.assertEqual(post['title'], '제목 수정됨')
        self.assertEqual(post['rank'], 10)
        self.assertEqual(post['movie_title'], '어벤져스 1')  # 기존 데이터 유지 확인
        print('✅ [PASS] 리뷰 수정 (PATCH) → 200 + 데이터 변경 확인')

    # ========== 12. 타인의 글 수정 시도 → 403 ==========
    def test_review_update_forbidden(self):
        """타인의 리뷰 수정 시도 → 403"""
        refresh = RefreshToken.for_user(self.user2)  # user2가 user1의 글 수정 시도
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        response = self.client.patch(f'/api/community/review/{self.review1.id}/update/', {
            'title': '해킹 시도'
        })
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.data['error'], '본인의 게시글만 수정할 수 있습니다.')
        print('✅ [PASS] 타인 글 수정 시도 → 403')

    # ========== 13. 미인증 수정 시도 → 401 ==========
    def test_review_update_unauthenticated(self):
        """미인증 상태로 수정 시도 → 401"""
        response = self.client.patch(f'/api/community/review/{self.review1.id}/update/', {
            'title': '몰래 수정'
        })
        self.assertEqual(response.status_code, 401)
        print('✅ [PASS] 미인증 수정 시도 → 401')

    # ========== 14. 리뷰 삭제 (DELETE) 성공 → 200 ==========
    def test_review_delete_success(self):
        """작성자 본인이 리뷰 삭제"""
        refresh = RefreshToken.for_user(self.user1)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        # 삭제할 리뷰 ID
        review_id = self.review1.id
        title = self.review1.title

        response = self.client.delete(f'/api/community/review/{review_id}/delete/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['message'], f'작성하신 게시글 "{title}"이(가) 성공적으로 삭제 되었습니다.')

        # DB 삭제 확인
        self.assertFalse(Review.objects.filter(id=review_id).exists())
        print('✅ [PASS] 리뷰 삭제 (DELETE) → 200 + DB 삭제 확인')

    # ========== 15. 타인의 글 삭제 시도 → 403 ==========
    def test_review_delete_forbidden(self):
        """타인의 리뷰 삭제 시도 → 403"""
        refresh = RefreshToken.for_user(self.user2)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        response = self.client.delete(f'/api/community/review/{self.review1.id}/delete/')
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.data['error'], '본인의 게시글만 삭제할 수 있습니다.')
        print('✅ [PASS] 타인 글 삭제 시도 → 403')

    # ========== 16. 미인증 삭제 시도 → 401 ==========
    def test_review_delete_unauthenticated(self):
        """미인증 상태로 삭제 시도 → 401"""
        response = self.client.delete(f'/api/community/review/{self.review1.id}/delete/')
        self.assertEqual(response.status_code, 401)
        print('✅ [PASS] 미인증 삭제 시도 → 401')

    # ========== 17. 댓글 작성 성공 → 200 ==========
    def test_comment_create_success(self):
        """댓글 작성 성공 확인"""
        refresh = RefreshToken.for_user(self.user2)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        response = self.client.post(f'/api/community/review/{self.review1.id}/comment/create/', {
            'content': '정말 공감 가는 리뷰에요',
            'review_id': self.review1.id  # Body에도 포함 (선택사항)
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['message'], '댓글이 정상적으로 작성 됐습니다.')
        
        comment = response.data['comment']
        self.assertEqual(comment['content'], '정말 공감 가는 리뷰에요')
        self.assertEqual(comment['user']['username'], 'testuser2')
        self.assertEqual(comment['user']['email'], 'test2@test.com')
        self.assertEqual(comment['user']['first_name'], '철수')
        self.assertEqual(comment['user']['last_name'], '김')
        self.assertIn('date_joined', comment['user'])  # 날짜 필드 존재 확인
        
        # DB 확인
        self.assertTrue(ReviewComment.objects.filter(content='정말 공감 가는 리뷰에요').exists())
        print('✅ [PASS] 댓글 작성 → 200 + DB 확인 + date_joined 확인')

    # ========== 18. 없는 리뷰에 댓글 작성 → 404 ==========
    def test_comment_create_not_found(self):
        """없는 리뷰 ID로 댓글 작성 시도 → 404"""
        refresh = RefreshToken.for_user(self.user2)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        response = self.client.post('/api/community/review/9999/comment/create/', {
            'content': '댓글'
        })
        self.assertEqual(response.status_code, 404)
        print('✅ [PASS] 없는 리뷰 댓글 작성 → 404')

    # ========== 19. 미인증 댓글 작성 → 401 ==========
    def test_comment_create_unauthenticated(self):
        """미인증 상태로 댓글 작성 시도 → 401"""
        response = self.client.post(f'/api/community/review/{self.review1.id}/comment/create/', {
            'content': '댓글'
        })
        self.assertEqual(response.status_code, 401)
        print('✅ [PASS] 미인증 댓글 작성 → 401')


        print('✅ [PASS] 미인증 댓글 작성 → 401')

    # ========== 20. 댓글 목록 조회 성공 → 200 ==========
    def test_comment_list_success(self):
        """댓글 목록 조회 (페이징 확인)"""
        # 댓글 15개 생성
        for i in range(15):
            ReviewComment.objects.create(
                user=self.user2,
                review=self.review1,
                content=f'댓글 {i}'
            )
        
        response = self.client.get(f'/api/community/review/{self.review1.id}/comment/list/?page=1')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 17)  # setUp 2개 + 추가 15개 = 17개
        self.assertEqual(len(response.data['results']), 10)  # 페이지당 10개
        self.assertIsNotNone(response.data['next'])
        print('✅ [PASS] 댓글 목록 조회 (페이징) → 200')

    # ========== 21. 없는 리뷰 댓글 조회 → 404 ==========
    def test_comment_list_not_found(self):
        """없는 리뷰 ID 조회 시 404"""
        response = self.client.get('/api/community/review/9999/comment/list/')
        self.assertEqual(response.status_code, 404)
        print('✅ [PASS] 없는 리뷰 댓글 조회 → 404')

    # ========== 22. 댓글 수정 성공 → 200 ==========
    def test_comment_update_success(self):
        """본인 댓글 수정 성공"""
        refresh = RefreshToken.for_user(self.user2)  # user2가 댓글 작성자임 (setUp 확인 필요하지만 여기서는 새로 생성)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        # 댓글 생성 (user2가 작성)
        comment = ReviewComment.objects.create(user=self.user2, review=self.review1, content='원본 댓글')

        response = self.client.put(f'/api/community/review/{self.review1.id}/comment/{comment.id}/update/', {
            'content': '수정된 댓글'
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['message'], '댓글이 성공적으로 수정되었습니다')
        self.assertEqual(response.data['comment']['content'], '수정된 댓글')
        print('✅ [PASS] 댓글 수정 → 200')

    # ========== 23. 타인 댓글 수정 시도 → 403 ==========
    def test_comment_update_forbidden(self):
        """타인의 댓글 수정 시도 → 403"""
        refresh = RefreshToken.for_user(self.user1)  # user1이 user2의 댓글 수정 시도
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        # 댓글 생성 (user2가 작성)
        comment = ReviewComment.objects.create(user=self.user2, review=self.review1, content='원본 댓글')

        response = self.client.put(f'/api/community/review/{self.review1.id}/comment/{comment.id}/update/', {
            'content': '해킹 시도'
        })
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.data['error'], '본인의 댓글만 수정할 수 있습니다.')
        print('✅ [PASS] 타인 댓글 수정 시도 → 403')

    # ========== 24. 경로 불일치 (리뷰ID 다름) → 400 ==========
    def test_comment_update_path_mismatch(self):
        """URL의 review_id와 실제 댓글의 review가 다를 때 → 400"""
        refresh = RefreshToken.for_user(self.user2)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        comment = ReviewComment.objects.create(user=self.user2, review=self.review1, content='원본 댓글')
        
        # 다른 리뷰 ID(999)로 요청
        response = self.client.put(f'/api/community/review/999/comment/{comment.id}/update/', {
            'content': '수정'
        })
        # get_object_or_404를 먼저 호출하면 404일 수도 있으나, view 구현 순서에 따라 400 또는 404
        # 현재 구현: review_id 검증 전에 comment_id로 먼저 찾음 -> 찾았는데 review_id 안 맞으면 400
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data['error'], '잘못된 경로입니다. (리뷰 ID 불일치)')
        print('✅ [PASS] 경로 불일치 → 400')

    # ========== 25. 댓글 삭제 성공 → 200 ==========
    def test_comment_delete_success(self):
        """본인 댓글 삭제 성공"""
        refresh = RefreshToken.for_user(self.user2)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        comment = ReviewComment.objects.create(user=self.user2, review=self.review1, content='삭제할 댓글')

        response = self.client.delete(f'/api/community/review/{self.review1.id}/comment/{comment.id}/delete/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['message'], '댓글이 성공적으로 삭제되었습니다')
        
        # DB 확인
        self.assertFalse(ReviewComment.objects.filter(id=comment.id).exists())
        print('✅ [PASS] 댓글 삭제 → 200 + DB 삭제 확인')

    # ========== 26. 타인 댓글 삭제 시도 → 403 ==========
    def test_comment_delete_forbidden(self):
        """타인 댓글 삭제 시도 → 403"""
        refresh = RefreshToken.for_user(self.user1)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        # user2가 작성한 댓글
        comment = ReviewComment.objects.create(user=self.user2, review=self.review1, content='원본 댓글')

        response = self.client.delete(f'/api/community/review/{self.review1.id}/comment/{comment.id}/delete/')
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.data['error'], '본인의 댓글만 삭제할 수 있습니다.')
        print('✅ [PASS] 타인 댓글 삭제 시도 → 403')

    # ========== 27. 미인증 삭제 시도 → 401 ==========
    def test_comment_delete_unauthenticated(self):
        """미인증 댓글 삭제 시도 → 401"""
        comment = ReviewComment.objects.create(user=self.user2, review=self.review1, content='댓글')
        
        response = self.client.delete(f'/api/community/review/{self.review1.id}/comment/{comment.id}/delete/')
        self.assertEqual(response.status_code, 401)
        print('✅ [PASS] 미인증 댓글 삭제 시도 → 401')
