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
        topRated: { container: document.getElementById("film-container"), genre: "", limit: 6, expanded: false, films: [] },
        animation: { container: document.getElementById("category-1-content"), genre: "animation", limit: 6, expanded: false, films: [] },
        western: { container: document.getElementById("category-2-content"), genre: "western", limit: 6, expanded: false, films: [] }
    };

    async function fetchFilms(genre, limit) {
        let url = `${baseURL}?sort_by=-imdb_score&page_size=${limit}`;
        if (genre) url += `&genre=${genre}`;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
            const data = await response.json();
            return data.results || [];
        } catch (error) {
            console.error("Erreur lors de la récupération des films:", error);
            return [];
        }
    }

    function displayFilms(films, container) {
        if (!container) return;
        container.innerHTML = ""; // ✅ Supprime les films existants pour éviter la duplication

        films.forEach(film => {
            const filmElement = document.createElement("div");
            filmElement.classList.add("film");
            filmElement.innerHTML = `
                <img src="${film.image_url || 'placeholder.jpg'}" alt="${film.title}">
                <div class="film-info">
                    <h2>${film.title}</h2>
                    <p>${film.description || "Description non disponible"}</p>
                    <button class="details-btn" data-id="${film.id}">Détails</button>
                </div>
            `;
            container.appendChild(filmElement);
        });
    }

    async function loadCategory(categoryKey) {
        const category = categories[categoryKey];
        if (!category.container) return;

        category.films = await fetchFilms(category.genre, category.limit);
        displayFilms(category.films, category.container);
    }

    async function toggleMore(categoryKey) {
        const category = categories[categoryKey];
        const button = document.getElementById(`see-more-${categoryKey}`);

        if (!category.container || !button) return;

        category.expanded = !category.expanded;
        category.limit = category.expanded ? 12 : 6;
        button.innerHTML = category.expanded ? "Réduire " : "Voir plus ";

        await loadCategory(categoryKey); //  Recharge sans dupliquer
    }

    // Charger les films initiaux
    await Promise.all(Object.keys(categories).map(loadCategory));

    // Ajouter les boutons "Voir plus"
    Object.keys(categories).forEach(categoryKey => {
        const category = categories[categoryKey];
        if (!category.container) return;

        const button = document.createElement("button");
        button.id = `see-more-${categoryKey}`;
        button.innerHTML = "Voir plus ";
        button.classList.add("see-more-btn");
        category.container.parentElement.appendChild(button);
        button.addEventListener("click", () => toggleMore(categoryKey));
    });
});

document.addEventListener("DOMContentLoaded", async function () {
    const baseURL = "http://localhost:8000/api/v1/titles/";
    const categorySelect = document.getElementById("category-select");
    const selectedCategoryContainer = document.getElementById("selected-category-container");
    const modal = document.getElementById("modal");
    const modalDetails = document.getElementById("modal-details");
    const closeModalBtn = document.querySelector(".close-btn");

    async function fetchCategories() {
        try {
            const response = await fetch(baseURL + "?sort_by=-imdb_score&page_size=50");
            const data = await response.json();

            let categories = new Set();
            data.results.forEach(movie => {
                movie.genres.forEach(genre => categories.add(genre));
            });

            populateCategoryDropdown(Array.from(categories));
        } catch (error) {
            console.error("Erreur lors de la récupération des catégories:", error);
        }
    }

    function populateCategoryDropdown(categories) {
        categorySelect.innerHTML = '<option value="all">Toutes les catégories</option>';

        categories.forEach(category => {
            let option = document.createElement("option");
            option.value = category.toLowerCase();
            option.textContent = category;
            categorySelect.appendChild(option);
        });
    }

    async function displaySelectedCategory(categoryName) {
        if (categoryName === "all") {
            selectedCategoryContainer.innerHTML = "<p>Veuillez choisir une catégorie</p>";
            return;
        }

        try {
            const response = await fetch(`${baseURL}?genre=${categoryName}&sort_by=-imdb_score&page_size=6`);
            const data = await response.json();

            if (data.results.length === 0) {
                selectedCategoryContainer.innerHTML = `<p>Aucun film trouvé pour ${categoryName}</p>`;
                return;
            }

            selectedCategoryContainer.innerHTML = `
                <h3>Films de la catégorie : ${categoryName}</h3>
                <div class="movies-list">
                    ${data.results.map(movie => `
                        <div class="movie-card" data-id="${movie.id}">
                            <img src="${movie.image_url || 'placeholder.jpg'}" alt="${movie.title}" />
                            <h4>${movie.title}</h4>
                        </div>
                    `).join('')}
                </div>
            `;

            // Ajouter un écouteur d'événements pour afficher les détails du film
            document.querySelectorAll(".movie-card").forEach(card => {
                card.addEventListener("click", () => displayModal(card.dataset.id));
            });

        } catch (error) {
            console.error("Erreur lors de l'affichage des films de la catégorie:", error);
        }
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

    categorySelect.addEventListener("change", (event) => {
        const selectedCategory = event.target.value;
        displaySelectedCategory(selectedCategory);
    });

    await fetchCategories();
});






























































document.addEventListener("DOMContentLoaded", async function () {
    const baseURL = "http://localhost:8000/api/v1/titles/";
    const featuredContainer = document.getElementById("featured-film-content");

    async function fetchBestFilm() {
        try {
            const response = await fetch(baseURL + "?sort_by=-imdb_score&page_size=1");
            if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
            const data = await response.json();

            if (data.results.length === 0) {
                console.error("Aucun film trouvé !");
                return;
            }

            const bestFilm = data.results[0];
            const detailsResponse = await fetch(baseURL + bestFilm.id);
            if (!detailsResponse.ok) throw new Error(`Erreur HTTP: ${detailsResponse.status}`);
            const filmDetails = await detailsResponse.json();

            featuredContainer.innerHTML = `
                <div class="featured-film">
                    <img src="placeholder.jpg" data-src="${filmDetails.image_url}" class="lazy-load" alt="${filmDetails.title}">
                    <div class="film-info">
                        <h2>${filmDetails.title}</h2>
                        <p>${filmDetails.long_description || filmDetails.description || "Résumé non disponible"}</p>
                        <button class="details-btn" data-id="${filmDetails.id}">Détails</button>
                    </div>
                </div>
            `;

            lazyLoadImages(); // Appelle la fonction pour charger les images progressivement
        } catch (error) {
            console.error("Erreur lors de la récupération du meilleur film:", error);
        }
    }

    function lazyLoadImages() {
        const images = document.querySelectorAll("img.lazy-load");
        images.forEach(img => {
            img.src = img.dataset.src; // Charge l’image réelle après que le DOM est prêt
        });
    }

    await fetchBestFilm();
});


















































