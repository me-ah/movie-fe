// Use DBML to define your database structure
// Docs: https://dbml.dbdiagram.io/docs

Table users {
  id integer [primary key]
  username varchar
  email varchar
  is_onboarding_completed boolean [default: false]
  pref_action integer [default: 0]
  pref_adventure integer [default: 0]
  pref_animation integer [default: 0]
  pref_comedy integer [default: 0]
  pref_crime integer [default: 0]
  pref_documentary integer [default: 0]
  pref_drama integer [default: 0]
  pref_family integer [default: 0]
  pref_fantasy integer [default: 0]
  pref_history integer [default: 0]
  pref_horror integer [default: 0]
  pref_music integer [default: 0]
  pref_mystery integer [default: 0]
  pref_romance integer [default: 0]
  pref_science_fiction integer [default: 0]
  pref_tv_movie integer [default: 0]
  pref_thriller integer [default: 0]
  pref_war integer [default: 0]
  pref_western integer [default: 0]
}

Table movies {
  id integer [primary key]
  movie_id varchar [unique, note: 'TMDB 고유 ID']
  title varchar
  vote_average float
  review_average float [note: '사용자 리뷰 평균']
  poster_path varchar
  embed_url varchar
  view_count integer
  like_count integer
}

Table genres {
  id integer [primary key]
  name varchar
}

// 다대다(ManyToMany) 관계를 위한 중간 테이블
Table movie_genres {
  id integer [primary key]
  movie_id integer
  genre_id integer
}

Table home_categories {
  id integer [primary key]
  title varchar
  genre_key varchar [note: '장르 조합 키']
  category_type varchar [note: 'special 또는 general']
  base_score float
}

Table home_category_movies {
  id integer [primary key]
  homecategory_id integer
  movie_id integer
}

Table user_movie_histories {
  id integer [primary key]
  user_id integer
  movie_id integer
  watch_time integer [note: '시청 시간(초)']
  watched_at timestamp
}

Table user_my_lists {
  id integer [primary key]
  user_id integer
  movie_id integer
  created_at timestamp
}

Table user_like_lists {
  id integer [primary key]
  user_id integer
  movie_id integer
  created_at timestamp
}

Table movie_reviews {
  id integer [primary key]
  movie_id integer
  author_id integer
  rating integer
  content text
  created_at timestamp
}

Table comments {
  id integer [primary key]
  movie_id integer
  user_id integer
  content text
  created_at timestamp
}

// Relationships (References)
Ref: movie_genres.movie_id > movies.id
Ref: movie_genres.genre_id > genres.id

Ref: home_category_movies.homecategory_id > home_categories.id
Ref: home_category_movies.movie_id > movies.id

Ref: user_movie_histories.user_id > users.id
Ref: user_movie_histories.movie_id > movies.id

Ref: user_my_lists.user_id > users.id
Ref: user_my_lists.movie_id > movies.id

Ref: user_like_lists.user_id > users.id
Ref: user_like_lists.movie_id > movies.id

Ref: movie_reviews.movie_id > movies.id
Ref: movie_reviews.author_id > users.id

Ref: comments.movie_id > movies.id
Ref: comments.user_id > users.id
