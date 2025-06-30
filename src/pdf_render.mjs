import { createPdf, updatePdfInfo, resetPdfInfo, togglePrintPreview, updateCurrentPage, adjustLogo } from "./mockup.mjs";
import { pdfInfo } from "./state.mjs"

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

    console.log(`pdf page count: ${pdf.numPages}`);

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
    return true;
}

document.getElementById("page-info-form").addEventListener("submit", async function(e) {
    e.preventDefault();

    const form = e.target;

    const currentPage = parseInt(form.currentPage.value, 10);
    const currentPageInput = document.getElementById("currentPage");

    const minPage = currentPageInput.min;
    const maxPage = currentPageInput.max;
    if (currentPage < minPage || currentPage > maxPage) {
        alert(`Please enter a valid age between ${minPage} and ${maxPage}.`);
    }

    const currentPageType = form.currentPageType.value;

    await updateCurrentPage(currentPage, currentPageType);

    var pdfBytes = await createPdf();
    renderPdf(pdfBytes);
});

document.getElementById("pdfForm").addEventListener("submit", async function(e) {
    e.preventDefault(); // prevent page reload

    const action = e.submitter?.value; // gets value of the button that triggered submit

    if (action === "updatePdf") {
        console.log("updating PDF");
        const form = e.target;
        updatePdfInfo(form);
    } else if (action === "resetInfo") {
        console.log("restoring default PDF info");
        resetPdfInfo();
    } else if (action === "clearForm") {
        console.log("clearing form");
        document.getElementById("pdfForm").reset();
    } else if (action === "clearImg") {
        const id = e.submitter?.id;
        if (id == "frontBlankImgClear") {
            document.getElementById("frontBlankImage").value = "";
            pdfInfo.shirtFrontImg = "";
        } else if (id == "backBlankImgClear") {
            document.getElementById("backBlankImage").value = "";
            pdfInfo.shirtBackImg = "";
        } else if (id == "shirtFrontLogoClear") {
            document.getElementById("frontLogoImage").value = "";
            pdfInfo.frontLogoImg = "";
        } else if (id == "shirtBackLogoClear") {
            document.getElementById("backLogoImage").value = "";
            pdfInfo.backLogoImg = "";
        }
        return;
    } else if (action === "togglePrintPreview") {
        console.log("toggling print preview (border boxes)");
        togglePrintPreview();
    } else if (action === "adjustFrontLogo") {
        console.log("Adjusting Front Logo");
        await adjustLogo("front");
    } else if (action === "adjustBackLogo") {
        console.log("Adjusting Back Logo");
        await adjustLogo("back");
    }


    var pdfBytes = await createPdf();
    renderPdf(pdfBytes);

    if (action === "exportPdf") {
        if (!exportPdf(pdfBytes)) {
            console.log("failure exporting pdf");
        }
    }
});


