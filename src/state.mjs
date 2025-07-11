import { showWarning } from "./util.mjs";

export const pageWidth = 720;
export const pageHeight = 1080;
export var pageCount = 1;
export var logoOnFrontBlank = false;
export var logoOnBackBlank = false;

export var defaultPdfInfo = {
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

export var currentPage = 0;
export var pages = [{
    type: 1,
    info: JSON.parse(JSON.stringify(defaultPdfInfo))
}];
export function getCurrentPage() { return pages[currentPage]; }
function updateTotalPages() {
    document.getElementById("page-count-label").textContent = "Total Pages: " + pages.length.toString();
}
function updateCurentPageInput() {
    document.getElementById("current-page-input").value = currentPage + 1;
}
export function addPage() {
    pages.push({
        type: 1,
        info: JSON.parse(JSON.stringify(defaultPdfInfo))
    });
    updateTotalPages();
}

export function removePage() {

    const pageToRemove = parseInt(document.getElementById("remove-page-input").value, 10) - 1;

    if (Number.isNaN(pageToRemove) || pageToRemove < 0 || pageToRemove > pages.length - 1) {
        showWarning(`Please enter a valid page number between 1 and ${pages.length}`);
        return;
    }
    pages.splice(pageToRemove, 1);

    if (pages.length === 0) { // if there are no pages, add default page 
        addPage();
    } else if (pageToRemove === pages.length - 1) { // if current page is last and to be remove, decrese current page
        currentPage -= 1;
        updateCurentPageInput();
    }

    updateTotalPages();
}

export function changeDirection(direction) {
    if (direction == "incr" && currentPage < pages.length - 1) {
        console.log("incrementing page");
        currentPage += 1;
        updateCurentPageInput();
    } else if (direction == "decr" && currentPage > 0) {
        console.log("decrementing page");
        currentPage -= 1;
        updateCurentPageInput();
    }
    changeCurrentPage(`template${pages[currentPage].type}`);
}

export function changeCurrentPage(newCurrentPageType) {
    console.log("updating current page and page type");

    const form1Container = document.getElementById("pdf-form-container-1");
    const form2Container = document.getElementById("pdf-form-container-2");

    if (newCurrentPageType == "template1") {
        pages[currentPage].type = 1;
        form1Container.style.display = "block";
        form2Container.style.display = "none"
    } else if (newCurrentPageType == "template2") {
        pages[currentPage].type = 2;
        form1Container.style.display = "none";
        form2Container.style.display = "block"
    } else {
        console.error("invalid template type");
        return;
    }

    const formId = `pdf-form-${pages[currentPage].type}`;
    document
        .querySelectorAll('#form-buttons button')
        .forEach(btn => {
            btn.setAttribute('form', formId);
        });
}
changeCurrentPage("template1");
updateTotalPages();

export var showPrintPreview = false;
export function togglePrintPreview() {
    console.log("toggling print preview (border boxes)");
    showPrintPreview = !showPrintPreview;
}

