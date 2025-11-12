const axios = require('axios');
const config = require('./config.json');

const fs = require('fs');
const FAVORITES_FILE = './favourite.json';


// This funtion runs the CDL Movie Tool
async function run() {
    const args  = process.argv.slice(2);
    const command = args[0];
    const searchTerm = args[1];
    const query = args.slice(1).join();

    const typeIndex = args.indexOf('--type');
    const yearIndex = args.indexOf('--year');

    const type = typeIndex !== -1 ? args[typeIndex + 1] : null;
    const year = yearIndex !== -1 ? args[yearIndex + 1] : null;


    if (!command) {
    console.log(`
        Provide an input:
        node index.js search "Cars" -> shows all movies found with this input
        node index.js info "The Vampire Diaries" -> for detailed information about movie
        node index.js info tt1375666 -> for detailed information about movie by IMDB Code
        node index.js add "Inception" -> adds a movie to favourites file by name
        node index.js add tt1375666 -> adds a movie to favourites file by IMDB Code
        node index.js info "Inception" -> checks if a movie is in favourites by name or id
        node index.js remove "Inception" -> removes a movie from favourites by name or id
        node index.js list favorites-> shows all favourites movies
        node index.js top -> shows top 5 favourites movies by rating
        node index.js stats -> shows statistics about favourite movies
        node index.js export -> exports favourite movies to a CSV file
        node index.js compare "Inception" "The Dark Knight" -> compares two movies by name or id
        node index.js random -> shows a random movie from favourites
        `);
    }else if (command === 'search') {
        if (!searchTerm) {
            console.log('Please provide a search term');
            return;
        }
        await searchMovies(searchTerm, type, year);
    } else if (command === 'info') {
        if (!query) {
            console.log('Please provide a movie name or IMDB ID');
            return;
        }
        await getMovieDetails(query);
    } else if (command === 'add') {
        if (!query) {
            console.log('Please provide a movie name or IMDB ID to add to favourites');
            return;
        }
        await addToFavourite(query);
    } else if (command ==='remove') {
        if (!query) {
            console.log('Please provide a movie name or IMDB ID to remove from favourites');
            return;
        }
        await removeFromFavorites(query);
    } else if (command === 'list_favorites') {
        await showfavorites();
    } else if (command === 'top') {
        await showTopFavorites();
    } else if (command === 'stats') {
        await favouriteStatistics();
    } else if (command === 'export') {
        const filename = args[1] || 'favorites.csv';
        await exportFavoritesToCSV(filename);
    } else if (command === 'compare') {
        if (args.length < 3) {
            console.log('Please provide two movie names or IMDB IDs to compare');
            return;
        }
        const movie1 = args[1];
        const movie2 = args[2];
        await compareMovies(movie1, movie2);
    } else if (command === 'random') {
        await randomFavoriteMovie();
    }
};

//use this to see how the data from API looks
async function seeData(name) {
    const url = `${config.baseUrl}?apikey=${config.apiKey}&i=${encodeURIComponent(name)}`;
    const response = await axios.get(url);
    const data = response.data;

    console.log(data);
}

//this fetches the data from API
async function fetchMovieData(query) {
    const isID = query.startsWith('tt');
    const param = isID? `i=${encodeURIComponent(query)}` : `t=${encodeURIComponent(query)}`;
    const url = `${config.baseUrl}?apikey=${config.apiKey}&${param}`;

    try {
    const response = await axios.get(url);
    const data = response.data;

    if (data.Response === 'False') {
        return null;
    }

    return{
        title: data.Title,
        id: data.imdbID,
        year: data.Year,
        runtime: data.Runtime,
        genre: data.Genre,
        director: data.Director,
        actors: data.Actors,
        country: data.Country,
        plot: data.Plot,
        awards: data.Awards,
        poster: data.Poster,
        rating: data.imdbRating
    }

  } catch (error) {
    console.log(`SMTG is wrong: ${error}`);;
  }};

//show list of movies with the input name
async function searchMovies(name, type=null, year=null) {
    let url = `${config.baseUrl}?apikey=${config.apiKey}&s=${encodeURIComponent(name)}`;
    if (type) url += `&type=${encodeURIComponent(type)}`;
    if (year) url += `&y=${encodeURIComponent(year)}`;


    try {
    const response = await axios.get(url);
    const data = response.data;

    if (data.Response === 'False') {
        console.log('No results found');
        return;
    }

    console.log(`Result for movies with the name: ${name} ${type? type : " "} ${year? year : " "}`);
    data.Search.forEach((movie, i) => {
        console.log(`${i + 1}. ${movie.Title} ${movie.Type} ${movie.Year}`);
    })

    } catch (error) {
        console.log(`SMTG is wrong : ${error}`)
    }    
};

