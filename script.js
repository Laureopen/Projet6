document.addEventListener("DOMContentLoaded", async function () {
    const baseURL = "http://localhost:8000/api/v1/titles/";
    const featuredContainer = document.getElementById("featured-film-content");

    async function fetchBestFilm() {
        try {
            // 1. Récupérer le meilleur film (trié par score IMDB)
            const response = await fetch(baseURL + "?sort_by=-imdb_score&page_size=1");
            if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
            const data = await response.json();

            if (data.results.length === 0) {
                console.error("Aucun film trouvé !");
                return;
            }

            const bestFilm = data.results[0];

            // 2. Récupérer les détails complets du meilleur film
            const detailsResponse = await fetch(baseURL + bestFilm.id);
            if (!detailsResponse.ok) throw new Error(`Erreur HTTP: ${detailsResponse.status}`);
            const filmDetails = await detailsResponse.json();

            // 3. Ajouter le film dans la section "Meilleur film"
            featuredContainer.innerHTML = `
                <div class="featured-film">
                    <img src="${filmDetails.image_url || 'placeholder.jpg'}" alt="${filmDetails.title}">
                    <div class="film-info">
                        <h2>${filmDetails.title}</h2>
                        <p>${filmDetails.long_description || filmDetails.description || "Résumé non disponible"}</p>
                        <button class="details-btn" data-id="${filmDetails.id}">Détails</button>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error("Erreur lors de la récupération du meilleur film:", error);
        }
    }

    await fetchBestFilm();
});

document.addEventListener("DOMContentLoaded", async function () {
    const baseURL = "http://localhost:8000/api/v1/titles/";
    const containers = {
        featured: document.getElementById("featured-film-content"),
        topRated: document.getElementById("film-container"),
        category1: document.getElementById("category-1-content"),
        category2: document.getElementById("category-2-content")
    };

    const modal = document.getElementById("modal");
    const modalDetails = document.getElementById("modal-details");
    const closeModalBtn = document.getElementsByClassName("close-btn")[0];

    function fetchAndDisplayFilm(filmId, container, isFeatured = false) {
        fetch(baseURL + filmId)
            .then(response => response.json())
            .then(data => {
                const filmElement = document.createElement("div");
                filmElement.classList.add(isFeatured ? "featured-film" : "film");

                const localImages = {

                };

                const imageUrl = localImages[data.original_title] || data.image_url || "placeholder.jpg";

                filmElement.innerHTML = `
                    <img src="${imageUrl}" alt="${data.original_title}">
                    <div class="film-info">
                        <h2>${data.original_title}</h2>
                        <p>${data.description}</p>
                        <button class="details-btn" data-id="${data.id}">Détails</button>
                    </div>
                `;
                container.appendChild(filmElement);
            })
            .catch(error => console.error("Erreur lors de la récupération des données:", error));
    }

    async function displayModal(filmId) {
        try {
            const response = await fetch(baseURL + filmId);
            if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
            const data = await response.json();

            modalDetails.innerHTML = `
                <img src="${data.image_url || 'placeholder.jpg'}" alt="${data.original_title}">
                <h3>${data.original_title || 'Titre inconnu'}</h3>
                <p><strong>Genre :</strong> ${data.genres?.join(", ") || "Non disponible"}</p>
                <p><strong>Date de sortie :</strong> ${data.date_published || "Non disponible"}</p>
                <p><strong>Classification :</strong> ${data.rated || "Non classé"}</p>
                <p><strong>Score IMDB :</strong> ${data.imdb_score || "Non noté"}</p>
                <p><strong>Réalisateur :</strong> ${data.directors?.join(", ") || "Non disponible"}</p>
                <p><strong>Acteurs :</strong> ${data.actors?.join(", ") || "Non disponible"}</p>
                <p><strong>Durée :</strong> ${data.duration ? `${data.duration} minutes` : "Non disponible"}</p>
                <p><strong>Pays d'origine :</strong> ${data.countries?.join(", ") || "Non disponible"}</p>
                <p><strong>Recettes :</strong> ${data.worldwide_gross_income ? `${data.worldwide_gross_income} ${data.budget_currency || ''}` : "Non disponible"}</p>
                <p><strong>Résumé :</strong> ${data.long_description || data.description || "Résumé non disponible"}</p>
            `;
            modal.style.display = "block";
        } catch (error) {
            console.error("Erreur lors de l'affichage du film:", error);
        }
    }

    closeModalBtn.onclick = () => (modal.style.display = "none");
    window.onclick = event => { if (event.target === modal) modal.style.display = "none"; };

    document.addEventListener("click", event => {
        if (event.target.classList.contains("details-btn")) {
            displayModal(event.target.dataset.id);
        }
    });

    document.querySelectorAll(".see-more-btn").forEach(button => {
        button.addEventListener("click", function() {
            const category = this.dataset.category;
            categories[category]?.forEach(id => fetchAndDisplayFilm(id, containers[category]));
        });
    });

    fetchAndDisplayFilm(featuredFilmId, containers.featured, true);
    categories.topRated.forEach(id => fetchAndDisplayFilm(id, containers.topRated));
});



document.addEventListener("DOMContentLoaded", async function () {
    const baseURL = "http://localhost:8000/api/v1/titles/";
    const categories = {
        topRated: "?sort_by=-imdb_score&page_size=6",
        comedy: "?genre=comedy&sort_by=-imdb_score&page_size=6",
        western: "?genre=western&sort_by=-imdb_score&page_size=6"
    };

    const featuredContainer = document.getElementById("featured-film-content");
    const topRatedContainer = document.getElementById("film-container");
    const comedyContainer = document.getElementById("category-1-content");
    const westernContainer = document.getElementById("category-2-content");
    const modal = document.getElementById("modal");
    const modalDetails = document.getElementById("modal-details");
    const closeModalBtn = document.getElementsByClassName("close-btn")[0];

    async function fetchFilms(endpoint) {
        try {
            const response = await fetch(baseURL + endpoint);
            if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
            const data = await response.json();
            return data.results;
        } catch (error) {
            console.error("Erreur lors de la récupération des films:", error);
            return [];
        }
    }

    function displayFilm(film, container, isFeatured = false) {
        const filmElement = document.createElement("div");
        filmElement.classList.add(isFeatured ? "featured-film" : "film");

        const filmHTML = `
            <img src="${film.image_url || 'placeholder.jpg'}" alt="${film.title}">
            <div class="film-info">
                <h2>${film.title}</h2>
                <p>${film.description || "Description non disponible"}</p>
                <button class="details-btn" data-id="${film.id}">Détails</button>
            </div>
        `;

        filmElement.innerHTML = filmHTML;
        container.appendChild(filmElement);
    }

    async function displayModal(filmId) {
        try {
            const response = await fetch(baseURL + filmId);
            if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
            const data = await response.json();

            modalDetails.innerHTML = `
                <img src="${data.image_url || 'placeholder.jpg'}" alt="${data.title}">
                <h3>${data.title}</h3>
                <p><strong>Genre :</strong> ${data.genres?.join(", ") || "Non disponible"}</p>
                <p><strong>Date de sortie :</strong> ${data.date_published || "Non disponible"}</p>
                <p><strong>Score IMDB :</strong> ${data.imdb_score || "Non noté"}</p>
                <p><strong>Réalisateur :</strong> ${data.directors?.join(", ") || "Non disponible"}</p>
                <p><strong>Acteurs :</strong> ${data.actors?.join(", ") || "Non disponible"}</p>
                <p><strong>Durée :</strong> ${data.duration ? `${data.duration} minutes` : "Non disponible"}</p>
                <p><strong>Résumé :</strong> ${data.long_description || data.description || "Résumé non disponible"}</p>
            `;

            modal.style.display = "block";
        } catch (error) {
            console.error("Erreur lors de la récupération des détails du film:", error);
        }
    }

    closeModalBtn.onclick = function() {
        modal.style.display = "none";
    };

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    };

    document.addEventListener("click", function(event) {
        if (event.target.classList.contains("details-btn")) {
            const filmId = event.target.getAttribute("data-id");
            displayModal(filmId);
        }
    });

    const topRatedFilms = await fetchFilms(categories.topRated);
    topRatedFilms.forEach(film => displayFilm(film, topRatedContainer));

    const comedyFilms = await fetchFilms(categories.comedy);
    comedyFilms.forEach(film => displayFilm(film, comedyContainer));

    const westernFilms = await fetchFilms(categories.western);
    westernFilms.forEach(film => displayFilm(film, westernContainer));
});