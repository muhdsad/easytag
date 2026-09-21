document.addEventListener('DOMContentLoaded', () => {
    // Application State
    let items = []; // Holds current list of normalized product objects { name, price, unit }
    let rawHeaders = []; // Header names from the uploaded file
    let rawDataRows = []; // Raw parsed rows (array of objects)
    let currentEditIndex = null; // Currently selected index in the modal editor

    // Default Sample Data (Matches the screenshot exactly)
    const SAMPLE_DATA = [
        { name: 'TOMATO', price: '19.90', unit: 'KG', mrp: '25.00' },
        { name: 'CAPSICUM', price: '76.00', unit: 'KG', mrp: '90.00' },
        { name: 'CUCUMBER', price: '24.90', unit: 'KG', mrp: '35.00' },
        { name: 'GREEN CHILLIY', price: '29.90', unit: 'KG', mrp: '40.00' },
        { name: 'BEETROOT', price: '42.00', unit: 'KG', mrp: '50.00' },
        { name: 'VELLARI', price: '15.90', unit: 'KG', mrp: '20.00' },
        { name: 'PAYAR', price: '58.90', unit: 'KG', mrp: '70.00' },
        { name: 'MATHAN', price: '16.90', unit: 'KG', mrp: '25.00' },
        { name: 'ELAVAN', price: '14.90', unit: 'KG', mrp: '20.00' },
        { name: 'KOVAKKA', price: '60.00', unit: 'KG', mrp: '75.00' },
        { name: 'COCONUT', price: '52.00', unit: 'KG', mrp: '60.00' },
        { name: 'MILMA MILK', price: '27.90', unit: 'POUCH', mrp: '30.00' },
        { name: 'PINEAPPLE', price: '87.00', unit: 'KG', mrp: '100.00' },
        { name: 'MANGO NEELAM', price: '42.00', unit: 'KG', mrp: '60.00' },
        { name: 'APPLE PINK', price: '316.00', unit: 'KG', mrp: '350.00' },
        { name: 'SABARJELLI', price: '110.00', unit: 'KG', mrp: '130.00' }
    ];

    // DOM Elements
    const uploadView = document.getElementById('upload-view');
    const previewView = document.getElementById('preview-view');
    const pagesContainer = document.getElementById('pages-container');
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const browseBtn = document.getElementById('browse-btn');
    const generateBtn = document.getElementById('generate-btn');
    const useSampleBtn = document.getElementById('use-sample-btn');
    const newUploadBtn = document.getElementById('new-upload-btn');
    const printBtn = document.getElementById('print-btn');
    const savePngBtn = document.getElementById('save-png-btn');
    
    // Image Matching Elements
    const matchFolderBtn = document.getElementById('match-folder-btn');
    const matchGdriveBtn = document.getElementById('match-gdrive-btn');
    const folderInput = document.getElementById('folder-input');
    const gdriveModal = document.getElementById('gdrive-modal');
    const gdriveCloseBtn = document.getElementById('gdrive-close-btn');
    const gdriveCancelBtn = document.getElementById('gdrive-cancel-btn');
    const gdriveFetchBtn = document.getElementById('gdrive-fetch-btn');
    const gdriveFolderUrlInput = document.getElementById('gdrive-folder-url');
    const gdriveApiKeyInput = document.getElementById('gdrive-api-key');
    const gdriveLinksInput = document.getElementById('gdrive-links-input');
    const gdriveStatus = document.getElementById('gdrive-status');
    const toastContainer = document.getElementById('toast-container');
    
    // Mapping Elements
    const mappingContainer = document.getElementById('mapping-container');
    const mapItemSelect = document.getElementById('map-item');
    const mapPriceSelect = document.getElementById('map-price');
    const mapMrpSelect = document.getElementById('map-mrp');
    const mapUnitSelect = document.getElementById('map-unit');
    const previewTableHeader = document.getElementById('preview-table-header');
    const previewTableBody = document.getElementById('preview-table-body');

    // Editor Modal Elements
    const editorModal = document.getElementById('editor-modal');
    const closeBtn = document.querySelector('.close-btn');
    const saveBtn = document.getElementById('save-btn');
    const deleteBtn = document.getElementById('delete-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const itemNameInput = document.getElementById('item-name');
    const itemSpInput = document.getElementById('item-sp');
    const itemMrpInput = document.getElementById('item-mrp');
    const itemUnitInput = document.getElementById('item-unit');
    
    // Image Upload Elements inside Modal
    const modalImageBox = document.getElementById('modal-image-box');
    const modalUploadPlaceholder = document.getElementById('modal-upload-placeholder');
    const modalImagePreview = document.getElementById('modal-image-preview');
    const modalRemoveImage = document.getElementById('modal-remove-image');
    const modalImageInput = document.getElementById('modal-image-input');
    let currentImageBase64 = null;

    // Helper: Switch views & ensure fonts fit once web fonts are fully loaded
    function triggerFontRefit() {
        updateScaleFactor();
        adjustAllFontSizes();
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => {
                requestAnimationFrame(() => {
                    updateScaleFactor();
                    adjustAllFontSizes();
                });
            });
        }
    }

    function showView(viewId) {
        document.querySelectorAll('.view-container').forEach(view => {
            view.classList.remove('active');
        });
        document.getElementById(viewId).classList.add('active');
        if (viewId === 'preview-view') {
            requestAnimationFrame(() => {
                triggerFontRefit();
            });
            setTimeout(triggerFontRefit, 300);
            setTimeout(triggerFontRefit, 800);
        }
    }

    if (document.fonts) {
        document.fonts.ready.then(() => {
            if (document.getElementById('preview-view') && document.getElementById('preview-view').classList.contains('active')) {
                triggerFontRefit();
            }
        });
        document.fonts.onloadingdone = () => {
            if (document.getElementById('preview-view') && document.getElementById('preview-view').classList.contains('active')) {
                triggerFontRefit();
            }
        };
    }

    // Helper: Dynamic scale factor for responsive display
    function updateScaleFactor() {
        const wrapper = document.querySelector('.pages-wrapper');
        if (!wrapper || !wrapper.clientWidth) return;
        
        // Target width of A4 Landscape container is 297mm (~1122.5px at 96 DPI)
        const a4WidthPx = 1122.5;
        const padding = window.innerWidth <= 768 ? 20 : 40;
        const availableWidth = Math.max(260, wrapper.clientWidth - padding);
        
        let scaleFactor = 1;
        if (availableWidth < a4WidthPx) {
            scaleFactor = availableWidth / a4WidthPx;
        }
        
        document.documentElement.style.setProperty('--scale-factor', scaleFactor);
    }
    
    window.addEventListener('resize', () => {
        triggerFontRefit();
    });

    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            triggerFontRefit();
        }, 150);
    });

    // Drag & Drop Setup
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleUploadedFile(e.dataTransfer.files[0]);
        }
    });

    browseBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleUploadedFile(e.target.files[0]);
        }
    });

    // File Parsing Logic
    function handleUploadedFile(file) {
        const reader = new FileReader();
        const extension = file.name.split('.').pop().toLowerCase();

        reader.onload = function(e) {
            const data = e.target.result;
            try {
                if (extension === 'csv') {
                    parseCSV(data);
                } else if (extension === 'xlsx' || extension === 'xls') {
                    parseExcel(data);
                } else {
                    alert('Unsupported file format. Please upload a CSV or Excel file.');
                }
            } catch (err) {
                console.error(err);
                alert('Error parsing file: ' + err.message);
            }
        };

        if (extension === 'csv') {
            reader.readAsText(file);
        } else {
            reader.readAsArrayBuffer(file);
        }
    }

    // CSV parser with PapaParse
    function parseCSV(text) {
        Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                if (results.data && results.data.length > 0) {
                    processParsedData(results.meta.fields, results.data);
                } else {
                    alert('No data found in the CSV file.');
                }
            }
        });
    }

    // Excel parser with SheetJS
    function parseExcel(arrayBuffer) {
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (json.length > 0) {
            const headers = Object.keys(json[0]);
            processParsedData(headers, json);
        } else {
            alert('No data found in the Excel file.');
        }
    }

    // Header auto-detection and data preview setup
    function processParsedData(headers, rows) {
        rawHeaders = headers;
        rawDataRows = rows;

        // Auto-detect columns using regular expressions
        let detectedItem = '';
        let detectedPrice = '';
        let detectedMrp = '';
        let detectedUnit = '';

        headers.forEach(h => {
            const cleanHeader = h.toLowerCase().trim();
            
            if (!detectedItem && /item|items|name|product|title|particulars/i.test(cleanHeader)) {
                detectedItem = h;
            }
            if (!detectedPrice && /price|rate|selling|sp|cost/i.test(cleanHeader)) {
                detectedPrice = h;
            }
            if (!detectedMrp && /mrp|market|original|strike/i.test(cleanHeader)) {
                detectedMrp = h;
            }
            if (!detectedUnit && /unit|weight|qty|measure|uom|pack/i.test(cleanHeader)) {
                detectedUnit = h;
            }
        });

        // Fallback defaults if not matched
        detectedItem = detectedItem || headers[0];
        detectedPrice = detectedPrice || headers[1] || headers[0];
        detectedMrp = detectedMrp || headers[3] || headers[1] || headers[0];
        detectedUnit = detectedUnit || headers[2] || headers[0];

        // Populate selects
        populateMappingSelectors(headers, detectedItem, detectedPrice, detectedUnit, detectedMrp);
        
        // Show mapping UI
        mappingContainer.style.display = 'block';
        generateBtn.disabled = false;

        // Render mini table preview
        renderPreviewTable(headers, rows);
    }

    function populateMappingSelectors(headers, itemSel, priceSel, unitSel, mrpSel) {
        [mapItemSelect, mapPriceSelect, mapUnitSelect, mapMrpSelect].forEach(select => {
            select.innerHTML = '';
            headers.forEach(header => {
                const opt = document.createElement('option');
                opt.value = header;
                opt.textContent = header;
                select.appendChild(opt);
            });
        });

        mapItemSelect.value = itemSel;
        mapPriceSelect.value = priceSel;
        mapUnitSelect.value = unitSel;
        mapMrpSelect.value = mrpSel;
    }

    function renderPreviewTable(headers, rows) {
        // Headers
        previewTableHeader.innerHTML = '';
        headers.forEach(h => {
            const th = document.createElement('th');
            th.textContent = h;
            previewTableHeader.appendChild(th);
        });

        // Body (First 5 rows for verification)
        previewTableBody.innerHTML = '';
        const limit = Math.min(rows.length, 5);
        for (let i = 0; i < limit; i++) {
            const tr = document.createElement('tr');
            headers.forEach(h => {
                const td = document.createElement('td');
                td.textContent = rows[i][h];
                tr.appendChild(td);
            });
            previewTableBody.appendChild(tr);
        }
    }

    // Map raw spreadsheet rows into normalized product objects
    function generateItemsFromRaw() {
        const itemField = mapItemSelect.value;
        const priceField = mapPriceSelect.value;
        const unitField = mapUnitSelect.value;
        const mrpField = mapMrpSelect.value;

        items = rawDataRows.map(row => {
            const name = String(row[itemField] || '').trim().toUpperCase();
            
            // Normalize Price (Float parsing)
            let rawPrice = String(row[priceField] || '').trim();
            let parsedPrice = parseFloat(rawPrice.replace(/[^\d.]/g, ''));
            const price = isNaN(parsedPrice) ? '' : parsedPrice.toFixed(2);

            let rawMrp = String(row[mrpField] || '').trim();
            let parsedMrp = parseFloat(rawMrp.replace(/[^\d.]/g, ''));
            const mrp = isNaN(parsedMrp) ? '' : parsedMrp.toFixed(2);

            const unit = String(row[unitField] || '').trim().toUpperCase();

            return { name, price, unit, mrp, image: '' };
        });
    }

    // Grid Renderer (renders A4 sheets containing 16 cells each)
    function renderGridPages() {
        pagesContainer.innerHTML = '';

        // Chunk items list into sets of 16
        const chunkSize = 16;
        const pageCount = Math.max(1, Math.ceil(items.length / chunkSize));

        for (let pageIdx = 0; pageIdx < pageCount; pageIdx++) {
            const pageScaler = document.createElement('div');
            pageScaler.className = 'page-scaler';

            const a4Container = document.createElement('div');
            a4Container.className = 'a4-container';

            const gridContainer = document.createElement('div');
            gridContainer.className = 'grid-container';

            // Generate 16 items for this page. If items array is shorter, remainder are empty cards.
            for (let cardIdx = 0; cardIdx < chunkSize; cardIdx++) {
                const globalIdx = (pageIdx * chunkSize) + cardIdx;
                const item = items[globalIdx];

                const card = document.createElement('div');
                card.className = 'price-card';
                card.dataset.index = globalIdx;

                if (globalIdx < items.length && item && (item.name || item.price || item.image || item.mrp)) {
                    // Populate filled tag cell
                    let unitDisplay = item.unit ? item.unit.trim() : '';
                    if (unitDisplay && !unitDisplay.startsWith('/')) {
                        unitDisplay = `/ ${unitDisplay}`;
                    }
                    const priceAndUnit = `${item.price} ${unitDisplay}`.trim();

                    let imageHtml = '';
                    if (item.image) {
                        card.classList.add('has-image');
                        imageHtml = `<img class="price-card-image" src="${item.image}" alt="">`;
                    } else {
                        card.classList.remove('has-image');
                    }

                    let mrpHtml = '';
                    if (item.mrp && parseFloat(item.mrp) > 0) {
                        mrpHtml = `<div class="price-card-mrp">MRP ${item.mrp}</div>`;
                    }

                    let saveHtml = '';
                    if (item.mrp && item.price) {
                        const mrpVal = parseFloat(item.mrp);
                        const priceVal = parseFloat(item.price);
                        if (!isNaN(mrpVal) && !isNaN(priceVal) && mrpVal > priceVal) {
                            const savings = (mrpVal - priceVal).toFixed(2);
                            saveHtml = `<div class="price-card-save">SMILE SAVE <span class="currency-symbol">₹</span>${savings}</div>`;
                        }
                    }

                    card.innerHTML = `
                        ${imageHtml}
                        ${mrpHtml}
                        ${saveHtml}
                        <div class="product-title">${item.name || ''}</div>
                        <div class="price-tag-line">${priceAndUnit}</div>
                    `;
                } else {
                    // Populate empty tag cell
                    card.classList.add('empty-card');
                    card.classList.remove('has-image');
                }

                // Inline editing when clicked
                card.addEventListener('click', () => {
                    openEditor(globalIdx);
                });

                gridContainer.appendChild(card);
            }

            a4Container.appendChild(gridContainer);
            pageScaler.appendChild(a4Container);
            pagesContainer.appendChild(pageScaler);
        }
    }

    // Fit Text Size logic (ensures long words/prices scale down to fit on a single line)
    function adjustAllFontSizes(container = document) {
        const cards = container.querySelectorAll('.price-card');
        cards.forEach(card => {
            const titleEl = card.querySelector('.product-title');
            const priceEl = card.querySelector('.price-tag-line');
            if (!titleEl && !priceEl) return;

            // Reset fonts
            if (titleEl) titleEl.style.fontSize = '';
            if (priceEl) priceEl.style.fontSize = '';

            // Card dimensions (unscaled A4 cell: ~74.25mm width x 52.5mm height)
            const cardWidth = card.clientWidth || (1122.5 / 4);
            const cardHeight = card.clientHeight || (793.7 / 4);
            const maxAllowedWidth = cardWidth - 8; // Minimal padding offset
            const maxAllowedHeight = (cardHeight / 2) - 2; // Max height allocated per text line

            if (titleEl && titleEl.textContent) {
                let size = 21; // mm base font size (HUGE & HEAVY matching screenshot)
                titleEl.style.fontSize = `${size}mm`;
                // Keep shrinking until element fits within cell width & height boundary
                while ((titleEl.scrollWidth > maxAllowedWidth || titleEl.offsetHeight > maxAllowedHeight * 1.15) && size > 5) {
                    size -= 0.3;
                    titleEl.style.fontSize = `${size}mm`;
                }
            }

            if (priceEl && priceEl.textContent) {
                let size = 21; // mm base font size (HUGE & HEAVY matching screenshot)
                priceEl.style.fontSize = `${size}mm`;
                while ((priceEl.scrollWidth > maxAllowedWidth || priceEl.offsetHeight > maxAllowedHeight * 1.15) && size > 5) {
                    size -= 0.3;
                    priceEl.style.fontSize = `${size}mm`;
                }
            }
        });
    }

    // Open Inline Editor Modal
    function openEditor(index) {
        currentEditIndex = index;
        
        // If index doesn't exist in our current items array, we create placeholder fields
        // This allows clicking empty cells to add new tags manually.
        if (index >= items.length) {
            // Fill array up to the clicked index
            while (items.length <= index) {
                items.push({ name: '', price: '', unit: '', mrp: '', image: '' });
            }
        }

        const item = items[index];

        itemNameInput.value = item.name || '';
        itemSpInput.value = item.price || '';
        itemMrpInput.value = item.mrp || '';
        itemUnitInput.value = item.unit || '';

        // Load image state
        currentImageBase64 = item.image || null;
        if (currentImageBase64) {
            modalImagePreview.src = currentImageBase64;
            modalImagePreview.style.display = 'block';
            modalRemoveImage.style.display = 'flex';
            modalUploadPlaceholder.style.display = 'none';
        } else {
            modalImagePreview.src = '';
            modalImagePreview.style.display = 'none';
            modalRemoveImage.style.display = 'none';
            modalUploadPlaceholder.style.display = 'flex';
        }

        editorModal.style.display = 'flex';
        itemNameInput.focus();
    }

    // Close Editor Modal
    function closeEditor() {
        editorModal.style.display = 'none';
        currentEditIndex = null;
        currentImageBase64 = null;
        modalImageInput.value = '';
        itemMrpInput.value = '';
    }

    // Save edited tag details
    saveBtn.addEventListener('click', () => {
        if (currentEditIndex === null) return;

        items[currentEditIndex] = {
            name: itemNameInput.value.toUpperCase().trim(),
            price: itemSpInput.value ? parseFloat(itemSpInput.value).toFixed(2) : '',
            unit: itemUnitInput.value.toUpperCase().trim(),
            mrp: itemMrpInput.value ? parseFloat(itemMrpInput.value).toFixed(2) : '',
            image: currentImageBase64 || ''
        };

        // Redraw grid pages and refresh text scaling
        renderGridPages();
        adjustAllFontSizes();
        closeEditor();
    });

    // Clear tag data
    deleteBtn.addEventListener('click', () => {
        if (currentEditIndex !== null) {
            items[currentEditIndex] = { name: '', price: '', unit: '', mrp: '', image: '' };
            renderGridPages();
            adjustAllFontSizes();
            closeEditor();
        }
    });

    // Image Upload Events
    modalImageBox.addEventListener('click', (e) => {
        if (e.target.closest('#modal-remove-image')) return;
        modalImageInput.click();
    });

    modalImageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                currentImageBase64 = event.target.result;
                modalImagePreview.src = currentImageBase64;
                modalImagePreview.style.display = 'block';
                modalRemoveImage.style.display = 'flex';
                modalUploadPlaceholder.style.display = 'none';
            };
            reader.readAsDataURL(file);
        }
    });

    modalRemoveImage.addEventListener('click', (e) => {
        e.stopPropagation();
        currentImageBase64 = null;
        modalImageInput.value = '';
        modalImagePreview.src = '';
        modalImagePreview.style.display = 'none';
        modalRemoveImage.style.display = 'none';
        modalUploadPlaceholder.style.display = 'flex';
    });

    closeBtn.addEventListener('click', closeEditor);
    cancelBtn.addEventListener('click', closeEditor);

    window.onclick = function(event) {
        if (event.target == editorModal) {
            closeEditor();
        }
    };

    // Controller Action: Generate Pages
    generateBtn.addEventListener('click', () => {
        generateItemsFromRaw();
        renderGridPages();
        showView('preview-view');
    });

    // Controller Action: Use Sample Data
    useSampleBtn.addEventListener('click', () => {
        items = JSON.parse(JSON.stringify(SAMPLE_DATA));
        renderGridPages();
        showView('preview-view');
    });

    // Controller Action: New Upload
    newUploadBtn.addEventListener('click', () => {
        // Reset state
        items = [];
        rawHeaders = [];
        rawDataRows = [];
        fileInput.value = '';
        mappingContainer.style.display = 'none';
        generateBtn.disabled = true;
        showView('upload-view');
    });

    // Controller Action: Print
    printBtn.addEventListener('click', () => {
        window.print();
    });

    // Controller Action: Save as PNG
    savePngBtn.addEventListener('click', async () => {
        const originalText = savePngBtn.innerHTML;
        savePngBtn.disabled = true;
        savePngBtn.innerHTML = `
            <svg viewBox="0 0 24 24" class="btn-icon spinner"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="32" /></svg>
            Saving PNGs...
        `;

        const a4Containers = document.querySelectorAll('.a4-container');
        
        for (let i = 0; i < a4Containers.length; i++) {
            const originalElement = a4Containers[i];
            
            // Clone node to render offscreen at scale 1 (A4 dimensions at 96 DPI)
            const element = originalElement.cloneNode(true);
            const a4WidthPx = 1122; // 297mm in pixels
            const a4HeightPx = 794; // 210mm in pixels
            
            element.style.width = `${a4WidthPx}px`;
            element.style.height = `${a4HeightPx}px`;
            element.style.minWidth = `${a4WidthPx}px`;
            element.style.minHeight = `${a4HeightPx}px`;
            element.style.margin = '0';
            element.style.boxShadow = 'none';
            element.style.transform = 'none';

            const container = document.createElement('div');
            container.style.position = 'fixed';
            container.style.top = '0';
            container.style.left = '-9999px';
            container.style.zIndex = '-9999';
            container.style.width = `${a4WidthPx}px`;
            container.style.height = `${a4HeightPx}px`;
            container.appendChild(element);
            
            document.body.appendChild(container);

            try {
                // Ensure browser loaded Google fonts before measuring text dimensions
                await document.fonts.ready;
                
                // Re-fit fonts inside the clone using the main font scaling algorithm (21mm base size)
                adjustAllFontSizes(container);
                
                const canvas = await html2canvas(element, {
                    scale: 2, // Retains high crisp printing resolution
                    useCORS: true,
                    scrollY: 0,
                    scrollX: 0,
                    x: 0,
                    y: 0,
                    width: a4WidthPx,
                    height: a4HeightPx,
                    windowWidth: a4WidthPx,
                    windowHeight: a4HeightPx,
                });

                const dataUrl = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.download = a4Containers.length > 1 
                    ? `price-tags-page-${i + 1}.png` 
                    : 'price-tags.png';
                link.href = dataUrl;
                link.click();
            } catch (err) {
                console.error('PNG Capture Error:', err);
            } finally {
                document.body.removeChild(container);
            }
            
            // Stagger downloads slightly to prevent browser download grouping blockers
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        savePngBtn.disabled = false;
        savePngBtn.innerHTML = originalText;
    });

    // ==========================================
    // IMAGE MATCHING LOGIC & HELPERS
    // ==========================================

    // Helper: Toast Notifications
    function showToast(message, type = 'info', duration = 4000) {
        if (!toastContainer) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let iconSvg = '';
        if (type === 'success') {
            iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
        } else if (type === 'error') {
            iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
        } else {
            iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
        }

        toast.innerHTML = `${iconSvg}<span>${message}</span>`;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // Helper: Normalize String for Matching
    function normalizeString(str) {
        if (!str) return '';
        const withoutExt = str.replace(/\.(png|jpe?g|webp|gif|svg|bmp)$/i, '');
        return withoutExt.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
    }

    // Helper: Smart Score for matching product item name with file name
    function calculateMatchScore(itemName, filename) {
        const normItem = normalizeString(itemName);
        const normFile = normalizeString(filename);

        if (!normItem || !normFile) return 0;

        // 1. Exact match
        if (normItem === normFile) return 100;

        // 2. Spaces stripped match (e.g. "GREEN CHILLIY" matches "greenchilliy")
        const itemNoSpace = normItem.replace(/\s+/g, '');
        const fileNoSpace = normFile.replace(/\s+/g, '');
        if (itemNoSpace === fileNoSpace) return 95;

        // 3. Substring match
        if (fileNoSpace.includes(itemNoSpace) || itemNoSpace.includes(fileNoSpace)) return 80;

        // 4. Token overlap
        const itemTokens = normItem.split(' ').filter(t => t.length > 1);
        const fileTokens = normFile.split(' ').filter(t => t.length > 1);

        if (itemTokens.length === 0 || fileTokens.length === 0) return 0;

        const matchedTokens = itemTokens.filter(t => fileTokens.includes(t));
        if (matchedTokens.length === itemTokens.length) return 75;

        const matchRatio = matchedTokens.length / itemTokens.length;
        if (matchRatio >= 0.5) return Math.round(matchRatio * 60);

        return 0;
    }

    // --- 1. LOCAL FOLDER MATCHING ---
    if (matchFolderBtn) {
        matchFolderBtn.addEventListener('click', () => {
            if (items.length === 0) {
                showToast('Please upload or generate product data first before matching images.', 'error');
                return;
            }
            folderInput.click();
        });
    }

    if (folderInput) {
        folderInput.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg|bmp)$/i.test(f.name));

            if (files.length === 0) {
                showToast('No image files found in the selected folder.', 'error');
                return;
            }

            let matchedCount = 0;

            const readAsDataURL = (file) => new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (evt) => resolve(evt.target.result);
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(file);
            });

            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (!item.name) continue;

                let bestMatchFile = null;
                let bestScore = 0;

                for (const file of files) {
                    const score = calculateMatchScore(item.name, file.name);
                    if (score > bestScore && score >= 50) {
                        bestScore = score;
                        bestMatchFile = file;
                    }
                }

                if (bestMatchFile) {
                    const dataUrl = await readAsDataURL(bestMatchFile);
                    if (dataUrl) {
                        item.image = dataUrl;
                        matchedCount++;
                    }
                }
            }

            renderGridPages();
            adjustAllFontSizes();

            if (matchedCount > 0) {
                showToast(`Successfully matched ${matchedCount} of ${items.length} product images from folder!`, 'success');
            } else {
                showToast(`Scanned ${files.length} images, but could not find matching product names (e.g. "TOMATO.jpg").`, 'info', 6000);
            }

            folderInput.value = '';
        });
    }

    // --- 2. GOOGLE DRIVE MATCHING ---
    document.querySelectorAll('.gdrive-tabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.gdrive-tabs .tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.gdrive-modal-content .tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });

    function openGdriveModal() {
        if (items.length === 0) {
            showToast('Please upload or generate product data first before matching images.', 'error');
            return;
        }
        if (gdriveStatus) {
            gdriveStatus.style.display = 'none';
            gdriveStatus.className = 'gdrive-status';
            gdriveStatus.innerHTML = '';
        }
        gdriveModal.style.display = 'flex';
    }

    function closeGdriveModal() {
        gdriveModal.style.display = 'none';
    }

    if (matchGdriveBtn) matchGdriveBtn.addEventListener('click', openGdriveModal);
    if (gdriveCloseBtn) gdriveCloseBtn.addEventListener('click', closeGdriveModal);
    if (gdriveCancelBtn) gdriveCancelBtn.addEventListener('click', closeGdriveModal);

    // Convert image URL to Base64 (to prevent CORS canvas export issues)
    async function fetchImageAsBase64(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) return null;
            const blob = await response.blob();
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(blob);
            });
        } catch (e) {
            return url; // fallback to direct URL
        }
    }

    // Helper: Extract Google Drive File ID
    function extractDriveFileId(str) {
        if (!str) return null;
        const match = str.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || 
                      str.match(/id=([a-zA-Z0-9_-]+)/) ||
                      str.match(/\/folders\/([a-zA-Z0-9_-]+)/);
        if (match) return match[1];
        if (/^[a-zA-Z0-9_-]{25,50}$/.test(str.trim())) return str.trim();
        return null;
    }

    if (gdriveFetchBtn) {
        gdriveFetchBtn.addEventListener('click', async () => {
            const activeTab = document.querySelector('.gdrive-tabs .tab-btn.active').getAttribute('data-tab');
            
            gdriveStatus.style.display = 'block';
            gdriveStatus.className = 'gdrive-status info';
            gdriveStatus.innerHTML = 'Connecting to Google Drive and scanning images...';
            gdriveFetchBtn.disabled = true;

            let matchedCount = 0;

            try {
                if (activeTab === 'tab-folder') {
                    const folderInputVal = gdriveFolderUrlInput.value.trim();
                    const apiKey = gdriveApiKeyInput.value.trim();
                    const folderId = extractDriveFileId(folderInputVal);

                    if (!folderId) {
                        gdriveStatus.className = 'gdrive-status error';
                        gdriveStatus.innerHTML = 'Please enter a valid Google Drive Folder URL or Folder ID.';
                        gdriveFetchBtn.disabled = false;
                        return;
                    }

                    if (apiKey) {
                        const apiUrl = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+mimeType+contains+'image/'&fields=files(id,name)&key=${apiKey}`;
                        const res = await fetch(apiUrl);
                        if (!res.ok) {
                            throw new Error(`Google Drive API error (${res.status}). Verify API Key and Folder sharing settings.`);
                        }
                        const data = await res.json();
                        const files = data.files || [];

                        for (let i = 0; i < items.length; i++) {
                            const item = items[i];
                            if (!item.name) continue;

                            let bestMatch = null;
                            let bestScore = 0;

                            for (const file of files) {
                                const score = calculateMatchScore(item.name, file.name);
                                if (score > bestScore && score >= 50) {
                                    bestScore = score;
                                    bestMatch = file;
                                }
                            }

                            if (bestMatch) {
                                const directUrl = `https://lh3.googleusercontent.com/d/${bestMatch.id}`;
                                const base64 = await fetchImageAsBase64(directUrl);
                                if (base64) {
                                    item.image = base64;
                                    matchedCount++;
                                }
                            }
                        }
                    } else {
                        // Without API key: try parsing public folder view or fallback instructions
                        try {
                            const corsProxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://drive.google.com/drive/folders/${folderId}`)}`;
                            const pageRes = await fetch(corsProxyUrl);
                            const pageHtml = await pageRes.text();

                            const matches = [...pageHtml.matchAll(/\["([a-zA-Z0-9_-]{25,50})",\["([^"]+)"/g)];
                            const extractedFiles = matches.map(m => ({ id: m[1], name: m[2] }));

                            if (extractedFiles.length > 0) {
                                for (let i = 0; i < items.length; i++) {
                                    const item = items[i];
                                    if (!item.name) continue;
                                    let bestMatch = null;
                                    let bestScore = 0;
                                    for (const file of extractedFiles) {
                                        const score = calculateMatchScore(item.name, file.name);
                                        if (score > bestScore && score >= 50) {
                                            bestScore = score;
                                            bestMatch = file;
                                        }
                                    }
                                    if (bestMatch) {
                                        const directUrl = `https://lh3.googleusercontent.com/d/${bestMatch.id}`;
                                        const base64 = await fetchImageAsBase64(directUrl);
                                        if (base64) {
                                            item.image = base64;
                                            matchedCount++;
                                        }
                                    }
                                }
                            } else {
                                throw new Error('Could not parse public folder items.');
                            }
                        } catch (err) {
                            gdriveStatus.className = 'gdrive-status error';
                            gdriveStatus.innerHTML = `Could not list folder automatically without API Key. Tip: Use the "Bulk Links / URLs" tab to paste share links directly, or provide an API Key.`;
                            gdriveFetchBtn.disabled = false;
                            return;
                        }
                    }
                } else {
                    // Tab 2: Bulk Links / URLs
                    const rawText = gdriveLinksInput.value.trim();
                    if (!rawText) {
                        gdriveStatus.className = 'gdrive-status error';
                        gdriveStatus.innerHTML = 'Please paste at least one Google Drive link or image URL.';
                        gdriveFetchBtn.disabled = false;
                        return;
                    }

                    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

                    for (const line of lines) {
                        let targetProductName = '';
                        let urlStr = line;

                        if (line.includes(':')) {
                            const parts = line.split(':');
                            targetProductName = parts[0].trim();
                            urlStr = parts.slice(1).join(':').trim();
                        }

                        const fileId = extractDriveFileId(urlStr);
                        if (!fileId && !urlStr.startsWith('http')) continue;

                        const directUrl = fileId ? `https://lh3.googleusercontent.com/d/${fileId}` : urlStr;
                        const base64 = await fetchImageAsBase64(directUrl);

                        if (base64) {
                            if (targetProductName) {
                                for (const item of items) {
                                    if (calculateMatchScore(item.name, targetProductName) >= 50) {
                                        item.image = base64;
                                        matchedCount++;
                                        break;
                                    }
                                }
                            } else {
                                for (const item of items) {
                                    if (!item.image && calculateMatchScore(item.name, urlStr) >= 40) {
                                        item.image = base64;
                                        matchedCount++;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }

                renderGridPages();
                adjustAllFontSizes();

                if (matchedCount > 0) {
                    gdriveStatus.className = 'gdrive-status';
                    gdriveStatus.innerHTML = `Successfully matched ${matchedCount} product image(s) from Google Drive!`;
                    showToast(`Matched ${matchedCount} image(s) from Google Drive!`, 'success');
                    setTimeout(() => closeGdriveModal(), 1500);
                } else {
                    gdriveStatus.className = 'gdrive-status info';
                    gdriveStatus.innerHTML = 'No product names matched with the files found. Make sure file names match product titles.';
                }
            } catch (err) {
                console.error('GDrive Match Error:', err);
                gdriveStatus.className = 'gdrive-status error';
                gdriveStatus.innerHTML = `Error: ${err.message}`;
            } finally {
                gdriveFetchBtn.disabled = false;
            }
        });
    }
});

