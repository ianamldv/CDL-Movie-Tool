# CDL-Movie-Tool
 
# CDL Movie CLI Tool 🎬

A simple command-line tool to search, manage, and analyze your favorite movies using the OMDB API.

---

## Features

- Search movies by name, type, or year.
- View detailed information about a movie by title or IMDB ID.
- Add or remove movies from your favorites.
- List all favorite movies.
- Show top 5 favorite movies by rating.
- Display statistics about favorite movies (most common genre, top director, average rating, etc.).
- Export favorite movies to a CSV file.
- Compare two movies side by side.
- Show a random movie from your favorites.

---

## Installation

1. Clone this repository:

```bash
git clone <repository_url>
cd <repository_folder>
```
2. Install dependencies:

```bash
npm install
```

3. Initialize the favorites file

Make sure your favourites.json file exists and has the following structure:

```json
{
    "movies" : []
}
```

## Camands to use

to see all the commands:

```bash
node index.js
``` 

shows all movies found with this input:

```bash
node index.js search "Cars" 
```

for detailed information about movie:

```bash
node index.js info "The Vampire Diaries"
```

for detailed information about movie by IMDB Code:

```bash
node index.js info tt1375666 
```

adds a movie to favourites file by name:

```bash
node index.js add "Inception"
```

adds a movie to favourites file by IMDB Code:

```bash
node index.js add tt1375666
```

checks if a movie is in favourites by name or id:

```bash
node index.js info "Inception"
```

removes a movie from favourites by name or id:

```bash
node index.js remove "Inception"
```

shows all favourites movies:

```bash
node index.js list favorites
```

shows top 5 favourites movies by rating:

```bash
node index.js top
```

shows statistics about favourite movies:

```bash
node index.js stats
```

exports favourite movies to a CSV file:

```bash
node index.js export "your_filename.csv"
or
node index.js export "favourites.csv"
```

compares two movies by name or id:

```bash
node index.js compare "Inception" "The Dark Knight"
```

shows a random movie from favourites:

```bash
node index.js random
```
 