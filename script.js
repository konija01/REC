const page1 = document.getElementById('page-1');
const page2 = document.getElementById('page-2');
const page3 = document.getElementById('page-3');
const startEvaluationBtn = document.getElementById('start-evaluation');
const previousPageBtn = document.getElementById('previous-page');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const categorySelect = document.getElementById('category-select');
const penToolBtn = document.getElementById('pen-tool');
const lassoToolBtn = document.getElementById('lasso-tool');
const rectangleToolBtn = document.getElementById('rectangle-tool');
const eraserToolBtn = document.getElementById('eraser-tool');
const editToolBtn = document.getElementById('edit-tool');
const resultsBtn = document.getElementById('results');
const downloadAllResultsBtn = document.getElementById('download-all-results');
const nextImageBtn = document.getElementById('next-image');
const previousImageBtn = document.getElementById('previous-image');

let images = [];
let currentImageIndex = 0;
let isPenActive = false;
let isLassoActive = false;
let isRectangleActive = false;
let isEraserActive = false;
let isEditActive = false;
let selections = [];
let penPoints = [];
let isDrawing = false;
let selectedPoint = null;

canvas.width = 1000;

function showPage(page) {
    [page1, page2, page3].forEach(p => p.classList.add('hidden'));
    page.classList.remove('hidden');
}

startEvaluationBtn.addEventListener('click', () => {
    const files = document.getElementById('image-upload').files;
    if (files.length === 0) return;

    images = Array.from(files).map(file => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        return { img, selections: [] };
    });

    images[0].img.onload = () => {
        resizeAndDrawImage(images[0].img);
    };

    showPage(page2);
});

previousPageBtn.addEventListener('click', () => {
    showPage(page1);
});

previousImageBtn.addEventListener('click', () => {
    if (currentImageIndex > 0) {
        saveCurrentSelection();
        currentImageIndex--;
        selections = images[currentImageIndex].selections || [];
        resizeAndDrawImage(images[currentImageIndex].img);
        drawSelections();
    }
});

nextImageBtn.addEventListener('click', () => {
    if (currentImageIndex < images.length - 1) {
        saveCurrentSelection();
        currentImageIndex++;
        selections = images[currentImageIndex].selections || [];
        resizeAndDrawImage(images[currentImageIndex].img);
        drawSelections();
    }
});

penToolBtn.addEventListener('click', () => {
    isPenActive = true;
    isLassoActive = false;
    isRectangleActive = false;
    isEraserActive = false;
    isEditActive = false;
    updateToolSelection();
    canvas.style.cursor = 'crosshair';
});

lassoToolBtn.addEventListener('click', () => {
    isPenActive = false;
    isLassoActive = true;
    isRectangleActive = false;
    isEraserActive = false;
    isEditActive = false;
    updateToolSelection();
    canvas.style.cursor = 'crosshair';
});

rectangleToolBtn.addEventListener('click', () => {
    isPenActive = false;
    isLassoActive = false;
    isRectangleActive = true;
    isEraserActive = false;
    isEditActive = false;
    updateToolSelection();
    canvas.style.cursor = 'crosshair';
});

eraserToolBtn.addEventListener('click', () => {
    isPenActive = false;
    isLassoActive = false;
    isRectangleActive = false;
    isEraserActive = true;
    isEditActive = false;
    updateToolSelection();
    canvas.style.cursor = 'cell';
});

editToolBtn.addEventListener('click', () => {
    isPenActive = false;
    isLassoActive = false;
    isRectangleActive = false;
    isEraserActive = false;
    isEditActive = true;
    updateToolSelection();
    canvas.style.cursor = 'move';
});

function updateToolSelection() {
    penToolBtn.classList.toggle('selected', isPenActive);
    lassoToolBtn.classList.toggle('selected', isLassoActive);
    rectangleToolBtn.classList.toggle('selected', isRectangleActive);
    eraserToolBtn.classList.toggle('selected', isEraserActive);
    editToolBtn.classList.toggle('selected', isEditActive);
}

canvas.addEventListener('mousedown', (e) => {
    if (isPenActive) {
        addPenPoint(e);
        isDrawing = true;
    }
    if (isLassoActive) startLasso(e);
    if (isRectangleActive) startRectangle(e);
    if (isEraserActive) startErasing(e);
    if (isEditActive) selectEditPoint(e);
});

