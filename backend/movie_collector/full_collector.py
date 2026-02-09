import os
import json
import requests
import yt_dlp
import hashlib
import time
import subprocess
import shutil
import threading
import glob
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta
from dotenv import load_dotenv

# --- [1. 설정 및 경로 영역] ---
current_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(current_dir, '..', '.env')
load_dotenv(env_path)

DRY_RUN = False 
TMDB_API_KEY = os.getenv("TMDB_API_KEY")
SALT = "ssafy_reels_project_2026_top_secret"
START_DATE_STR = "2020-01-01"
MAX_WORKERS = 1 

S3_BUCKET_NAME = "mimoviemovies"
S3_REGION = "ap-northeast-2"
S3_BASE_URL = f"https://{S3_BUCKET_NAME}.s3.{S3_REGION}.amazonaws.com"

BASE_DIR = os.path.abspath(os.path.join(current_dir, "..", "movie_data"))
TEMP_DIR = os.path.join(BASE_DIR, "temp_downloads")
HLS_BASE_DIR = os.path.join(BASE_DIR, "hls")

INFO_FILE = os.path.join(BASE_DIR, "movie_info.json")
DATE_FILE = os.path.join(BASE_DIR, "movie_date.json")
HASH_FILE = os.path.join(BASE_DIR, "movie_hash.json")
LAST_DATE_FILE = os.path.join(BASE_DIR, "last_date.txt")

db_lock = threading.Lock()
os.makedirs(TEMP_DIR, exist_ok=True)
os.makedirs(HLS_BASE_DIR, exist_ok=True)

# --- [2. 기능 함수 영역] ---

def generate_hash(movie_id):
    return hashlib.sha256(f"{movie_id}_{SALT}".encode()).hexdigest()

def get_movies_by_date(date_str):
    url = f"https://api.themoviedb.org/3/discover/movie?api_key={TMDB_API_KEY}&language=ko-KR&primary_release_date.gte={date_str}&primary_release_date.lte={date_str}&sort_by=popularity.desc"
    try:
        res = requests.get(url, timeout=10).json()
        return res.get('results', [])
    except: return []

def get_tmdb_official_trailer_url(movie_id):
    for lang in ["ko-KR", "en-US"]:
        url = f"https://api.themoviedb.org/3/movie/{movie_id}/videos?api_key={TMDB_API_KEY}&language={lang}"
        try:
            res = requests.get(url, timeout=5).json()
            for v in res.get('results', []):
                if v.get('site') == 'YouTube' and v.get('type') == 'Trailer':
                    return f"https://www.youtube.com/watch?v={v['key']}"
        except: continue
    return None

