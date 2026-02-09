# /// script
# requires-python = ">=3.11"
# dependencies = ["requests", "yt-dlp", "python-dotenv"]
# ///

import os
import json
import requests
import yt_dlp
import hashlib
import time
import subprocess
import shutil
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta
from dotenv import load_dotenv

# --- [1. 설정 및 경로 영역] ---
# 현재 파일(full_collector.py) 기준 상위 폴더(backend)의 .env 로드
current_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(current_dir, '..', '.env')
load_dotenv(env_path)

# 테스트 모드 (True: 로그만 출력, False: 실제 S3 업로드)
DRY_RUN = False 

TMDB_API_KEY = os.getenv("TMDB_API_KEY")
SALT = "ssafy_reels_project_2026_top_secret"
START_DATE_STR = "2020-01-01"
MAX_WORKERS = 4 

S3_BUCKET_NAME = "mimoviemovies"
S3_REGION = "ap-northeast-2"
S3_BASE_URL = f"https://{S3_BUCKET_NAME}.s3.{S3_REGION}.amazonaws.com"

# 데이터 저장소: backend/movie_data 폴더 가리킴
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
    all_movies = []
    page = 1
    while True:
        url = (f"https://api.themoviedb.org/3/discover/movie?api_key={TMDB_API_KEY}&language=ko-KR&"
               f"primary_release_date.gte={date_str}&primary_release_date.lte={date_str}&sort_by=popularity.desc&page={page}")
        try:
            res = requests.get(url, timeout=10).json()
            results = res.get('results', [])
            if not results: break
            all_movies.extend(results)
            if page >= res.get('total_pages', 1): break
            page += 1
        except: break
    return all_movies

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

    if DRY_RUN:
        with db_lock:
            db_info[m_id] = {"title": title, "status": "dry_run_verified"}
        return f"[Dry Run] {title} (URL: {v_url})"

    h_name = generate_hash(m_id)
    temp_mp4 = os.path.join(TEMP_DIR, f"{h_name}.mp4")
    local_hls_dir = os.path.join(HLS_BASE_DIR, h_name)
    os.makedirs(local_hls_dir, exist_ok=True)

    try:
        ydl_opts = {'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]', 'outtmpl': temp_mp4, 'quiet': True, 'nocheckcertificate': True}
        with yt_dlp.YoutubeDL(ydl_opts) as ydl: ydl.download([v_url])
        
        m3u8_output = os.path.join(local_hls_dir, "index.m3u8")
        cmd = ['ffmpeg', '-y', '-i', temp_mp4, '-profile:v', 'baseline', '-level', '3.0', '-s', '720x1280',
               '-start_number', '0', '-hls_time', '4', '-hls_list_size', '0', '-f', 'hls', 
               '-hls_segment_filename', os.path.join(local_hls_dir, 'seg_%03d.ts'), m3u8_output]
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        s3_folder_path = f"uploads/{date_str}/{h_name}"
        content_types = {'.m3u8': 'application/x-mpegURL', '.ts': 'video/MP2T'}
        for filename in os.listdir(local_hls_dir):
            local_p = os.path.join(local_hls_dir, filename)
            c_type = content_types.get(os.path.splitext(filename)[1], 'application/octet-stream')
            with open(local_p, 'rb') as f:
                requests.put(f"{S3_BASE_URL}/{s3_folder_path}/{filename}", data=f, headers={'Content-Type': c_type})
        
        with db_lock:
            db_info[m_id] = {
                "movie_id": m_id, "title": title, "hls_url": f"{S3_BASE_URL}/{s3_folder_path}/index.m3u8",
                "release_date": date_str, "hashed_name": h_name, "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
            db_hash[h_name] = m_id
            if date_str not in db_date: db_date[date_str] = []
            db_date[date_str].append({"id": m_id, "title": title})

        if os.path.exists(temp_mp4): os.remove(temp_mp4)
        if os.path.exists(local_hls_dir): shutil.rmtree(local_hls_dir)
        return f"[신규] {title} 완료"
    except Exception as e:
        if os.path.exists(temp_mp4): os.remove(temp_mp4)
        return f"[에러] {title}: {str(e)}"

# --- [3. 메인 실행부] ---

def main():
    if not TMDB_API_KEY:
        print("[오류] TMDB_API_KEY 환경 변수가 설정되지 않았습니다.")
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
            start_date = datetime.strptime(f.read().strip(), "%Y-%m-%d")

    current_date, end_date = start_date, datetime.now()
    print(f"\n{'='*70}\n [V16-Final] 수집 가동 (DryRun: {DRY_RUN}, Workers: {MAX_WORKERS})\n{'='*70}")

    while current_date <= end_date:
        date_str = current_date.strftime("%Y-%m-%d")
        movies = get_movies_by_date(date_str)
        print(f"\n>>> {date_str} (후보 {len(movies)}개)")

        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            futures = [executor.submit(process_single_movie, m, date_str, genre_map, db_info, db_date, db_hash) for m in movies]
            for future in as_completed(futures):
                res = future.result()
                if res: print(f"    {res}")

        with open(INFO_FILE, 'w', encoding='utf-8') as f: json.dump(db_info, f, ensure_ascii=False, indent=4)
        with open(DATE_FILE, 'w', encoding='utf-8') as f: json.dump(db_date, f, ensure_ascii=False, indent=4)
        with open(HASH_FILE, 'w', encoding='utf-8') as f: json.dump(db_hash, f, ensure_ascii=False, indent=4)
        with open(LAST_DATE_FILE, 'w') as f: f.write(date_str)
        
        current_date += timedelta(days=1)
        if DRY_RUN and (current_date - start_date).days >= 3:
            print("\n[알림] Dry Run 모드로 3일 치 테스트를 완료했습니다.")
            break

if __name__ == "__main__":
    main()