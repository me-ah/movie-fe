import os
import json
import requests
import hashlib
import time
from datetime import datetime, timedelta

# --- [1. 설정 영역] ---
TMDB_API_KEY = "f2d709eb190cb4d7ef17aaa984b91e60"
SALT = "ssafy_reels_project_2026_top_secret"

# 수집 범위 설정: 2010년 1월 1일 ~ 2026년 1월 31일
START_YEAR = 2010
END_YEAR = 2026
END_MONTH_LIMIT = "2026-01-31"
PAGES_PER_YEAR = 10  # 연도당 상위 200개씩 수집

BASE_DIR = "./movie_data"
INFO_FILE = os.path.join(BASE_DIR, "movie_info.json")
DATE_FILE = os.path.join(BASE_DIR, "movie_date.json")
HASH_FILE = os.path.join(BASE_DIR, "movie_hash.json")
IFRAME_FILE = os.path.join(BASE_DIR, "movie_iframe.json") # 신규 파일 경로 추가

os.makedirs(BASE_DIR, exist_ok=True)

# --- [2. 핵심 기능 함수 영역] ---

def generate_hash(movie_id):
    """보안 및 매핑을 위한 해시값을 생성합니다."""
    return hashlib.sha256(f"{movie_id}_{SALT}".encode()).hexdigest()

def get_genre_mapping():
    """장르 ID를 한글 이름으로 매핑하는 데이터를 가져옵니다."""
    url = f"https://api.themoviedb.org/3/genre/movie/list?api_key={TMDB_API_KEY}&language=ko-KR"
    try:
        res = requests.get(url, timeout=10).json()
        return {item['id']: item['name'] for item in res.get('genres', [])}
    except: return {}

def get_extra_details(movie_id):
    """OTT 정보(KR) 및 극장 상영 여부를 조회합니다."""
    extra = {"ott_providers": [], "is_in_theaters": False}
    
    # OTT 정보 조회 (ott_providers 필드명 적용)
    try:
        p_res = requests.get(f"https://api.themoviedb.org/3/movie/{movie_id}/watch/providers?api_key={TMDB_API_KEY}", timeout=10).json()
        kr_providers = p_res.get('results', {}).get('KR', {}).get('flatrate', [])
        extra["ott_providers"] = [p['provider_name'] for p in kr_providers]
    except: pass

    # 상영 여부 조회
    try:
        rel_res = requests.get(f"https://api.themoviedb.org/3/movie/{movie_id}/release_dates?api_key={TMDB_API_KEY}", timeout=10).json()
        for res in rel_res.get('results', []):
            if res['iso_3166_1'] == 'KR':
                for detail in res['release_dates']:
                    if detail['type'] in [2, 3]: 
                        rel_date = datetime.strptime(detail['release_date'][:10], "%Y-%m-%d")
                        if datetime.now() - rel_date < timedelta(days=60):
                            extra["is_in_theaters"] = True
    except: pass
    return extra

def get_youtube_key(movie_id):
    """유튜브 예고편 키를 추출합니다."""
    try:
        res = requests.get(f"https://api.themoviedb.org/3/movie/{movie_id}/videos?api_key={TMDB_API_KEY}&language=ko-KR", timeout=10).json()
        trailers = [v for v in res.get('results', []) if v['site'] == 'YouTube' and v['type'] == 'Trailer']
        if trailers: return trailers[0]['key']
        
        res_en = requests.get(f"https://api.themoviedb.org/3/movie/{movie_id}/videos?api_key={TMDB_API_KEY}", timeout=10).json()
        trailers_en = [v for v in res_en.get('results', []) if v['site'] == 'YouTube' and v['type'] == 'Trailer']
        return trailers_en[0]['key'] if trailers_en else None
    except: return None

# --- [3. 메인 실행부] ---

