/* -------------------------------- */
/* TINY PHOTO CLUB */
/* upload.js */
/* -------------------------------- */


/* ------------------------------ */
/* Elements */
/* ------------------------------ */

const upload = document.querySelector("#photo-upload");
const gallery = document.querySelector("#gallery");
const counter = document.querySelector("#counter");
const strip = document.querySelector("#selected-strip");
const complete = document.querySelector("#complete");
const dozenMessage = document.querySelector("#dozen-message");
const uploadBox = document.querySelector("#upload-box");


/* ------------------------------ */
/* Selected Prints */
/* ------------------------------ */

/*
   Each item represents ONE physical print.

   The same photo can therefore appear more than once:

   photo A
   photo A
   photo B

   = 3 prints
*/

let selectedPhotos = [];


/* ------------------------------ */
/* Upload Photos */
/* ------------------------------ */

upload.addEventListener("change", function (event) {

    const files = [...event.target.files];

    files.forEach(file => {

        if (!file.type.startsWith("image/")) return;

        const reader = new FileReader();

        reader.onload = function (e) {

            const photo = document.createElement("div");

            photo.className = "photo";

            photo.innerHTML = `
                <img src="${e.target.result}" alt="uploaded photo">
            `;

            photo.dataset.src = e.target.result;

           photo.addEventListener("click", (event) => {

             event.preventDefault();
             event.stopPropagation();

            addPrint(photo);

         });
            gallery.appendChild(photo);

        };

        reader.readAsDataURL(file);

    });

    /*
       Reset the input so the same file can be
       selected again from the file picker.
    */

    upload.value = "";

});


/* ------------------------------ */
/* Add A Print */
/* ------------------------------ */

function addPrint(photo) {

    if (selectedPhotos.length >= 12) {

        showFullMessage();

        return;

    }

    const src = photo.dataset.src;

    selectedPhotos.push(src);

    updateUI();

}


/* ------------------------------ */
/* Remove A Print */
/* ------------------------------ */

function removePrint(index) {

    selectedPhotos.splice(index, 1);

    updateUI();

}


/* ------------------------------ */
/* Update Everything */
/* ------------------------------ */

function updateUI() {

    /*
       Update counter
    */

    counter.textContent =
        `${selectedPhotos.length} / 12`;


    /*
       Clear selected strip
    */

    strip.innerHTML = "";


    /*
       Create one slot for every physical print
    */

    selectedPhotos.forEach((src, index) => {

        const slot = document.createElement("div");

        slot.className = "slot";

        slot.innerHTML = `
            <img
                src="${src}"
                alt="selected print ${index + 1}"
            >

            <button
                class="remove-print"
                type="button"
                aria-label="remove print"
            >
                ×
            </button>
        `;

        const removeButton =
            slot.querySelector(".remove-print");

        removeButton.addEventListener("click", (event) => {

            event.stopPropagation();

            removePrint(index);

        });

        strip.appendChild(slot);

    });


    /*
       Dozen is full
    */

    if (selectedPhotos.length === 12) {

        showFullMessage();

        complete.classList.add("show");

    }

    else {

        if (dozenMessage) {

            dozenMessage.textContent = "";

        }

        complete.classList.remove("show");

    }

}


/* ------------------------------ */
/* Your Dozen Is Full */
/* ------------------------------ */

function showFullMessage() {

    if (!dozenMessage) return;

    dozenMessage.textContent =
        "your dozen is full ♡";

}


/* ------------------------------ */
/* Drag & Drop */
/* ------------------------------ */

uploadBox.addEventListener("dragover", (e) => {

    e.preventDefault();

    uploadBox.style.background = "#f5f5f5";

});


uploadBox.addEventListener("dragleave", () => {

    uploadBox.style.background = "white";

});


uploadBox.addEventListener("drop", (e) => {

    e.preventDefault();

    uploadBox.style.background = "white";

    const files = [...e.dataTransfer.files];

    files.forEach(file => {

        if (!file.type.startsWith("image/")) return;

        const reader = new FileReader();

        reader.onload = function (event) {

            const photo = document.createElement("div");

            photo.className = "photo";

            photo.innerHTML = `
                <img
                    src="${event.target.result}"
                    alt="uploaded photo"
                >
            `;

            photo.dataset.src = event.target.result;

           photo.addEventListener("click", (event) => {

          event.preventDefault();
          event.stopPropagation();

          addPrint(photo);

        });

            gallery.appendChild(photo);

        };

        reader.readAsDataURL(file);

    });

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