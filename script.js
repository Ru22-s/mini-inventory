// Initialize products from localStorage or use default data
let products = JSON.parse(localStorage.getItem('products')) || [
    { id: "1715623456789", name: "Laptop", category: "Electronics", quantity: 15, price: 999.99 },
    { id: "1715623456790", name: "T-Shirt", category: "Clothing", quantity: 4, price: 19.99 },
    { id: "1715623456791", name: "Coffee Maker", category: "Home", quantity: 8, price: 49.99 },
    { id: "1715623456792", name: "Headphones", category: "Electronics", quantity: 3, price: 149.99 },
    { id: "1715623456793", name: "Apples", category: "Groceries", quantity: 50, price: 0.99 }
];

// Current sort state
let currentSort = {
    column: null,
    direction: 'asc' // or 'desc'
};

// DOM Elements
const productTableBody = document.getElementById('product-table-body');
const totalValueEl = document.getElementById('total-value');
const lowStockCountEl = document.getElementById('low-stock-count');
const productTypesEl = document.getElementById('product-types');
const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');
const productForm = document.getElementById('product-form');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
const addProductBtn = document.getElementById('add-product-btn');

let productModal;
let deleteModal;
let productToDeleteId = null;

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', () => {
    // Initialize modals
    productModal = new bootstrap.Modal(document.getElementById('productModal'));
    deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));

    renderTable();
    calculateStats();
    setupEventListeners();
    setupNavigation();
});

// Navigation Setup
function setupNavigation() {
    const sections = {
        'nav-dashboard': 'section-dashboard',
        'nav-products': 'section-products',
        'nav-reports': 'section-reports',
        'nav-settings': 'section-settings'
    };

    for (const [navId, sectionId] of Object.entries(sections)) {
        const navLink = document.getElementById(navId);
        if (navLink) {
            navLink.addEventListener('click', (e) => {
                e.preventDefault();

                // Update Active Link
                document.querySelectorAll('.list-group-item').forEach(el => el.classList.remove('active'));
                navLink.classList.add('active');

                // Show Section
                Object.values(sections).forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.classList.add('d-none');
                });
                const target = document.getElementById(sectionId);
                if (target) target.classList.remove('d-none');
            });
        }
    }
}

// Save to localStorage
function saveProducts() {
    localStorage.setItem('products', JSON.stringify(products));
    calculateStats();
}