def main():
    genre_map = get_genre_mapping()
    
    def load_json(p):
        if os.path.exists(p):
            with open(p, 'r', encoding='utf-8') as f:
                try: return json.load(f)
                except: return {}
        return {}

    db_info = load_json(INFO_FILE)
    db_date = load_json(DATE_FILE)
    db_hash = load_json(HASH_FILE)
    db_iframe = load_json(IFRAME_FILE) # 신규 데이터 로드

    total_years = END_YEAR - START_YEAR + 1
    total_expected_pages = total_years * PAGES_PER_YEAR

    print(f"\n{'='*70}")
    print(f" 🚀 [SSAFY Movie Collector] 고도화 수집 시작")
    print(f" - 기간 설정: {START_YEAR}-01-01 ~ {END_MONTH_LIMIT}")
    print(f" - 신규 생성 파일: movie_iframe.json")
    print(f" - 현재 DB 데이터 수: {len(db_info)}개")
    print(f"{'='*70}\n")

    global_page_count = 0
    for year in range(START_YEAR, END_YEAR + 1):
        year_start = f"{year}-01-01"
        year_end = f"{year}-12-31" if year < END_YEAR else END_MONTH_LIMIT
        
        for p in range(1, PAGES_PER_YEAR + 1):
            global_page_count += 1
            progress_pct = (global_page_count / total_expected_pages) * 100
            bar = '█' * int(20 * progress_pct // 100) + '-' * (20 - int(20 * progress_pct // 100))
            
            print(f"\n>>> [{bar}] {progress_pct:.1f}% | {year}년 ({p}/{PAGES_PER_YEAR} page)")

            url = (f"https://api.themoviedb.org/3/discover/movie?api_key={TMDB_API_KEY}&language=ko-KR"
                   f"&primary_release_date.gte={year_start}&primary_release_date.lte={year_end}"
                   f"&sort_by=popularity.desc&page={p}")
            
            try:
                movies = requests.get(url, timeout=10).json().get('results', [])
            except: break
            if not movies: break

            for idx, movie in enumerate(movies):
                m_id = str(movie['id'])
                title = movie['title']
                
                # 기존 데이터가 있고 iframe 정보도 있으면 건너뜀
                if m_id in db_info and m_id in db_iframe: continue

                yt_key = get_youtube_key(m_id)
                if yt_key:
                    extra = get_extra_details(m_id)
                    genre_list = [{"id": gid, "name": genre_map.get(gid, "기타")} for gid in movie.get('genre_ids', [])]
                    h_name = generate_hash(m_id)
                    
                    params = f"autoplay=1&mute=1&loop=1&playlist={yt_key}&controls=0&modestbranding=1&rel=0"
                    embed_url = f"https://www.youtube.com/embed/{yt_key}?{params}"
                    
                    # 1. movie_info.json (전체 상세 데이터)
                    db_info[m_id] = {
                        "movie_id": m_id,
                        "title": title,
                        "youtube_key": yt_key,
                        "embed_url": embed_url,
                        "release_date": movie.get('release_date', ''),
                        "genres": genre_list,
                        "vote_average": movie.get('vote_average', 0),
                        "star_rating": round(movie.get('vote_average', 0) / 2, 1),
                        "ott_providers": extra["ott_providers"],
                        "is_in_theaters": extra["is_in_theaters"],
                        "overview": movie.get('overview', ''),
                        "poster_path": f"https://image.tmdb.org/t/p/w500{movie.get('poster_path')}",
                        "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    }
                    
                    # 2. movie_iframe.json (핵심 요약 데이터) - 요청하신 부분
                    db_iframe[m_id] = {
                        "movie_id": m_id,
                        "title": title,
                        "embed_url": embed_url
                    }
                    
                    # 매핑 업데이트
                    rel_date = movie.get('release_date', '0000-00-00')
                    if rel_date not in db_date: db_date[rel_date] = []
                    db_date[rel_date].append({"id": m_id, "title": title})
                    db_hash[h_name] = m_id

                    # 모든 파일 실시간 저장
                    with open(INFO_FILE, 'w', encoding='utf-8') as f: json.dump(db_info, f, ensure_ascii=False, indent=4)
                    with open(DATE_FILE, 'w', encoding='utf-8') as f: json.dump(db_date, f, ensure_ascii=False, indent=4)
                    with open(HASH_FILE, 'w', encoding='utf-8') as f: json.dump(db_hash, f, ensure_ascii=False, indent=4)
                    with open(IFRAME_FILE, 'w', encoding='utf-8') as f: json.dump(db_iframe, f, ensure_ascii=False, indent=4)

                    print(f"  ({idx+1:02d}/20) [성공] {title}")
                
                time.sleep(0.1)

    print(f"\n{'='*70}\n ✅ 모든 데이터 수집 및 movie_iframe.json 생성 완료!\n{'='*70}")

if __name__ == "__main__":
    main()