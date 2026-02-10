"""
테스트 전용 설정 파일

PostgreSQL 연결 없이 SQLite 인메모리 DB로 테스트를 실행합니다.

사용법:
    uv run python manage.py test --settings=config.settings_test movies.tests -v 2
"""
from config.settings import *  # noqa: F401, F403

# 테스트용 SQLite 인메모리 DB 사용 (PostgreSQL 연결 불필요)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}
