// DOM Elements
const balanceEl = document.getElementById('balance');
const incomeTotal = document.getElementById('income-total');
const expenseTotal = document.getElementById('expense-total');
const transactionList = document.getElementById('transaction-list');
const form = document.getElementById('transaction-form');
const descriptionInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const typeInput = document.getElementById('type');
const currencySelect = document.getElementById('currency-select');
const confirmModal = document.getElementById('confirm-modal');
const confirmDeleteBtn = document.getElementById('confirm-delete');
const cancelDeleteBtn = document.getElementById('cancel-delete');

let transactions = JSON.parse(localStorage.getItem('transactions')) || {};
let currentCurrency = localStorage.getItem('currentCurrency') || 'USD';
let exchangeRates = {};
let deleteIndex;

// Fetch exchange rates from a free API (e.g., ExchangeRate-API)
async function fetchExchangeRates() {
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = await response.json();
    exchangeRates = data.rates;
    localStorage.setItem('exchangeRates', JSON.stringify(exchangeRates));
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    // Use fallback rates if API call fails
    exchangeRates = {
      USD: 1,
      EUR: 0.84,
      GBP: 0.72,
      NGN: 411.5
    };
  }
}

// Convert amount to selected currency
function convertCurrency(amount, fromCurrency, toCurrency) {
  const rateFrom = exchangeRates[fromCurrency];
  const rateTo = exchangeRates[toCurrency];
  return (amount / rateFrom) * rateTo;
}

// Update UI
function updateUI() {
  const balance = calculateBalance();
  const income = calculateTotal('income');
  const expenses = calculateTotal('expense');

  balanceEl.textContent = formatCurrency(balance, currentCurrency);
  incomeTotal.textContent = formatCurrency(income, currentCurrency);
  expenseTotal.textContent = formatCurrency(expenses, currentCurrency);

  updateTransactionList();
}

// Calculate balance
function calculateBalance() {
  if (!transactions[currentCurrency]) return 0;
  return transactions[currentCurrency].reduce((acc, transaction) => {
    return transaction.type === 'income' ? acc + transaction.amount : acc - transaction.amount;
  }, 0);
}

// Calculate total for income or expenses
function calculateTotal(type) {
  if (!transactions[currentCurrency]) return 0;
  return transactions[currentCurrency]
    .filter(transaction => transaction.type === type)
    .reduce((acc, transaction) => acc + transaction.amount, 0);
}

// Format currency
function formatCurrency(amount, currency) {
  const symbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    NGN: '₦'
  };
  return `${symbols[currency]}${amount.toFixed(2)}`;
}

// Update transaction list
function updateTransactionList() {
  transactionList.innerHTML = '';
  if (!transactions[currentCurrency]) return;
  transactions[currentCurrency].forEach((transaction, index) => {
    const li = document.createElement('li');
    li.classList.add('transaction-item', transaction.type);
    li.innerHTML = `
            <span>${transaction.description}</span>
            <span>${formatCurrency(transaction.amount, currentCurrency)}</span>
            <button class="edit-btn" onclick="editTransaction(${index})">
                <i class="fas fa-edit"></i>
            </button>
            <button class="delete-btn" onclick="showConfirmDialog(${index})">
                <i class="fas fa-trash"></i>
            </button>
        `;
    transactionList.appendChild(li);
  });
}

// Add transaction
function addTransaction(e) {
  e.preventDefault();

  const description = descriptionInput.value.trim();
  const amount = +amountInput.value;
  const type = typeInput.value;

  if (description === '' || amount <= 0) {
    showToast('Please enter a valid description and amount.', 'error');
    return;
  }

  const transaction = { id: generateId(), description, amount, type };

  if (!transactions[currentCurrency]) transactions[currentCurrency] = [];
  transactions[currentCurrency].push(transaction);
  updateLocalStorage();
  updateUI();

  showToast('Transaction added successfully!', 'success');

  descriptionInput.value = '';
  amountInput.value = '';
}

// Edit transaction
function editTransaction(index) {
  const transaction = transactions[currentCurrency][index];
  descriptionInput.value = transaction.description;
  amountInput.value = transaction.amount;
  typeInput.value = transaction.type;

  form.removeEventListener('submit', addTransaction);
  form.addEventListener('submit', function updateTransaction(e) {
    e.preventDefault();

    transaction.description = descriptionInput.value;
    transaction.amount = +amountInput.value;
    transaction.type = typeInput.value;

    updateLocalStorage();
    updateUI();

    form.removeEventListener('submit', updateTransaction);
    form.addEventListener('submit', addTransaction);

    descriptionInput.value = '';
    amountInput.value = '';

    showToast('Transaction updated successfully!', 'success'); // Success message
  });
}

// Delete transaction
function deleteTransaction() {
  if (deleteIndex === undefined) return;
  transactions[currentCurrency].splice(deleteIndex, 1);
  updateLocalStorage();
  updateUI();
  showToast('Transaction deleted successfully!', 'success'); // Success message
}

// Function to show the confirmation dialog
function showConfirmDialog(index) {
  deleteIndex = index;
  confirmModal.style.display = 'block';
}

// Function to hide the confirmation dialog
function hideConfirmDialog() {
  confirmModal.style.display = 'none';
}

// Handle delete confirmation
confirmDeleteBtn.addEventListener('click', () => {
  deleteTransaction();
  hideConfirmDialog();
});

// Handle cancel delete
cancelDeleteBtn.addEventListener('click', () => {
  hideConfirmDialog();
});

// Show toast notification
function showToast(message, type = 'error') {
  const toastContainer = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.classList.add('toast', 'show', type);
  toast.innerHTML = `
    <span>${message}</span>
    <button class="close-btn" onclick="removeToast(this)">&times;</button>
  `;
  toastContainer.appendChild(toast);

  // Remove toast after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Remove toast notification
function removeToast(button) {
  const toast = button.parentElement;
  toast.classList.remove('show');
  setTimeout(() => toast.remove(), 300);
}

// Generate a unique ID for each transaction
function generateId() {
  return '_' + Math.random().toString(36).substr(2, 9);
}

// Update local storage
function updateLocalStorage() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
  localStorage.setItem('currentCurrency', currentCurrency);
}

// Event listeners
form.addEventListener('submit', addTransaction);
currencySelect.addEventListener('change', (e) => {
  currentCurrency = e.target.value;
  localStorage.setItem('currentCurrency', currentCurrency);
  updateUI();
});

// Initialize app
async function initApp() {
  await fetchExchangeRates();
  currencySelect.value = currentCurrency;
  updateUI();
}

initApp();
