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

export const pageWidth = 720;
export const pageHeight = 1080;
export var pageCount = 1;
export var logoOnFrontBlank = false;
export var logoOnBackBlank = false;

export var showPrintPreview = false;
export async function togglePrintPreview() {
    showPrintPreview = !showPrintPreview;
}

export var currentPage = 1;
export var currentPageType = 1;
export async function updateCurrentPage(newCurrentPage, newCurrentPageType) {
    console.log("updating current page and page type");

    currentPage = newCurrentPage;
    const form1Container = document.getElementById("pdf-form-container-1");
    const form2Container = document.getElementById("pdf-form-container-2");

    if (newCurrentPageType == "template1") {
        currentPageType = 1;
        form1Container.style.display = "block";
        form2Container.style.display = "none"
    } else if (newCurrentPageType == "template2") {
        currentPageType = 2;
        form1Container.style.display = "none";
        form2Container.style.display = "block"
    } else {
        console.error("invalid template type");
        return;
    }

    const formId = `pdf-form-${currentPageType}`;
    document
        .querySelectorAll('#form-buttons button')
        .forEach(btn => {
            btn.setAttribute('form', formId);
        });
}
updateCurrentPage(1, "template1");

