document.addEventListener("DOMContentLoaded", async function () {
    const baseURL = "http://localhost:8000/api/v1/titles/";
    const featuredContainer = document.getElementById("featured-film-content");
    const categorySelect = document.getElementById("category-select");
    const selectedCategoryContainer = document.getElementById("selected-category-container");

    async function fetchBestFilm() {
        try {
            const response = await fetch(`${baseURL}?sort_by=-imdb_score&page_size=1`);
            if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
            const data = await response.json();
            if (data.results.length === 0) return;

            const bestFilm = data.results[0];
            const detailsResponse = await fetch(`${baseURL}${bestFilm.id}`);
            if (!detailsResponse.ok) throw new Error(`Erreur HTTP: ${detailsResponse.status}`);
            const filmDetails = await detailsResponse.json();

            featuredContainer.innerHTML = `
                <div class="featured-film">
                    <img src="${filmDetails.image_url || 'placeholder.jpg'}" alt="${filmDetails.title}" onerror="handleImageError(this)">
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

    categorySelect.addEventListener("change", async function (event) {
        const selectedCategory = event.target.value;
        if (selectedCategory === "all") {
            selectedCategoryContainer.innerHTML = "<p>Veuillez choisir une catégorie</p>";
            return;
        }
        try {
            const films = await fetchFilms(selectedCategory, 6); // Récupère les films selon la catégorie sélectionnée
            displayFilms(films, selectedCategoryContainer); // Affiche les films dans le conteneur
        } catch (error) {
            console.error("Erreur lors de la récupération des films:", error);
        }
    });

    await fetchBestFilm();
    fetchCategories();

    const categories = {
        topRated: { container: document.getElementById("film-container"), genre: "", limit: 6, expanded: false },
        animation: { container: document.getElementById("category-1-content"), genre: "animation", limit: 6, expanded: false },
        western: { container: document.getElementById("category-2-content"), genre: "western", limit: 6, expanded: false }
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

    function displayFilms(films, container, categoryKey) {
        if (!container) return;
        container.innerHTML = "";

        films.forEach((film, index) => {
            const filmElement = document.createElement("div");
            filmElement.classList.add("film");
            filmElement.style.display = index < getVisibleCount() ? "block" : "none"; // Films cachés si besoin
            filmElement.innerHTML = `
                <img src="${film.image_url || 'images/placeholder.png'}" alt="${film.title}" onerror="handleImageError(this)">
                <div class="film-info">
                    <h2>${film.title}</h2>
                    <p>${film.description || "Description non disponible"}</p>
                    <button class="details-btn" data-id="${film.id}">Détails</button>
                </div>
            `;
            container.appendChild(filmElement);
        });
		if (window.innerWidth <= 800) {
			createToggleButton(container, categoryKey); // crée le bouton "voir +" si pas version mobile ou tablette
		}
    }

    function createToggleButton(container, categoryKey) {
        let button = document.getElementById(`see-more-${categoryKey}`);
        if (!button && (categoryKey != null)) {
            button = document.createElement("button");
            button.id = `see-more-${categoryKey}`;
            button.classList.add("see-more-btn");
            container.parentElement.appendChild(button);
            button.addEventListener("click", () => toggleMore(categoryKey));
        }
        updateButtonText(categoryKey, button);
    }

    function updateButtonText(categoryKey, button) {
        const category = categories[categoryKey];
        button.innerHTML = category.expanded ? "Réduire" : "Voir plus";
    }

    async function loadCategory(categoryKey) {
        const category = categories[categoryKey];
        if (!category.container) return;

        const films = await fetchFilms(category.genre, category.limit);
        displayFilms(films, category.container, categoryKey);
    }

    function getVisibleCount() {
        if (window.innerWidth <= 500) return 2; // Mobile : 2 films visibles
        if (window.innerWidth <= 800) return 4; // Tablette : 4 films visibles
        return 6; // PC : 6 films visibles par défaut
    }



    function toggleMore(categoryKey) {
        const category = categories[categoryKey];
        const films = category.container.querySelectorAll(".film");
        category.expanded = !category.expanded;
        const visibleCount = getVisibleCount();

        films.forEach((film, index) => {
            film.style.display = index < visibleCount || category.expanded ? "block" : "none";
        });

        updateButtonText(categoryKey, document.getElementById(`see-more-${categoryKey}`));
    }

    // Chargement des films au démarrage
    await Promise.all(Object.keys(categories).map(loadCategory));

	window.addEventListener("resize", () => {
		// Vérifie si la largeur de la fenêtre est inférieure ou égale à 800px
		const isMobileOrTablet = window.innerWidth <= 800;

		Object.keys(categories).forEach(categoryKey => {
			const category = categories[categoryKey];
			if (!category.container) return;

			const films = category.container.querySelectorAll(".film");
			const visibleCount = getVisibleCount();

			// Ajuste la visibilité des films en fonction de la taille de la fenêtre
			films.forEach((film, index) => {
				film.style.display = index < visibleCount || category.expanded ? "block" : "none";
			});

			if (!isMobileOrTablet) {
				// Masque tous les boutons "Voir plus" pour les écrans mobiles ou tablettes
				const button = document.getElementById(`see-more-${categoryKey}`);
				if (button) button.style.display = "none";
			} else {
				// Affiche les boutons "Voir plus" pour les écrans plus grands
				const button = document.getElementById(`see-more-${categoryKey}`);
				if (button) button.style.display = "block";
			}
		});
	});



    document.addEventListener("click", event => {
        if (event.target.classList.contains("details-btn")) {
            displayModal(event.target.dataset.id);
        }
    });

    async function displayModal(filmId) {
        try {
            const response = await fetch(`${baseURL}${filmId}`);
            if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
            const data = await response.json();

            const modal = document.getElementById("modal");
            const modalDetails = document.getElementById("modal-details");
            modalDetails.innerHTML = `
                <img src="${data.image_url || 'images/placeholder.png'}" alt="${data.original_title || 'Titre inconnu'}" onerror="handleImageError(this)">
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

    document.getElementsByClassName("close-btn")[0].onclick = () => {
        document.getElementById("modal").style.display = "none";
    };
    window.onclick = event => {
        if (event.target === document.getElementById("modal")) {
            document.getElementById("modal").style.display = "none";
        }
    };
});

function handleImageError(image) {
    image.onerror = null;
    image.src = 'front-end/images/clac de cinéma.jpg';
}
