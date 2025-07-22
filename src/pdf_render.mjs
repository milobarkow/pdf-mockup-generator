import { createPdf, updatePdfInfo, clearFormInputs, resetPdfInfo, adjustLogo } from "./mockup.mjs";
import { pages, currentPage, togglePrintPreview, changeCurrentPage, addPage, removePage, changeDirection } from "./state.mjs"
import { showWarning } from "./util.mjs";

var canvas = document.getElementById('pdf-canvas');
var context = canvas.getContext('2d');

var pdf = null;
var pdfBytes = null;
var pageRendering = false;
var pageNumPending = null;


// multi page rendering taken from https://mozilla.github.io/pdf.js/examples/

export async function renderPdfPage(pageNum) {

    if (typeof pdfBytes === "undefined" || pdfBytes === null) {
        console.error("no PDF data provided");
        return;
    }

    var totalHeight = 0;
    var maxWidth = 0;
    var scale = 1;

    pdf.getPage(pageNum).then(function(page) {
        const viewport = page.getViewport({ scale: scale });
        totalHeight += viewport.height;
        maxWidth = Math.max(maxWidth, viewport.width);

        var outputScale = 4;
        canvas.width = Math.floor(maxWidth * outputScale);
        canvas.height = Math.floor(totalHeight * outputScale);

        var yOffset = 0;

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

        var renderTask = page.render(renderContext);

        // Wait for rendering to finish
        renderTask.promise.then(function() {
            pageRendering = false;
            if (pageNumPending !== null) {
                // New page rendering is pending
                renderPdfPage(pageNumPending);
                pageNumPending = null;
            }
        });

        yOffset += viewport.height;
    });
}

function queueRenderPage(num) {
    if (pageRendering) {
        pageNumPending = num;
    } else {
        renderPdfPage(num);
    }
}

document.getElementById("incrPage").addEventListener("click", async function() {
    changeDirection("incr");
    clearFormInputs();
    queueRenderPage(currentPage + 1);
});

document.getElementById("decrPage").addEventListener("click", async function() {
    changeDirection("decr");
    clearFormInputs();
    queueRenderPage(currentPage + 1);
});

async function updateOnPdfChange() {
    pdfBytes = await createPdf();
    pdfjsLib.getDocument({ data: pdfBytes }).promise.then(async function(pdfDoc) {
        pdf = pdfDoc;
        await renderPdfPage(currentPage + 1);
    });
}

// update pdf on initial open
(async () => {
    updateOnPdfChange();
})();

async function exportPdf() {
    pdfBytes = await createPdf();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const pdfName = pages[currentPage].info.pdfName;
    link.download = pdfName;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    console.log(`PDF saved as ${pdfName}`);
    return;
}


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
    } else if (action == "removePage") {
        removePage();
    }

    updateOnPdfChange();
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

    switch (action) {
        case "updatePdf": updatePdfInfo(e.target); updateOnPdfChange(); break;
        case "resetDefaults": resetPdfInfo(); updateOnPdfChange(); break;
        case "clearForm": clearFormInputs(); break;
        case "clearImg": clearFormImages(e.submitter?.id); break;
        case "togglePrintPreview": togglePrintPreview(); updateOnPdfChange(); break;
        case "adjustFrontLogo": await adjustLogo("front"); break;
        case "adjustBackLogo": await adjustLogo("back"); break;
        case "exportPdf": await exportPdf(); break;
        default: break;
    }
}

window.handlePopupData = function(data) {
    const side = data.side;
    if (side === "front") {
        pages[currentPage].info.shirtFrontImg = data.imgUrl;
        updateOnPdfChange();
    } else if (side === "back") {
        pages[currentPage].info.shirtBackImg = data.imgUrl;
        updateOnPdfChange();
    } else {
        console.error("invalid side");
    }
};
