from .schemas import Movie


SAMPLE_MOVIES = [
    Movie(
        id="arrival",
        title="Arrival",
        year=2016,
        duration_minutes=116,
        synopsis="A linguist is recruited to interpret the arrival of alien visitors.",
        poster_url="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80",
        genres=["Sci-Fi", "Drama"],
    ),
    Movie(
        id="moonlight",
        title="Moonlight",
        year=2016,
        duration_minutes=111,
        synopsis="A young man navigates identity, family, and belonging across three defining chapters.",
        poster_url="https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80",
        genres=["Drama"],
    ),
    Movie(
        id="spirited-away",
        title="Spirited Away",
        year=2001,
        duration_minutes=125,
        synopsis="A girl enters a supernatural world and must free her parents from a curse.",
        poster_url="https://images.unsplash.com/photo-1518131678677-a699bc968b77?auto=format&fit=crop&w=800&q=80",
        genres=["Fantasy", "Adventure"],
    ),
]
