import { Canvas, Image, Circle } from 'fabric'

function drawTestDot(canvas, x, y) {
    const circle = new Circle({
        radius: 10,
        fill: '#FF0000',
        left: x,
        top: y,
    });
    canvas.add(circle);
}

console.log("initializing canvas");
const canvas = new Canvas("popup-canvas");

const canvasWidth = window.innerWidth * 0.98;
const canvasHeight = window.innerHeight * 0.9 * 0.98;

canvas.setWidth(canvasWidth);
canvas.setHeight(canvasHeight);
// canvas.getElement().style.border = "2px solid #FF0000";
canvas.getElement().style.backgroundColor = "#181818";

const params = new URLSearchParams(window.location.search);
const shirtUrl = params.get("shirt");
const logoUrl = params.get("logo");

Image.fromURL(shirtUrl).then((shirtImg) => {
    shirtImg.set({
        scaleX: 0.8,
        scaleY: 0.8,
        selectable: false,
    });

    console.log(shirtImg.getScaledWidth(), shirtImg.getScaledHeight());
    canvas.setWidth(shirtImg.getScaledWidth());
    canvas.setHeight(shirtImg.getScaledHeight());
    canvas.add(shirtImg);

    Image.fromURL(logoUrl).then((logoImg) => {
        logoImg.set({
            scaleX: 0.5,
            scaleY: 0.5,
        });
        canvas.centerObject(logoImg);
        canvas.add(logoImg);
    });
});

document.getElementById("export-button").addEventListener("click", async function(e) {
    const dataUrl = canvas.toDataURL({
        format: 'png',
        quality: 1.0,            // ignored for PNG
        multiplier: 1            // scale factor (optional)
    });

    console.log(dataUrl);

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'test.png';
    link.click();

});
