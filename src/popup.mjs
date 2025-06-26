const params = new URLSearchParams(window.location.search);

var shirt = document.getElementById("shirt-img");
shirt.setAttribute("src", params.get("shirt"));

var logo = document.getElementById("logo-img");
logo.setAttribute("src", params.get("logo"));

// Enable dragging only for the logo
let isDragging = false;
let offsetX = 0;
let offsetY = 0;

logo.addEventListener("dragstart", (e) => {
  e.preventDefault();
});

logo.addEventListener("mousedown", (e) => {
    console.log("mouse down");
  isDragging = true;
  offsetX = e.clientX - logo.offsetLeft;
  offsetY = e.clientY - logo.offsetTop;
  logo.style.cursor = "grabbing";
});

document.addEventListener("mousemove", (e) => {
    console.log("mouse move");
  if (isDragging) {
    logo.style.left = `${e.clientX - offsetX}px`;
    logo.style.top = `${e.clientY - offsetY}px`;
  }
});

document.addEventListener("mouseup", () => {
    console.log("mouse mouseup");
  isDragging = false;
  logo.style.cursor = "grab";
});
