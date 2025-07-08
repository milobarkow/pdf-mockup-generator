import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import * as s from "./state.mjs";
import { showWarning } from "./util.mjs";

async function getImg(pdfDoc, img, imgSrc) { //, fromUpload = false, fromBase64 = false) {
    var imgBytes, imgType;
    if (imgSrc == "upload") {
        imgBytes = await img.arrayBuffer();
        imgType = img.name.split('.').pop().toLowerCase();
    } else if (imgSrc == "base64") {
        imgType = "png";
        const response = await fetch(img);
        imgBytes = await response.arrayBuffer();
    } else {
        const response = await fetch(img);
        imgBytes = await response.arrayBuffer();
        const pathParts = img.split('.');
        imgType = pathParts.length > 1 ? pathParts.pop().toLowerCase() : '';
    }

    if (imgType == "png") {
        return await pdfDoc.embedPng(imgBytes);
    } else if (imgType == "jpg") {
        return await pdfDoc.embedJpg(imgBytes);
    }
    console.error("Bad image type, image must be .png or .jpg");
}

function hexToRgb(hex) {
    hex = hex.replace(/^#/, '');
    let r = parseInt(hex.substring(0, 2), 16) / 255;
    let g = parseInt(hex.substring(2, 4), 16) / 255;
    let b = parseInt(hex.substring(4, 6), 16) / 255;
    return rgb(r, g, b);
}

function putImage(page, img, imgX, imgY, imgWidth, imgHeight, showBorder = false) {
    page.drawImage(img, {
        x: imgX, y: imgY,
        width: imgWidth, height: imgHeight,
    });
    if (showBorder) {
        page.drawRectangle({
            x: imgX, y: imgY,
            width: imgWidth, height: imgHeight,
            borderColor: rgb(0, 0, 0),
            borderWidth: 1,
        });
    }
}

function putImageBorder(page, borderX, borderY, borderWidth, borderHeight, placeHolderText = null, placeHolderFont = null) {
    page.drawRectangle({
        x: borderX, y: borderY,
        width: borderWidth, height: borderHeight,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
    });

    if (placeHolderText && placeHolderFont) {
        const placeHolderFontSize = 28;
        const placeHolderColor = hexToRgb('#000000');
        const placeHolderX = borderX + borderWidth / 2 - placeHolderFont.widthOfTextAtSize(placeHolderText, placeHolderFontSize) / 2;
        const placeHolderY = borderY + borderHeight / 2 - placeHolderFontSize / 2;
        page.drawText(placeHolderText, {
            x: placeHolderX, y: placeHolderY,
            size: placeHolderFontSize, font: placeHolderFont, color: placeHolderColor,
        })
    }
}

function getCircleTextColor(hex) {
    let rgbColor = hexToRgb(hex);
    let r = rgbColor.red;
    let g = rgbColor.green;
    let b = rgbColor.blue;

    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (lum < 0.5) return rgb(1, 1, 1);
    return rgb(0, 0, 0);
}

function drawCircles(page, circleX, circleY, colors, circleSize, hexFont, maxWidth) {
    const circleXStart = circleX;
    const circleFontSize = 11;
    for (let i = 0; i < colors.length; i++) {
        let circleText = colors[i];
        let circleColor = hexToRgb(circleText);
        let circleBorderColor = circleColor;
        let circleTextColor = getCircleTextColor(circleText);

        if (circleText == "000000") {
            circleText = "black";
        } else if (circleText == "ffffff" || circleText == "FFFFFF") {
            circleText = "white";
            circleBorderColor = rgb(0, 0, 0);
        }

        page.drawCircle({
            x: circleX,
            y: circleY,
            size: circleSize,
            color: circleColor,
            borderWidth: 1,
            borderColor: circleBorderColor,
        })
        page.drawText(circleText, {
            x: circleX - hexFont.widthOfTextAtSize(circleText, circleFontSize) / 2,
            y: circleY - circleFontSize / 2,
            size: circleFontSize,
            font: hexFont,
            color: circleTextColor,
        })
        circleX += circleSize * 2.2
        if (circleX + circleSize >= maxWidth) {
            circleY -= circleSize * 2.25;
            circleX = circleXStart;
        }
    }
}

function getCaptionString(capObj) {
    var caption = [];
    if (capObj.type != "") {
        caption.push("Print Type: " + capObj.type);
    }
    if (capObj.dims != "") {
        caption.push("Dimensions: " + capObj.dims);
    }
    if (capObj.loc != "") {
        caption.push("Print Location: " + capObj.loc);
    }
    return caption;
}

export function updatePdfInfo(form) {
    console.log("updating PDF");

    switch (s.pages[s.currentPage].type) {
        case 1:
            {
                if (form.title) {
                    if (form.title.value == "") s.pages[s.currentPage].info.title = "Title";
                    else s.pages[s.currentPage].info.title = form.title.value;
                }
                if (form.subtitle) {
                    if (form.subtitle.value == "") s.pages[s.currentPage].info.subtitle = "Subtitle";
                    else s.pages[s.currentPage].info.subtitle = form.subtitle.value;
                }

                const frontBlankImageFile = document.getElementById("frontBlankImage1").files[0];
                if (frontBlankImageFile) s.pages[s.currentPage].info.frontBlankImg = frontBlankImageFile;

                const backBlankImageFile = document.getElementById("backBlankImage1").files[0];
                if (backBlankImageFile) s.pages[s.currentPage].info.backBlankImg = backBlankImageFile;

                const frontLogoImageFile = document.getElementById("frontLogoImage1").files[0];
                if (frontLogoImageFile) s.pages[s.currentPage].info.frontLogoImg = frontLogoImageFile;

                const backLogoImageFile = document.getElementById("backLogoImage1").files[0];
                if (backLogoImageFile) s.pages[s.currentPage].info.backLogoImg = backLogoImageFile;

                if (form.printTypeFront1) s.pages[s.currentPage].info.c1.type = form.printTypeFront1.value;
                if (form.printDimsFront1) s.pages[s.currentPage].info.c1.dims = form.printDimsFront1.value;
                if (form.printLocFront1) s.pages[s.currentPage].info.c1.loc = form.printLocFront1.value;

                if (form.printTypeBack1) s.pages[s.currentPage].info.c2.type = form.printTypeBack1.value;
                if (form.printDimsBack1) s.pages[s.currentPage].info.c2.dims = form.printDimsBack1.value;
                if (form.printLocBack1) s.pages[s.currentPage].info.c2.loc = form.printLocBack1.value;

                const frontLogoColors = Array.from({ length: 8 }, (_, i) =>
                    form[`fcolor${i + 1}`]?.value || ""
                );
                if (frontLogoColors) s.pages[s.currentPage].info.frontLogoColors = frontLogoColors;

                const backLogoColors = Array.from({ length: 8 }, (_, i) =>
                    form[`bcolor${i + 1}`]?.value || ""
                );
                if (backLogoColors) s.pages[s.currentPage].info.backLogoColors = backLogoColors;

                if (form.mockupNum && form.mockupNum.value) s.pages[s.currentPage].info.mockupNum = form.mockupNum.value;

                if (form.pdfName1) {
                    s.pages[s.currentPage].info.pdfName = form.pdfName1.value;
                } else {
                    s.pages[s.currentPage].info.pdfName = s.defaultPdfInfo.pdfName;
                }
            }
            break;
        case 2:
            {
                const frontBlankImageFile = document.getElementById("frontBlankImage2").files[0];
                if (frontBlankImageFile) s.pages[s.currentPage].info.frontBlankImg = frontBlankImageFile;

                const frontLogoImageFile = document.getElementById("frontLogoImage2").files[0];
                if (frontLogoImageFile) s.pages[s.currentPage].info.frontLogoImg = frontLogoImageFile;

                if (form.printTypeFront2) s.pages[s.currentPage].info.c1.type = form.printTypeFront2.value;
                if (form.printDimsFront2) s.pages[s.currentPage].info.c1.dims = form.printDimsFront2.value;
                if (form.printLocFront2) s.pages[s.currentPage].info.c1.loc = form.printLocFront2.value;

                if (form.pdfName2) {
                    s.pages[s.currentPage].info.pdfName = form.pdfName2.value;
                } else {
                    s.pages[s.currentPage].info.pdfName = s.defaultPdfInfo.pdfName;
                }
            }
            break;
    }
}

export function clearFormInputs() {
    console.log("clearing form");
    document.getElementById(`pdf-form-${s.pages[s.currentPage].type}`).reset();
}

export function resetPdfInfo() {
    console.log("restoring default PDF info");
    Object.assign(s.pages[s.currentPage].info, s.defaultPdfInfo);
}

async function template2(pdfDoc, page) {
    const marginTop = 35;
    const marginSide = 35;

    // FONTS
    const placeHolderFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const captionFont = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic)

    // SHIRT FRONT
    const p1Dims = {
        width: s.pageWidth * 0.6,
        height: s.pageHeight / 2 - marginSide,
    }
    const p1X = (s.pageWidth / 2 - p1Dims.width / 2);   //marginSide;
    const p1Y = s.pageHeight - marginTop - p1Dims.height;
    if (s.pages[s.currentPage].info.shirtFrontImg != "") {
        const p1 = await getImg(pdfDoc, s.pages[s.currentPage].info.shirtFrontImg, "base64");
        putImage(page, p1, p1X, p1Y, p1Dims.width, p1Dims.height, false);
    } else if (s.pages[s.currentPage].info.frontBlankImg != "") {
        const p1 = await getImg(pdfDoc, s.pages[s.currentPage].info.frontBlankImg, "upload");
        putImage(page, p1, p1X, p1Y, p1Dims.width, p1Dims.height, false);
    } else if (!s.showPrintPreview) {
        putImageBorder(page, p1X, p1Y, p1Dims.width, p1Dims.height, "SHIRT FRONT", placeHolderFont);
    }

    // SHIRT FRONT CAPTION
    const captionFontSize = 16;
    const captionColor = hexToRgb('#000000');
    const captionLineHeight = Math.ceil(captionFontSize * 1.3);

    const c1X = p1X;
    const c1Y = p1Y - captionLineHeight;
    const c1 = getCaptionString(s.pages[s.currentPage].info.c1);
    page.drawText(c1.join("\n"), {
        x: c1X,
        y: c1Y,
        maxWidth: p1Dims.width,
        size: captionFontSize,
        lineHeight: captionLineHeight,
        font: captionFont,
        color: captionColor,
    })
    let c1LineCount = 0;
    for (let s of c1) {
        let lineWidth = captionFont.widthOfTextAtSize(s, captionFontSize);
        c1LineCount += Math.ceil(lineWidth / p1Dims.width);
    }
    const c1TextBottomY = c1Y - (c1LineCount - 1) * captionLineHeight;

    // LOGO
    const logoDims = {
        width: s.pageWidth / 2 - marginSide * 2,
        height: s.pageWidth / 2 - marginSide * 2,
    }
    const logoX = (s.pageWidth / 2 - logoDims.width / 2);   //marginSide;
    const logoY = c1TextBottomY - logoDims.height - captionLineHeight / 2;
    if (s.pages[s.currentPage].info.frontLogoImg != "") {
        const logo = await getImg(pdfDoc, s.pages[s.currentPage].info.frontLogoImg, "upload");
        putImage(page, logo, logoX, logoY, logoDims.width, logoDims.height, false);
    } else if (!s.showPrintPreview) {
        putImageBorder(page, logoX, logoY, logoDims.width, logoDims.height, "LOGO FRONT", placeHolderFont);
    }
}

