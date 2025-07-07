import { createPdf, updatePdfInfo, clearFormInputs, resetPdfInfo, adjustLogo } from "./mockup.mjs";
import { pages, currentPage, togglePrintPreview, changeCurrentPage, addPage, changeDirection } from "./state.mjs"
import { showWarning } from "./util.mjs";

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

    // for (let i = 1; i <= pdf.numPages; i++) {
    for (let i = 1; i <= 1; i++) {
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

    // for (let i = 0; i < pdf.numPages; i++) {
    for (let i = 0; i < 1; i++) {
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

async function exportPdf(pdfBytes) {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = pages[currentPage].info.pdfName;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    console.log(`PDF saved as ${pages[currentPage].info.pdfName}`);
    return;
}

// set defaults and render on initial open
(async () => {
    const pdfBytes = await createPdf();
    await renderPdf(pdfBytes);
})();

document.getElementById("incrPage").addEventListener("click", async function() {
    changeDirection("incr");
    clearFormInputs();
    var pdfBytes = await createPdf();
    await renderPdf(pdfBytes);
});
document.getElementById("decrPage").addEventListener("click", async function() {
    changeDirection("decr");
    clearFormInputs();
    var pdfBytes = await createPdf();
    await renderPdf(pdfBytes);
});

document.getElementById("page-info-form").addEventListener("submit", async function(e) {
    e.preventDefault();
    e.preventDefault(); // prevent page reload

    const action = e.submitter?.value; // gets value of the button that triggered submit

    if (action === "updateCurrentPage") {
        const form = e.target;

        clearFormInputs();

        const newCurrentPage = parseInt(document.getElementById("current-page-input").value, 10);

        const minPage = 1;
        const maxPage = pages.length;
        if (newCurrentPage < minPage || newCurrentPage > maxPage) {
            showWarning(`Please enter a valid age between ${minPage} and ${maxPage}.`); return;
        }

        const newCurrentPageType = form.currentPageType.value;

        changeCurrentPage(newCurrentPageType);
        clearFormInputs();

    } else if (action == "addPage") {
        addPage();
    }

    var pdfBytes = await createPdf();
    await renderPdf(pdfBytes);

});


['pdf-form-1', 'pdf-form-2'].forEach(formId => {
    document
        .getElementById(formId)
        .addEventListener('submit', onPdfFormSubmit);
});

function clearFormImages(id, clearAll = false) {
    const currentPageType = pages[currentPage].type;
    if (id == `frontBlankImgClear${currentPageType}` || clearAll) {
        document.getElementById(`frontBlankImage${currentPageType}`).value = "";
        pages[currentPage].info.shirtFrontImg = "";
        pages[currentPage].info.frontBlankImg = "";
    } else if (id == `backBlankImgClear1` || clearAll) {
        document.getElementById(`backBlankImage${currentPageType}`).value = "";
        pages[currentPage].info.shirtBackImg = "";
        pages[currentPage].info.backBlankImg = "";
    } else if (id == `shirtFrontLogoClear${currentPageType}` || clearAll) {
        document.getElementById(`frontLogoImage${currentPageType}`).value = "";
        pages[currentPage].info.frontLogoImg = "";
    } else if (id == `shirtBackLogoClear2` || clearAll) {
        document.getElementById(`backLogoImage${currentPageType}`).value = "";
        pages[currentPage].info.backLogoImg = "";
    }
}

async function onPdfFormSubmit(e) {
    e.preventDefault(); // prevent page reload

    const action = e.submitter?.value; // gets value of the button that triggered submit

    if (action === "updatePdf") {
        updatePdfInfo(e.target);
    } else if (action === "resetInfo") {
        await resetPdfInfo();
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
    await renderPdf(pdfBytes);

    if (action === "exportPdf") {
        exportPdf(pdfBytes);
    }
}
