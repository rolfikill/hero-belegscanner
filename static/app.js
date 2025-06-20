// HERO Software Belegscanner - Enhanced JavaScript

class ModernReceiptScanner {
    constructor() {
        // Core elements
        this.uploadArea = document.getElementById('upload-area');
        this.fileInput = document.getElementById('file-input');
        this.documentPreview = document.getElementById('document-preview');
        this.previewImage = document.getElementById('preview-image');
        this.zoomLevel = document.getElementById('zoom-level');
        this.previewControls = document.getElementById('preview-controls');
        
        // Progress elements
        this.progressContainer = document.getElementById('progress-container');
        this.progressBar = document.getElementById('progress-bar');
        this.progressText = document.getElementById('progress-text');
        
        // Form elements
        this.receiptForm = document.getElementById('receipt-form');
        this.vendorInput = document.getElementById('vendor');
        this.dateInput = document.getElementById('date');
        this.invoiceNumberInput = document.getElementById('invoice-number');
        this.documentTypeSelect = document.getElementById('document-type');
        this.grossAmountInput = document.getElementById('gross-amount');
        this.vatRateSelect = document.getElementById('vat-rate');
        this.netAmountInput = document.getElementById('net-amount');
        
        // Control buttons
        this.rotateLeftBtn = document.getElementById('rotate-left');
        this.rotateRightBtn = document.getElementById('rotate-right');
        this.zoomInBtn = document.getElementById('zoom-in');
        this.zoomOutBtn = document.getElementById('zoom-out');
        this.deleteDocBtn = document.getElementById('delete-doc');
        this.finishButton = document.getElementById('finish-button');
        this.newScanBtn = document.getElementById('new-scan-btn');
        this.selectFileBtn = document.getElementById('select-file');
        
        // KPI elements
        this.incomeValue = document.getElementById('income-value');
        this.expensesValue = document.getElementById('expenses-value');
        this.totalValue = document.getElementById('total-value');
        
        // Message system
        this.messageContainer = document.getElementById('message-container');
        this.messageContent = document.getElementById('message-content');
        this.messageIcon = document.getElementById('message-icon');
        this.messageText = document.getElementById('message-text');
        this.messageClose = document.getElementById('message-close');
        
        // State
        this.currentFile = null;
        this.currentRotation = 0;
        this.currentZoom = 1;
        this.isProcessing = false;
        
        // Initialize
        this.initEvents();
        this.setTodayDate();
        this.loadStats();
    }
    