canvas.addEventListener('mousemove', (e) => {
    if (isPenActive && isDrawing) {
        drawPenPreview(e);
    }
    if (isEditActive && selectedPoint) {
        moveEditPoint(e);
    }
});

canvas.addEventListener('mouseup', () => {
    if (isPenActive) {
        isDrawing = false;
    }
    if (isEditActive) {
        selectedPoint = null;
    }
});

canvas.addEventListener('dblclick', () => {
    if (isPenActive) finishPen();
});

function resizeAndDrawImage(img) {
    const aspectRatio = img.width / img.height;
    const newHeight = canvas.width / aspectRatio;

    canvas.height = newHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, newHeight);
}

function addPenPoint(e) {
    const x = e.offsetX;
    const y = e.offsetY;
    penPoints.push({ x, y, curve: false });
    drawPenLines();
}

function drawPenLines() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    resizeAndDrawImage(images[currentImageIndex].img);
    drawSelections();

    if (penPoints.length > 0) {
        ctx.beginPath();
        ctx.moveTo(penPoints[0].x, penPoints[0].y);
        for (let i = 1; i < penPoints.length; i++) {
            const p = penPoints[i];
            const prevP = penPoints[i - 1];
            if (p.curve) {
                ctx.quadraticCurveTo(prevP.x, prevP.y, p.x, p.y);
            } else {
                ctx.lineTo(p.x, p.y);
            }
        }
        ctx.strokeStyle = getCategoryColor(categorySelect.value);
        ctx.lineWidth = 2;
        ctx.stroke();
        drawAnchorPoints(penPoints);
    }
}

function drawPenPreview(e) {
    if (penPoints.length > 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        resizeAndDrawImage(images[currentImageIndex].img);
        drawSelections();

        ctx.beginPath();
        ctx.moveTo(penPoints[0].x, penPoints[0].y);
        for (let i = 1; i < penPoints.length; i++) {
            const p = penPoints[i];
            const prevP = penPoints[i - 1];
            if (p.curve) {
                ctx.quadraticCurveTo(prevP.x, prevP.y, p.x, p.y);
            } else {
                ctx.lineTo(p.x, p.y);
            }
        }
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.strokeStyle = getCategoryColor(categorySelect.value);
        ctx.lineWidth = 2;
        ctx.stroke();
        drawAnchorPoints(penPoints);
    }
}

function drawAnchorPoints(points) {
    points.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI); // Smaller points
        ctx.fillStyle = 'black';
        ctx.fill();
    });
}

function finishPen() {
    if (penPoints.length > 0) {
        ctx.closePath();
        if (!isOverlap(penPoints, 'pen')) {
            selections.push({ type: 'pen', points: penPoints, category: categorySelect.value });
        }
        penPoints = [];
        drawSelections();
    }
}

function startLasso(e) {
    let points = [];
    const startX = e.offsetX;
    const startY = e.offsetY;
    points.push({ x: startX, y: startY });

    function drawLasso(e) {
        const x = e.offsetX;
        const y = e.offsetY;
        points.push({ x, y });
        ctx.lineTo(x, y);
        ctx.stroke();
    }

    function endLasso() {
        canvas.removeEventListener('mousemove', drawLasso);
        canvas.removeEventListener('mouseup', endLasso);
        ctx.closePath();

        if (!isOverlap(points, 'lasso')) {
            selections.push({ type: 'lasso', points, category: categorySelect.value });
        }
        drawSelections();
    }

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineWidth = 2;
    ctx.strokeStyle = getCategoryColor(categorySelect.value);
    ctx.fillStyle = getCategoryColorWithTransparency(categorySelect.value);
    canvas.addEventListener('mousemove', drawLasso);
    canvas.addEventListener('mouseup', endLasso);
}

