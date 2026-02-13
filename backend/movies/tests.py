import json

from django.test import TestCase
from rest_framework.test import APIClient

from movies.models import Genre, Movie


class MovieShortsAPITest(TestCase):
    """Shorts API 응답 검증 테스트"""

    # ========== 테스트 데이터 세팅 ==========
    def setUp(self):
        self.client = APIClient()
        self.url = '/api/movies/shorts/'

        # ---- 장르 생성 ----
        self.genre_action = Genre.objects.create(id=28, name='액션')
        self.genre_comedy = Genre.objects.create(id=35, name='코미디')
        self.genre_sf = Genre.objects.create(id=878, name='SF')

        # ---- 영화 15개 생성 (페이지네이션 테스트용) ----
        self.movies = []
        for i in range(1, 16):
            movie = Movie.objects.create(
                movie_id=str(10000 + i),
                title=f'테스트 영화 {i}',
                youtube_key=f'test_key_{i}',
                embed_url=f'https://www.youtube.com/embed/test_key_{i}?autoplay=1',
                release_date='2024-01-15',
                vote_average=7.5,
                star_rating=3.8,
                ott_providers=['Netflix'],
                is_in_theaters=False,
                overview=f'테스트 영화 {i}의 줄거리입니다.',
                poster_path=f'https://image.tmdb.org/t/p/w500/test_{i}.jpg',
                view_count=i * 10,
                like_count=i * 5,
            )
            movie.genres.set([self.genre_action, self.genre_comedy])
            self.movies.append(movie)

    # ========== 1. 기본 응답 테스트 ==========
    def test_shorts_api_returns_200(self):
        """API가 200 상태코드를 반환하는지 확인"""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        print('✅ [PASS] 상태코드 200 반환')

    # ========== 2. 응답 구조 검증 ==========
    def test_response_has_required_keys(self):
        """응답에 next_cursor, results 키가 존재하는지 확인"""
        response = self.client.get(self.url)
        data = response.json()

        self.assertIn('next_cursor', data)
        self.assertIn('results', data)
        print('✅ [PASS] 응답에 next_cursor, results 키 존재')

    # ========== 3. results 필수 필드 검증 ==========
    def test_each_result_has_all_required_fields(self):
        """results 각 항목에 모든 필수 필드가 존재하는지 확인"""
        response = self.client.get(self.url)
        data = response.json()
        results = data['results']

        required_fields = [
            'movie_id', 'title', 'youtube_key', 'embed_url',
            'release_date', 'genres', 'vote_average', 'star_rating',
            'ott_providers', 'is_in_theaters', 'overview', 'poster_path',
            'view_count', 'like_count', 'is_liked',
        ]

        self.assertGreater(len(results), 0, '결과가 비어있으면 안 됩니다')

        for idx, movie in enumerate(results):
            for field in required_fields:
                self.assertIn(
                    field, movie,
                    f'results[{idx}]에 "{field}" 필드가 없습니다'
                )

        print(f'✅ [PASS] results {len(results)}개 항목 모두 필수 필드 존재')
        print(f'   검증된 필드: {", ".join(required_fields)}')

    # ========== 4. genres 구조 검증 ==========
    def test_genres_structure(self):
        """genres 배열 내 각 항목에 id, name이 존재하는지 확인"""
        response = self.client.get(self.url)
        data = response.json()
        results = data['results']

        for idx, movie in enumerate(results):
            genres = movie['genres']
            self.assertIsInstance(genres, list, f'results[{idx}].genres는 배열이어야 합니다')
            self.assertGreater(len(genres), 0, f'results[{idx}].genres가 비어있습니다')

            for g_idx, genre in enumerate(genres):
                self.assertIn('id', genre, f'results[{idx}].genres[{g_idx}]에 "id"가 없습니다')
                self.assertIn('name', genre, f'results[{idx}].genres[{g_idx}]에 "name"이 없습니다')

        print('✅ [PASS] genres 배열 구조 정상 (id, name 포함)')

    # ========== 5. 필드 값 타입 검증 ==========
    def test_field_value_types(self):
        """주요 필드들의 값 타입이 올바른지 확인"""
        response = self.client.get(self.url)
        data = response.json()
        movie = data['results'][0]

        self.assertIsInstance(movie['movie_id'], str)
        self.assertIsInstance(movie['title'], str)
        self.assertIsInstance(movie['vote_average'], (int, float))
        self.assertIsInstance(movie['star_rating'], (int, float))
        self.assertIsInstance(movie['ott_providers'], list)
        self.assertIsInstance(movie['is_in_theaters'], bool)
        self.assertIsInstance(movie['view_count'], int)
        self.assertIsInstance(movie['like_count'], int)
        self.assertIsInstance(movie['is_liked'], bool)

        print('✅ [PASS] 필드 값 타입 정상')
        print(f'   movie_id={movie["movie_id"]}, title={movie["title"]}')
        print(f'   vote_average={movie["vote_average"]}, view_count={movie["view_count"]}')

    # ========== 6. 페이지네이션 동작 검증 ==========
    def test_cursor_pagination(self):
        """커서 기반 페이지네이션이 정상 동작하는지 확인"""
        # ---- 첫 번째 페이지 ----
        response1 = self.client.get(self.url)
        data1 = response1.json()

        self.assertEqual(len(data1['results']), 10, '기본 페이지 크기는 10이어야 합니다')
        self.assertIsNotNone(data1['next_cursor'], '다음 페이지가 있으므로 next_cursor가 있어야 합니다')

        first_page_ids = [m['movie_id'] for m in data1['results']]
        print(f'✅ [PASS] 1페이지: {len(data1["results"])}개 반환')
        print(f'   movie_ids: {first_page_ids}')

        # ---- 두 번째 페이지 ----
        response2 = self.client.get(f'{self.url}?cursor={data1["next_cursor"]}')
        data2 = response2.json()

        self.assertEqual(len(data2['results']), 5, '남은 5개가 반환되어야 합니다')
        self.assertIsNone(data2['next_cursor'], '마지막 페이지이므로 next_cursor가 None이어야 합니다')

        second_page_ids = [m['movie_id'] for m in data2['results']]
        print(f'✅ [PASS] 2페이지: {len(data2["results"])}개 반환')
        print(f'   movie_ids: {second_page_ids}')

        # ---- 중복 없음 확인 ----
        all_ids = first_page_ids + second_page_ids
        self.assertEqual(len(all_ids), len(set(all_ids)), '페이지 간 중복 영화가 없어야 합니다')
        print('✅ [PASS] 페이지 간 중복 없음')

    # ========== 7. page_size 파라미터 검증 ==========
    def test_custom_page_size(self):
        """page_size 파라미터가 동작하는지 확인"""
        response = self.client.get(f'{self.url}?page_size=5')
        data = response.json()

        self.assertEqual(len(data['results']), 5)
        print('✅ [PASS] page_size=5 정상 동작')

    # ========== 8. 데이터 없을 때 빈 results 반환 ==========
    def test_empty_results_when_no_data(self):
        """데이터가 없을 때 빈 results가 반환되는지 확인"""
        Movie.objects.all().delete()

        response = self.client.get(self.url)
        data = response.json()

        self.assertEqual(len(data['results']), 0)
        self.assertIsNone(data['next_cursor'])
        print('✅ [PASS] 데이터 없을 때 빈 results 반환')

    # ========== 9. is_liked가 현재 항상 False인지 확인 ==========
    def test_is_liked_always_false(self):
        """인증 없이 is_liked가 항상 False인지 확인"""
        response = self.client.get(self.url)
        data = response.json()

        for movie in data['results']:
            self.assertFalse(movie['is_liked'])

        print('✅ [PASS] is_liked 항상 False (비로그인 상태)')


