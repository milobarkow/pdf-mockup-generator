import { createPdf, updatePdfInfo, updatePdfImageInfo, resetPdfInfo, getPdfInfo, togglePrintPreview } from './mockup.mjs';

var canvas = document.getElementById('pdf-canvas');
var context = canvas.getContext('2d');

async function renderPdf(pdfData) {
    var loadingTask;
    if (typeof pdfData === "undefined") {
        console.error("no PDF data provided");
    } else {
        loadingTask = pdfjsLib.getDocument({ data: pdfData });
    }

    // loadingTask.promise.then(async function(pdf) {
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
    console.log(pdfBytes);

    var pdfInfo = await getPdfInfo();

    const blob = new Blob([pdfBytes], { type: 'application/pdf' });

    // Create a download link and trigger it
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = pdfInfo.pdfName;
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    console.log(`PDF saved as ${pdfInfo.pdfName}`);
    return true;
}

document.getElementById("pdfForm").addEventListener("submit", async function(e) {
    e.preventDefault(); // prevent page reload

    const action = e.submitter?.value; // gets value of the button that triggered submit

    if (action === "updatePdf") {
        console.log("updating PDF");

        const form = e.target;

        const title = form.title.value;
        const subtitle = form.subtitle.value;

        const shirtFrontImageFile = document.getElementById("shirtFrontImage").files[0];
        const c1Type = form.printTypeFront.value;
        const c1Dims = form.printDimsFront.value;
        const c1Loc = form.printLocFront.value;

        const shirtBackImageFile = document.getElementById("shirtBackImage").files[0];
        const c2Type = form.printTypeBack.value;
        const c2Dims = form.printDimsBack.value;
        const c2Loc = form.printLocBack.value;

        const frontLogoImageFile = document.getElementById("frontLogoImage").files[0];
        const fcolor1 = form.fcolor1.value;
        const fcolor2 = form.fcolor2.value;
        const fcolor3 = form.fcolor3.value;
        const fcolor4 = form.fcolor4.value;
        const fcolor5 = form.fcolor5.value;
        const fcolor6 = form.fcolor6.value;
        const fcolor7 = form.fcolor7.value;
        const fcolor8 = form.fcolor8.value;
        const frontLogoColors = [fcolor1, fcolor2, fcolor3, fcolor4, fcolor5, fcolor6, fcolor7, fcolor8]

        const backLogoImageFile = document.getElementById("backLogoImage").files[0];
        const bcolor1 = form.bcolor1.value;
        const bcolor2 = form.bcolor2.value;
        const bcolor3 = form.bcolor3.value;
        const bcolor4 = form.bcolor4.value;
        const bcolor5 = form.bcolor5.value;
        const bcolor6 = form.bcolor6.value;
        const bcolor7 = form.bcolor7.value;
        const bcolor8 = form.bcolor8.value;
        const backLogoColors = [bcolor1, bcolor2, bcolor3, bcolor4, bcolor5, bcolor6, bcolor7, bcolor8]

        const mockupNum = form.mockupNum.value;

        const pdfName = form.pdfName.value;

        console.log("updating PDF info");
        updatePdfInfo(title, subtitle,
            shirtFrontImageFile, c1Type, c1Dims, c1Loc,
            shirtBackImageFile, c2Type, c2Dims, c2Loc,
            frontLogoImageFile, frontLogoColors,
            backLogoImageFile, backLogoColors,
            mockupNum, pdfName);
    } else if (action === "resetInfo") {
        console.log("restoring default PDF info");
        resetPdfInfo();
    } else if (action === "clearForm") {
        console.log("clearing form");
        document.getElementById("pdfForm").reset();
    } else if (action === "clearImg") {
        const id = e.submitter?.id;
        if (id == "shirtFrontImgClear") {
            document.getElementById("shirtFrontImage").value = "";
            updatePdfImageInfo("", null, null, null);
        } else if (id == "shirtBackImgClear") {
            document.getElementById("shirtBackImage").value = "";
            updatePdfImageInfo(null, "", null, null);
        }
        return;
    } else if (action === "togglePrintPreview") {
        console.log("toggling print preview (border boxes)");
        togglePrintPreview();
    }

    var pdfBytes = await createPdf();
    renderPdf(pdfBytes);

    if (action === "exportPdf") {
        if (!exportPdf(pdfBytes)) {
            console.log("failure exporting pdf");
        }
    }
});