function startRectangle(e) {
    const startX = e.offsetX;
    const startY = e.offsetY;

    function drawRectangle(e) {
        const x = e.offsetX;
        const y = e.offsetY;
        const width = x - startX;
        const height = y - startY;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        resizeAndDrawImage(images[currentImageIndex].img);
        drawSelections();

        ctx.strokeStyle = getCategoryColor(categorySelect.value);
        ctx.strokeRect(startX, startY, width, height);
        ctx.fillStyle = getCategoryColorWithTransparency(categorySelect.value);
        ctx.fillRect(startX, startY, width, height);
    }

    function endRectangle(e) {
        canvas.removeEventListener('mousemove', drawRectangle);
        canvas.removeEventListener('mouseup', endRectangle);
        const endX = e.offsetX;
        const endY = e.offsetY;
        const width = endX - startX;
        const height = endY - startY;

        if (!isOverlap([{ x: startX, y: startY }, { x: endX, y: endY }], 'rectangle')) {
            selections.push({
                type: 'rectangle',
                points: [
                    { x: startX, y: startY },
                    { x: endX, y: startY },
                    { x: endX, y: endY },
                    { x: startX, y: endY }
                ],
                startX, startY, width, height, category: categorySelect.value
            });
        }
        drawSelections();
    }

    canvas.addEventListener('mousemove', drawRectangle);
    canvas.addEventListener('mouseup', endRectangle);
}

function startErasing(e) {
    const x = e.offsetX;
    const y = e.offsetY;

    selections = selections.filter(selection => {
        if (selection.type === 'rectangle') {
            return !(x >= selection.startX && x <= selection.startX + selection.width && y >= selection.startY && y <= selection.startY + selection.height);
        }
        if (selection.type === 'lasso' || selection.type === 'pen') {
            return !isPointInPolygon(selection.points, { x, y });
        }
        return true;
    });

    drawSelections();
}

function selectEditPoint(e) {
    const x = e.offsetX;
    const y = e.offsetY;
    selections.forEach(selection => {
        selection.points.forEach(point => {
            if (Math.abs(point.x - x) < 5 && Math.abs(point.y - y) < 5) {
                selectedPoint = point;
            }
        });
    });
}

function moveEditPoint(e) {
    if (selectedPoint) {
        selectedPoint.x = e.offsetX;
        selectedPoint.y = e.offsetY;
        drawSelections();
    }
}

function isPointInPolygon(points, point) {
    let isInside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const xi = points[i].x, yi = points[i].y;
        const xj = points[j].x, yj = points[j].y;

        const intersect = ((yi > point.y) !== (yj > point.y))
            && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
        if (intersect) isInside = !isInside;
    }
    return isInside;
}

function drawSelections() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    resizeAndDrawImage(images[currentImageIndex].img);

    selections.forEach(selection => {
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = getCategoryColor(selection.category);
        ctx.fillStyle = getCategoryColorWithTransparency(selection.category);

        if (selection.type === 'rectangle') {
            const [startX, startY, endX, endY] = [
                selection.points[0].x, selection.points[0].y,
                selection.points[2].x, selection.points[2].y
            ];
            ctx.strokeRect(startX, startY, endX - startX, endY - startY);
            ctx.fillRect(startX, startY, endX - startX, endY - startY);
        } else if (selection.type === 'lasso' || selection.type === 'pen') {
            ctx.moveTo(selection.points[0].x, selection.points[0].y);
            for (let i = 1; i < selection.points.length; i++) {
                const p = selection.points[i];
                const prevP = selection.points[i - 1];
                if (p.curve) {
                    ctx.quadraticCurveTo(prevP.x, prevP.y, p.x, p.y);
                } else {
                    ctx.lineTo(p.x, p.y);
                }
            }
            ctx.closePath();
            ctx.fill();
            if (selection.type === 'pen') {
                drawAnchorPoints(selection.points);
            }
        }
        ctx.stroke();
    });
}

function getCategoryColor(category) {
    switch (category) {
        case 'map':
            return 'blue';
        case 'dataviz':
            return 'green';
        case 'text':
            return 'red';
        case 'illustration':
            return 'purple';
        default:
            return 'black';
    }
}

function getCategoryColorWithTransparency(category) {
    switch (category) {
        case 'map':
            return 'rgba(0, 0, 255, 0.15)';
        case 'dataviz':
            return 'rgba(0, 128, 0, 0.15)';
        case 'text':
            return 'rgba(255, 0, 0, 0.15)';
        case 'illustration':
            return 'rgba(128, 0, 128, 0.15)';
        default:
            return 'rgba(0, 0, 0, 0.15)';
    }
}

