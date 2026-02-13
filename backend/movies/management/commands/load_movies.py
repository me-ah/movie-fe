"""
movie_genres.json과 movie_info.json 데이터를 DB에 로드하는 Management Command

사용법 (VS Code 터미널):
    uv run python manage.py load_movies
"""
import json
import os
from datetime import datetime

from django.conf import settings
from django.core.management.base import BaseCommand
from movies.models import Genre, Movie


class Command(BaseCommand):
    help = 'movie_genres.json과 movie_info.json 데이터를 DB에 로드합니다.'

    def handle(self, *args, **options):
        data_dir = os.path.join(settings.BASE_DIR, 'movie_data')

        # ========== 1. Genre 로드 (movie_genres.json) ==========
        genres_path = os.path.join(data_dir, 'movie_genres.json')
        self.stdout.write(self.style.NOTICE(f'장르 데이터 로드 중... ({genres_path})'))

        with open(genres_path, 'r', encoding='utf-8') as f:
            genres_data = json.load(f)

        genre_count = 0
        for genre_id, genre_info in genres_data.items():
            Genre.objects.get_or_create(
                id=int(genre_id),
                defaults={'name': genre_info['name']}
            )
            genre_count += 1

        self.stdout.write(self.style.SUCCESS(f'장르 {genre_count}개 로드 완료'))

        # ========== 2. Movie 로드 (movie_info.json) ==========
        movies_path = os.path.join(data_dir, 'movie_info.json')
        self.stdout.write(self.style.NOTICE(f'영화 데이터 로드 중... ({movies_path})'))

        with open(movies_path, 'r', encoding='utf-8') as f:
            movies_data = json.load(f)

        movie_count = 0
        for movie_id, movie_info in movies_data.items():
            # ---- release_date 파싱 ----
            release_date = None
            if movie_info.get('release_date'):
                try:
                    release_date = datetime.strptime(
                        movie_info['release_date'], '%Y-%m-%d'
                    ).date()
                except ValueError:
                    release_date = None

            # ---- Movie 생성/업데이트 ----
            movie, created = Movie.objects.update_or_create(
                movie_id=movie_info['movie_id'],
                defaults={
                    'title': movie_info.get('title', ''),
                    'youtube_key': movie_info.get('youtube_key', ''),
                    'embed_url': movie_info.get('embed_url', ''),
                    'release_date': release_date,
                    'vote_average': movie_info.get('vote_average', 0),
                    'star_rating': movie_info.get('star_rating', 0),
                    'ott_providers': movie_info.get('ott_providers', []),
                    'is_in_theaters': movie_info.get('is_in_theaters', False),
                    'overview': movie_info.get('overview', ''),
                    'poster_path': movie_info.get('poster_path', ''),
                }
            )

            # ---- 장르 M2M 연결 ----
            genre_ids = [g['id'] for g in movie_info.get('genres', [])]
            genres = Genre.objects.filter(id__in=genre_ids)
            movie.genres.set(genres)

            movie_count += 1

            # ---- 진행 상황 출력 (500개마다) ----
            if movie_count % 500 == 0:
                self.stdout.write(f'  ... {movie_count}개 처리됨')

        self.stdout.write(self.style.SUCCESS(
            f'영화 {movie_count}개 로드 완료!'
        ))