def process_single_movie(movie, date_str, genre_map, db_info, db_date, db_hash):
    m_id = str(movie['id'])
    title = movie['title']
    
    if m_id in db_info:
        return f"[유지] {title}"

    v_url = get_tmdb_official_trailer_url(m_id)
    if not v_url: return None

    h_name = generate_hash(m_id)
    temp_path_base = os.path.join(TEMP_DIR, f"{h_name}")
    local_hls_dir = os.path.join(HLS_BASE_DIR, h_name)
    os.makedirs(local_hls_dir, exist_ok=True)

    # [수정 핵심] TV 클라이언트 강제 지정 및 JS 런타임 의존성 최소화
    ydl_opts = {
        'format': 'best', # TV 클라이언트는 보통 단일 스트림을 잘 줍니다.
        'outtmpl': f"{temp_path_base}.%(ext)s",
        'quiet': True,
        'no_warnings': True,
        'nocheckcertificate': True,
        'cookiefile': os.path.join(current_dir, 'cookies.txt') if os.path.exists(os.path.join(current_dir, 'cookies.txt')) else None,
        # 웹이나 모바일 대신 TV 클라이언트를 최우선으로 사용
        'extractor_args': {
            'youtube': {
                'player_client': ['tv', 'web_embedded'],
                'skip': ['web', 'ios', 'android'] 
            }
        },
        'ignoreerrors': True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([v_url])
        
        downloaded_files = glob.glob(f"{temp_path_base}.*")
        if not downloaded_files:
            return f"[실패] {title}: 유튜브 차단 (TV 클라이언트도 거부됨)"
        
        input_file = downloaded_files[0]
        m3u8_output = os.path.join(local_hls_dir, "index.m3u8")
        
        # HLS 변환
        cmd = ['ffmpeg', '-y', '-i', input_file, '-profile:v', 'baseline', '-level', '3.0', '-s', '720x1280',
               '-start_number', '0', '-hls_time', '4', '-hls_list_size', '0', '-f', 'hls', 
               '-hls_segment_filename', os.path.join(local_hls_dir, 'seg_%03d.ts'), m3u8_output]
        subprocess.run(cmd, check=True, capture_output=True)
        
        # S3 업로드
        s3_folder_path = f"uploads/{date_str}/{h_name}"
        for filename in os.listdir(local_hls_dir):
            local_p = os.path.join(local_hls_dir, filename)
            c_type = 'application/x-mpegURL' if filename.endswith('.m3u8') else 'video/MP2T'
            with open(local_p, 'rb') as f:
                requests.put(f"{S3_BASE_URL}/{s3_folder_path}/{filename}", data=f, headers={'Content-Type': c_type})
        
        movie_genres = [{"id": gid, "name": genre_map.get(gid, "알 수 없음")} for gid in movie.get('genre_ids', [])]
        with db_lock:
            db_info[m_id] = {
                "movie_id": m_id, "title": title, "hls_url": f"{S3_BASE_URL}/{s3_folder_path}/index.m3u8",
                "overview": movie.get('overview', ''), "vote_average": movie.get('vote_average', 0),
                "release_date": date_str, "genres": movie_genres, "hashed_name": h_name,
                "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
            db_hash[h_name] = m_id
            if date_str not in db_date: db_date[date_str] = []
            db_date[date_str].append({"id": m_id, "title": title})

        for f in glob.glob(f"{temp_path_base}.*"): os.remove(f)
        if os.path.exists(local_hls_dir): shutil.rmtree(local_hls_dir)
        return f"[신규] {title} 완료"

    except Exception as e:
        for f in glob.glob(f"{temp_path_base}.*"): 
            try: os.remove(f)
            except: pass
        return f"[에러] {title}: {str(e)}"

# --- [3. 메인 실행부] ---
def main():
    if not TMDB_API_KEY:
        print("[에러] TMDB 키가 없습니다.")
        return

    url_g = f"https://api.themoviedb.org/3/genre/movie/list?api_key={TMDB_API_KEY}&language=ko-KR"
    genre_map = {g['id']: g['name'] for g in requests.get(url_g).json().get('genres', [])}

    def load_json(path):
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as f:
                try: return json.load(f)
                except: return {}
        return {}

    db_info, db_date, db_hash = load_json(INFO_FILE), load_json(DATE_FILE), load_json(HASH_FILE)

    start_date = datetime.strptime(START_DATE_STR, "%Y-%m-%d")
    if os.path.exists(LAST_DATE_FILE):
        with open(LAST_DATE_FILE, 'r') as f:
            content = f.read().strip()
            if content: start_date = datetime.strptime(content, "%Y-%m-%d")

    current_date, end_date = start_date, datetime.now()
    print(f"\n{'='*70}\n [TV 클라이언트 모드] 수집 시작\n{'='*70}")

    while current_date <= end_date:
        date_str = current_date.strftime("%Y-%m-%d")
        movies = sorted(get_movies_by_date(date_str), key=lambda x: x.get('popularity', 0), reverse=True)[:10]
        print(f"\n>>> {date_str}")

        for movie in movies:
            res = process_single_movie(movie, date_str, genre_map, db_info, db_date, db_hash)
            if res: print(f"    {res}")
            time.sleep(10)

        with open(INFO_FILE, 'w', encoding='utf-8') as f: json.dump(db_info, f, ensure_ascii=False, indent=4)
        with open(DATE_FILE, 'w', encoding='utf-8') as f: json.dump(db_date, f, ensure_ascii=False, indent=4)
        with open(HASH_FILE, 'w', encoding='utf-8') as f: json.dump(db_hash, f, ensure_ascii=False, indent=4)
        with open(LAST_DATE_FILE, 'w') as f: f.write(date_str)
        
        current_date += timedelta(days=1)
        time.sleep(20)

if __name__ == "__main__":
    main()