//show info about the given movie name or IMDB ID
async function getMovieDetails(idOrTitle) {
    const movie = await fetchMovieData(idOrTitle);
    if (!movie) return;

    const shortPlot = movie.plot.length > 100 
        ? movie.plot.slice(0, 100) + "..."
        : movie.plot

    const favoriteTitle = await isFavorite(movie.id);
    const favoriteStar = favoriteTitle ? '⭐' : '';

    console.log(`
        🎬 ${favoriteStar} ${movie.title.toUpperCase()} (${movie.year})
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

        🎭 Director: ${movie.director}
        ⭐ Rating: ${movie.rating}/10 (IMDB)
        ⏱️  Runtime: ${movie.runtime}
        🎪 Genre: ${movie.genre}
        👥 Cast:
            ${movie.actors}
        
        📖 Plot: 
            ${shortPlot}

        🖼️  Poster: ${movie.poster}
        `)
};


//check that the file exist
if (!fs.existsSync(FAVORITES_FILE)) {
  fs.writeFileSync(FAVORITES_FILE, JSON.stringify({ movies: [] }, null, 2));
}

//loads the info from the favourites file
async function loadFavourites() {
    if (!fs.existsSync(FAVORITES_FILE)) {
        fs.writeFileSync(FAVORITES_FILE, JSON.stringify({ movies: [] }, null, 2));
    }

    const data = fs.readFileSync(FAVORITES_FILE, 'utf8');
    const favorites = JSON.parse(data);

    if (!favorites.movies) {
        favorites.movies = [];
    }
    
    return favorites;
}

//saves the info to the favourites file
async function saveFavourites(favorites) {
    fs.writeFileSync(FAVORITES_FILE, JSON.stringify(favorites, null, 2));
}

//adds a movie to the favourites file
async function addToFavourite(query) {

    const favorites = await loadFavourites();

    const movie = await fetchMovieData(query);
    if (!movie) {
        console.log('Movie not found!');
        return;
    }

    const movieExists = favorites.movies.some(
        m => m.id === movie.id || m.title === movie.title 
    );

    if (movieExists) {
        console.log(`${movie.title} already exists in favourites`);
        return;
    }

    favorites.movies.push({
        id: movie.id,
        title: movie.title,
        year: movie.year,
        rating: movie.rating,
        genre: movie.genre,
        director: movie.director,
        addedAt: new Date().toISOString()
    });
    saveFavourites(favorites);

    console.log(`${movie.title} was succesfuly added to favourites`);
};

//removes a movie from favourites by name or id
async function removeFromFavorites(identifier) {
    const favorites = await loadFavourites();

    const isID = identifier.startsWith('tt');
    const index = favorites.movies.findIndex(movie => 
        isID? movie.id === identifier : movie.title.toLowerCase() === identifier.toLowerCase()
    );

    if (index === -1) {
        console.log(`Movie with ID ${identifier} not found in favourites.`);
        return;
    }

    const removed = favorites.movies.splice(index, 1)[0];
    saveFavourites(favorites);

    console.log(`${removed.title} was removed from favourites.`);
};

//checks if a movie is in favourites by name or id
async function isFavorite(identifier) {
    const favorites = await loadFavourites();

    const isID = identifier.startsWith('tt');
    const movie = favorites.movies.find(movie => 
        isID? movie.id === identifier : movie.title.toLowerCase() === identifier.toLowerCase()
    );

    return movie ? movie.title : null;
};

//shows all favourite movies
async function showfavorites() {
    const favorites = await loadFavourites();

    if (favorites.movies.length === 0) {
        console.log('No favorite movies yet');
        return;
    }
    console.log('⭐ Your Favorite Movies:');
    favorites.movies.forEach((movie, i) => {
        console.log(`${i + 1}. ${movie.title} (${movie.year}) - Rating: ${movie.rating}/10`);
    }); 
}

