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
    throw new Error("Bad image type, image must be .png or .jpg");
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

export async function updatePdfInfo(form) {
    if (form.title.value) s.pdfInfo.title = form.title.value;
    if (form.subtitle.value) s.pdfInfo.subtitle = form.subtitle.value;

    const frontBlankImageFile = document.getElementById("frontBlankImage").files[0];
    if (frontBlankImageFile) s.pdfInfo.frontBlankImg = frontBlankImageFile;

    const backBlankImageFile = document.getElementById("backBlankImage").files[0];
    if (backBlankImageFile) s.pdfInfo.backBlankImg = backBlankImageFile;

    const frontLogoImageFile = document.getElementById("frontLogoImage").files[0];
    if (frontLogoImageFile) s.pdfInfo.frontLogoImg = frontLogoImageFile;

    const backLogoImageFile = document.getElementById("backLogoImage").files[0];
    if (backLogoImageFile) s.pdfInfo.backLogoImg = backLogoImageFile;

    if (form.c1Type) s.pdfInfo.c1.type = form.c1Type.value;
    if (form.c1Dims) s.pdfInfo.c1.dims = form.c1Dims.value;
    if (form.c1Loc) s.pdfInfo.c1.loc = form.c1Loc.value;

    if (form.c2Type) s.pdfInfo.c2.type = form.c2Type.value;
    if (form.c2Dims) s.pdfInfo.c2.dims = form.c2Dims.value;
    if (form.c2Loc) s.pdfInfo.c2.loc = form.c2Loc.value;

    const frontLogoColors = Array.from({ length: 8 }, (_, i) =>
        form[`fcolor${i + 1}`]?.value || ""
    );
    if (frontLogoColors) s.pdfInfo.frontLogoColors = frontLogoColors;

    const backLogoColors = Array.from({ length: 8 }, (_, i) =>
        form[`bcolor${i + 1}`]?.value || ""
    );
    if (backLogoColors) s.pdfInfo.backLogoColors = backLogoColors;

    if (form.mockupNum.value) s.pdfInfo.mockupNum = form.mockupNum.value;

    if (form.pdfname) {
        s.pdfInfo.pdfName = form.pdfname.value;
    } else {
        s.pdfInfo.pdfName = s.defaultPdfInfo.pdfName;
    }
}

export async function resetPdfInfo() {
    Object.assign(s.pdfInfo, s.defaultPdfInfo);
}

async function template2(pdfDoc, page) {
    // FONTS
    const titleFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const socialsFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const placeHolderFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    // HEADER
    const logo = await getImg(pdfDoc, s.pdfInfo.logoPath);
    const logoDims = logo.scale(0.70);
    const logoX = s.marginSide;
    const logoY = s.pageHeight - logoDims.height - s.marginTop;
    putImage(page, logo, logoX, logoY, logoDims.width, logoDims.height, false);

    // TITTLE
    const titleFontSize = 28;
    const subtitleFontSize = 20;
    const titleColor = hexToRgb('#4d4e4e');
    const titleX = s.marginSide;
    const titleY = s.pageHeight - logoDims.height - s.marginTop - titleFontSize * 1.3;
    const subtitleY = titleY - titleFontSize;
    page.drawText(s.pdfInfo.title, {
        x: titleX, y: titleY,
        size: titleFontSize, font: titleFont, color: titleColor,
    })
    page.drawText(s.pdfInfo.subtitle, {
        x: titleX, y: subtitleY,
        size: subtitleFontSize, font: titleFont, color: titleColor,
    })

    // SOCIALS
    const socialsFontSize = 16;
    const socialsTextColor = hexToRgb('#000000');

    const websiteX = s.pageWidth - s.marginSide - socialsFont.widthOfTextAtSize(s.pdfInfo.website, socialsFontSize);
    const websiteY = s.pageHeight - s.marginTop - socialsFontSize;
    page.drawText(s.pdfInfo.website, {
        x: websiteX, y: websiteY,
        size: socialsFontSize, font: socialsFont, color: socialsTextColor,
    })
    const globe = await getImg(pdfDoc, s.pdfInfo.globePath);
    const globeDims = globe.scale(1);
    const globeX = websiteX - globeDims.width * 1.5;
    const globeY = websiteY - (globeDims.height - socialsFontSize) / 2;
    putImage(page, globe, globeX, globeY, globeDims.width, globeDims.height, false);

    const instaX = websiteX;
    const instaY = websiteY - socialsFontSize * 1.8;
    page.drawText(s.pdfInfo.instagram, {
        x: instaX, y: instaY,
        size: socialsFontSize, font: socialsFont, color: socialsTextColor,
    })
    const instaLogo = await getImg(pdfDoc, s.pdfInfo.instaLogoPath);
    const instaLogoDims = instaLogo.scale(1.1);
    const instaLogoX = globeX;
    const instaLogoY = instaY - (instaLogoDims.height - socialsFontSize) / 2;
    putImage(page, instaLogo, instaLogoX, instaLogoY, instaLogoDims.width, instaLogoDims.height, false);
}