    initEvents() {
        // File upload events
        this.uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        this.uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.selectFileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.fileInput.click();
        });
        this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        
        // Preview controls
        this.rotateLeftBtn.addEventListener('click', () => this.rotateImage(-90));
        this.rotateRightBtn.addEventListener('click', () => this.rotateImage(90));
        this.zoomInBtn.addEventListener('click', () => this.zoomImage(1.2));
        this.zoomOutBtn.addEventListener('click', () => this.zoomImage(0.8));
        this.deleteDocBtn.addEventListener('click', this.deleteDocument.bind(this));
        
        // Form events
        this.receiptForm.addEventListener('submit', this.handleFormSubmit.bind(this));
        this.newScanBtn.addEventListener('click', this.resetUI.bind(this));
        
        // Auto-calculation
        this.grossAmountInput.addEventListener('input', this.calculateNetAmount.bind(this));
        this.vatRateSelect.addEventListener('change', this.calculateNetAmount.bind(this));
        
        // Form validation
        this.setupFormValidation();
        
        // Message close
        this.messageClose.addEventListener('click', this.hideMessage.bind(this));
        
        // Keyboard shortcuts
        this.initKeyboardShortcuts();
    }
    
    setupFormValidation() {
        const requiredFields = [this.vendorInput, this.dateInput, this.documentTypeSelect, this.grossAmountInput];
        
        requiredFields.forEach(field => {
            field.addEventListener('blur', () => this.validateField(field));
            field.addEventListener('input', () => this.clearFieldError(field));
        });
    }
    
    validateField(field) {
        const fieldName = field.id;
        const errorElement = document.getElementById(`${fieldName}-error`);
        
        if (field.hasAttribute('required') && !field.value.trim()) {
            this.showFieldError(field, errorElement, 'Dieses Feld ist erforderlich');
            return false;
        }

        if (field.type === 'number' && field.value && parseFloat(field.value) <= 0) {
            this.showFieldError(field, errorElement, 'Bitte geben Sie einen gültigen Betrag ein');
            return false;
        }

        this.clearFieldError(field);
        return true;
    }
    
    showFieldError(field, errorElement, message) {
        field.classList.add('error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
        }
    }
    
    clearFieldError(field) {
        field.classList.remove('error');
        const errorElement = document.getElementById(`${field.id}-error`);
        if (errorElement) {
            errorElement.classList.add('hidden');
        }
    }
    
    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('drag-over');
    }
    
    handleDragLeave(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('drag-over');
    }
    
    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.handleFile(files[0]);
        }
    }
    
    handleFileSelect(e) {
        if (e.target.files.length > 0) {
            this.handleFile(e.target.files[0]);
        }
    }
    
    handleFile(file) {
        if (this.isProcessing) return;

        // Validate file type
        if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
            this.showMessage('error', 'fas fa-exclamation-triangle', 'Bitte wählen Sie eine Bilddatei oder PDF aus.');
            return;
        }

        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
            this.showMessage('error', 'fas fa-exclamation-triangle', 'Die Datei ist zu groß. Maximum: 10 MB');
            return;
        }

        this.currentFile = file;
        this.currentRotation = 0;
        this.currentZoom = 1;

        // Show preview
        this.showPreview(file);
        
        // Process file
        this.processFile(file);
    }
    
    showPreview(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            this.previewImage.src = e.target.result;
            this.previewImage.style.transform = '';
            this.zoomLevel.textContent = '100%';
            
            // Show preview and controls
            this.uploadArea.classList.add('hidden');
            this.documentPreview.classList.remove('hidden');
            this.previewControls.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
    
    async processFile(file) {
        this.isProcessing = true;
        this.showProgress();

        try {
            const formData = new FormData();
            formData.append('file', file);

            // Simulate progress
            this.updateProgress(20, 'Wird hochgeladen...');

            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            this.updateProgress(70, 'Wird analysiert...');

            const data = await response.json();

            this.updateProgress(100, 'Fertig!');

            setTimeout(() => {
                this.hideProgress();
                if (response.ok) {
                    this.handleAnalysisResult(data);
                } else {
                    this.showMessage('error', 'fas fa-exclamation-triangle', data.error || 'Fehler beim Verarbeiten der Datei');
                }
                this.isProcessing = false;
            }, 500);

        } catch (error) {
            this.hideProgress();
            this.showMessage('error', 'fas fa-exclamation-triangle', 'Fehler beim Hochladen der Datei');
            this.isProcessing = false;
        }
    }
    
    handleAnalysisResult(data) {
        if (data.analysis && typeof data.analysis === 'object') {
            this.populateForm(data.analysis);
            this.showMessage('success', 'fas fa-check-circle', 'Dokument erfolgreich analysiert!');
        } else {
            this.showMessage('warning', 'fas fa-exclamation-circle', 'Dokument wurde verarbeitet, aber keine Daten erkannt');
        }
    }
    
    populateForm(analysis) {
        // Clear existing confidence indicators
        this.clearConfidenceIndicators();

        if (analysis.haendler) {
            this.vendorInput.value = analysis.haendler;
            this.showConfidenceIndicator('vendor', 'high');
        }

        if (analysis.datum) {
            this.dateInput.value = this.formatDateForInput(analysis.datum);
            this.showConfidenceIndicator('date', 'high');
        }

        if (analysis.rechnungsnummer) {
            this.invoiceNumberInput.value = analysis.rechnungsnummer;
            this.showConfidenceIndicator('invoice-number', 'medium');
        }

        if (analysis.dokumenttyp) {
            this.documentTypeSelect.value = analysis.dokumenttyp;
            this.showConfidenceIndicator('document-type', 'medium');
        }

        if (analysis.betrag) {
            this.grossAmountInput.value = analysis.betrag;
            this.showConfidenceIndicator('gross-amount', 'high');
        }

        if (analysis.mwst_satz) {
            this.vatRateSelect.value = analysis.mwst_satz;
        }

        this.calculateNetAmount();
    }
    
    showConfidenceIndicator(fieldId, level) {
        const indicator = document.getElementById(`${fieldId}-confidence`);
        if (indicator) {
            indicator.classList.remove('hidden', 'high', 'medium', 'low');
            indicator.classList.add(level);
        }
    }
    
    clearConfidenceIndicators() {
        const indicators = document.querySelectorAll('.confidence-bubble');
        indicators.forEach(indicator => {
            indicator.classList.add('hidden');
            indicator.classList.remove('high', 'medium', 'low');
        });
    }
    
    formatDateForInput(dateStr) {
        if (dateStr.includes('.')) {
            const [d, m, y] = dateStr.split('.');
            return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
        return dateStr;
    }
    
    calculateNetAmount() {
        const grossAmount = parseFloat(this.grossAmountInput.value) || 0;
        const vatRate = parseFloat(this.vatRateSelect.value) || 0;

        if (grossAmount > 0) {
            const netAmount = grossAmount / (1 + vatRate / 100);
            this.netAmountInput.value = netAmount.toFixed(2);
        } else {
            this.netAmountInput.value = '';
        }
    }
    
    rotateImage(degrees) {
        this.currentRotation = (this.currentRotation + degrees) % 360;
        this.updateImageTransform();
    }
    
    zoomImage(factor) {
        this.currentZoom = Math.max(0.2, Math.min(this.currentZoom * factor, 5));
        this.updateImageTransform();
        this.zoomLevel.textContent = `${Math.round(this.currentZoom * 100)}%`;
    }
    
    updateImageTransform() {
        this.previewImage.style.transform = `rotate(${this.currentRotation}deg) scale(${this.currentZoom})`;
    }
    
    deleteDocument() {
        this.currentFile = null;
        this.previewImage.src = '';
        this.documentPreview.classList.add('hidden');
        this.previewControls.classList.add('hidden');
        this.uploadArea.classList.remove('hidden');
        this.resetForm();
    }
    
    async handleFormSubmit(e) {
        e.preventDefault();
        
        if (this.isProcessing) return;

        // Validate form
        const isValid = this.validateForm();
        if (!isValid) return;

        this.setButtonLoading(this.finishButton, true);

        try {
            const formData = this.getFormData();
            
            const response = await fetch('/api/receipts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                this.showMessage('success', 'fas fa-check-circle', 'Beleg erfolgreich gespeichert!');
                this.updateStats(data.stats);
                this.resetUI();
            } else {
                this.showMessage('error', 'fas fa-exclamation-triangle', data.error || 'Fehler beim Speichern');
            }
        } catch (error) {
            this.showMessage('error', 'fas fa-exclamation-triangle', 'Fehler beim Speichern des Belegs');
        } finally {
            this.setButtonLoading(this.finishButton, false);
        }
    }
    
    validateForm() {
        const requiredFields = [this.vendorInput, this.dateInput, this.documentTypeSelect, this.grossAmountInput];
        let isValid = true;

        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        if (!isValid) {
            this.showMessage('error', 'fas fa-exclamation-triangle', 'Bitte füllen Sie alle Pflichtfelder aus');
        }

        return isValid;
    }
    
    getFormData() {
        return {
            vendor: this.vendorInput.value,
            date: this.dateInput.value,
            invoice_number: this.invoiceNumberInput.value,
            document_type: this.documentTypeSelect.value,
            gross_amount: parseFloat(this.grossAmountInput.value),
            vat_rate: parseFloat(this.vatRateSelect.value),
            net_amount: parseFloat(this.netAmountInput.value),
            file_name: this.currentFile?.name || ''
        };
    }
    
    setButtonLoading(button, loading) {
        const spinner = button.querySelector('.btn-spinner');
        if (loading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }
    
    showProgress() {
        this.progressContainer.classList.remove('hidden');
        this.progressBar.style.width = '0%';
    }
    
    updateProgress(percentage, label) {
        this.progressBar.style.width = `${percentage}%`;
        this.progressText.textContent = `${percentage}%`;
        if (label) {
            document.querySelector('.progress-label').textContent = label;
        }
    }
    
    hideProgress() {
        this.progressContainer.classList.add('hidden');
    }
    
    showMessage(type, icon, text, autoHide = true) {
        this.messageContent.className = `message-content ${type}`;
        this.messageIcon.className = `message-icon ${icon}`;
        this.messageText.textContent = text;
        this.messageContainer.classList.remove('hidden');

        if (autoHide && type === 'success') {
            setTimeout(() => this.hideMessage(), 5000);
        }
    }
    
    hideMessage() {
        this.messageContainer.classList.add('hidden');
    }
    
    updateStats(stats) {
        if (stats) {
            this.incomeValue.textContent = this.formatCurrency(stats.income || 0);
            this.expensesValue.textContent = this.formatCurrency(stats.expenses || 0);
            this.totalValue.textContent = this.formatCurrency(stats.total || 0);
        }
    }
    
    resetForm() {
        this.receiptForm.reset();
        this.setTodayDate();
        this.clearConfidenceIndicators();
        this.clearAllFieldErrors();
    }
    
    clearAllFieldErrors() {
        const errorElements = document.querySelectorAll('.field-error');
        errorElements.forEach(el => el.classList.add('hidden'));
        
        const inputElements = document.querySelectorAll('.form-input');
        inputElements.forEach(el => el.classList.remove('error'));
    }
    
    resetUI() {
        this.deleteDocument();
        this.hideMessage();
    }
    
    setTodayDate() {
        const today = new Date().toISOString().split('T')[0];
        this.dateInput.value = today;
    }
    
    loadStats() {
        this.updateStats({ income: 0, expenses: 0, total: 0 });
    }
    
    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
                return;
            }

            switch (e.key.toLowerCase()) {
                case 'l':
                    if (e.ctrlKey && !this.documentPreview.classList.contains('hidden')) {
                        e.preventDefault();
                        this.rotateImage(-90);
                    }
                    break;
                case 'r':
                    if (e.ctrlKey && !this.documentPreview.classList.contains('hidden')) {
                        e.preventDefault();
                        this.rotateImage(90);
                    }
                    break;
                case '=':
                case '+':
                    if (e.ctrlKey && !this.documentPreview.classList.contains('hidden')) {
                        e.preventDefault();
                        this.zoomImage(1.2);
                    }
                    break;
                case '-':
                    if (e.ctrlKey && !this.documentPreview.classList.contains('hidden')) {
                        e.preventDefault();
                        this.zoomImage(0.8);
                    }
                    break;
            }
        });
    }
    
    formatCurrency(amount) {
        return new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ModernReceiptScanner();
});

