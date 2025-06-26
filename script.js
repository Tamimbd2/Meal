document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const expenseForm = document.getElementById('expense-form');
    const accountForm = document.getElementById('account-form');
    const expenseTableBody = document.getElementById('expense-table-body');
    const accountBalancesDiv = document.getElementById('account-balances');
    const addMoneyBtn = document.getElementById('add-money');
    const withdrawMoneyBtn = document.getElementById('withdraw-money');
    const clearDataBtn = document.getElementById('clear-data');

    // Initial State
    let state = {
        accounts: {
            'TAMIM': 0,
            'AL-AMIN': 0,
            'NUR': 0,
            'MB': 0
        },
        expenses: []
    };

    // --- DATA PERSISTENCE ---
    function saveData() {
        localStorage.setItem('homeManagementState', JSON.stringify(state));
    }

    function loadData() {
        const savedState = localStorage.getItem('homeManagementState');
        if (savedState) {
            state = JSON.parse(savedState);
        }
    }

    // --- RENDER FUNCTIONS ---
    function render() {
        renderAccounts();
        renderTable();
    }

    function renderAccounts() {
        accountBalancesDiv.innerHTML = '';
        for (const account in state.accounts) {
            const balance = state.accounts[account].toFixed(2);
            const accountDiv = document.createElement('div');
            accountDiv.innerHTML = `
                <span>${account.replace('_', '-')}</span>
                <span class="balance">${balance} BDT</span>
            `;
            accountBalancesDiv.appendChild(accountDiv);
        }
    }

    function renderTable() {
        expenseTableBody.innerHTML = '';

        let runningBalances = { ...state.accounts };

        // Process expenses in reverse for correct running balance calculation
        const reversedExpenses = [...state.expenses].reverse();
        const displayRows = [];

        for (const expense of reversedExpenses) {
            const row = document.createElement('tr');

            // Calculate current balances for this row
            const payer = expense.payer;
            const mealCost = parseFloat(expense.perMeal);
            const marketCost = parseFloat(expense.market);

            // Temporarily revert the transaction to show the state *before* it happened
             for (const person in runningBalances) {
                if (Object.keys(state.accounts).includes(person)) {
                     runningBalances[person] += mealCost;
                }
            }
             runningBalances[payer] -= marketCost;

            row.innerHTML = `
                <td>${expense.date}</td>
                <td>${expense.market}</td>
                <td>${expense.border}</td>
                <td>${expense.perMeal.toFixed(2)}</td>
                <td>${runningBalances['TAMIM'].toFixed(2)}</td>
                <td>${runningBalances['AL-AMIN'].toFixed(2)}</td>
                <td>${runningBalances['NUR'].toFixed(2)}</td>
                <td>${runningBalances['MB'].toFixed(2)}</td>
                <td>${expense.note}</td>
            `;
            displayRows.push(row);

            // Re-apply the transaction to get the state for the next older row
             for (const person in runningBalances) {
                 if (Object.keys(state.accounts).includes(person)) {
                    runningBalances[person] -= mealCost;
                }
            }
            runningBalances[payer] += marketCost;
        }

        // Append rows in correct chronological order
        displayRows.reverse().forEach(row => expenseTableBody.appendChild(row));
    }


    // --- EVENT HANDLERS ---
    expenseForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const date = document.getElementById('date').value;
        const market = parseFloat(document.getElementById('market').value);
        const border = parseInt(document.getElementById('border').value);
        const payer = document.getElementById('payer').value;
        const note = document.getElementById('note').value;

        if (!date || isNaN(market) || isNaN(border) || border <= 0) {
            alert('Please fill all fields correctly.');
            return;
        }

        const perMeal = market / border;

        // Add expense to state
        state.expenses.push({ date, market, border, perMeal, payer, note });

        // Update account balances
        state.accounts[payer] -= market; // Payer gets the money back from the group
        for (const person in state.accounts) {
            state.accounts[person] += perMeal; // Everyone pays for their meal
        }

        saveData();
        render();
        expenseForm.reset();
        document.getElementById('date').valueAsDate = new Date(); // Set date to today
    });

    addMoneyBtn.addEventListener('click', () => {
        updateAccountBalance(true);
    });

    withdrawMoneyBtn.addEventListener('click', () => {
        updateAccountBalance(false);
    });
    
    function updateAccountBalance(isAdding) {
        const accountName = document.getElementById('account-name').value;
        const amount = parseFloat(document.getElementById('amount').value);

        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid positive amount.');
            return;
        }

        if (isAdding) {
            state.accounts[accountName] -= amount; // Adding deposit reduces their debt
        } else {
            state.accounts[accountName] += amount; // Withdrawing money increases their debt
        }
        
        saveData();
        render();
        document.getElementById('amount').value = '';
    }
    
    clearDataBtn.addEventListener('click', () => {
        if(confirm('Are you sure you want to delete all data? This cannot be undone.')) {
            localStorage.removeItem('homeManagementState');
            // Reset state to initial
            state = {
                accounts: { 'TAMIM': 0, 'AL-AMIN': 0, 'NUR': 0, 'MB': 0 },
                expenses: []
            };
            render();
        }
    });


    // --- INITIALIZATION ---
    loadData();
    render();
    // Set default date to today
    document.getElementById('date').valueAsDate = new Date();
});
