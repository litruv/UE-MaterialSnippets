document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.querySelector('[data-material-grid]');
    const searchInput = document.querySelector('[data-search]');
    const categoriesContainer = document.querySelector('[data-categories]');
    
    let materialLibrary = [];
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
                filterMaterials();
            });
        });
    } catch (error) {
        console.error('Error loading materials:', error);
        grid.innerHTML = '<p class="error-message">Error loading materials library.</p>';
        return;
    }

    function renderMaterials(materials) {
        grid.innerHTML = materials.map(material => `
            <div class="material-card show" data-material="${material.name.toLowerCase().replace(/\s+/g, '-')}">
                <img class="material-preview" src="${material.preview}" alt="${material.name}">
                <div class="material-info">
                    <h3>${material.name}</h3>
                    <p class="author">${material.author}</p>
                    <p>${material.description}</p>
                    <div class="material-tags">
                        ${material.categories.map(cat => `<span class="tag" data-tag="${cat}">${cat}</span>`).join(' ')}
                    </div>
                </div>
            </div>
        `).join('');

        const tags = document.querySelectorAll('.tag');
        tags.forEach(tag => {
            tag.addEventListener('click', (e) => {
                e.stopPropagation();
                const category = tag.dataset.tag;
                const categoryButton = [...document.querySelectorAll('.category-button')]
                    .find(button => button.dataset.category === category);
                if (categoryButton) {
                    categoryButton.classList.add('active');
                    filterMaterials();
                }
            });
        });

        reSortMasonry();
    }

    async function loadSnippet(snippetPath) {
        try {
            const response = await fetch(snippetPath);
            return await response.text();
        } catch (error) {
            console.error('Error loading snippet:', error);
            return '';
        }
    }

    async function filterMaterials() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedCategories = [...document.querySelectorAll('.category-button.active')]
            .map(button => button.dataset.category);

        const filtered = materialLibrary.filter(material => {
            const matchesSearch = material.name.toLowerCase().includes(searchTerm) ||
                                material.description.toLowerCase().includes(searchTerm) ||
                                material.categories.some(cat => cat.toLowerCase().includes(searchTerm));
            const matchesCategory = selectedCategories.every(cat => material.categories.includes(cat));
            return matchesSearch && matchesCategory;
        });

        const allCards = document.querySelectorAll('.material-card');
        allCards.forEach(card => {
            card.classList.add('hide');
        });

        setTimeout(() => {
            renderMaterials(filtered);
        }, 300);
    }

    function reSortMasonry() {
        const masonryItems = document.querySelectorAll('.material-card');
        let transitionCount = masonryItems.length;

        masonryItems.forEach(item => {
            item.style.display = 'inline-block';
            item.addEventListener('transitionend', () => {
                transitionCount--;
                if (transitionCount === 0) {
                    grid.style.columnCount = 0; 
                    grid.style.columnCount = 4; 
                }
            }, { once: true });
        });
    }

    grid.addEventListener('click', async (e) => {
        const card = e.target.closest('.material-card');
        if (card && !e.target.classList.contains('tag')) {
            const materialName = card.dataset.material;
            const material = materialLibrary.find(m => 
                m.name.toLowerCase().replace(/\s+/g, '-') === materialName
            );
            
            const snippet = await loadSnippet(material.snippet);
            navigator.clipboard.writeText(snippet);
            
            const notification = document.createElement('div');
            notification.className = 'copy-notification';
            notification.textContent = 'Copied!';
            notification.style.left = `${e.clientX}px`;
            notification.style.top = `${e.clientY - 30}px`;
            
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 1000);
        }
    });

    grid.addEventListener('dragstart', (e) => {
        e.preventDefault();
    });

    searchInput.addEventListener('input', filterMaterials);

    renderMaterials(materialLibrary);
});