function isOverlap(points, type) {
    return selections.some(selection => {
        if (type === 'rectangle' && selection.type === 'rectangle') {
            const [x1, y1, x2, y2] = [points[0].x, points[0].y, points[1].x, points[1].y];
            const [sx1, sy1, sx2, sy2] = [selection.startX, selection.startY, selection.startX + selection.width, selection.startY + selection.height];
            return !(x2 < sx1 || x1 > sx2 || y2 < sy1 || y1 > sy2);
        }
        if ((type === 'lasso' || type === 'pen') && (selection.type === 'lasso' || selection.type === 'pen')) {
            return points.some(point => selection.points.some(sp => Math.abs(point.x - sp.x) < 5 && Math.abs(point.y - sp.y) < 5));
        }
        return false;
    });
}

function saveCurrentSelection() {
    images[currentImageIndex].selections = selections;
}

resultsBtn.addEventListener('click', () => {
    saveCurrentSelection();
    showPage(page3);
});

downloadAllResultsBtn.addEventListener('click', () => {
    const zip = new JSZip();
    
    images.forEach((image, index) => {
        if (image.selections.length === 0) return; // Skip images without selections
        
        // Add CSV
        let csvContent = "Image Name,Category,Type,Coordinates/Size,Percentage\n";
        const totalArea = canvas.width * canvas.height;

        image.selections.forEach(selection => {
            const name = `Image ${index + 1}`;
            const category = selection.category;
            const type = selection.type;
            let coords, area, percentage;

            if (type === 'rectangle') {
                coords = `(${selection.startX},${selection.startY}), (${selection.startX + selection.width},${selection.startY + selection.height})`;
                area = selection.width * selection.height;
            } else if (type === 'lasso' || type === 'pen') {
                coords = selection.points.map(point => `(${point.x},${point.y})`).join('; ');
                area = calculateLassoArea(selection.points);
            }

            percentage = ((area / totalArea) * 100).toFixed(2);

            csvContent += `${name},${category},${type},${coords},${percentage}%\n`;
        });

        zip.file(`evaluation_results_image_${index + 1}.csv`, csvContent);

        // Add Screenshot
        resizeAndDrawImage(image.img);
        drawSelectionsForImage(image.selections, image.img);

        canvas.toBlob(function(blob) {
            zip.file(`screenshot_image_${index + 1}.png`, blob);
            if (index === images.length - 1) {
                zip.generateAsync({ type: 'blob' }).then(function(content) {
                    saveAs(content, 'evaluation_results.zip');
                });
            }
        }, 'image/png');
    });
});

function drawSelectionsForImage(selections, img) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    resizeAndDrawImage(img);

    selections.forEach(selection => {
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = getCategoryColor(selection.category);
        ctx.fillStyle = getCategoryColorWithTransparency(selection.category);

        if (selection.type === 'rectangle') {
            const [startX, startY, endX, endY] = [
                selection.points[0].x, selection.points[0].y,
                selection.points[2].x, selection.points[2].y
            ];
            ctx.strokeRect(startX, startY, endX - startX, endY - startY);
            ctx.fillRect(startX, startY, endX - startX, endY - startY);
        } else if (selection.type === 'lasso' || selection.type === 'pen') {
            ctx.moveTo(selection.points[0].x, selection.points[0].y);
            for (let i = 1; i < selection.points.length; i++) {
                const p = selection.points[i];
                const prevP = selection.points[i - 1];
                if (p.curve) {
                    ctx.quadraticCurveTo(prevP.x, prevP.y, p.x, p.y);
                } else {
                    ctx.lineTo(p.x, p.y);
                }
            }
            ctx.closePath();
            ctx.fill();
            if (selection.type === 'pen') {
                drawAnchorPoints(selection.points);
            }
        }
        ctx.stroke();
    });
}

function calculateLassoArea(points) {
    let area = 0;
    for (let i = 0; i < points.length - 1; i++) {
        area += points[i].x * points[i + 1].y - points[i + 1].x * points[i].y;
    }
    area += points[points.length - 1].x * points[0].y - points[0].x * points[points.length - 1].y;
    return Math.abs(area / 2);
}

showPage(page1);

