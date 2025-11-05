const axios = require('axios');
const config = require('./config.json');

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
        `);
    }else if (command === 'search') {
        searchMovies(query);
    } else if (command === 'info') {
        getMovieDetails(query);
    }};

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

    console.log(`
        🎬 ${movie.title.toUpperCase()} (${movie.year})
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

run();