/* -------------------------------- */
/* TINY PHOTO CLUB */
/* upload.js */
/* -------------------------------- */

const upload = document.querySelector("#photo-upload");
const gallery = document.querySelector("#gallery");
const counter = document.querySelector("#counter");
const strip = document.querySelector("#selected-strip");
const complete = document.querySelector("#complete");

let selectedPhotos = [];

/* ------------------------------ */
/* Upload Photos */
/* ------------------------------ */

upload.addEventListener("change", function (event) {

    gallery.innerHTML = "";

    const files = [...event.target.files];

    files.forEach(file => {

        if (!file.type.startsWith("image/")) return;

        const reader = new FileReader();

        reader.onload = function (e) {

            const photo = document.createElement("div");
            photo.className = "photo";

            photo.innerHTML = `
                <img src="${e.target.result}">
            `;

            photo.dataset.src = e.target.result;

            photo.addEventListener("click", () => {

                togglePhoto(photo);

            });

            gallery.appendChild(photo);

        };

        reader.readAsDataURL(file);

    });

});

/* ------------------------------ */
/* Select / Deselect */
/* ------------------------------ */

function togglePhoto(photo){

    const src = photo.dataset.src;

    if(photo.classList.contains("selected")){

        photo.classList.remove("selected");

        selectedPhotos =
        selectedPhotos.filter(image => image !== src);

    }

    else{

        if(selectedPhotos.length >= 12){

            return;

        }

        photo.classList.add("selected");

        selectedPhotos.push(src);

    }

    updateUI();

}

/* ------------------------------ */
/* Update Everything */
/* ------------------------------ */

function updateUI(){

    counter.textContent =
    `${selectedPhotos.length} / 12`;

    const slots =
    document.querySelectorAll(".slot");

    slots.forEach(slot=>{

        slot.innerHTML = "";

    });

    selectedPhotos.forEach((src,index)=>{

        slots[index].innerHTML =
        `<img src="${src}">`;

    });

    if(selectedPhotos.length === 12){

        complete.classList.add("show");

        complete.scrollIntoView({

            behavior:"smooth",

            block:"center"

        });

    }

    else{

        complete.classList.remove("show");

    }

}

/* ------------------------------ */
/* Drag & Drop */
/* ------------------------------ */

const uploadBox =
document.querySelector("#upload-box");

uploadBox.addEventListener("dragover",(e)=>{

    e.preventDefault();

    uploadBox.style.background="#f5f5f5";

});

uploadBox.addEventListener("dragleave",()=>{

    uploadBox.style.background="white";

});

uploadBox.addEventListener("drop",(e)=>{

    e.preventDefault();

    uploadBox.style.background="white";

    upload.files = e.dataTransfer.files;

    upload.dispatchEvent(

        new Event("change")

    );

});
/* -------------------------- */
/* PRINT PREVIEW SLIDESHOW */
/* -------------------------- */

const printImages = [
    "i1.JPG",
    "i2.JPG",
    "i3.JPG",
    "i4.JPG",
    "i5.JPG",
    "i6.JPG",
    "i7.JPG",
    "i8.JPG",
    "i9.JPG",
    "i10.JPG",
    "i11.JPG",
    "i12.JPG"
].sort(() => Math.random() - 0.5);

let printIndex = 0;

const printSlide =
    document.querySelector("#print-slideshow");

if (printSlide) {

    setInterval(() => {

        printIndex++;

        if (printIndex >= printImages.length) {
            printIndex = 0;
        }

        printSlide.src =
            printImages[printIndex];

    }, 500);

}