/** Default placeholder image for missing thumbnails (base64 encoded) */
const FALLBACK_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iIzJBMkEyQSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjY2IiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCI+Tm8gUHJldmlldzwvdGV4dD48L3N2Zz4=';

/** Animation delay for card transitions in milliseconds */
const FILTER_TRANSITION_DELAY = 300;

/** Number of columns for masonry grid */
const GRID_COLUMN_COUNT = 4;

/** Duration for copy feedback notification in milliseconds */
const COPY_NOTIFICATION_DURATION = 1000;

/** URL separator for categories (pipe doesn't get encoded) */
const URL_CATEGORY_SEPARATOR = '|';

document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.querySelector('[data-material-grid]');
    const searchInput = document.querySelector('[data-search]');
    const categoriesContainer = document.querySelector('[data-categories]');
    const loadingSpinner = document.querySelector('[data-loading]');
    const clearFiltersButton = document.querySelector('[data-clear-filters]');
    const resultCountEl = document.querySelector('[data-result-count]');
    
    let materialLibrary = [];

    /**
     * Shows or hides the loading spinner
     * @param {boolean} show - Whether to show the spinner
     */
    function setLoading(show) {
        loadingSpinner.style.display = show ? 'flex' : 'none';
        grid.style.display = show ? 'none' : 'block';
    }

    /**
     * Updates the result count display
     * @param {number} count - Number of materials shown
     * @param {number} total - Total number of materials
     */
    function updateResultCount(count, total) {
        if (count === total) {
            resultCountEl.innerHTML = `Showing <span>${count}</span> snippets`;
        } else {
            resultCountEl.innerHTML = `Showing <span>${count}</span> of <span>${total}</span> snippets`;
        }
    }

    /**
     * Reads URL parameters and returns filter state
     * @returns {{search: string, categories: string[]}} Filter state from URL
     */
    function getFiltersFromURL() {
        const params = new URLSearchParams(window.location.search);
        const search = params.get('q') || '';
        const categories = params.get('categories') ? params.get('categories').split(URL_CATEGORY_SEPARATOR) : [];
        return { search, categories };
    }

    /**
     * Updates the URL with current filter state
     * @param {string} search - Current search term
     * @param {string[]} categories - Currently selected categories
     */
    function updateURL(search, categories) {
        const params = new URLSearchParams();
        if (search) params.set('q', search);
        if (categories.length > 0) params.set('categories', categories.join(URL_CATEGORY_SEPARATOR));
        
        const newURL = params.toString() 
            ? `${window.location.pathname}?${params.toString()}`
            : window.location.pathname;
        
        window.history.replaceState({}, '', newURL);
    }

    /**
     * Updates the visibility of the clear filters button
     */
    function updateClearFiltersVisibility() {
        const hasActiveFilters = document.querySelectorAll('.category-button.active').length > 0;
        const hasSearchText = searchInput.value.trim().length > 0;
        clearFiltersButton.style.display = (hasActiveFilters || hasSearchText) ? 'inline-block' : 'none';
    }

    /**
     * Clears all active filters and search text
     */
    function clearAllFilters() {
        document.querySelectorAll('.category-button.active').forEach(btn => btn.classList.remove('active'));
        searchInput.value = '';
        updateClearFiltersVisibility();
        filterMaterials();
    }

    /**
     * Shows a copy notification at the given position
     * @param {DOMRect} rect - Bounding rectangle for positioning
     */
    function showCopyNotification(rect) {
        const notification = document.createElement('div');
        notification.className = 'copy-notification';
        notification.textContent = 'Copied!';
        notification.style.left = `${rect.left + rect.width / 2}px`;
        notification.style.top = `${rect.top}px`;
        
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), COPY_NOTIFICATION_DURATION);
    }

    setLoading(true);

    try {
        const response = await fetch('materials.json');
        const data = await response.json();
        materialLibrary = data.materials;
        
        const categories = [...new Set(materialLibrary.flatMap(m => m.categories))].sort();
        
        categoriesContainer.innerHTML = categories.map(category => `
            <button class="category-button" data-category="${category}">
                ${category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
        `).join('');

        const categoryButtons = categoriesContainer.querySelectorAll('.category-button');
        categoryButtons.forEach(button => {
            button.addEventListener('click', () => {
                button.classList.toggle('active');
                updateClearFiltersVisibility();
                filterMaterials();
            });
        });

        clearFiltersButton.addEventListener('click', clearAllFilters);

        const urlFilters = getFiltersFromURL();
        if (urlFilters.search) {
            searchInput.value = urlFilters.search;
        }
        if (urlFilters.categories.length > 0) {
            urlFilters.categories.forEach(cat => {
                const btn = categoriesContainer.querySelector(`[data-category="${cat}"]`);
                if (btn) btn.classList.add('active');
            });
        }
        updateClearFiltersVisibility();

        setLoading(false);
    } catch (error) {
        console.error('Error loading materials:', error);
        setLoading(false);
        grid.innerHTML = '<p class="error-message">Error loading materials library.</p>';
        return;
    }

    /**
     * Renders the material cards to the grid
     * @param {Array} materials - Array of material objects to render
     */
    function renderMaterials(materials) {
        grid.innerHTML = materials.map(material => `
            <div class="material-card show" data-material="${material.name.toLowerCase().replace(/\s+/g, '-')}" tabindex="0" role="button" aria-label="Copy ${material.name} snippet">
                <img class="material-preview" src="${material.preview}" alt="Preview of ${material.name} material effect" onerror="this.src='${FALLBACK_IMAGE}'">
                <div class="material-info">
                    <h3>${material.name}</h3>
                    <p class="author">${material.author}</p>
                    <p>${material.description}</p>
                    <div class="material-tags">
                        ${material.categories.map(cat => `<span class="tag" data-tag="${cat}" tabindex="0" role="button" aria-label="Filter by ${cat}">${cat}</span>`).join(' ')}
                    </div>
                </div>
            </div>
        `).join('');

        const tags = document.querySelectorAll('.tag');
        tags.forEach(tag => {
            /**
             * Handles tag click to activate category filter
             * @param {Event} e - Click or keydown event
             */
            const handleTagActivation = (e) => {
                if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
                e.preventDefault();
                e.stopPropagation();
                const category = tag.dataset.tag;
                const categoryButton = [...document.querySelectorAll('.category-button')]
                    .find(button => button.dataset.category === category);
                if (categoryButton) {
                    categoryButton.classList.add('active');
                    updateClearFiltersVisibility();
                    filterMaterials();
                }
            };
            tag.addEventListener('click', handleTagActivation);
            tag.addEventListener('keydown', handleTagActivation);
        });

        reSortMasonry();
    }

    /**
     * Loads a snippet file from the given path
     * @param {string} snippetPath - Path to the snippet file
     * @returns {Promise<string>} The snippet content
     */
    async function loadSnippet(snippetPath) {
        try {
            const response = await fetch(snippetPath);
            return await response.text();
        } catch (error) {
            console.error('Error loading snippet:', error);
            return '';
        }
    }

    /**
     * Filters materials based on search term and selected categories
     */
    async function filterMaterials() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedCategories = [...document.querySelectorAll('.category-button.active')]
            .map(button => button.dataset.category);

        updateURL(searchInput.value, selectedCategories);

        const filtered = materialLibrary.filter(material => {
            const matchesSearch = material.name.toLowerCase().includes(searchTerm) ||
                                material.description.toLowerCase().includes(searchTerm) ||
                                material.categories.some(cat => cat.toLowerCase().includes(searchTerm));
            const matchesCategory = selectedCategories.every(cat => material.categories.includes(cat));
            return matchesSearch && matchesCategory;
        });

        updateResultCount(filtered.length, materialLibrary.length);

        const allCards = document.querySelectorAll('.material-card');
        allCards.forEach(card => {
            card.classList.add('hide');
        });

        setTimeout(() => {
            renderMaterials(filtered);
        }, FILTER_TRANSITION_DELAY);
    }

    /**
     * Re-sorts the masonry grid layout after content changes
     */
    function reSortMasonry() {
        const masonryItems = document.querySelectorAll('.material-card');
        let transitionCount = masonryItems.length;

        masonryItems.forEach(item => {
            item.style.display = 'inline-block';
            item.addEventListener('transitionend', () => {
                transitionCount--;
                if (transitionCount === 0) {
                    grid.style.columnCount = 0; 
                    grid.style.columnCount = GRID_COLUMN_COUNT; 
                }
            }, { once: true });
        });
    }

    /**
     * Handles copying a material snippet to clipboard
     * @param {HTMLElement} card - The card element that was activated
     */
    async function handleCardClick(card) {
        const materialName = card.dataset.material;
        const material = materialLibrary.find(m => 
            m.name.toLowerCase().replace(/\s+/g, '-') === materialName
        );
        
        const snippet = await loadSnippet(material.snippet);
        navigator.clipboard.writeText(snippet);
        showCopyNotification(card.getBoundingClientRect());
    }

    grid.addEventListener('click', async (e) => {
        const card = e.target.closest('.material-card');
        if (card && !e.target.classList.contains('tag')) {
            await handleCardClick(card);
        }
    });

    grid.addEventListener('keydown', async (e) => {
        const card = e.target.closest('.material-card');
        if (card && (e.key === 'Enter' || e.key === ' ') && !e.target.classList.contains('tag')) {
            e.preventDefault();
            await handleCardClick(card);
        }
    });

    grid.addEventListener('dragstart', (e) => {
        e.preventDefault();
    });

    searchInput.addEventListener('input', () => {
        updateClearFiltersVisibility();
        filterMaterials();
    });

    updateResultCount(materialLibrary.length, materialLibrary.length);
    renderMaterials(materialLibrary);
    
    if (getFiltersFromURL().search || getFiltersFromURL().categories.length > 0) {
        filterMaterials();
    }
});