class MovieShortsDetailAPITest(TestCase):
    """
    쇼츠 상세 조회 API (/api/movies/shorts/{movie_id}/) 테스트

    공유 링크를 통해 특정 영화를 조회할 때의 응답을 검증합니다.
    응답 구조: { "current": {...}, "next_cursor": "..." | null, "results": [...] }
    """

    # ========== 테스트 데이터 세팅 ==========
    def setUp(self):
        self.client = APIClient()

        # ---- 장르 생성 ----
        self.genre_action = Genre.objects.create(id=28, name='액션')
        self.genre_comedy = Genre.objects.create(id=35, name='코미디')

        # ---- 영화 15개 생성 (페이지네이션 테스트용) ----
        self.movies = []
        for i in range(1, 16):
            movie = Movie.objects.create(
                movie_id=str(10000 + i),
                title=f'테스트 영화 {i}',
                youtube_key=f'test_key_{i}',
                embed_url=f'https://www.youtube.com/embed/test_key_{i}?autoplay=1',
                release_date='2024-01-15',
                vote_average=7.5,
                star_rating=3.8,
                ott_providers=['Netflix'],
                is_in_theaters=False,
                overview=f'테스트 영화 {i}의 줄거리입니다.',
                poster_path=f'https://image.tmdb.org/t/p/w500/test_{i}.jpg',
                view_count=i * 10,
                like_count=i * 5,
            )
            movie.genres.set([self.genre_action, self.genre_comedy])
            self.movies.append(movie)

    # ========== 1. 유효한 movie_id로 요청 시 200 반환 ==========
    def test_detail_returns_200(self):
        """
        유효한 movie_id('10001')로 요청하면 200 상태코드를 반환하는지 확인합니다.

        요청: GET /api/movies/shorts/10001/
        예상: status_code = 200
        """
        response = self.client.get('/api/movies/shorts/10001/')
        self.assertEqual(response.status_code, 200)
        print('✅ [PASS] 유효한 movie_id → 200 반환')

    # ========== 2. 존재하지 않는 movie_id로 요청 시 404 반환 ==========
    def test_detail_returns_404_for_invalid_id(self):
        """
        존재하지 않는 movie_id('99999')로 요청하면 404 상태코드를 반환하는지 확인합니다.

        요청: GET /api/movies/shorts/99999/
        예상 응답:
        {
            "detail": "찾을 수 없습니다."  (404 Not Found)
        }
        """
        response = self.client.get('/api/movies/shorts/99999/')
        self.assertEqual(response.status_code, 404)
        print('✅ [PASS] 존재하지 않는 movie_id → 404 반환')

    # ========== 3. 응답에 current, next_cursor, results 키 존재 ==========
    def test_detail_response_has_current_and_results(self):
        """
        응답 최상위에 'current', 'next_cursor', 'results' 3개 키가 모두 존재하는지 확인합니다.

        요청: GET /api/movies/shorts/10001/
        예상 응답 구조:
        {
            "current": { ... },      ← Object (해당 영화 상세)
            "next_cursor": "...",     ← String | null
            "results": [ ... ]       ← Array (이후 영화 목록)
        }
        """
        response = self.client.get('/api/movies/shorts/10001/')
        data = response.json()

        self.assertIn('current', data)
        self.assertIn('next_cursor', data)
        self.assertIn('results', data)
        print('✅ [PASS] 응답에 current, next_cursor, results 키 존재')

    # ========== 4. current에 모든 필수 필드 15개 포함 ==========
    def test_current_has_all_required_fields(self):
        """
        current 객체 안에 쇼츠 API의 모든 필수 필드 15개가 존재하는지 확인합니다.

        요청: GET /api/movies/shorts/10001/
        예상 current 데이터:
        {
            "movie_id": "10001",
            "title": "테스트 영화 1",
            "youtube_key": "test_key_1",
            "embed_url": "https://www.youtube.com/embed/test_key_1?autoplay=1",
            "release_date": "2024-01-15",
            "genres": [{"id": 28, "name": "액션"}, {"id": 35, "name": "코미디"}],
            "vote_average": 7.5,
            "star_rating": 3.8,
            "ott_providers": ["Netflix"],
            "is_in_theaters": false,
            "overview": "테스트 영화 1의 줄거리입니다.",
            "poster_path": "https://image.tmdb.org/t/p/w500/test_1.jpg",
            "view_count": 10,
            "like_count": 5,
            "is_liked": false
        }
        """
        response = self.client.get('/api/movies/shorts/10001/')
        data = response.json()
        current = data['current']

        required_fields = [
            'movie_id', 'title', 'youtube_key', 'embed_url',
            'release_date', 'genres', 'vote_average', 'star_rating',
            'ott_providers', 'is_in_theaters', 'overview', 'poster_path',
            'view_count', 'like_count', 'is_liked',
        ]

        for field in required_fields:
            self.assertIn(field, current, f'current에 "{field}" 필드가 없습니다')

        # ---- 값 검증 ----
        self.assertEqual(current['movie_id'], '10001')
        self.assertEqual(current['title'], '테스트 영화 1')

        print(f'✅ [PASS] current에 필수 필드 {len(required_fields)}개 모두 존재')
        print(f'   movie_id={current["movie_id"]}, title={current["title"]}')

    # ========== 5. results에 current 이후 영화만 포함 ==========
    def test_results_contain_next_movies_after_current(self):
        """
        results 배열이 current 영화 이후의 영화들만 포함하는지 확인합니다.
        current 영화 자체는 results에 포함되면 안 됩니다.

        요청: GET /api/movies/shorts/10001/
        검증:
        - current의 movie_id('10001')가 results에 포함되지 않음
        - results 개수 = 10 (총 15개 중 첫 번째 제외, 나머지 14개 중 10개)
        - next_cursor가 존재 (아직 4개 남음)
        - results의 모든 movie_id가 current의 movie_id보다 뒤에 위치
        """
        response = self.client.get('/api/movies/shorts/10001/')
        data = response.json()

        current_movie_id = data['current']['movie_id']
        result_ids = [m['movie_id'] for m in data['results']]

        # ---- current가 results에 포함되면 안 됨 ----
        self.assertNotIn(current_movie_id, result_ids,
                         'current 영화가 results에 포함되어 있습니다')

        # ---- results 개수 검증 (기본 page_size=10) ----
        self.assertEqual(len(data['results']), 10,
                         '이후 영화 14개 중 10개가 반환되어야 합니다')

        # ---- 다음 페이지 존재 (4개 남음) ----
        self.assertIsNotNone(data['next_cursor'],
                             '아직 4개 남았으므로 next_cursor가 있어야 합니다')

        print(f'✅ [PASS] results에 current 이후 영화 {len(data["results"])}개 반환')
        print(f'   current: {current_movie_id}')
        print(f'   results: {result_ids}')
        print(f'   next_cursor: {data["next_cursor"]}')