async function template1(pdfDoc, page) {
    const marginTop = 25;
    const marginSide = 35;

    // FONTS
    const titleFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const socialsFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const captionFont = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic)
    const placeHolderFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    // HEADER
    const logo = await getImg(pdfDoc, s.pages[s.currentPage].info.logoPath);
    const logoDims = logo.scale(0.70);
    const logoX = marginSide;
    const logoY = s.pageHeight - logoDims.height - marginTop;
    putImage(page, logo, logoX, logoY, logoDims.width, logoDims.height, false);

    // TITTLE
    const titleFontSize = 28;
    const subtitleFontSize = 20;
    const titleColor = hexToRgb('#4d4e4e');
    const titleX = marginSide;
    const titleY = s.pageHeight - logoDims.height - marginTop - titleFontSize * 1.3;
    const subtitleY = titleY - titleFontSize;
    page.drawText(s.pages[s.currentPage].info.title, {
        x: titleX, y: titleY,
        size: titleFontSize, font: titleFont, color: titleColor,
    })
    page.drawText(s.pages[s.currentPage].info.subtitle, {
        x: titleX, y: subtitleY,
        size: subtitleFontSize, font: titleFont, color: titleColor,
    })

    // SOCIALS
    const socialsFontSize = 16;
    const socialsTextColor = hexToRgb('#000000');

    const websiteX = s.pageWidth - marginSide - socialsFont.widthOfTextAtSize(s.pages[s.currentPage].info.website, socialsFontSize);
    const websiteY = s.pageHeight - marginTop - socialsFontSize;
    page.drawText(s.pages[s.currentPage].info.website, {
        x: websiteX, y: websiteY,
        size: socialsFontSize, font: socialsFont, color: socialsTextColor,
    })
    const globe = await getImg(pdfDoc, s.pages[s.currentPage].info.globePath);
    const globeDims = globe.scale(1);
    const globeX = websiteX - globeDims.width * 1.5;
    const globeY = websiteY - (globeDims.height - socialsFontSize) / 2;
    putImage(page, globe, globeX, globeY, globeDims.width, globeDims.height, false);

    const instaX = websiteX;
    const instaY = websiteY - socialsFontSize * 1.8;
    page.drawText(s.pages[s.currentPage].info.instagram, {
        x: instaX, y: instaY,
        size: socialsFontSize, font: socialsFont, color: socialsTextColor,
    })
    const instaLogo = await getImg(pdfDoc, s.pages[s.currentPage].info.instaLogoPath);
    const instaLogoDims = instaLogo.scale(1.1);
    const instaLogoX = globeX;
    const instaLogoY = instaY - (instaLogoDims.height - socialsFontSize) / 2;
    putImage(page, instaLogo, instaLogoX, instaLogoY, instaLogoDims.width, instaLogoDims.height, false);

    // BODY

    // SHIRT FRONT
    const p1Dims = {
        width: s.pageWidth / 2 - marginSide * 1.5,
        height: (s.pageWidth / 2 - marginSide * 1.5) * 1.25,
    }
    const p1X = marginSide;
    const p1Y = subtitleY - p1Dims.height - subtitleFontSize;
    if (s.pages[s.currentPage].info.shirtFrontImg != "") {
        const p1 = await getImg(pdfDoc, s.pages[s.currentPage].info.shirtFrontImg, "base64");
        putImage(page, p1, p1X, p1Y, p1Dims.width, p1Dims.height, false);
    } else if (s.pages[s.currentPage].info.frontBlankImg != "") {
        const p1 = await getImg(pdfDoc, s.pages[s.currentPage].info.frontBlankImg, "upload");
        putImage(page, p1, p1X, p1Y, p1Dims.width, p1Dims.height, false);
    } else if (!s.showPrintPreview) {
        putImageBorder(page, p1X, p1Y, p1Dims.width, p1Dims.height, "SHIRT FRONT", placeHolderFont);
    }

    // SHIRT BACK
    const p2Dims = {
        width: s.pageWidth / 2 - marginSide * 1.5,
        height: (s.pageWidth / 2 - marginSide * 1.5) * 1.25,
    }
    const p2X = s.pageWidth - marginSide - p2Dims.width;
    const p2Y = subtitleY - p2Dims.height - subtitleFontSize;
    if (s.pages[s.currentPage].info.shirtBackImg != "") {
        const p2 = await getImg(pdfDoc, s.pages[s.currentPage].info.shirtBackImg, "base64");
        putImage(page, p2, p2X, p2Y, p2Dims.width, p2Dims.height, false);
    } else if (s.pages[s.currentPage].info.backBlankImg != "") {
        const p2 = await getImg(pdfDoc, s.pages[s.currentPage].info.backBlankImg, "upload");
        putImage(page, p2, p2X, p2Y, p2Dims.width, p2Dims.height, false);
    } else if (!s.showPrintPreview) {
        putImageBorder(page, p2X, p2Y, p2Dims.width, p2Dims.height, "SHIRT BACK", placeHolderFont);
    }

    // SHIRT FRONT CAPTION
    const captionFontSize = 14;
    const captionColor = hexToRgb('#000000');
    const captionLineHeight = Math.ceil(captionFontSize * 1.3);

    const c1X = p1X;
    const c1Y = p1Y - captionLineHeight;
    const c1 = getCaptionString(s.pages[s.currentPage].info.c1);
    page.drawText(c1.join("\n"), {
        x: c1X,
        y: c1Y,
        maxWidth: p1Dims.width,
        size: captionFontSize,
        lineHeight: captionLineHeight,
        font: captionFont,
        color: captionColor,
    })
    let c1LineCount = 0;
    for (let s of c1) {
        let lineWidth = captionFont.widthOfTextAtSize(s, captionFontSize);
        c1LineCount += Math.ceil(lineWidth / p1Dims.width);
    }
    const c1TextBottomY = c1Y - (c1LineCount - 1) * captionLineHeight;

    // SHIRT BACK CAPTION
    const c2X = p2X;
    const c2Y = p2Y - captionLineHeight;
    const c2 = getCaptionString(s.pages[s.currentPage].info.c2);
    page.drawText(c2.join("\n"), {
        x: c2X,
        y: c2Y,
        maxWidth: p2Dims.width,
        size: captionFontSize,
        lineHeight: captionLineHeight,
        font: captionFont,
        color: captionColor,
    })
    let c2LineCount = 0;
    for (let s of c2) {
        let lineWidth = captionFont.widthOfTextAtSize(s, captionFontSize);
        c2LineCount += Math.ceil(lineWidth / p1Dims.width);
    }
    const c2TextBottomY = c2Y - (c2LineCount - 1) * captionLineHeight;

    // SHIRT FRONT LOGO
    const frontLogoDims = {
        width: s.pageWidth / 2 - marginSide * 2,
        height: s.pageWidth / 2 - marginSide * 2,
    }
    const frontLogoX = marginSide;
    const frontLogoY = Math.min(c1TextBottomY, c2TextBottomY) - frontLogoDims.height - captionLineHeight / 2;
    if (s.pages[s.currentPage].info.frontLogoImg != "") {
        const frontLogo = await getImg(pdfDoc, s.pages[s.currentPage].info.frontLogoImg, "upload");
        putImage(page, frontLogo, frontLogoX, frontLogoY, frontLogoDims.width, frontLogoDims.height, false);
    } else if (!s.showPrintPreview) {
        putImageBorder(page, frontLogoX, frontLogoY, frontLogoDims.width, frontLogoDims.height, "LOGO FRONT", placeHolderFont);
    }

    // SHIRT BACK LOGO
    const backLogoDims = {
        width: s.pageWidth / 2 - marginSide * 2,
        height: s.pageWidth / 2 - marginSide * 2,
    }
    const backLogoX = p2X;
    const backLogoY = Math.min(c1TextBottomY, c2TextBottomY) - backLogoDims.height - captionLineHeight / 2;
    if (s.pages[s.currentPage].info.backLogoImg != "") {
        const backLogo = await getImg(pdfDoc, s.pages[s.currentPage].info.backLogoImg, "upload");
        putImage(page, backLogo, backLogoX, backLogoY, backLogoDims.width, backLogoDims.height, false);
    } else if (!s.showPrintPreview) {
        putImageBorder(page, backLogoX, backLogoY, backLogoDims.width, backLogoDims.height, "LOGO BACK", placeHolderFont);
    }

    // COLOR CIRCLES
    const frontLogoColors = s.pages[s.currentPage].info.frontLogoColors
        .filter(color => color.trim() !== "") // remove empty strings
        .map(color => color.replace(/^#/, "")); // remove leading #
    const circleSize = 26; // radius

    //  FRONT LOGO COLORS
    let frontLogoColorX = marginSide + circleSize;
    let frontLogoColorY = frontLogoY - circleSize * 1.3;
    let frontLogoMaxWidth = marginSide + frontLogoDims.width;
    drawCircles(page, frontLogoColorX, frontLogoColorY, frontLogoColors, circleSize, captionFont, frontLogoMaxWidth);

    //  BACK LOGO COLORS
    const backLogoColors = s.pages[s.currentPage].info.backLogoColors
        .filter(color => color.trim() !== "") // remove empty strings
        .map(color => color.replace(/^#/, "")); // remove leading #
    let backLogoColorX = p2X + circleSize;
    let backLogoColorY = backLogoY - circleSize * 1.3;
    let backLogoMaxWidth = p2X + backLogoDims.width;
    drawCircles(page, backLogoColorX, backLogoColorY, backLogoColors, circleSize, captionFont, backLogoMaxWidth);

    // BOTTOM TEXT
    const mockupNumFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const mockupNum = "Mockup " + s.pages[s.currentPage].info.mockupNum;
    const mockupNumX = marginSide;
    const mockupNumY = marginTop / 2;
    const mockupNumFontSize = 18;
    page.drawText(mockupNum, {
        x: mockupNumX, y: mockupNumY,
        size: mockupNumFontSize, font: mockupNumFont, color: titleColor,
    })

    const motoFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const motto = "INNOVATION IN INK";
    const mottoFontSize = 22;
    const mottoX = marginSide;
    const mottoY = mockupNumY + mockupNumFontSize * 1.3;
    page.drawText(motto, {
        x: mottoX, y: mottoY,
        size: mottoFontSize, font: motoFont, color: titleColor,
    })
    return pdfDoc
}

window.handlePopupData = function(data) {
    const side = data.side;
    if (side == "front") {
        s.pages[s.currentPage].info.shirtFrontImg = data.imgUrl;
    } else if (side == "back") {
        s.pages[s.currentPage].info.shirtBackImg = data.imgUrl;
    } else {
        console.error("invalid side");
    }
};

export async function adjustLogo(side) {
    console.log(`Adjusting ${side} Logo`);

    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;

    const width = Math.floor(screenWidth * 0.5);
    const height = screenHeight;

    const left = Math.floor((screenWidth - width) / 2);
    const top = Math.floor((screenHeight - height) / 2);

    var blankUrl = "";
    var logoUrl = "";
    if (side == "front") {
        if (s.pages[s.currentPage].info.frontBlankImg != "") {
            blankUrl = s.pages[s.currentPage].info.frontBlankImg.name;
        } else {
            showWarning("Must upload front shirt blank image before adjusting"); return;
        }
        if (s.pages[s.currentPage].info.frontLogoImg != "") {
            logoUrl = s.pages[s.currentPage].info.frontLogoImg.name;
        } else {
            showWarning("Must upload front logo image before adjusting"); return;
        }
    } else if (side == "back") {
        if (s.pages[s.currentPage].info.backBlankImg != "") {
            blankUrl = s.pages[s.currentPage].info.backBlankImg.name;
        } else {
            showWarning("Must upload back shirt blank image before adjusting"); return;
        }
        if (s.pages[s.currentPage].info.backLogoImg != "") {
            logoUrl = s.pages[s.currentPage].info.backLogoImg.name;
        } else {
            showWarning("Must upload back logo image before adjusting"); return;
        }
    }

    // `${import.meta.env.BASE_URL}popup.html?blank=${encodeURIComponent(blankUrl)}&logo=${encodeURIComponent(logoUrl)}&side=${encodeURIComponent(side)}`,
    window.open(
        `popup.html?blank=${encodeURIComponent(blankUrl)}&logo=${encodeURIComponent(logoUrl)}&side=${encodeURIComponent(side)}`,
        "PopupWindow",
        `width=${width},height=${height},left=${left},top=${top},resizable=no,scrollbars=no`
    );
    return;
}

export async function createPdf() {
    var pdfDoc = await PDFDocument.create();

    for (const page of s.pages) {
        const newPage = pdfDoc.addPage([s.pageWidth, s.pageHeight]);
        if (page.type == 1) {
            await template1(pdfDoc, newPage);
        } else if (page.type == 2) {
            await template2(pdfDoc, newPage);
        }
    }

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
}
