import { Canvas, Image } from 'fabric' // fabric v6

const params = new URLSearchParams(window.location.search);
const blankUrl = params.get("blank");
const logoUrl = params.get("logo");
const side = params.get("side");

console.log(`blank url: ${blankUrl}`);
console.log(`logo url: ${logoUrl}`);

console.log("initializing canvas");
const canvas = new Canvas("popup-canvas");

const canvasWidth = window.innerWidth * 0.98;
const canvasHeight = window.innerHeight * 0.9 * 0.98;

canvas.setWidth(canvasWidth);
canvas.setHeight(canvasHeight);
canvas.getElement().style.backgroundColor = "#181818";

async function setLogo() {
    canvas.clear();
    Image.fromURL(blankUrl).then((blankImg) => {
        blankImg.set({
            scaleX: 0.8,
            scaleY: 0.8,
            selectable: false,
        });

        canvas.setWidth(blankImg.getScaledWidth());
        canvas.setHeight(blankImg.getScaledHeight());
        canvas.add(blankImg);

        Image.fromURL(logoUrl).then((logoImg) => {
            logoImg.set({
                scaleX: 0.5,
                scaleY: 0.5,
            });
            canvas.centerObject(logoImg);
            canvas.add(logoImg);

            document.getElementById("reset-logo-button").addEventListener("click", async function () {
                logoImg.set({
                    scaleX: 0.5,
                    scaleY: 0.5,
                });
                canvas.centerObject(logoImg);
            });
        });
    });
}
setLogo(); // call on load

document.getElementById("export-button").addEventListener("click", async function () {
    console.log(`sending ${side} image back to main window`);
    const dataUrl = canvas.toDataURL({
        format: 'png',
        quality: 1.0,            // ignored for PNG
        multiplier: 5            // scale factor (optional)
    });

    const dataReturn = {
        imgUrl: dataUrl,
        side
    }

    if (typeof window.opener?.handlePopupData === 'function') {
        window.opener.handlePopupData(dataReturn);
        window.close();
    }
});
