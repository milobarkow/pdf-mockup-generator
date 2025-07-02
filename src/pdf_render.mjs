import { createPdf, updatePdfInfo, clearFormInputs, resetPdfInfo, adjustLogo } from "./mockup.mjs";
import { pdfInfo, togglePrintPreview, updateCurrentPage, currentPageType } from "./state.mjs"

var canvas = document.getElementById('pdf-canvas');
var context = canvas.getContext('2d');

async function renderPdf(pdfData) {
    var loadingTask;
    if (typeof pdfData === "undefined") {
        console.error("no PDF data provided");
    } else {
        loadingTask = pdfjsLib.getDocument({ data: pdfData });
    }

    var pdf = await loadingTask.promise;

    const pageViewports = [];
    var totalHeight = 0;
    var maxWidth = 0;
    var scale = 1;

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: scale });
        totalHeight += viewport.height;
        maxWidth = Math.max(maxWidth, viewport.width);
        pageViewports.push({ page, viewport });
    }

    var outputScale = 0.9;
    canvas.width = Math.floor(maxWidth * outputScale);
    canvas.height = Math.floor(totalHeight * outputScale);

    var yOffset = 0;

    for (let i = 0; i < pdf.numPages; i++) {
        const page = pageViewports[i].page;
        const viewport = pageViewports[i].viewport;

        context.strokeStyle = '#ccc';     // light gray border
        context.lineWidth = 2;
        context.strokeRect(0, yOffset, viewport.width, viewport.height);

        context.save();
        var transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;
        context.translate(0, yOffset);
        var renderContext = {
            canvasContext: context,
            transform: transform,
            viewport: viewport
        };
        await page.render(renderContext).promise;
        context.restore();

        yOffset += viewport.height;
    }
}

// set defaults and render on initial open
(async () => {
    const pdfBytes = await createPdf();
    await renderPdf(pdfBytes);
})();

async function exportPdf(pdfBytes) {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = pdfInfo.pdfName;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    console.log(`PDF saved as ${pdfInfo.pdfName}`);
    return;
}

document.getElementById("page-info-form").addEventListener("submit", async function(e) {
    e.preventDefault();

    const form = e.target;

    document.getElementById(`pdf-form-${currentPageType}`).reset(); // clear current form before switching
    updatePdfInfo(form);

    const currentPage = parseInt(form.currentPage.value, 10);
    const currentPageInput = document.getElementById("currentPage");

    const minPage = currentPageInput.min;
    const maxPage = currentPageInput.max;
    if (currentPage < minPage || currentPage > maxPage) {
        alert(`Please enter a valid age between ${minPage} and ${maxPage}.`);
    }

    const newCurrentPageType = form.currentPageType.value;

    await updateCurrentPage(currentPage, newCurrentPageType);
    document.getElementById(`pdf-form-${currentPageType}`).reset(); // clear current form before switching
    updatePdfInfo(form);

    var pdfBytes = await createPdf();
    renderPdf(pdfBytes);
});


['pdf-form-1', 'pdf-form-2'].forEach(formId => {
    document
        .getElementById(formId)
        .addEventListener('submit', onPdfFormSubmit);
});

function clearFormImages(id, clearAll = false) {
    if (id == `frontBlankImgClear${currentPageType}` || clearAll) {
        document.getElementById(`frontBlankImage${currentPageType}`).value = "";
        pdfInfo.shirtFrontImg = "";
        pdfInfo.frontBlankImg = "";
    } else if (id == `backBlankImgClear1` || clearAll) {
        document.getElementById(`backBlankImage${currentPageType}`).value = "";
        pdfInfo.shirtBackImg = "";
        pdfInfo.backBlankImg = "";
    } else if (id == `shirtFrontLogoClear${currentPageType}` || clearAll) {
        document.getElementById(`frontLogoImage${currentPageType}`).value = "";
        pdfInfo.frontLogoImg = "";
    } else if (id == `shirtBackLogoClear2` || clearAll) {
        document.getElementById(`backLogoImage${currentPageType}`).value = "";
        pdfInfo.backLogoImg = "";
    }
}

async function onPdfFormSubmit(e) {
    e.preventDefault(); // prevent page reload

    const action = e.submitter?.value; // gets value of the button that triggered submit

    if (action === "updatePdf") {
        updatePdfInfo(e.target);
    } else if (action === "resetInfo") {
        resetPdfInfo();
    } else if (action === "clearForm") {
        clearFormInputs();
    } else if (action === "clearImg") {
        clearFormImages(e.submitter?.id); return;
    } else if (action === "togglePrintPreview") {
        togglePrintPreview();
    } else if (action === "adjustFrontLogo") {
        await adjustLogo("front");
    } else if (action === "adjustBackLogo") {
        await adjustLogo("back");
    }

    var pdfBytes = await createPdf();
    renderPdf(pdfBytes);

    if (action === "exportPdf") {
        exportPdf(pdfBytes);
    }
}