//shows top 5 favourite movies by rating
async function showTopFavorites() {
    const favorites = await loadFavourites();

    if (favorites.movies.length === 0) {
        console.log('No favorite movies yet');
        return;
    }
    const sortedMovies = favorites.movies.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
    const topMovies = sortedMovies.slice(0, 5);

    console.log('⭐ Your Top 5 Favorite Movies:');
    topMovies.forEach((movie, i) => {
        console.log(`${i + 1}. ${movie.title} (${movie.year}) - Rating: ${movie.rating}/10`);
    });
}

//shows statistics about favourite movies
async function favouriteStatistics() {
    const favorites = await loadFavourites();

    if (favorites.movies.length === 0) {
        console.log('No favorite movies yet');
        return;
    }

    const totalMovies = favorites.movies.length;
    const averageRating = (favorites.movies.reduce((sum, movie) => sum + parseFloat(movie.rating), 0) / totalMovies).toFixed(2);

    const genreCounts = {};
    favorites.movies.forEach(movie => {
    if (!movie.genre) return;
    movie.genre.split(',').map(g => g.trim()).forEach(g => {
        genreCounts[g] = (genreCounts[g] || 0) + 1;
    });
    });

    let mostCommonGenre = null;
    let maxCount = 0;
    for (const [genre, count] of Object.entries(genreCounts)) {
        if (count > maxCount) {
            mostCommonGenre = genre;
            maxCount = count;
        }
    }

    const directorCounts = {};
    favorites.movies.forEach(movie => {
        if (!movie.director) return;
        movie.director.split(',').map(d => d.trim()).forEach(d => {
            directorCounts[d] = (directorCounts[d] || 0) + 1;
        });
    });

    let topDirector = null;
    let maxDirectorCount = 0;
    for (const [director, count] of Object.entries(directorCounts)) {
        if (count > maxDirectorCount) {
            topDirector = director;
            maxDirectorCount = count;
        }
    }

    console.log(`    📊 Favorite Movies Statistics: 
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    Total Movies: ${totalMovies}
    Average Rating: ${averageRating}/10
    Most Common Genre: ${mostCommonGenre} (${maxCount} movies)
    Top Director: ${topDirector} (${maxDirectorCount} movies)
    `);
};

//exports favourite movies to a CSV file
async function exportFavoritesToCSV(filename) {
    const favorites = await loadFavourites();

    if (favorites.movies.length === 0) {
        console.log('No favorite movies yet');
        return;
    }

    const header = 'Title,Year,Rating,Genre,Director,AddedAt\n';
    const rows = favorites.movies.map(movie => {
        const title = movie.title ? movie.title.replace(/"/g, '""') : '';
        const year = movie.year || '';
        const rating = movie.rating || '';
        const genre = movie.genre ? movie.genre.replace(/"/g, '""') : '';
        const director = movie.director ? movie.director.replace(/"/g, '""') : '';
        const addedAt = movie.addedAt || '';
        return `"${title}",${year},${rating},"${genre}","${director}",${addedAt}`;
    }).join('\n');

    const csvContent = header + rows;
    fs.writeFileSync(filename, csvContent);

    console.log(`Favorites exported to ${filename}`);
};

//compares side by side two movies by name or id
async function compareMovies(idOrTitle1, idOrTitle2) {
    const movie1 = await fetchMovieData(idOrTitle1);
    const movie2 = await fetchMovieData(idOrTitle2);

    if (!movie1 || !movie2) {
        console.log('One or both movies not found!');
        return;
    }

    console.log(`
        🎬 Comparing Movies side by side:
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        ${movie1.title.toUpperCase()} (${movie1.year}) vs ${movie2.title.toUpperCase()} (${movie2.year})
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

        🎭 Director: ${movie1.director} vs ${movie2.director}
        ⭐ Rating: ${movie1.rating}/10 vs ${movie2.rating}/10 (IMDB)
        ⏱️  Runtime: ${movie1.runtime} vs ${movie2.runtime}
        🎪 Genre: ${movie1.genre} vs ${movie2.genre}

    `);
};

//shows a random movie from favourites
async function randomFavoriteMovie() {
    const favorites = await loadFavourites();

    if (favorites.movies.length === 0) {
        console.log('No favorite movies yet');
        return;
    }

    const randomIndex = Math.floor(Math.random() * favorites.movies.length);
    const randomMovie = favorites.movies[randomIndex];

    console.log(`🎲 Random Favorite Movie: ${randomMovie.title} (${randomMovie.year}) - Rating: ${randomMovie.rating}/10`);
}

run();


