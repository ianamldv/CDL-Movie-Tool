const axios = require('axios');
const config = require('./config.json');

const fs = require('fs');
const FAVORITES_FILE = './favourite.json';

/*
This funtion runs the CDL Movie Tool
Usages: 
    *node index.js search "Cars" -> shows all movies found with this input
    *node index.js info "The Vampire Diaries" -> for detailed information about movie
    *node index.js info tt1375666 -> for detailed information about movie by IMDB Code
*/
async function run() {
    const args  = process.argv.slice(2);
    const command = args[0];
    const query = args.slice(1).join();

    if (!command || !query) {
    console.log(`
        Provide an input:
        node index.js search "Cars" -> shows all movies found with this input
        node index.js info "The Vampire Diaries" -> for detailed information about movie
        node index.js info tt1375666 -> for detailed information about movie by IMDB Code
        node index.js add "Inception" -> adds a movie to favourites file by name
        node index.js add tt1375666 -> adds a movie to favourites file by IMDB Code
        node index.js info "Inception" -> checks if a movie is in favourites by name or id
        `);
    }else if (command === 'search') {
        await searchMovies(query);
    } else if (command === 'info') {
        await getMovieDetails(query);
    } else if (command === 'add') {
        await addToFavourite(query);
    } else if (command ==='remove') {
        await removeFromFavorites(query);
    } else if (command === 'info') {
        await isFavorite (query);
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
async function searchMovies(name) {
    const url = `${config.baseUrl}?apikey=${config.apiKey}&s=${encodeURIComponent(name)}`;
    
    try {
    const response = await axios.get(url);
    const movie = response.data;

    if (response === 'False') {
        console.log('An input should be provided');
    }

    console.log(`Result for movies with the name: ${name}`)
    movie.Search.forEach((movie, i) => {
        console.log(`${i + 1}. ${movie.Title}`);
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
        isID? movie.isID === identifier : movie.title.toLowerCase() === identifier.toLowerCase()
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

run();


