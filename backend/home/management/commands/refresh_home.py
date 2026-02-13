from django.core.management.base import BaseCommand
from movies.models import Movie, Genre
from home.models import HomeCategory
from django.db.models import Count, Q, Avg
import itertools
import random

class Command(BaseCommand):
    help = '넷플릭스 스타일의 감성적인 타이틀로 471개 카테고리를 갱신합니다.'

    def handle(self, *args, **options):
        HomeCategory.objects.all().delete()
        self.stdout.write("기존 카테고리를 초기화했습니다.")

        # 감성 형용사 사전
        adj_map = {
            '액션': ['심장 뛰는', '손에 땀을 쥐는', '강렬한 카타르시스,', '박진감 넘치는'],
            '모험': ['장대한 스케일의', '미지의 세계로,', '가슴 벅찬', '모험심을 깨우는'],
            '판타지': ['현실을 잊게 만드는', '신비로운', '상상 그 이상의', '몽환적인'],
            '애니메이션': ['꿈과 희망의', '온 가족이 즐기는', '마음이 따뜻해지는', '창의적인'],
            '드라마': ['깊은 울림을 주는', '현실보다 더 현실 같은', '인생의 의미를 담은', '감동적인'],
            '공포': ['잠 못 이루는 밤,', '소름 끼치는', '숨 막히는 공포,', '등골 서늘한'],
            '코미디': ['웃음 폭탄!', '유쾌한 에너지,', '기분 좋아지는', '배꼽 잡는'],
            '역사': ['역사의 한 페이지,', '몰랐던 사실,', '시대를 넘나드는', '거대한 서사의'],
            '서부': ['황야의 무법자,', '거친 매력의', '정의를 향한', '클래식한'],
            '스릴러': ['긴박함이 가득한', '예측 불가능한', '치밀한 두뇌 싸움,', '심장 쫄깃한'],
            '범죄': ['뒷골목의 진실,', '리얼한 범죄 세계,', '범죄와의 전쟁,', '치열한'],
            '다큐멘 터리': ['기록의 힘,', '진실을 찾아서,', '세상을 보는 눈,', '생생한 현장의'],
            'SF': ['우주 너머의 세계,', '미래를 예견하는', '최첨단 상상력,', '경이로운 스케일의'],
            '미스터리': ['풀리지 않는 수수께끼,', '기묘한 이야기,', '진실은 어디에,', '안개 속의'],
            '음악': ['귀가 즐거운', '음악에 취하다,', '선율의 감동,', '리듬을 타고'],
            '로맨스': ['두근거리는 설렘,', '달달한', '애틋한 감성의', '사랑이 꽃피는'],
            '가족': ['가족과 함께하는', '따스한 미소,', '행복한 시간,', '세대 공감'],
            '전쟁': ['전쟁의 소용돌이,', '치열한 사투,', '평화를 바라는', '웅장한'],
            'TV 영화': ['놓치면 아쉬운', '검증된 재미,', '안방극장의 명작,', '다시 보고 싶은']
        }

        # 1. 스페셜 카테고리 (항상 상위 3개)
        specials = [
            ("지금 뜨는 인기작 TOP 15", "special_trending", "-view_count", Q()),
            ("영화관에서 바로 온 현재 상영작", "special_theaters", "-view_count", Q(is_in_theaters=True)),
            ("실패 없는 최고 평점 명작", "special_top_rated", "-vote_average", Q(vote_average__gte=7.5)),
        ]
        for title, key, order, filters in specials:
            self.create_category(title, key, order, filters, 'special')

        # 2. 단일 장르 (19개)
        genres = Genre.objects.all()
        for genre in genres:
            adjs = adj_map.get(genre.name, ["인기"])
            title = f"{random.choice(adjs)} {genre.name} 영화"
            self.create_category(title, genre.name, "-view_count", Q(genres=genre))

        # 3. 혼합 장르 (분석 및 감성 타이틀 생성)
        all_movies = Movie.objects.prefetch_related('genres').all()
        genre_combinations = {}

        for movie in all_movies:
            movie_genres = sorted([g.name for g in movie.genres.all()])
            if len(movie_genres) >= 2:
                combo_key = "|".join(movie_genres)
                if combo_key not in genre_combinations:
                    genre_combinations[combo_key] = []
                genre_combinations[combo_key].append(movie.id)

        for combo_key, movie_ids in genre_combinations.items():
            genre_names = combo_key.split('|')
            
            # 넷플릭스 스타일 타이틀 조합 로직
            primary_genre = genre_names[0]
            adjs = adj_map.get(primary_genre, ["흥미진진한"])
            
            if len(genre_names) == 2:
                title = f"{random.choice(adjs)} {genre_names[0]} & {genre_names[1]}"
            elif len(genre_names) == 3:
                title = f"{primary_genre}와 함께 즐기는 {genre_names[1]}·{genre_names[2]}"
            else:
                # 4개 이상일 경우 "외.." 대신 핵심 위주 요약
                title = f"다채로운 매력, {primary_genre} 중심의 {genre_names[1]} 컬렉션"

            cat = HomeCategory.objects.create(
                title=title,
                genre_key=combo_key,
                category_type='general'
            )
            cat.movies.set(Movie.objects.filter(id__in=movie_ids).order_by('-vote_average')[:15])
            cat.save()

        count = HomeCategory.objects.count()
        self.stdout.write(self.style.SUCCESS(f'총 {count}개의 감성 카테고리 갱신 완료!'))

    def create_category(self, title, key, order, filters, cat_type='general'):
        movies = Movie.objects.filter(filters).distinct()
        if movies.exists():
            cat = HomeCategory.objects.create(title=title, genre_key=key, category_type=cat_type)
            cat.movies.set(movies.order_by(order)[:15])
            cat.save()
            return cat
        return None
