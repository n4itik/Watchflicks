const searchForm = document.getElementById("search-form");
const movieInput = document.getElementById("movie-input");
const moviesList = document.querySelector(".movies-list");
const moviesPlaceholder = document.querySelector(".movies-placeholder");
const moviesPlaceholderContent = document.querySelector(
  ".movies-placeholder-content"
);

if (searchForm) {
  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    fetchMovies();
  });
}

function generateMovieHtml(movie) {
  return `
    <div class="movie" data-imdbid="${movie.imdbID}">
      <div class="movie-poster">
        <img src="${movie.poster}" alt="${
    movie.title
  }" onerror="this.onerror=null; this.src='images/no-poster.png';">
      </div>
      <div class="movie-info">
        <div class="movie-header">
          <h2>${movie.title}</h2>
          <p class="movie-rating">
            <i class="fa-solid fa-star"></i> ${movie.rating}
          </p>
        </div>
        <div class="movie-meta">
          <p>${movie.runtime}</p>
          <p>${movie.genre}</p>
          ${movie.addToWatchlistButton ? movie.addToWatchlistButton : ""}
          ${
            movie.removeFromWatchlistButton
              ? movie.removeFromWatchlistButton
              : ""
          }
        </div>
        <p class="movie-plot">${movie.plot}</p>
      </div>
    </div>`;
}

function fetchMovies() {
  moviesList.classList.add("hidden");
  moviesPlaceholder.classList.remove("hidden");
  moviesPlaceholderContent.innerHTML = `<i class="fa-solid fa-spinner fa-spin fa-2xl"></i>`;

  let imdbIDs = [];
  let movies = [];

  fetch(`https://www.omdbapi.com/?apikey=b1c5c8fa&s=${movieInput.value.trim()}`)
    .then((response) => response.json())
    .then((data) => {
      if (data.Response === "False") {
        throw new Error(
          "Unable to find what you're looking for. Please try another search."
        );
      }
      for (let item of data.Search) {
        imdbIDs.push(item.imdbID);
      }
      return Promise.all(
        imdbIDs.map((id) =>
          fetch(`https://www.omdbapi.com/?apikey=b1c5c8fa&i=${id}`)
            .then((response) => response.json())
            .then((data) => {
              let movie = {
                title: data.Title,
                rating: data.imdbRating,
                runtime: data.Runtime,
                genre: data.Genre,
                plot: data.Plot,
                poster: data.Poster,
                imdbID: data.imdbID,
              };
              return movie;
            })
        )
      );
    })
    .then((movieData) => {
      movies = movieData;
      renderMovies(movies);
      addWatchlistEventListeners();
    })
    .catch((error) => {
      moviesPlaceholderContent.innerHTML = `<p>${error.message}</p>`;
      moviesPlaceholder.classList.remove("hidden");
    });
}

function renderMovies(movies) {
  if (movies.length === 0) {
    moviesPlaceholderContent.innerHTML = `<p>Unable to find what you're looking for. Please try another search.</p>`;
    moviesPlaceholder.classList.remove("hidden");
    return;
  }
  const moviesHtml = movies
    .map((movie) =>
      generateMovieHtml({
        ...movie,
        addToWatchlistButton: `<button class="add-to-watchlist">
        <i class="fa-solid fa-circle-plus"></i> Watchlist
      </button>`,
      })
    )
    .join("");

  moviesList.classList.remove("hidden");
  moviesPlaceholder.classList.add("hidden");
  moviesList.innerHTML = moviesHtml;

  const watchlistButtons = document.querySelectorAll(".add-to-watchlist");
  watchlistButtons.forEach((button) => {
    button.addEventListener("click", addToWatchlist);
  });
}

function addToWatchlist(event) {
  const movieElement = event.target.closest(".movie");
  const imdbID = movieElement.dataset.imdbid;
  const watchlist = JSON.parse(localStorage.getItem("watchlist")) || [];
  const isMovieInWatchlist = watchlist.some((movie) => movie.imdbID === imdbID);

  if (!isMovieInWatchlist) {
    fetch(`https://www.omdbapi.com/?apikey=b1c5c8fa&i=${imdbID}`)
      .then((response) => response.json())
      .then((data) => {
        const movieData = {
          title: data.Title,
          rating: data.imdbRating,
          runtime: data.Runtime,
          genre: data.Genre,
          plot: data.Plot,
          poster: data.Poster,
          imdbID: data.imdbID,
        };

        watchlist.push(movieData);
        localStorage.setItem("watchlist", JSON.stringify(watchlist));
        renderWatchlist();
      })
      .catch((error) => {
        console.error(error);
      });
  }
}

function removeFromWatchlist(imdbID) {
  let watchlist = JSON.parse(localStorage.getItem("watchlist")) || [];
  watchlist = watchlist.filter((movie) => movie.imdbID !== imdbID);
  localStorage.setItem("watchlist", JSON.stringify(watchlist));
  renderWatchlist();
}

function renderWatchlist() {
  const watchlist = JSON.parse(localStorage.getItem("watchlist")) || [];
  const watchlistContainer = document.getElementById("watchlist");
  const placeholderContainer = document.querySelector(".movies-placeholder");

  if (watchlistContainer) {
    if (watchlist.length === 0) {
      watchlistContainer.classList.add("hidden");
      placeholderContainer.classList.remove("hidden");
    } else {
      watchlistContainer.classList.remove("hidden");
      placeholderContainer.classList.add("hidden");

      const watchlistHtml = watchlist
        .map((movie) =>
          generateMovieHtml({
            ...movie,
            removeFromWatchlistButton: `<button class="remove-from-watchlist">
          <i class="fa-solid fa-circle-minus"></i> Remove
        </button>`,
          })
        )
        .join("");

      watchlistContainer.innerHTML = watchlistHtml;

      const removeButtons = document.querySelectorAll(".remove-from-watchlist");
      removeButtons.forEach((button) => {
        button.addEventListener("click", (event) => {
          const movieElement = event.target.closest(".movie");
          const imdbID = movieElement.dataset.imdbid;
          removeFromWatchlist(imdbID);
        });
      });
    }
  }
}

function addWatchlistEventListeners() {
  const watchlistButtons = document.querySelectorAll(".add-to-watchlist");
  watchlistButtons.forEach((button) => {
    button.addEventListener("click", addToWatchlist);
  });
}

if (
  window.location.pathname.endsWith("movies") ||
  window.location.pathname.endsWith("movies.html")
) {
  renderWatchlist();
}
