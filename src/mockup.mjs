import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const pageWidth = 720;
const pageHeight = 1080;
const marginTop = 25;
const marginSide = 35;
let X = 0;
let Y = 0;


async function getImg(pdfDoc, img, fromUpload = false) {
    var imgBytes, imgType;
    if (fromUpload) {
        imgBytes = await img.arrayBuffer();
        imgType = img.name.split('.').pop().toLowerCase();
    } else {
        const response = await fetch(img);
        imgBytes = await response.arrayBuffer();
        const pathParts = img.split('.');
        imgType = pathParts.length > 1 ? pathParts.pop().toLowerCase() : '';
        return await pdfDoc.embedPng(imgBytes);
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

function putImageBorder(page, borderX, borderY, borderWidth, borderHeight , placeHolderText = null, placeHolderFont = null) {
    page.drawRectangle({
        x: borderX, y: borderY,
        width: borderWidth, height: borderHeight,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
    });

    if (placeHolderText && placeHolderFont) {
        const placeHolderFontSize = 28;
        const placeHolderColor = hexToRgb('#000000');
        const placeHolderX = borderX + borderWidth/2 - placeHolderFont.widthOfTextAtSize(placeHolderText, placeHolderFontSize) / 2;
        const placeHolderY = borderY + borderHeight/2 - placeHolderFontSize/2;
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

var pdfInfo = {
    title: "Title",
    subtitle: "Subtitle",
    logoPath: "/logo.png",
    globePath: "/globe.png",
    instaLogoPath: "/insta.png",
    website: "www.jointprinting.com",
    instagram: "@jointprinting",
    shirtFrontImg: "",
    shirtBackImg: "",
    frontLogoImg: "",
    backLogoImg: "",
    frontLogoColors: ["FF0000", "00FF00", "0000FF", ],
    backLogoColors: ["FFFFFF", "000000"],
    c1: {
        type: "",
        dims: "",
        loc: ""
    },
    c2: {
        type: "",
        dims: "",
        loc: ""
    },
    mockupNum: "#0000000",
    pdfName: "mockup.pdf",
};

const defaultPdfInfo = JSON.parse(JSON.stringify(pdfInfo));

var showPrintPreview = false;
export async function togglePrintPreview() {
    showPrintPreview = !showPrintPreview ;
}

export async function updatePdfImageInfo(shirtFrontImageFile, shirtBackImageFile, frontLogoImageFile, backLogoImageFile) {
    if (shirtFrontImageFile != null) pdfInfo.shirtFrontImg = shirtFrontImageFile;
    if (shirtBackImageFile != null) pdfInfo.shirtBackImg = shirtBackImageFile;
    if (frontLogoImageFile != null) pdfInfo.frontLogoImg = frontLogoImageFile;
    if (backLogoImageFile != null) pdfInfo.backLogoImg = backLogoImageFile;
}

export async function updatePdfInfo(title, subtitle,
    shirtFrontImageFile, c1Type, c1Dims, c1Loc,
    shirtBackImageFile, c2Type, c2Dims, c2Loc,
    frontLogoImageFile, frontLogoColors,
    backLogoImageFile, backLogoColors,
    mockupNum, pdfName) {
    if (title) pdfInfo.title = title;
    // else pdfInfo.title = "";

    if (subtitle) pdfInfo.subtitle = subtitle;
    // else pdfInfo.subtitle = "";

    if (shirtFrontImageFile) pdfInfo.shirtFrontImg = shirtFrontImageFile;
    if (c1Type) pdfInfo.c1.type = c1Type;
    if (c1Dims) pdfInfo.c1.dims = c1Dims;
    if (c1Loc) pdfInfo.c1.loc = c1Loc;

    if (shirtBackImageFile) pdfInfo.shirtBackImg = shirtBackImageFile;
    if (c2Type) pdfInfo.c2.type = c2Type;
    if (c2Dims) pdfInfo.c2.dims = c2Dims;
    if (c2Loc) pdfInfo.c2.loc = c2Loc;

    if (frontLogoImageFile) pdfInfo.frontLogoImg = frontLogoImageFile;
    if (frontLogoColors) pdfInfo.frontLogoColors = frontLogoColors;

    if (backLogoImageFile) pdfInfo.backLogoImg = backLogoImageFile;
    if (backLogoColors) pdfInfo.backLogoColors = backLogoColors;

    if (mockupNum) pdfInfo.mockupNum = mockupNum;
    // else pdfInfo.mockupNum = "";

    if (pdfName) pdfInfo.pdfName = pdfName;
    else pdfInfo.pdfName = defaultPdfInfo.pdfName;
}

export async function getPdfInfo() {
    return pdfInfo;
}

export async function resetPdfInfo() {
    Object.assign(pdfInfo, defaultPdfInfo);
}

export async function createPdf() {
    const pdfDoc = await PDFDocument.create();

    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    // FONTS
    const titleFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const socialsFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const placeHolderFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    // HEADER
    const logo = await getImg(pdfDoc, pdfInfo.logoPath);
    const logoDims = logo.scale(0.70);
    const logoX = marginSide;
    const logoY = pageHeight - logoDims.height - marginTop;
    putImage(page, logo, logoX, logoY, logoDims.width, logoDims.height, false);

    // TITTLE
    const titleFontSize = 28;
    const subtitleFontSize = 20;
    const titleColor = hexToRgb('#4d4e4e');
    const titleX = marginSide;
    const titleY = pageHeight - logoDims.height - marginTop - titleFontSize * 1.3;
    const subtitleY = titleY - titleFontSize;
    page.drawText(pdfInfo.title, {
        x: titleX, y: titleY,
        size: titleFontSize, font: titleFont, color: titleColor,
    })
    page.drawText(pdfInfo.subtitle, {
        x: titleX, y: subtitleY,
        size: subtitleFontSize, font: titleFont, color: titleColor,
    })

    // SOCIALS
    const socialsFontSize = 16;
    const socialsTextColor = hexToRgb('#000000');

    const websiteX = pageWidth - marginSide - socialsFont.widthOfTextAtSize(pdfInfo.website, socialsFontSize);
    const websiteY = pageHeight - marginTop - socialsFontSize;
    page.drawText(pdfInfo.website, {
        x: websiteX, y: websiteY,
        size: socialsFontSize, font: socialsFont, color: socialsTextColor,
    })
    const globe = await getImg(pdfDoc, pdfInfo.globePath);
    const globeDims = globe.scale(1);
    const globeX = websiteX - globeDims.width * 1.5;
    const globeY = websiteY - (globeDims.height-socialsFontSize)/2;
    putImage(page, globe, globeX, globeY, globeDims.width, globeDims.height, false);

    const instaX = websiteX;
    const instaY = websiteY - socialsFontSize*1.8;
    page.drawText(pdfInfo.instagram, {
        x: instaX, y: instaY,
        size: socialsFontSize, font: socialsFont, color: socialsTextColor,
    })
    const instaLogo = await getImg(pdfDoc, pdfInfo.instaLogoPath);
    const instaLogoDims = instaLogo.scale(1.1);
    const instaLogoX = globeX;
    const instaLogoY = instaY - (instaLogoDims.height-socialsFontSize)/2;
    putImage(page, instaLogo, instaLogoX, instaLogoY, instaLogoDims.width, instaLogoDims.height, false);

    // BODY

    // SHIRT FRONT
    const p1Dims = {
        width: pageWidth / 2 - marginSide * 1.5,
        height: (pageWidth / 2 - marginSide * 1.5) * 1.25,
    }
    // const p1Dims = p1.scale((pageWidth - marginSide * 3) / p1.size().width / 2);
    const p1X = marginSide;
    const p1Y = subtitleY - p1Dims.height - subtitleFontSize;
    if (pdfInfo.shirtFrontImg != "") {
        const p1 = await getImg(pdfDoc, pdfInfo.shirtFrontImg, true);
        putImage(page, p1, p1X, p1Y, p1Dims.width, p1Dims.height, false);
    } else if (!showPrintPreview)  {
        putImageBorder(page, p1X, p1Y, p1Dims.width, p1Dims.height, "SHIRT FRONT", placeHolderFont);
    }

    // SHIRT BACK
    const p2Dims = {
        width: pageWidth / 2 - marginSide * 1.5,
        height: (pageWidth / 2 - marginSide * 1.5) * 1.25,
    }
    const p2X = pageWidth - marginSide - p2Dims.width;
    const p2Y = subtitleY - p2Dims.height - subtitleFontSize;
    if (pdfInfo.shirtBackImg != "") {
        const p2 = await getImg(pdfDoc, pdfInfo.shirtBackImg, true);
        putImage(page, p2, p2X, p2Y, p2Dims.width, p2Dims.height, false);
    } else if (!showPrintPreview)  {
        putImageBorder(page, p2X, p2Y, p2Dims.width, p2Dims.height, "SHIRT BACK", placeHolderFont);
    }

    // SHIRT FRONT CAPTION
    const captionFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const captionFontSize = 14;
    const captionColor = hexToRgb('#4d4e4e');
    const captionLineHeight = Math.ceil(captionFontSize * 1.3);

    const c1X = p1X;
    const c1Y = p1Y - captionLineHeight;
    const c1 = getCaptionString(pdfInfo.c1);
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
    const c2 = getCaptionString(pdfInfo.c2);
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
        width: pageWidth / 2 - marginSide * 2,
        height: pageWidth / 2 - marginSide * 2,
    }
    // const frontLogoDims = frontLogo.scale((pageWidth - marginSide * 5) / frontLogo.size().width / 2);
    const frontLogoX = marginSide;
    const frontLogoY = Math.min(c1TextBottomY, c2TextBottomY) - frontLogoDims.height - captionLineHeight / 2;
    if (pdfInfo.frontLogoImg != "") {
        const frontLogo = await getImg(pdfDoc, pdfInfo.frontLogoImg, true);
        putImage(page, frontLogo, frontLogoX, frontLogoY, frontLogoDims.width, frontLogoDims.height, false);
    } else if (!showPrintPreview)  {
        putImageBorder(page, frontLogoX, frontLogoY, frontLogoDims.width, frontLogoDims.height, "LOGO FRONT", placeHolderFont);
    }

    // SHIRT BACK LOGO
    const backLogoDims = {
        width: pageWidth / 2 - marginSide * 2,
        height: pageWidth / 2 - marginSide * 2,
    }
    // const backLogoDims = backLogo.scale((pageWidth - marginSide * 5) / backLogo.size().width / 2);
    const backLogoX = p2X;
    const backLogoY = Math.min(c1TextBottomY, c2TextBottomY) - backLogoDims.height - captionLineHeight / 2;
    if (pdfInfo.backLogoImg != "") {
        const backLogo = await getImg(pdfDoc, pdfInfo.backLogoImg, true);
        putImage(page, backLogo, backLogoX, backLogoY, backLogoDims.width, backLogoDims.height, false);
    } else if (!showPrintPreview)  {
        putImageBorder(page, backLogoX, backLogoY, backLogoDims.width, backLogoDims.height, "LOGO BACK", placeHolderFont);
    }

    // COLOR CIRCLES
    const frontLogoColors = pdfInfo.frontLogoColors
        .filter(color => color.trim() !== "") // remove empty strings
        .map(color => color.replace(/^#/, "")); // remove leading #
    // let colorCount = Math.max(frontLogoColors.length, pdfInfo.backLogoColors.length);
    const circleSize = 26; // radius

    //  FRONT LOGO COLORS
    let frontLogoColorX = marginSide + circleSize;
    let frontLogoColorY = frontLogoY - circleSize * 1.3;
    let frontLogoMaxWidth = marginSide + frontLogoDims.width;
    drawCircles(page, frontLogoColorX, frontLogoColorY, frontLogoColors, circleSize, captionFont, frontLogoMaxWidth);

    //  BACK LOGO COLORS
    const backLogoColors = pdfInfo.backLogoColors
        .filter(color => color.trim() !== "") // remove empty strings
        .map(color => color.replace(/^#/, "")); // remove leading #
    let backLogoColorX = p2X + circleSize;
    let backLogoColorY = backLogoY - circleSize * 1.3;
    let backLogoMaxWidth = p2X + backLogoDims.width;
    drawCircles(page, backLogoColorX, backLogoColorY, backLogoColors, circleSize, captionFont, backLogoMaxWidth);

    // BOTTOM TEXT
    const mockupNumFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const mockupNum = "Mockup " + pdfInfo.mockupNum;
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


    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
    // fs.writeFileSync(pdfName, pdfBytes);
    // console.log(`PDF saved as ${pdfName}`);
}
