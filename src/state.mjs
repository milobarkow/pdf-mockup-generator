export const pageWidth = 720;
export const pageHeight = 1080;
export const marginTop = 25;
export const marginSide = 35;
export var showPrintPreview = false;
export var currentPage = 1;
export var currentPageType = 1;
export var pageCount = 1;
export var logoOnFrontBlank = false;
export var logoOnBackBlank = false;

export var pdfInfo = {
    title: "Title",
    subtitle: "Subtitle",
    logoPath: "/pdf-mockup-generator/logo.png",
    globePath: "/pdf-mockup-generator/globe.png",
    instaLogoPath: "/pdf-mockup-generator/insta.png",
    website: "www.jointprinting.com",
    instagram: "@jointprinting",
    shirtFrontImg: "",
    shirtBackImg: "",
    frontBlankImg: "",
    backBlankImg: "",
    frontLogoImg: "",
    backLogoImg: "",
    frontLogoColors: ["FF0000", "00FF00", "0000FF",],
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
export const defaultPdfInfo = JSON.parse(JSON.stringify(pdfInfo));
