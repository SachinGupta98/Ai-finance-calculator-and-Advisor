class FinancialCalculator {
    constructor() {
        // --- State and Data ---
        this.currentCalculator = 'tax-advisor';
        this.sipChart = null;
        this.exchangeRates = {
            "USD": { "rates": { "INR": 83.42, "EUR": 0.92, "GBP": 0.79, "JPY": 157.0 } },
            "INR": { "rates": { "USD": 0.012, "EUR": 0.011, "GBP": 0.0095, "JPY": 1.88 } },
            "EUR": { "rates": { "USD": 1.08, "INR": 90.5, "GBP": 0.85, "JPY": 170.0 } },
            "GBP": { "rates": { "USD": 1.27, "INR": 105.0, "EUR": 1.17, "JPY": 198.0 } },
            "JPY": { "rates": { "USD": 0.0064, "INR": 0.53, "EUR": 0.0059, "GBP": 0.0051 } }
        };
        this.currencySymbols = { "USD": "$", "EUR": "€", "GBP": "£", "JPY": "¥", "INR": "₹" };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeAllCalculators();
        this.switchCalculator('tax-advisor'); // Start on the first AI advisor
    }

    setupEventListeners() {
        document.querySelectorAll('.nav-link').forEach(link => link.addEventListener('click', (e) => this.handleNavigation(e)));
        this.setupCurrencyListeners();
        this.setupEMIListeners();
        this.setupGSTListeners();
        this.setupSIPListeners();
        this.setupRetirementListeners();
        this.setupCompoundListeners();
        this.setupGeminiListeners();
    }

    handleNavigation(event) {
        event.preventDefault();
        const calculatorType = event.currentTarget.getAttribute('data-calculator');
        this.switchCalculator(calculatorType);
    }

    switchCalculator(type) {
        if (!type || type === this.currentCalculator) return;
        this.currentCalculator = type;
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        document.querySelector(`.nav-link[data-calculator="${type}"]`).classList.add('active');
        document.querySelectorAll('.calculator-section').forEach(s => s.classList.remove('active'));
        const activeSection = this._el(`${type}-calculator`);
        if (activeSection) activeSection.classList.add('active');
        this.updateHeader();
        this.initializeSpecificCalculator(type);
    }

    updateHeader() {
        const activeLink = document.querySelector('.nav-link.active');
        const title = activeLink ? activeLink.textContent : 'AI Advisor';
        const subtitles = {
            'tax-advisor': 'Get AI-powered advice to maximize your tax savings.',
            'portfolio-advisor': 'Receive an AI analysis of your investment portfolio.',
            'budget-advisor': 'Let AI analyze your expenses and suggest a budget.',
            'currency': 'Convert between different currencies.',
            'emi': 'Calculate your Equated Monthly Installment.',
            'gst': 'Calculate Goods and Services Tax.',
            'sip': 'Project the future value of your investments.',
            'compound': 'See the power of compounding on your savings.',
            'retirement': 'Plan for your retirement corpus and investments.',
            'goal-savings': 'Get an AI plan to achieve your financial goals.'
        };
        this._el('main-header-title').textContent = title;
        this._el('main-header-subtitle').textContent = subtitles[this.currentCalculator] || `Financial Tools`;
    }

    initializeAllCalculators() {
        this.calculateCurrency();
        this.calculateEMI();
        this.calculateGST();
        this.calculateSIP();
        this.calculateRetirement();
        this.calculateCompoundInterest();
    }

    initializeSpecificCalculator(type) {
        const calcMap = {
            currency: this.calculateCurrency,
            emi: this.calculateEMI,
            gst: this.calculateGST,
            sip: this.calculateSIP,
            retirement: this.calculateRetirement,
            compound: this.calculateCompoundInterest,
        };
        if (calcMap[type]) calcMap[type].call(this);
    }

    _el(id) { return document.getElementById(id); }
    _formatCurrency(num, symbol = '₹') {
        if (isNaN(num) || !isFinite(num)) return `${symbol}0.00`;
        return symbol + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

   async callGeminiAPI(prompt, container) {
        container.innerHTML = '';
        container.classList.add('loading');

        // The NEW API URL points to YOUR backend server
        const apiUrl = '/api/gemini'; 

        const payload = {
            prompt: prompt // We only need to send the prompt now
        };

        try {
            // This fetch call now goes to your Flask server (e.g., http://127.0.0.1:5000/api/gemini)
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                // Catches errors returned from your Flask server
                const errorResult = await response.json();
                throw new Error(errorResult.error || `Server Error: ${response.status}`);
            }

            const result = await response.json();

            // The structure from Gemini is nested, so we extract the text part
            const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text || "No valid response generated.";
            container.textContent = generatedText;

        } catch (error) {
            console.error("Error calling backend API:", error);
            container.textContent = `An error occurred: ${error.message}`;
        } finally {
            container.classList.remove('loading');
        }
    }

    setupGeminiListeners() {
        this._el('get-tax-advice-btn')?.addEventListener('click', () => this.getTaxAdvice());
        this._el('get-portfolio-advice-btn')?.addEventListener('click', () => this.getPortfolioAdvice());
        this._el('get-budget-advice-btn')?.addEventListener('click', () => this.getBudgetAdvice());
        this._el('get-loan-advice-btn')?.addEventListener('click', () => this.getLoanAdvice());
        this._el('generate-savings-plan-btn')?.addEventListener('click', () => this.generateSavingsPlan());
    }
    
    getTaxAdvice() {
        const income = this._el('tax-income').value, investments = this._el('tax-investments').value;
        if (!income) { alert("Please enter your annual income."); return; }
        const prompt = `I am in India. My annual CTC is ${income} INR. My existing tax-saving investments under Section 80C are ${investments || 0} INR. Assuming I am under the old tax regime, provide a clear, actionable plan to maximize my tax savings. Suggest specific investment options like ELSS, PPF, NPS, and health insurance (Section 80D). Format the response with clear headings and bullet points.`;
        this.callGeminiAPI(prompt, this._el('tax-advice-container'));
    }

    getPortfolioAdvice() {
        const description = this._el('portfolio-description').value, risk = this._el('portfolio-risk').value;
        if (!description) { alert("Please describe your portfolio."); return; }
        const prompt = `Analyze my investment portfolio, which consists of: "${description}". My risk tolerance is '${risk}'. Provide feedback on my asset allocation, comment on its diversification, and suggest any rebalancing needed to align with my risk profile. Give practical, easy-to-understand advice.`;
        this.callGeminiAPI(prompt, this._el('portfolio-advice-container'));
    }

    getBudgetAdvice() {
        const salary = this._el('budget-salary').value, expenses = this._el('budget-expenses').value;
        if (!salary || !expenses) { alert("Please enter your salary and expenses."); return; }
        const prompt = `My monthly in-hand salary is ${salary} INR. My typical monthly expenses are: "${expenses}". Analyze my spending habits, identify areas where I can save, and create a sample budget for me based on the 50/30/20 rule (50% Needs, 30% Wants, 20% Savings). Show the breakdown clearly.`;
        this.callGeminiAPI(prompt, this._el('budget-advice-container'));
    }
    
    getLoanAdvice() {
        const p = this._el('loan-amount').value, rate = this._el('interest-rate').value, years = this._el('loan-tenure').value, emi = this._el('monthly-emi').textContent;
        if (!p || !rate || !years) { alert("Please fill in all loan details first."); return; }
        const prompt = `I have a loan of ${p} at ${rate}% for ${years} years. My EMI is ${emi}. Provide actionable advice on repaying this faster. Suggest prepayment strategies and explain the pros and cons. Format clearly with headings.`;
        this.callGeminiAPI(prompt, this._el('loan-advice-container'));
    }

    generateSavingsPlan() {
        const goal = this._el('goal-name').value, amount = this._el('goal-amount').value, years = this._el('goal-years').value;
        if (!goal || !amount || !years) { alert("Please fill in all goal details first."); return; }
        const prompt = `My financial goal is "${goal}". I need to save ${amount} in ${years} years. My risk tolerance is moderate. Generate a personalized savings plan with a monthly savings target, investment mix (SIPs, RDs), and practical tips. Format clearly with headings.`;
        this.callGeminiAPI(prompt, this._el('savings-plan-container'));
    }

    setupCurrencyListeners() { ['currency-amount', 'from-currency', 'to-currency'].forEach(id => this._el(id)?.addEventListener('input', () => this.calculateCurrency())); }
    calculateCurrency() {
        const amount = parseFloat(this._el('currency-amount').value) || 0;
        const from = this._el('from-currency').value;
        const to = this._el('to-currency').value;
        let rate = (from === to) ? 1 : (this.exchangeRates[from]?.rates[to] || 0);
        const convertedAmount = amount * rate;
        this._el('converted-amount').textContent = convertedAmount.toFixed(2);
        this._el('result-currency').textContent = to;
        this._el('exchange-rate-info').textContent = `1 ${from} = ${rate.toFixed(4)} ${to}`;
    }

    setupEMIListeners() { ['loan-amount', 'interest-rate', 'loan-tenure'].forEach(id => this._el(id)?.addEventListener('input', () => this.calculateEMI())); }
    calculateEMI() {
        const p = parseFloat(this._el('loan-amount').value) || 0, annualRate = parseFloat(this._el('interest-rate').value) || 0, years = parseFloat(this._el('loan-tenure').value) || 0;
        if (p <= 0 || annualRate <= 0 || years <= 0) {
            ['monthly-emi', 'total-payment', 'total-interest'].forEach(id => this._el(id).textContent = this._formatCurrency(0));
            return;
        }
        const r = (annualRate / 100) / 12, n = years * 12;
        const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        const totalPayment = emi * n, totalInterest = totalPayment - p;
        this._el('monthly-emi').textContent = this._formatCurrency(emi);
        this._el('total-payment').textContent = this._formatCurrency(totalPayment);
        this._el('total-interest').textContent = this._formatCurrency(totalInterest);
    }

    setupGSTListeners() { ['gst-amount', 'gst-rate', 'gst-type'].forEach(id => this._el(id)?.addEventListener('input', () => this.calculateGST())); }
    calculateGST() {
        const amount = parseFloat(this._el('gst-amount').value) || 0, rate = parseFloat(this._el('gst-rate').value) || 0, type = this._el('gst-type').value;
        let base = 0, tax = 0, total = 0;
        if (type === 'exclusive') { base = amount; tax = (amount * rate) / 100; total = base + tax; } 
        else { total = amount; base = amount / (1 + (rate / 100)); tax = total - base; }
        this._el('base-amount').textContent = this._formatCurrency(base);
        this._el('tax-amount').textContent = this._formatCurrency(tax);
        this._el('total-with-tax').textContent = this._formatCurrency(total);
    }

    setupSIPListeners() { ['sip-amount', 'sip-return', 'sip-period'].forEach(id => this._el(id)?.addEventListener('input', () => this.calculateSIP())); }
    calculateSIP() {
        const monthlyInvestment = parseFloat(this._el('sip-amount').value) || 0, annualReturn = parseFloat(this._el('sip-return').value) || 0, years = parseFloat(this._el('sip-period').value) || 0;
        if (monthlyInvestment <= 0 || years <= 0) {
            ['total-investment', 'expected-returns', 'maturity-amount'].forEach(id => this._el(id).textContent = this._formatCurrency(0));
            this.updateSIPChart(0, 0);
            return;
        }
        const i = (annualReturn / 100) / 12, n = years * 12;
        const futureValue = monthlyInvestment * (((Math.pow(1 + i, n) - 1) / i));
        const investedAmount = monthlyInvestment * n, estReturns = futureValue - investedAmount;
        this._el('total-investment').textContent = this._formatCurrency(investedAmount);
        this._el('expected-returns').textContent = this._formatCurrency(estReturns);
        this._el('maturity-amount').textContent = this._formatCurrency(futureValue);
        this.updateSIPChart(investedAmount, estReturns);
    }

    updateSIPChart(invested, returns) {
        const ctx = this._el('sip-chart')?.getContext('2d');
        if (!ctx) return;
        if (this.sipChart) this.sipChart.destroy();
        this.sipChart = new Chart(ctx, {
            type: 'doughnut',
            data: { labels: ['Invested Amount', 'Est. Returns'], datasets: [{ data: [invested, returns], backgroundColor: ['#3B82F6', '#10B981'], borderWidth: 0 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
        });
    }
    
    setupCompoundListeners() { ['compound-principal-amount', 'compound-rate', 'compound-years', 'compound-frequency'].forEach(id => this._el(id)?.addEventListener('input', () => this.calculateCompoundInterest())); }
    calculateCompoundInterest() {
        const p = parseFloat(this._el('compound-principal-amount').value) || 0;
        const annualRate = parseFloat(this._el('compound-rate').value) / 100 || 0;
        const years = parseFloat(this._el('compound-years').value) || 0;
        const n = parseFloat(this._el('compound-frequency').value) || 1;
        
        if (p <= 0 || annualRate <= 0 || years <= 0) {
            ['ci-principal', 'ci-interest', 'ci-total'].forEach(id => this._el(id).textContent = this._formatCurrency(0));
            return;
        }
        
        const total = p * Math.pow(1 + (annualRate / n), n * years);
        const interest = total - p;
        
        this._el('ci-principal').textContent = this._formatCurrency(p);
        this._el('ci-interest').textContent = this._formatCurrency(interest);
        this._el('ci-total').textContent = this._formatCurrency(total);
    }

    setupRetirementListeners() { ['current-age', 'retirement-age', 'monthly-expenses', 'inflation-rate', 'pre-retirement-return', 'post-retirement-return'].forEach(id => this._el(id)?.addEventListener('input', () => this.calculateRetirement())); }
    calculateRetirement() {
        const currentAge = parseFloat(this._el('current-age').value) || 0, retirementAge = parseFloat(this._el('retirement-age').value) || 0;
        const monthlyExpenses = parseFloat(this._el('monthly-expenses').value) || 0, inflation = parseFloat(this._el('inflation-rate').value) / 100 || 0;
        const preReturn = parseFloat(this._el('pre-retirement-return').value) / 100 || 0, postReturn = parseFloat(this._el('post-retirement-return').value) / 100 || 0;
        const yearsToRetire = retirementAge - currentAge;

        if (yearsToRetire <= 0 || monthlyExpenses <= 0) {
            this._el('retirement-corpus').textContent = this._formatCurrency(0);
            this._el('retirement-monthly-sip').textContent = this._formatCurrency(0);
            return;
        }
        
        const futureAnnualExpenses = (monthlyExpenses * Math.pow(1 + inflation, yearsToRetire)) * 12;
        const corpus = (futureAnnualExpenses * (1 + postReturn)) / (postReturn - inflation);
        const i = preReturn / 12, n = yearsToRetire * 12;
        const monthlySip = corpus / (((Math.pow(1 + i, n) - 1) / i));
        this._el('retirement-corpus').textContent = this._formatCurrency(corpus);
        this._el('retirement-monthly-sip').textContent = this._formatCurrency(monthlySip);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.finpalApp = new FinancialCalculator();
});