async function template1(pdfDoc, page) {
    // FONTS
    const titleFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const socialsFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const placeHolderFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    // HEADER
    const logo = await getImg(pdfDoc, s.pdfInfo.logoPath);
    const logoDims = logo.scale(0.70);
    const logoX = s.marginSide;
    const logoY = s.pageHeight - logoDims.height - s.marginTop;
    putImage(page, logo, logoX, logoY, logoDims.width, logoDims.height, false);

    // TITTLE
    const titleFontSize = 28;
    const subtitleFontSize = 20;
    const titleColor = hexToRgb('#4d4e4e');
    const titleX = s.marginSide;
    const titleY = s.pageHeight - logoDims.height - s.marginTop - titleFontSize * 1.3;
    const subtitleY = titleY - titleFontSize;
    page.drawText(s.pdfInfo.title, {
        x: titleX, y: titleY,
        size: titleFontSize, font: titleFont, color: titleColor,
    })
    page.drawText(s.pdfInfo.subtitle, {
        x: titleX, y: subtitleY,
        size: subtitleFontSize, font: titleFont, color: titleColor,
    })

    // SOCIALS
    const socialsFontSize = 16;
    const socialsTextColor = hexToRgb('#000000');

    const websiteX = s.pageWidth - s.marginSide - socialsFont.widthOfTextAtSize(s.pdfInfo.website, socialsFontSize);
    const websiteY = s.pageHeight - s.marginTop - socialsFontSize;
    page.drawText(s.pdfInfo.website, {
        x: websiteX, y: websiteY,
        size: socialsFontSize, font: socialsFont, color: socialsTextColor,
    })
    const globe = await getImg(pdfDoc, s.pdfInfo.globePath);
    const globeDims = globe.scale(1);
    const globeX = websiteX - globeDims.width * 1.5;
    const globeY = websiteY - (globeDims.height - socialsFontSize) / 2;
    putImage(page, globe, globeX, globeY, globeDims.width, globeDims.height, false);

    const instaX = websiteX;
    const instaY = websiteY - socialsFontSize * 1.8;
    page.drawText(s.pdfInfo.instagram, {
        x: instaX, y: instaY,
        size: socialsFontSize, font: socialsFont, color: socialsTextColor,
    })
    const instaLogo = await getImg(pdfDoc, s.pdfInfo.instaLogoPath);
    const instaLogoDims = instaLogo.scale(1.1);
    const instaLogoX = globeX;
    const instaLogoY = instaY - (instaLogoDims.height - socialsFontSize) / 2;
    putImage(page, instaLogo, instaLogoX, instaLogoY, instaLogoDims.width, instaLogoDims.height, false);

    // BODY

    // SHIRT FRONT
    const p1Dims = {
        width: s.pageWidth / 2 - s.marginSide * 1.5,
        height: (s.pageWidth / 2 - s.marginSide * 1.5) * 1.25,
    }
    const p1X = s.marginSide;
    const p1Y = subtitleY - p1Dims.height - subtitleFontSize;
    if (s.pdfInfo.shirtFrontImg != "") {
        const p1 = await getImg(pdfDoc, s.pdfInfo.shirtFrontImg, "base64");
        putImage(page, p1, p1X, p1Y, p1Dims.width, p1Dims.height, false);
    } else if (s.pdfInfo.frontBlankImg != "") {
        const p1 = await getImg(pdfDoc, s.pdfInfo.frontBlankImg, "upload");
        putImage(page, p1, p1X, p1Y, p1Dims.width, p1Dims.height, false);
    } else if (!s.showPrintPreview) {
        putImageBorder(page, p1X, p1Y, p1Dims.width, p1Dims.height, "SHIRT FRONT", placeHolderFont);
    }

    // SHIRT BACK
    const p2Dims = {
        width: s.pageWidth / 2 - s.marginSide * 1.5,
        height: (s.pageWidth / 2 - s.marginSide * 1.5) * 1.25,
    }
    const p2X = s.pageWidth - s.marginSide - p2Dims.width;
    const p2Y = subtitleY - p2Dims.height - subtitleFontSize;
    if (s.pdfInfo.shirtBackImg != "") {
        const p2 = await getImg(pdfDoc, s.pdfInfo.shirtBackImg, "base64");
        putImage(page, p2, p2X, p2Y, p2Dims.width, p2Dims.height, false);
    } else if (s.pdfInfo.backBlankImg != "") {
        const p2 = await getImg(pdfDoc, s.pdfInfo.backBlankImg, "upload");
        putImage(page, p2, p2X, p2Y, p2Dims.width, p2Dims.height, false);
    } else if (!s.showPrintPreview) {
        putImageBorder(page, p2X, p2Y, p2Dims.width, p2Dims.height, "SHIRT BACK", placeHolderFont);
    }

    // SHIRT FRONT CAPTION
    const captionFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const captionFontSize = 14;
    const captionColor = hexToRgb('#4d4e4e');
    const captionLineHeight = Math.ceil(captionFontSize * 1.3);

    const c1X = p1X;
    const c1Y = p1Y - captionLineHeight;
    const c1 = getCaptionString(s.pdfInfo.c1);
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
    const c2 = getCaptionString(s.pdfInfo.c2);
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
        width: s.pageWidth / 2 - s.marginSide * 2,
        height: s.pageWidth / 2 - s.marginSide * 2,
    }
    const frontLogoX = s.marginSide;
    const frontLogoY = Math.min(c1TextBottomY, c2TextBottomY) - frontLogoDims.height - captionLineHeight / 2;
    if (s.pdfInfo.frontLogoImg != "") {
        const frontLogo = await getImg(pdfDoc, s.pdfInfo.frontLogoImg, "upload");
        putImage(page, frontLogo, frontLogoX, frontLogoY, frontLogoDims.width, frontLogoDims.height, false);
    } else if (!s.showPrintPreview) {
        putImageBorder(page, frontLogoX, frontLogoY, frontLogoDims.width, frontLogoDims.height, "LOGO FRONT", placeHolderFont);
    }

    // SHIRT BACK LOGO
    const backLogoDims = {
        width: s.pageWidth / 2 - s.marginSide * 2,
        height: s.pageWidth / 2 - s.marginSide * 2,
    }
    const backLogoX = p2X;
    const backLogoY = Math.min(c1TextBottomY, c2TextBottomY) - backLogoDims.height - captionLineHeight / 2;
    if (s.pdfInfo.backLogoImg != "") {
        const backLogo = await getImg(pdfDoc, s.pdfInfo.backLogoImg, "upload");
        putImage(page, backLogo, backLogoX, backLogoY, backLogoDims.width, backLogoDims.height, false);
    } else if (!s.showPrintPreview) {
        putImageBorder(page, backLogoX, backLogoY, backLogoDims.width, backLogoDims.height, "LOGO BACK", placeHolderFont);
    }

    // COLOR CIRCLES
    const frontLogoColors = s.pdfInfo.frontLogoColors
        .filter(color => color.trim() !== "") // remove empty strings
        .map(color => color.replace(/^#/, "")); // remove leading #
    const circleSize = 26; // radius

    //  FRONT LOGO COLORS
    let frontLogoColorX = s.marginSide + circleSize;
    let frontLogoColorY = frontLogoY - circleSize * 1.3;
    let frontLogoMaxWidth = s.marginSide + frontLogoDims.width;
    drawCircles(page, frontLogoColorX, frontLogoColorY, frontLogoColors, circleSize, captionFont, frontLogoMaxWidth);

    //  BACK LOGO COLORS
    const backLogoColors = s.pdfInfo.backLogoColors
        .filter(color => color.trim() !== "") // remove empty strings
        .map(color => color.replace(/^#/, "")); // remove leading #
    let backLogoColorX = p2X + circleSize;
    let backLogoColorY = backLogoY - circleSize * 1.3;
    let backLogoMaxWidth = p2X + backLogoDims.width;
    drawCircles(page, backLogoColorX, backLogoColorY, backLogoColors, circleSize, captionFont, backLogoMaxWidth);

    // BOTTOM TEXT
    const mockupNumFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const mockupNum = "Mockup " + s.pdfInfo.mockupNum;
    const mockupNumX = s.marginSide;
    const mockupNumY = s.marginTop / 2;
    const mockupNumFontSize = 18;
    page.drawText(mockupNum, {
        x: mockupNumX, y: mockupNumY,
        size: mockupNumFontSize, font: mockupNumFont, color: titleColor,
    })

    const motoFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const motto = "INNOVATION IN INK";
    const mottoFontSize = 22;
    const mottoX = s.marginSide;
    const mottoY = mockupNumY + mockupNumFontSize * 1.3;
    page.drawText(motto, {
        x: mottoX, y: mottoY,
        size: mottoFontSize, font: motoFont, color: titleColor,
    })
    return pdfDoc
}

export async function updateCurrentPage(newCurrentPage, newCurrentPageType) {
    s.currentPage = newCurrentPage;

    const form1Container = document.getElementById("form1-container");
    const form2Container = document.getElementById("form2-container");

    if (newCurrentPageType == "template1") {
        s.currentPageType = 1;
        form1Container.style.display = "block";
        form2Container.style.display = "none"
    } else if (newCurrentPageType == "template2") {
        s.currentPageType = 2;
        form1Container.style.display = "none";
        form2Container.style.display = "block"
    } else {
        console.error("invalid template type");
    }
}


window.handlePopupData = function(data) {
    const side = data.side;
    if (side == "front") {
        s.pdfInfo.shirtFrontImg = data.imgUrl;
    } else if (side == "back") {
        s.pdfInfo.shirtBackImg = data.imgUrl;
    } else {
        console.error("invalid side");
    }
};


export async function adjustLogo(side) {
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;

    const width = Math.floor(screenWidth * 0.5);
    const height = screenHeight;

    const left = Math.floor((screenWidth - width) / 2);
    const top = Math.floor((screenHeight - height) / 2);

    // const blankUrl = "/pdf-mockup-generator/shirt.jpg";
    // const logoUrl = "/pdf-mockup-generator/fry.png";
    const blankUrl = "";
    const logoUrl = "";
    if (side == "front") {
        if (s.pdfInfo.frontLogoImg != "") {
            blankUrl = s.pdfInfo.frontLogoImg;
        } else {
            showWarning("Must upload front shirt blank image before adjusting"); return;
        }
        if (s.pdfInfo.frontLogoImg != "") {
            logoUrl = s.pdfInfo.frontLogoImg;
        } else {
            showWarning("Must upload front logo image before adjusting"); return;
        }
    } else if (side == "back") {
        if (s.pdfInfo.backLogoImg != "") {
            blankUrl = s.pdfInfo.backLogoImg;
        } else {
            showWarning("Must upload back shirt blank image before adjusting"); return;
        }
        if (s.pdfInfo.backLogoImg != "") {
            logoUrl = s.pdfInfo.backLogoImg;
        } else {
            showWarning("Must upload back logo image before adjusting"); return;
        }
    }

    window.open(
        `popup.html?blank=${encodeURIComponent(blankUrl)}&logo=${encodeURIComponent(logoUrl)}&side=${encodeURIComponent(side)}`,
        "PopupWindow",
        `width=${width},height=${height},left=${left},top=${top},resizable=no,scrollbars=no`
    );
    return;
}

export async function createPdf() {
    var pdfDoc = await PDFDocument.create();

    const page = pdfDoc.addPage([s.pageWidth, s.pageHeight]);

    if (s.currentPageType == 1) {
        await template1(pdfDoc, page);
    } else if (s.currentPageType == 2) {
        await template2(pdfDoc, page);
    }

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
}