// Render Table
function renderTable() {
    productTableBody.innerHTML = '';

    // Filter products
    const searchTerm = searchInput.value.toLowerCase();
    const category = categoryFilter.value;

    let filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm);
        const matchesCategory = category === '' || product.category === category;
        return matchesSearch && matchesCategory;
    });

    // Sort products
    if (currentSort.column) {
        filteredProducts.sort((a, b) => {
            let valA = a[currentSort.column];
            let valB = b[currentSort.column];

            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return currentSort.direction === 'asc' ? -1 : 1;
            if (valA > valB) return currentSort.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }

    if (filteredProducts.length === 0) {
        productTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-5">
                    <div class="text-muted">
                        <i class="fas fa-box-open fa-3x mb-3"></i>
                        <p class="fs-4">No products found.</p>
                        <p>Try adjusting your search or add a new product.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    productTableBody.innerHTML = filteredProducts.map(product => {
        // Determine status
        let statusBadge = '';
        if (parseInt(product.quantity) === 0) {
            statusBadge = '<span class="badge bg-danger">Out of Stock</span>';
        } else if (parseInt(product.quantity) < 5) {
            statusBadge = '<span class="badge bg-warning text-dark">Low Stock</span>';
        } else {
            statusBadge = '<span class="badge bg-success">In Stock</span>';
        }

        return `
            <tr>
                <td>${product.id}</td>
                <td>${product.name}</td>
                <td>${product.category}</td>
                <td>${product.quantity}</td>
                <td>${statusBadge}</td>
                <td>$${parseFloat(product.price).toFixed(2)}</td>
                <td>
                    <button class="btn btn-sm btn-primary me-1" onclick="openEditModal('${product.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="openDeleteModal('${product.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Calculate Stats
function calculateStats() {
    // Total Inventory Value
    const totalValue = products.reduce((sum, product) => sum + (product.price * product.quantity), 0);
    totalValueEl.textContent = `$${totalValue.toFixed(2)}`;

    // Low Stock Count (< 5)
    const lowStockCount = products.filter(product => product.quantity < 5).length;
    lowStockCountEl.textContent = lowStockCount;

    // Total Product Types (unique categories? No, usually just total number of products, but prompts says "Total Product Types")
    // "Total Product Types" could mean unique categories OR total number of items (SKUs).
    // Given the context of "Product Management", it usually means total number of product records.
    // However, if it meant categories, it would be unique categories.
    // Let's assume it means total count of products in the inventory list.
    productTypesEl.textContent = products.length;
}

// Setup Event Listeners
function setupEventListeners() {
    searchInput.addEventListener('input', renderTable);
    categoryFilter.addEventListener('change', renderTable);

    addProductBtn.addEventListener('click', () => {
        document.getElementById('productModalLabel').textContent = 'Add New Product';
        productForm.reset();
        productForm.classList.remove('was-validated');
        document.getElementById('product-id').value = '';
    });

    // Handle Form Submission (Add/Edit)
    document.getElementById('save-product-btn').addEventListener('click', (e) => {
        e.preventDefault();
        if (!productForm.checkValidity()) {
            productForm.classList.add('was-validated');
            return;
        }

        const id = document.getElementById('product-id').value; // Original ID (if editing)
        const barcode = document.getElementById('product-barcode').value.trim();
        const name = document.getElementById('product-name').value;
        const category = document.getElementById('product-category').value;
        const quantity = parseInt(document.getElementById('product-quantity').value);
        const price = parseFloat(document.getElementById('product-price').value);

        // Check for duplicate barcode
        // If adding: id is empty, so check if any product has this barcode
        // If editing: id is set, check if any OTHER product has this barcode
        const existingProduct = products.find(p => p.id == barcode);
        if (existingProduct && existingProduct.id != id) {
            alert('A product with this barcode already exists!');
            return;
        }

        if (id) {
            // Edit existing product
            const index = products.findIndex(p => p.id == id);
            if (index !== -1) {
                // Update product, including ID (barcode)
                products[index] = { ...products[index], id: barcode, name, category, quantity, price };
            }
            showToast('Product updated successfully!');
        } else {
            // Add new product
            const newProduct = {
                id: barcode,
                name,
                category,
                quantity,
                price
            };
            products.push(newProduct);
            showToast('Product added successfully!');
        }

        saveProducts();
        renderTable();
        productModal.hide();
    });

    // Handle Delete Confirmation
    confirmDeleteBtn.addEventListener('click', () => {
        if (productToDeleteId) {
            products = products.filter(p => p.id !== productToDeleteId);
            saveProducts();
            renderTable();
            deleteModal.hide();
            productToDeleteId = null;
            showToast('Product deleted successfully!', 'danger');
        }
    });

    // Sidebar Toggle
    const menuToggle = document.getElementById('menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', (e) => {
            e.preventDefault();
            document.body.classList.toggle('sb-sidenav-toggled');
        });
    }
}

// Open Edit Modal
window.openEditModal = function(id) {
    const product = products.find(p => p.id == id);
    if (product) {
        document.getElementById('productModalLabel').textContent = 'Edit Product';
        productForm.classList.remove('was-validated');
        document.getElementById('product-id').value = product.id;
        document.getElementById('product-barcode').value = product.id;
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-category').value = product.category;
        document.getElementById('product-quantity').value = product.quantity;
        document.getElementById('product-price').value = product.price;
        productModal.show();
    }
};

// Open Delete Modal
window.openDeleteModal = function(id) {
    const product = products.find(p => p.id == id);
    if (product) {
        productToDeleteId = id;
        document.getElementById('delete-product-name').textContent = product.name;
        deleteModal.show();
    }
};

// Sort Table
window.sortTable = function(column) {
    if (currentSort.column === column) {
        // Toggle direction
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.column = column;
        currentSort.direction = 'asc';
    }

    // Update sort icons visual cue (optional but good UI)
    updateSortIcons(column);

    renderTable();
};

function updateSortIcons(activeColumn) {
    const headers = document.querySelectorAll('th[onclick^="sortTable"]');
    headers.forEach(header => {
        const icon = header.querySelector('i');
        if (icon) {
            icon.className = 'fas fa-sort'; // Reset to default
        }
    });

    const activeHeader = document.querySelector(`th[onclick="sortTable('${activeColumn}')"]`);
    if (activeHeader) {
        const icon = activeHeader.querySelector('i');
        if (icon) {
            if (currentSort.direction === 'asc') {
                icon.className = 'fas fa-sort-up';
            } else {
                icon.className = 'fas fa-sort-down';
            }
        }
    }
}

// Toast Notification
function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toast-container');
    const bgClass = type === 'success' ? 'text-bg-success' : 'text-bg-danger';
    
    // Create toast element
    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center ${bgClass} border-0`;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');
    
    toastEl.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    toastContainer.appendChild(toastEl);
    
    // Initialize and show toast
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
    
    // Remove from DOM after hidden
    toastEl.addEventListener('hidden.bs.toast', () => {
        toastEl.remove();
    });
}
