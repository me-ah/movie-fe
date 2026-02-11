import random
from django.db.models import Avg
from home.models import HomeCategory
from .models import Movie
from accounts.models import UserMovieHistory

def get_ranked_categories(user):
    """유저 점수 기반으로 471개 카테고리의 우선순위를 정렬하여 반환 (홈 로직 재사용)"""
    genre_map = {
        '액션': 'pref_action', '모험': 'pref_adventure', '애니메이션': 'pref_animation',
        '코미디': 'pref_comedy', '범죄': 'pref_crime', '다큐멘 터리': 'pref_documentary',
        '드라마': 'pref_drama', '가족': 'pref_family', '판타지': 'pref_fantasy',
        '역사': 'pref_history', '공포': 'pref_horror', '음악': 'pref_music',
        '미스터리': 'pref_mystery', '로맨스': 'pref_romance', 'SF': 'pref_science_fiction',
        'TV 영화': 'pref_tv_movie', '스릴러': 'pref_thriller', '전쟁': 'pref_war', '서부': 'pref_western'
    }
    
    # 일반/혼합 카테고리만 대상으로 정렬
    generals = HomeCategory.objects.filter(category_type='general').prefetch_related('movies')
    cat_list = []
    
    for cat in generals:
        user_score = 0
        if cat.genre_key:
            genres = cat.genre_key.split('|')
            scores = [getattr(user, genre_map.get(g, ''), 0) for g in genres if genre_map.get(g)]
            user_score = sum(scores) / len(scores) if scores else 0
        cat_list.append({"obj": cat, "score": user_score})
    
    # 유저 점수 높은 순으로 정렬
    cat_list.sort(key=lambda x: x['score'], reverse=True)
    return [item['obj'] for item in cat_list]

def pick_movies_round_robin(categories, count, exclude_ids):
    """여러 카테고리에서 순차적으로 중복 없이 영화 ID 추출"""
    picked_movie_ids = []
    # 각 카테고리마다 영화 이터레이터 생성 (인기순)
    cat_iterators = [iter(cat.movies.exclude(id__in=exclude_ids).order_by('-vote_average')) for cat in categories]
    
    while len(picked_movie_ids) < count and cat_iterators:
        for it in list(cat_iterators):
            try:
                movie = next(it)
                if movie.id not in picked_movie_ids:
                    picked_movie_ids.append(movie.id)
                if len(picked_movie_ids) >= count: break
            except StopIteration:
                cat_iterators.remove(it)
        if not cat_iterators: break
    return picked_movie_ids

def generate_personalized_playlist(user):
    """Top(12) + Mid(4) + Special(4) = 20개 믹스 추천 리스트 생성"""
    # 1. 최근 시청한 500개 영화 제외 대상 수집
    watched_ids = list(UserMovieHistory.objects.filter(user=user).values_list('movie_id', flat=True)[:500])
    
    # 2. 카테고리 확보
    sorted_cats = get_ranked_categories(user)
    specials = HomeCategory.objects.filter(category_type='special').prefetch_related('movies')
    
    # 3. 믹스 수집 시작
    playlist = []
    
    # (1) Top 취향 (1~5위 카테고리) -> 12개
    playlist.extend(pick_movies_round_robin(sorted_cats[:5], 12, watched_ids))
    
    # (2) 중간 발견 (10~15위 카테고리) -> 4개
    playlist.extend(pick_movies_round_robin(sorted_cats[10:15], 4, watched_ids + playlist))
    
    # (3) 트렌딩/스페셜 -> 4개
    playlist.extend(pick_movies_round_robin(specials, 4, watched_ids + playlist))
    
    # (4) 20개를 채우지 못했다면 전체 인기 영화로 보충 (Fall-back)
    if len(playlist) < 20:
        extra = Movie.objects.exclude(id__in=watched_ids + playlist).order_by('-view_count')[:20-len(playlist)]
        playlist.extend([m.id for m in extra])
        
    # 랜덤 셔플로 신선함 유지
    random.shuffle(playlist)
    return playlist
