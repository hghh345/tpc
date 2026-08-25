/* -------------------------------- */
/* TINY PHOTO CLUB */
/* upload.js */
/* -------------------------------- */


/* ------------------------------ */
/* Elements */
/* ------------------------------ */

const upload =
    document.querySelector("#photo-upload");

const gallery =
    document.querySelector("#gallery");

const counter =
    document.querySelector("#counter");

const strip =
    document.querySelector("#selected-strip");

const complete =
    document.querySelector("#complete");

const dozenMessage =
    document.querySelector("#dozen-message");

const uploadBox =
    document.querySelector("#upload-box");


/* ------------------------------ */
/* IndexedDB */
/* ------------------------------ */

const DB_NAME = "tiny-photo-club";

const DB_VERSION = 1;

const STORE_NAME = "photos";


function openDatabase() {

    return new Promise((resolve, reject) => {

        const request =
            indexedDB.open(
                DB_NAME,
                DB_VERSION
            );


        request.onupgradeneeded = function () {

            const db = request.result;


            if (!db.objectStoreNames.contains(STORE_NAME)) {

                db.createObjectStore(
                    STORE_NAME,
                    {
                        keyPath: "id"
                    }
                );

            }

        };


        request.onsuccess = function () {

            resolve(request.result);

        };


        request.onerror = function () {

            reject(request.error);

        };

    });

}


/* ------------------------------ */
/* Save Photo */
/* ------------------------------ */

async function savePhoto(file) {

    const db =
        await openDatabase();


    const id =
        crypto.randomUUID();


    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                STORE_NAME,
                "readwrite"
            );


        const store =
            transaction.objectStore(
                STORE_NAME
            );


        store.put({

            id: id,

            file: file,

            name: file.name,

            type: file.type

        });


        transaction.oncomplete =
            function () {

                resolve(id);

            };


        transaction.onerror =
            function () {

                reject(
                    transaction.error
                );

            };

    });

}


/* ------------------------------ */
/* Get Photo */
/* ------------------------------ */

async function getPhoto(id) {

    const db =
        await openDatabase();


    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                STORE_NAME,
                "readonly"
            );


        const store =
            transaction.objectStore(
                STORE_NAME
            );


        const request =
            store.get(id);


        request.onsuccess =
            function () {

                resolve(
                    request.result
                );

            };


        request.onerror =
            function () {

                reject(
                    request.error
                );

            };

    });

}


/* ------------------------------ */
/* Selected Prints */
/* ------------------------------ */

let selectedPhotos = [];


/*
   Each item is a photo ID.

   The same ID can appear more than once.

   Example:

   photo A
   photo A
   photo B

   = 3 physical prints
*/


/* ------------------------------ */
/* Add Uploaded File */
/* ------------------------------ */

async function addUploadedFile(file) {

    if (!file.type.startsWith("image/")) {

        return;

    }


    const id =
        await savePhoto(file);


    const photo =
        document.createElement("div");


    photo.className =
        "photo";


    const image =
        document.createElement("img");


    image.src =
        URL.createObjectURL(file);


    image.alt =
        "uploaded photo";


    photo.appendChild(image);


    photo.dataset.id =
        id;


    photo.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            event.stopPropagation();

            addPrint(photo);

        }
    );


    gallery.appendChild(photo);

}


/* ------------------------------ */
/* Upload Photos */
/* ------------------------------ */

upload.addEventListener(
    "change",
    async function (event) {

        const files =
            [...event.target.files];


        for (const file of files) {

            await addUploadedFile(file);

        }


        /*
           Reset input so the same file
           can be selected again.
        */

        upload.value = "";

    }
);


/* ------------------------------ */
/* Add A Print */
/* ------------------------------ */

function addPrint(photo) {

    if (
        selectedPhotos.length >= 12
    ) {

        showFullMessage();

        return;

    }


    const id =
        photo.dataset.id;


    selectedPhotos.push(id);


    updateUI();

}


/* ------------------------------ */
/* Remove A Print */
/* ------------------------------ */

function removePrint(index) {

    selectedPhotos.splice(
        index,
        1
    );


    updateUI();

}


/* ------------------------------ */
/* Update Everything */
/* ------------------------------ */

async function updateUI() {

    counter.textContent =
        `${selectedPhotos.length} / 12`;


    strip.innerHTML = "";


    for (
        let index = 0;
        index < selectedPhotos.length;
        index++
    ) {

        const id =
            selectedPhotos[index];


        const storedPhoto =
            await getPhoto(id);


        if (!storedPhoto) {

            continue;

        }


        const slot =
            document.createElement("div");


        slot.className =
            "slot";


        const image =
            document.createElement("img");


        image.src =
            URL.createObjectURL(
                storedPhoto.file
            );


        image.alt =
            `selected print ${index + 1}`;


        const removeButton =
            document.createElement("button");


        removeButton.className =
            "remove-print";


        removeButton.type =
            "button";


        removeButton.setAttribute(
            "aria-label",
            "remove print"
        );


        removeButton.textContent =
            "×";


        removeButton.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

                removePrint(index);

            }
        );


        slot.appendChild(image);

        slot.appendChild(
            removeButton
        );


        strip.appendChild(slot);

    }


    if (
        selectedPhotos.length === 12
    ) {

        showFullMessage();

        complete.classList.add(
            "show"
        );

    }

    else {

        if (dozenMessage) {

            dozenMessage.textContent =
                "";

        }


        complete.classList.remove(
            "show"
        );

    }

}


/* ------------------------------ */
/* Your Dozen Is Full */
/* ------------------------------ */

function showFullMessage() {

    if (!dozenMessage) {

        return;

    }


    dozenMessage.textContent =
        "your dozen is full ♡ ↓ scroll down to keep going";

}


/* ------------------------------ */
/* Drag & Drop */
/* ------------------------------ */

uploadBox.addEventListener(
    "dragover",
    function (e) {

        e.preventDefault();

        uploadBox.style.background =
            "#f5f5f5";

    }
);


uploadBox.addEventListener(
    "dragleave",
    function () {

        uploadBox.style.background =
            "white";

    }
);


uploadBox.addEventListener(
    "drop",
    async function (e) {

        e.preventDefault();

        uploadBox.style.background =
            "white";


        const files =
            [...e.dataTransfer.files];


        for (const file of files) {

            await addUploadedFile(file);

        }

    }
);


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

].sort(
    () => Math.random() - 0.5
);


let printIndex = 0;


const printSlide =
    document.querySelector(
        "#print-slideshow"
    );


if (printSlide) {

    setInterval(
        function () {

            printIndex++;


            if (
                printIndex >=
                printImages.length
            ) {

                printIndex = 0;

            }


            printSlide.src =
                printImages[printIndex];

        },
        500
    );

}